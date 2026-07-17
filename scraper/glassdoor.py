"""Glassdoor Pakistan public search-result scraper."""

from __future__ import annotations

from typing import Any
from urllib.parse import urljoin

from bs4 import BeautifulSoup
from playwright.async_api import BrowserContext

from utils import dedupe_raw, extract_jsonld_jobs, first_attr, first_text, load_html, parse_posted_date

URL = "https://www.glassdoor.com/Job/pakistan-tech-jobs-SRCH_IL.0,8_IN192_KO9,13.htm"


async def scrape_glassdoor(context: BrowserContext, limit: int = 150) -> list[dict[str, Any]]:
    page = await context.new_page()
    try:
        html = await load_html(page, URL, "[data-test='jobListing'], li[class*='JobsList_jobListItem']")
        structured = extract_jsonld_jobs(html, "Glassdoor", URL)
        if structured:
            return dedupe_raw(structured)[:limit]

        soup = BeautifulSoup(html, "lxml")
        cards = soup.select("[data-test='jobListing'], li[class*='JobsList_jobListItem'], li.react-job-listing, article")
        jobs: list[dict[str, Any]] = []
        for card in cards:
            title = first_text(card, ["[data-test='job-title']", "a[class*='JobCard_jobTitle']", ".job-title", "h2", "h3"])
            if not title:
                continue
            href = first_attr(card, ["a[data-test='job-title']", "a[class*='JobCard_jobTitle']", "a[href*='/job-listing/']"], "href")
            jobs.append({
                "job_title": title,
                "company_name": first_text(card, ["[data-test='employer-name']", "[class*='EmployerProfile_compactEmployerName']", ".employer-name"]),
                "location": first_text(card, ["[data-test='emp-location']", "[class*='JobCard_location']", ".location"]),
                "description": first_text(card, ["[class*='JobCard_jobDescriptionSnippet']", ".job-description", "p"]),
                "experience": first_text(card, ["[class*='experience']"]),
                "job_type": first_text(card, ["[class*='employment']", "[class*='jobType']"]),
                "salary": first_text(card, ["[data-test='detailSalary']", "[class*='JobCard_salaryEstimate']", ".salary-estimate"]),
                "posted_date": parse_posted_date(first_text(card, ["[data-test='job-age']", "[class*='JobCard_listingAge']", "time"])),
                "source": "Glassdoor",
                "job_url": urljoin("https://www.glassdoor.com", href),
            })
        return dedupe_raw(jobs)[:limit]
    finally:
        await page.close()
