"""Rozee.pk public technology listing scraper."""

from __future__ import annotations

from typing import Any
from urllib.parse import urljoin

from bs4 import BeautifulSoup
from playwright.async_api import BrowserContext

from utils import clean_text, dedupe_raw, extract_jsonld_jobs, first_attr, first_text, load_html, parse_posted_date

URL = "https://rozee.pk/job/jsearch/q/technology"


async def scrape_rozee(context: BrowserContext, limit: int = 150) -> list[dict[str, Any]]:
    page = await context.new_page()
    try:
        html = await load_html(page, URL, "a[href*='/job/detail/'], .job")
        structured = extract_jsonld_jobs(html, "Rozee.pk", URL)
        if structured:
            return dedupe_raw(structured)[:limit]

        soup = BeautifulSoup(html, "lxml")
        cards = soup.select(".job, .job-listing, .jlist, li[class*='job'], div[data-job-id]")
        jobs: list[dict[str, Any]] = []
        for card in cards:
            title = first_text(card, ["h2", "h3", ".job-title", ".j-title", "a[href*='/job/detail/']"])
            if not title:
                continue
            href = first_attr(card, ["a[href*='/job/detail/']", "h2 a", "h3 a"], "href")
            jobs.append({
                "job_title": title,
                "company_name": first_text(card, [".company", ".company-name", ".c-name", "[class*='company']"]),
                "location": first_text(card, [".location", ".job-location", "[class*='location']"]),
                "description": first_text(card, [".description", ".job-description", ".details", "p"]),
                "experience": first_text(card, [".experience", "[class*='experience']"]),
                "job_type": first_text(card, [".job-type", "[class*='type']"]),
                "salary": first_text(card, [".salary", "[class*='salary']"]),
                "posted_date": parse_posted_date(first_text(card, ["time", ".date", "[class*='posted']"])),
                "source": "Rozee.pk",
                "job_url": urljoin(URL, href),
            })
        return dedupe_raw(jobs)[:limit]
    finally:
        await page.close()
