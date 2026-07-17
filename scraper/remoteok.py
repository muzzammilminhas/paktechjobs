"""Remote OK public-feed fallback for remote tech roles accessible from Pakistan."""

from __future__ import annotations

import asyncio
import json
from typing import Any
from urllib.request import Request, urlopen

from bs4 import BeautifulSoup
from playwright.async_api import BrowserContext

from utils import clean_text, dedupe_raw, parse_posted_date

URL = "https://remoteok.com/api?tag=software"
PAKISTAN_ACCESSIBLE = ("worldwide", "anywhere", "global", "asia", "apac", "pakistan")
TECH_ROLE_TERMS = (
    "developer", "engineer", "software", "devops", "data", "quality assurance", "qa ",
    "security", "cloud", "frontend", "backend", "full stack", "fullstack", "mobile",
    "android", "ios", "machine learning", "artificial intelligence", "site reliability",
)


def _fetch_feed() -> list[dict[str, Any]]:
    request = Request(
        URL,
        headers={
            "User-Agent": "PakTechJobs/1.0 (+https://github.com/muzzammilminhas/paktechjobs)",
            "Accept": "application/json",
        },
    )
    with urlopen(request, timeout=45) as response:
        payload = json.loads(response.read().decode("utf-8"))
    return payload if isinstance(payload, list) else []


async def scrape_remoteok(context: BrowserContext, limit: int = 150) -> list[dict[str, Any]]:
    del context  # Signature matches the browser-backed source scrapers.
    payload = await asyncio.to_thread(_fetch_feed)
    jobs: list[dict[str, Any]] = []
    for item in payload:
        if not isinstance(item, dict) or not item.get("position"):
            continue
        location = clean_text(item.get("location")).casefold()
        title = clean_text(item.get("position"))
        is_accessible = not location or location in {"remote", "remoto"} or any(region in location for region in PAKISTAN_ACCESSIBLE)
        if not is_accessible or not any(term in title.casefold() for term in TECH_ROLE_TERMS):
            continue
        description = BeautifulSoup(str(item.get("description", "")), "lxml").get_text(" ", strip=True)
        jobs.append({
            "job_title": title,
            "company_name": clean_text(item.get("company")),
            "location": "Remote",
            "description": clean_text(description),
            "experience": "",
            "job_type": "Remote",
            "salary_min": item.get("salary_min") or None,
            "salary_max": item.get("salary_max") or None,
            "posted_date": parse_posted_date(item.get("date")),
            "source": "Remote OK",
            "job_url": clean_text(item.get("url") or item.get("apply_url")),
            "skills": item.get("tags") or [],
        })
    return dedupe_raw(jobs)[:limit]
