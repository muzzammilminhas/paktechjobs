"""Jobicy public API source for APAC remote software roles."""

from __future__ import annotations

import asyncio
import json
from typing import Any
from urllib.request import Request, urlopen

from bs4 import BeautifulSoup
from playwright.async_api import BrowserContext

from utils import clean_text, dedupe_raw, parse_posted_date

URL = "https://jobicy.com/api/v2/remote-jobs?count=50&industry=dev&geo=apac"


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
    jobs = payload.get("jobs", []) if isinstance(payload, dict) else []
    return jobs if isinstance(jobs, list) else []


async def scrape_jobicy(context: BrowserContext, limit: int = 150) -> list[dict[str, Any]]:
    del context
    payload = await asyncio.to_thread(_fetch_feed)
    jobs: list[dict[str, Any]] = []
    for item in payload:
        if not isinstance(item, dict) or not item.get("jobTitle"):
            continue
        description = BeautifulSoup(str(item.get("jobDescription") or item.get("jobExcerpt") or ""), "lxml").get_text(" ", strip=True)
        industries = item.get("jobIndustry") or []
        jobs.append({
            "job_title": clean_text(item.get("jobTitle")),
            "company_name": clean_text(item.get("companyName")),
            "location": "Remote",
            "description": clean_text(description),
            "experience": clean_text(item.get("jobLevel")),
            "job_type": "Remote",
            "salary": "",
            "posted_date": parse_posted_date(item.get("pubDate")),
            "source": "Jobicy APAC",
            "job_url": clean_text(item.get("url")),
            "skills": industries,
        })
    return dedupe_raw(jobs)[:limit]
