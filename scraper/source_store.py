"""Per-source caches and publish-health metadata for resilient daily scraping."""

from __future__ import annotations

import json
import os
import re
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any, Iterable

from cleaner import PKT, ROOT, atomic_json, parse_date, text

SOURCE_CACHE_DIR = ROOT / "scraper" / "data" / "sources"
HEALTH_PATH = ROOT / "public" / "data" / "source_health.json"
CACHE_TTL_DAYS = max(1, int(os.getenv("SOURCE_CACHE_TTL_DAYS", "14")))


def source_slug(source: str) -> str:
    """Return a stable, filesystem-safe source identifier."""
    return re.sub(r"[^a-z0-9]+", "-", source.casefold()).strip("-") or "unknown"


def cache_path(source: str, cache_dir: Path = SOURCE_CACHE_DIR) -> Path:
    return cache_dir / f"{source_slug(source)}.json"


def load_json(path: Path, fallback: Any) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return fallback


def load_source_cache(source: str, cache_dir: Path = SOURCE_CACHE_DIR) -> dict[str, Any]:
    payload = load_json(cache_path(source, cache_dir), {})
    if not isinstance(payload, dict):
        return {"source": source, "last_success_at": None, "jobs": []}
    jobs = payload.get("jobs")
    return {
        "source": source,
        "last_success_at": payload.get("last_success_at"),
        "jobs": jobs if isinstance(jobs, list) else [],
    }


def raw_job_key(job: dict[str, Any]) -> tuple[str, str, str]:
    """Deduplicate raw jobs without collapsing different portal locations."""
    return (
        text(job.get("job_title") or job.get("title")).casefold(),
        text(job.get("company_name") or job.get("company")).casefold(),
        text(job.get("location") or job.get("city")).casefold(),
    )


def merge_raw_jobs(fresh: Iterable[dict[str, Any]], cached: Iterable[dict[str, Any]]) -> list[dict[str, Any]]:
    """Merge fresh and cached jobs, preferring the newest fetched representation."""
    merged: dict[tuple[str, str, str], dict[str, Any]] = {}
    for job in cached:
        key = raw_job_key(job)
        if key[0]:
            merged[key] = job
    for job in fresh:
        key = raw_job_key(job)
        if key[0]:
            merged[key] = job
    return list(merged.values())


def prune_raw_jobs(jobs: Iterable[dict[str, Any]], today: date, max_age_days: int = 90) -> list[dict[str, Any]]:
    cutoff = today - timedelta(days=max_age_days)
    maximum = today + timedelta(days=1)
    return [job for job in jobs if cutoff <= parse_date(job.get("posted_date"), today) <= maximum]


def _parse_timestamp(value: Any) -> datetime | None:
    try:
        parsed = datetime.fromisoformat(text(value).replace("Z", "+00:00"))
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=PKT)
    except ValueError:
        return None


