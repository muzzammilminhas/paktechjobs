from __future__ import annotations

import json
import sys
import tempfile
import unittest
from datetime import datetime, timedelta
from pathlib import Path

SCRAPER_DIR = Path(__file__).resolve().parents[1]
if str(SCRAPER_DIR) not in sys.path:
    sys.path.insert(0, str(SCRAPER_DIR))

from cleaner import PKT  # noqa: E402
from source_store import evaluate_publish, merge_raw_jobs, resolve_source  # noqa: E402


def job(title: str, posted: str = "2026-07-16", description: str = "old") -> dict:
    return {
        "job_title": title,
        "company_name": "Acme",
        "location": "Lahore",
        "description": description,
        "posted_date": posted,
        "source": "Test Portal",
    }


class SourceStoreTests(unittest.TestCase):
    def test_live_record_replaces_same_cached_record(self) -> None:
        merged = merge_raw_jobs([job("Python Engineer", description="fresh")], [job("Python Engineer")])
        self.assertEqual(len(merged), 1)
        self.assertEqual(merged[0]["description"], "fresh")

    def test_recent_cache_is_served_when_live_source_fails(self) -> None:
        now = datetime(2026, 7, 17, 8, tzinfo=PKT)
        with tempfile.TemporaryDirectory() as folder:
            cache_dir = Path(folder)
            effective, healthy = resolve_source("Test Portal", [job("Python Engineer")], now=now, cache_dir=cache_dir)
            self.assertEqual(healthy["status"], "healthy")
            self.assertEqual(len(effective), 1)

            immediate_jobs, immediate = resolve_source(
                "Test Portal", [], "timeout", now=now, cache_dir=cache_dir
            )
            self.assertEqual(immediate["status"], "cached")
            self.assertEqual(len(immediate_jobs), 1)

            cached_jobs, cached = resolve_source(
                "Test Portal", [], "timeout", now=now + timedelta(days=2), cache_dir=cache_dir
            )
            self.assertEqual(cached["status"], "cached")
            self.assertEqual(len(cached_jobs), 1)

            expired_jobs, expired = resolve_source(
                "Test Portal", [], "timeout", now=now + timedelta(days=15), cache_dir=cache_dir
            )
            self.assertEqual(expired["status"], "failed")
            self.assertEqual(expired_jobs, [])

    def test_live_success_rolls_active_cached_jobs_forward(self) -> None:
        now = datetime(2026, 7, 17, 8, tzinfo=PKT)
        with tempfile.TemporaryDirectory() as folder:
            cache_dir = Path(folder)
            resolve_source("Test Portal", [job("Python Engineer")], now=now, cache_dir=cache_dir)
            effective, status = resolve_source(
                "Test Portal", [job("React Engineer")], now=now + timedelta(days=1), cache_dir=cache_dir
            )
            self.assertEqual({item["job_title"] for item in effective}, {"Python Engineer", "React Engineer"})
            self.assertEqual(status["cached_count"], 1)
            payload = json.loads(next(cache_dir.glob("*.json")).read_text(encoding="utf-8"))
            self.assertEqual(len(payload["jobs"]), 2)

    def test_catastrophic_drop_requires_three_consecutive_runs(self) -> None:
        first = evaluate_publish(previous_count=50, candidate_count=10, fresh_source_count=1, prior_streak=0)
        second = evaluate_publish(previous_count=50, candidate_count=10, fresh_source_count=1, prior_streak=1)
        third = evaluate_publish(previous_count=50, candidate_count=10, fresh_source_count=1, prior_streak=2)
        self.assertEqual((first["publish_status"], first["guard_streak"]), ("preserved", 1))
        self.assertEqual((second["publish_status"], second["guard_streak"]), ("preserved", 2))
        self.assertEqual((third["publish_status"], third["guard_streak"]), ("published", 0))

    def test_no_fresh_sources_never_erase_public_data(self) -> None:
        decision = evaluate_publish(previous_count=45, candidate_count=30, fresh_source_count=0, prior_streak=1)
        self.assertEqual(decision["publish_status"], "preserved")
        self.assertEqual(decision["published_count"], 45)


if __name__ == "__main__":
    unittest.main()
