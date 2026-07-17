"""Mustakbil.com public IT and telecom listing scraper."""

from __future__ import annotations

from typing import Any
from urllib.parse import urljoin

from bs4 import BeautifulSoup
from playwright.async_api import BrowserContext

from utils import dedupe_raw, extract_jsonld_jobs, first_attr, first_text, load_html, parse_posted_date

URL = "https://www.mustakbil.com/jobs/it-telecom/"


async def scrape_mustakbil(context: BrowserContext, limit: int = 150) -> list[dict[str, Any]]:
    page = await context.new_page()
    try:
        html = await load_html(page, URL, "a[href*='/jobs/job/'], .job-list")
        structured = extract_jsonld_jobs(html, "Mustakbil.com", URL)
        if structured:
            return dedupe_raw(structured)[:limit]

        soup = BeautifulSoup(html, "lxml")
        cards = soup.select(".job-list, .job-card, article, li[class*='job'], div[class*='job-listing']")
        jobs: list[dict[str, Any]] = []
        for card in cards:
            title = first_text(card, ["h2", "h3", ".title", ".job-title", "a[href*='/jobs/job/']"])
            if not title:
                continue
            href = first_attr(card, ["a[href*='/jobs/job/']", "h2 a", "h3 a"], "href")
            jobs.append({
                "job_title": title,
                "company_name": first_text(card, [".company", ".company-name", "[class*='company']"]),
                "location": first_text(card, [".location", ".job-location", "[class*='location']"]),
                "description": first_text(card, [".description", ".summary", "p"]),
                "experience": first_text(card, [".experience", "[class*='experience']"]),
                "job_type": first_text(card, [".job-type", "[class*='employment']"]),
                "salary": first_text(card, [".salary", "[class*='salary']"]),
                "posted_date": parse_posted_date(first_text(card, ["time", ".date", "[class*='posted']"])),
                "source": "Mustakbil.com",
                "job_url": urljoin(URL, href),
            })
        return dedupe_raw(jobs)[:limit]
    finally:
        await page.close()
