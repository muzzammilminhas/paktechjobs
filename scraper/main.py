"""Run all source scrapers, preserve failures, then normalize and snapshot data."""

from __future__ import annotations

import argparse
import asyncio
import logging

from playwright.async_api import async_playwright

from cleaner import RAW_PATH, atomic_json, clean_jobs, write_outputs
from glassdoor import scrape_glassdoor
from mustakbil import scrape_mustakbil
from rozee import scrape_rozee

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
LOGGER = logging.getLogger("paktechjobs")


async def run(headed: bool, limit: int) -> int:
    all_jobs: list[dict] = []
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=not headed)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
            locale="en-PK",
            timezone_id="Asia/Karachi",
            viewport={"width": 1440, "height": 1000},
        )
        scrapers = (("Rozee.pk", scrape_rozee), ("Mustakbil.com", scrape_mustakbil), ("Glassdoor", scrape_glassdoor))
        for name, scraper in scrapers:
            try:
                jobs = await scraper(context, limit=limit)
                all_jobs.extend(jobs)
                LOGGER.info("%s: collected %d listings", name, len(jobs))
            except Exception as exc:  # A portal failure must not stop the remaining sources.
                LOGGER.warning("%s failed: %s", name, exc)
        await context.close()
        await browser.close()

    if not all_jobs:
        LOGGER.error("All sources returned zero listings; existing cleaned data was preserved.")
        return 0

    atomic_json(RAW_PATH, all_jobs)
    cleaned = clean_jobs(all_jobs)
    if not cleaned:
        LOGGER.error("All scraped listings were removed during validation; existing cleaned data was preserved.")
        return 0
    write_outputs(cleaned)
    LOGGER.info("Published %d normalized listings and today's history snapshot", len(cleaned))
    return len(cleaned)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Scrape and normalize Pakistan technology jobs")
    parser.add_argument("--headed", action="store_true", help="Show Chromium for local debugging")
    parser.add_argument("--limit", type=int, default=150, help="Maximum listings per source")
    return parser.parse_args()


if __name__ == "__main__":
    arguments = parse_args()
    asyncio.run(run(headed=arguments.headed, limit=max(1, arguments.limit)))