def resolve_source(
    source: str,
    live_jobs: list[dict[str, Any]],
    error: str | None = None,
    *,
    now: datetime | None = None,
    cache_dir: Path = SOURCE_CACHE_DIR,
    ttl_days: int = CACHE_TTL_DAYS,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """Return effective source jobs and health, updating cache after a live success."""
    current = now or datetime.now(PKT)
    if current.tzinfo is None:
        current = current.replace(tzinfo=PKT)
    today = current.astimezone(PKT).date()
    cache = load_source_cache(source, cache_dir)
    cached_jobs = prune_raw_jobs(cache["jobs"], today)
    cached_by_key = {raw_job_key(job): job for job in cached_jobs}
    last_success = _parse_timestamp(cache.get("last_success_at"))

    if live_jobs:
        effective = prune_raw_jobs(merge_raw_jobs(live_jobs, cached_jobs), today)
        live_keys = {raw_job_key(job) for job in live_jobs}
        carried_count = sum(1 for job in effective if raw_job_key(job) in cached_by_key and raw_job_key(job) not in live_keys)
        degraded = len(cached_jobs) >= 10 and len(live_jobs) < max(3, round(len(cached_jobs) * 0.35))
        status = "degraded" if degraded else "healthy"
        last_success_at = current.isoformat(timespec="seconds")
        atomic_json(cache_path(source, cache_dir), {
            "source": source,
            "last_success_at": last_success_at,
            "jobs": effective,
        })
        message = (
            f"Live scrape was unusually small; {carried_count} cached listings were retained."
            if degraded
            else f"Live scrape succeeded; {carried_count} older active listings were retained."
        )
        return effective, {
            "source": source,
            "status": status,
            "live_count": len(live_jobs),
            "cached_count": carried_count,
            "effective_count": len(effective),
            "last_success_at": last_success_at,
            "message": message,
        }

    cache_age = current - last_success.astimezone(current.tzinfo) if last_success else None
    cache_valid = bool(cached_jobs and cache_age is not None and cache_age <= timedelta(days=ttl_days))
    if cache_valid:
        message = f"Live scrape returned no jobs; serving the last good cache (up to {ttl_days} days)."
        if error:
            message = f"Live scrape failed; serving the last good cache (up to {ttl_days} days)."
        return cached_jobs, {
            "source": source,
            "status": "cached",
            "live_count": 0,
            "cached_count": len(cached_jobs),
            "effective_count": len(cached_jobs),
            "last_success_at": cache.get("last_success_at"),
            "message": message,
        }

    reason = "Live scrape failed and no recent cache is available." if error else "No live jobs or recent cache are available."
    return [], {
        "source": source,
        "status": "failed",
        "live_count": 0,
        "cached_count": 0,
        "effective_count": 0,
        "last_success_at": cache.get("last_success_at"),
        "message": reason,
    }


def read_previous_health(path: Path = HEALTH_PATH) -> dict[str, Any]:
    payload = load_json(path, {})
    return payload if isinstance(payload, dict) else {}


def evaluate_publish(
    *,
    previous_count: int,
    candidate_count: int,
    fresh_source_count: int,
    prior_streak: int,
) -> dict[str, Any]:
    """Guard public data against transient all-source and catastrophic drops."""
    catastrophic_floor = max(15, round(previous_count * 0.45))
    catastrophic_drop = previous_count >= 25 and candidate_count < catastrophic_floor

    if fresh_source_count == 0:
        return {
            "publish_status": "preserved",
            "guard_streak": prior_streak,
            "published_count": previous_count,
            "publish_message": "No source returned fresh data; the last published dataset was preserved.",
        }
    if candidate_count == 0:
        return {
            "publish_status": "preserved",
            "guard_streak": prior_streak,
            "published_count": previous_count,
            "publish_message": "All effective listings failed validation; the last published dataset was preserved.",
        }
    if catastrophic_drop and prior_streak < 2:
        streak = prior_streak + 1
        return {
            "publish_status": "preserved",
            "guard_streak": streak,
            "published_count": previous_count,
            "publish_message": (
                f"A major drop ({previous_count} to {candidate_count}) was blocked pending confirmation "
                f"on another run ({streak}/2)."
            ),
        }
    return {
        "publish_status": "published",
        "guard_streak": 0,
        "published_count": candidate_count,
        "publish_message": (
            "The smaller dataset was confirmed across three consecutive runs and published."
            if catastrophic_drop
            else "Fresh and cache-backed source results passed validation."
        ),
    }


def build_health_payload(
    sources: list[dict[str, Any]],
    *,
    publish_status: str,
    guard_streak: int,
    previous_count: int,
    published_count: int,
    generated_at: datetime | None = None,
    publish_message: str,
) -> dict[str, Any]:
    current = generated_at or datetime.now(PKT)
    return {
        "generated_at": current.isoformat(timespec="seconds"),
        "publish_status": publish_status,
        "publish_message": publish_message,
        "guard_streak": guard_streak,
        "previous_count": previous_count,
        "published_count": published_count,
        "fresh_sources": sum(item["status"] in {"healthy", "degraded"} for item in sources),
        "cached_sources": sum(item["status"] == "cached" for item in sources),
        "failed_sources": sum(item["status"] == "failed" for item in sources),
        "total_sources": len(sources),
        "cache_ttl_days": CACHE_TTL_DAYS,
        "sources": sources,
    }


def write_health(payload: dict[str, Any], path: Path = HEALTH_PATH) -> None:
    atomic_json(path, payload)
