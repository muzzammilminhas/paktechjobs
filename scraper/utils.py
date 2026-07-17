"""Shared extraction helpers for portal-specific Playwright scrapers."""

from __future__ import annotations

import json
import re
from datetime import date, datetime, timedelta
from typing import Any, Iterable
from urllib.parse import urljoin

from bs4 import BeautifulSoup, Tag
from dateutil import parser as date_parser
from playwright.async_api import Page, TimeoutError as PlaywrightTimeoutError


def clean_text(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def first_text(node: Tag, selectors: Iterable[str]) -> str:
    for selector in selectors:
        match = node.select_one(selector)
        if match:
            text = clean_text(match.get_text(" ", strip=True))
            if text:
                return text
    return ""


def first_attr(node: Tag, selectors: Iterable[str], attribute: str) -> str:
    for selector in selectors:
        match = node.select_one(selector)
        if match and match.get(attribute):
            return clean_text(match.get(attribute))
    return ""


def parse_posted_date(value: Any) -> str:
    text = clean_text(value).lower()
    today = date.today()
    if not text or text in {"today", "just posted", "new"}:
        return today.isoformat()
    if "yesterday" in text:
        return (today - timedelta(days=1)).isoformat()
    compact = re.fullmatch(r"(\d+)\+?\s*([mhdw])\+?", text)
    if compact:
        amount = int(compact.group(1))
        unit = compact.group(2)
        days = amount if unit == "d" else amount * 7 if unit == "w" else 0
        return (today - timedelta(days=days)).isoformat()
    relative = re.search(r"(\d+)\+?\s*(minute|hour|day|week|month)s?\s*ago", text)
    if relative:
        amount = int(relative.group(1))
        unit = relative.group(2)
        days = amount if unit == "day" else amount * 7 if unit == "week" else amount * 30 if unit == "month" else 0
        return (today - timedelta(days=days)).isoformat()
    try:
        return date_parser.parse(text, fuzzy=True, default=datetime.combine(today, datetime.min.time())).date().isoformat()
    except (ValueError, OverflowError, TypeError):
        return today.isoformat()


async def load_html(page: Page, url: str, ready_selector: str | None = None) -> str:
    """Load a public listing page without bypassing access controls."""
    await page.goto(url, wait_until="domcontentloaded", timeout=60_000)
    if ready_selector:
        try:
            await page.wait_for_selector(ready_selector, timeout=12_000)
        except PlaywrightTimeoutError:
            pass
    await page.wait_for_timeout(1_500)
    return await page.content()


def extract_jsonld_jobs(html: str, source: str, base_url: str) -> list[dict[str, Any]]:
    soup = BeautifulSoup(html, "lxml")
    results: list[dict[str, Any]] = []
    for script in soup.select('script[type="application/ld+json"]'):
        try:
            payload = json.loads(script.string or script.get_text())
        except (json.JSONDecodeError, TypeError):
            continue
        nodes = payload if isinstance(payload, list) else payload.get("@graph", [payload]) if isinstance(payload, dict) else []
        for node in nodes:
            if not isinstance(node, dict) or node.get("@type") != "JobPosting":
                continue
            organization = node.get("hiringOrganization") or {}
            location = node.get("jobLocation") or {}
            if isinstance(location, list):
                location = location[0] if location else {}
            address = location.get("address") or {} if isinstance(location, dict) else {}
            salary = node.get("baseSalary") or {}
            salary_value = salary.get("value") or {} if isinstance(salary, dict) else {}
            salary_text = " - ".join(str(item) for item in [salary_value.get("minValue"), salary_value.get("maxValue")] if item)
            results.append({
                "job_title": clean_text(node.get("title")),
                "company_name": clean_text(organization.get("name") if isinstance(organization, dict) else organization),
                "location": clean_text(" ".join(str(address.get(key, "")) for key in ("addressLocality", "addressRegion", "addressCountry"))),
                "description": clean_text(BeautifulSoup(str(node.get("description", "")), "lxml").get_text(" ")),
                "experience": clean_text(node.get("experienceRequirements") or node.get("qualifications")),
                "job_type": clean_text(node.get("employmentType")),
                "salary": salary_text,
                "posted_date": parse_posted_date(node.get("datePosted")),
                "source": source,
                "job_url": urljoin(base_url, clean_text(node.get("url"))),
            })
    return [item for item in results if item["job_title"]]


def dedupe_raw(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[tuple[str, str, str]] = set()
    output: list[dict[str, Any]] = []
    for item in items:
        key = (clean_text(item.get("job_title")).casefold(), clean_text(item.get("company_name")).casefold(), clean_text(item.get("location")).casefold())
        if key in seen or not key[0]:
            continue
        seen.add(key)
        output.append(item)
    return output
