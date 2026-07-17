"""Run every scraper and publish a guarded, cache-backed normalized dataset."""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
from datetime import datetime

from playwright.async_api import async_playwright

from cleaner import CURRENT_PATH, PKT, RAW_PATH, atomic_json, clean_jobs, write_outputs
from glassdoor import scrape_glassdoor
from jobicy import scrape_jobicy
from mustakbil import scrape_mustakbil
from remoteok import scrape_remoteok
from rozee import scrape_rozee
from source_store import build_health_payload, evaluate_publish, read_previous_health, resolve_source, write_health

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
LOGGER = logging.getLogger("paktechjobs")


async def run(headed: bool, limit: int) -> int:
    fresh_jobs: list[dict] = []
    effective_jobs: list[dict] = []
    source_health: list[dict] = []
    run_started = datetime.now(PKT)
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=not headed)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
            locale="en-PK",
            timezone_id="Asia/Karachi",
            viewport={"width": 1440, "height": 1000},
        )
        scrapers = (
            ("Rozee.pk", scrape_rozee),
            ("Mustakbil.com", scrape_mustakbil),
            ("Glassdoor", scrape_glassdoor),
            ("Jobicy APAC", scrape_jobicy),
            ("Remote OK", scrape_remoteok),
        )
        for name, scraper in scrapers:
            jobs: list[dict] = []
            error: str | None = None
            try:
                jobs = await scraper(context, limit=limit)
                fresh_jobs.extend(jobs)
                LOGGER.info("%s: collected %d listings", name, len(jobs))
            except Exception as exc:  # A portal failure must not stop the remaining sources.
                error = str(exc)
                LOGGER.warning("%s failed: %s", name, exc)
            resolved, health = resolve_source(name, jobs, error, now=run_started)
            effective_jobs.extend(resolved)
            source_health.append(health)
        await context.close()
        await browser.close()

    atomic_json(RAW_PATH, fresh_jobs)
    cleaned = clean_jobs(effective_jobs)

    try:
        previous_payload = json.loads(CURRENT_PATH.read_text(encoding="utf-8"))
        previous_count = len(previous_payload.get("jobs", [])) if isinstance(previous_payload, dict) else 0
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        previous_count = 0

    previous_health = read_previous_health()
    prior_streak = int(previous_health.get("guard_streak", 0) or 0)
    fresh_source_count = sum(item["status"] in {"healthy", "degraded"} for item in source_health)
    decision = evaluate_publish(
        previous_count=previous_count,
        candidate_count=len(cleaned),
        fresh_source_count=fresh_source_count,
        prior_streak=prior_streak,
    )
    publish_status = decision["publish_status"]
    guard_streak = decision["guard_streak"]
    published_count = decision["published_count"]
    publish_message = decision["publish_message"]

    if publish_status == "published":
        write_outputs(cleaned)

    health_payload = build_health_payload(
        source_health,
        publish_status=publish_status,
        guard_streak=guard_streak,
        previous_count=previous_count,
        published_count=published_count,
        generated_at=run_started,
        publish_message=publish_message,
    )
    write_health(health_payload)

    if publish_status == "published":
        LOGGER.info("Published %d normalized listings and today's history snapshot", published_count)
    else:
        LOGGER.warning("Preserved %d existing listings: %s", published_count, publish_message)
    return published_count


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Scrape and normalize Pakistan technology jobs")
    parser.add_argument("--headed", action="store_true", help="Show Chromium for local debugging")
    parser.add_argument("--limit", type=int, default=150, help="Maximum listings per source")
    return parser.parse_args()


if __name__ == "__main__":
    arguments = parse_args()
    asyncio.run(run(headed=arguments.headed, limit=max(1, arguments.limit)))
