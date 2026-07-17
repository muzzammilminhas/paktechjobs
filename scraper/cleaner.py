"""Normalize raw portal records and write the dashboard's static datasets."""

from __future__ import annotations

import hashlib
import json
import os
import re
import time
from collections import Counter
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Iterable

ROOT = Path(__file__).resolve().parents[1]
RAW_PATH = ROOT / "scraper" / "data" / "jobs_raw.json"
CURRENT_PATH = ROOT / "public" / "data" / "jobs.json"
HISTORY_DIR = ROOT / "public" / "data" / "history"
PKT = timezone(timedelta(hours=5))

STANDARD_SKILLS: dict[str, tuple[str, ...]] = {
    "Flutter": ("flutter",), "React": ("react.js", "reactjs", "react"), "Next.js": ("next.js", "nextjs"),
    "Node.js": ("node.js", "nodejs"), "Python": ("python",), "Django": ("django",), "FastAPI": ("fastapi", "fast api"),
    "Java": ("java",), "Spring": ("spring boot", "spring"), "PHP": ("php",), "Laravel": ("laravel",),
    "Vue": ("vue.js", "vuejs", "vue"), "Angular": ("angular",), "TypeScript": ("typescript",),
    "JavaScript": ("javascript",), "Dart": ("dart",), "SQL": ("sql",), "PostgreSQL": ("postgresql", "postgres"),
    "MongoDB": ("mongodb", "mongo db"), "Firebase": ("firebase",), "Supabase": ("supabase",), "AWS": ("aws", "amazon web services"),
    "Docker": ("docker",), "Kubernetes": ("kubernetes", "k8s"), "AI/ML": ("ai/ml", "machine learning", "artificial intelligence"),
    "TensorFlow": ("tensorflow",), "PyTorch": ("pytorch",), "QA": ("quality assurance", "qa engineer", "software tester"),
    "Selenium": ("selenium",), "Cypress": ("cypress",), "iOS": ("ios",), "Android": ("android",),
    "Unity": ("unity",), "C++": ("c++",), "C#": ("c#", "c sharp"), "Kotlin": ("kotlin",), "Swift": ("swift",),
}

CITY_MATCHES = (
    ("Lahore", ("lahore", "lhr")), ("Karachi", ("karachi", "khi")), ("Islamabad", ("islamabad", "isb")),
    ("Rawalpindi", ("rawalpindi", "pindi", "rwp")), ("Peshawar", ("peshawar", "pew")),
)


def atomic_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    for attempt in range(5):
        try:
            os.replace(temporary, path)
            return
        except PermissionError:
            if attempt == 4:
                temporary.unlink(missing_ok=True)
                raise
            time.sleep(0.25 * (attempt + 1))


def text(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def normalize_city(value: Any) -> str:
    candidate = text(value).casefold()
    if re.search(r"\b(remote|work from home|wfh|anywhere)\b", candidate):
        return "Remote"
    for standard, aliases in CITY_MATCHES:
        if any(re.search(rf"\b{re.escape(alias)}\b", candidate) for alias in aliases):
            return standard
    return "Other"


def extract_skills(*values: Any) -> list[str]:
    haystack = " ".join(text(value) for value in values).casefold()
    found: list[str] = []
    for standard, aliases in STANDARD_SKILLS.items():
        if any(re.search(rf"(?<!\w){re.escape(alias)}(?!\w)", haystack) for alias in aliases):
            found.append(standard)
    return found


def normalize_experience(value: Any) -> str:
    candidate = text(value).casefold()
    if re.search(r"\b(lead|manager|head|director|principal|9\+|10\+|11\+|12\+)\b", candidate):
        return "Lead/Manager"
    ranges = re.findall(r"(\d+)\s*(?:-|to|–)\s*(\d+)\s*(?:year|yr)", candidate)
    numbers = [int(number) for pair in ranges for number in pair]
    if numbers and max(numbers) >= 9:
        return "Lead/Manager"
    if re.search(r"\b(senior|sr\.?|architect)\b", candidate) or (numbers and max(numbers) >= 5):
        return "Senior"
    if re.search(r"\b(fresh|graduate|intern|trainee|junior|entry.level)\b", candidate) or (numbers and max(numbers) <= 1):
        return "Entry Level"
    explicit = re.search(r"(\d+)\+?\s*(?:year|yr)", candidate)
    if explicit:
        years = int(explicit.group(1))
        if years >= 9: return "Lead/Manager"
        if years >= 5: return "Senior"
        if years <= 1: return "Entry Level"
    return "Mid Level"


def normalize_job_type(value: Any) -> str:
    candidate = text(value).casefold()
    if re.search(r"\bhybrid\b", candidate):
        return "Hybrid"
    if re.search(r"\b(remote|work from home|wfh|anywhere)\b", candidate):
        return "Remote"
    return "Onsite"


def _amount(number: str, suffix: str) -> int:
    value = float(number.replace(",", ""))
    suffix = suffix.casefold()
    if suffix == "k": value *= 1_000
    elif suffix in {"lac", "lacs", "lakh", "lakhs"}: value *= 100_000
    elif suffix in {"m", "million"}: value *= 1_000_000
    return round(value)


def normalize_salary(raw: dict[str, Any]) -> tuple[int | None, int | None]:
    direct = [raw.get("salary_min"), raw.get("salary_max")]
    if any(isinstance(value, (int, float)) for value in direct):
        return tuple(round(value) if isinstance(value, (int, float)) else None for value in direct)  # type: ignore[return-value]
    candidate = text(raw.get("salary"))
    matches = re.findall(r"(?<!\d)(\d[\d,]*(?:\.\d+)?)\s*(k|lac|lacs|lakh|lakhs|m|million)?", candidate, flags=re.I)
    amounts = [_amount(number, suffix) for number, suffix in matches]
    amounts = [amount for amount in amounts if 10_000 <= amount <= 10_000_000]
    if not amounts: return None, None
    if len(amounts) == 1: return amounts[0], amounts[0]
    return min(amounts[:2]), max(amounts[:2])


def parse_date(value: Any, fallback: date) -> date:
    try:
        return datetime.strptime(text(value)[:10], "%Y-%m-%d").date()
    except ValueError:
        return fallback


def clean_jobs(raw_jobs: Iterable[dict[str, Any]], reference_date: date | None = None) -> list[dict[str, Any]]:
    today = reference_date or date.today()
    cutoff = today - timedelta(days=90)
    seen: set[tuple[str, str, str]] = set()
    cleaned: list[dict[str, Any]] = []
    for raw in raw_jobs:
        title = text(raw.get("job_title") or raw.get("title"))
        company = text(raw.get("company_name") or raw.get("company")) or "Unknown employer"
        location = text(raw.get("city") or raw.get("location"))
        description = text(raw.get("description"))
        experience_text = " ".join([text(raw.get("experience")), title, description])
        type_text = " ".join([text(raw.get("job_type")), title, description, location])
        city = normalize_city(location)
        posted = parse_date(raw.get("posted_date"), today)
        if not title or posted < cutoff or posted > today + timedelta(days=1):
            continue
        key = (title.casefold(), company.casefold(), city.casefold())
        if key in seen:
            continue
        seen.add(key)
        salary_min, salary_max = normalize_salary(raw)
        stable_id = hashlib.sha1("|".join(key).encode("utf-8")).hexdigest()[:16]
        cleaned.append({
            "id": stable_id,
            "job_title": title,
            "company_name": company,
            "city": city,
            "skills": extract_skills(title, description, raw.get("skills")),
            "experience_level": normalize_experience(experience_text),
            "job_type": normalize_job_type(type_text),
            "salary_min": salary_min,
            "salary_max": salary_max,
            "posted_date": posted.isoformat(),
            "source": text(raw.get("source")) or "Unknown",
            "description": description,
            "job_url": text(raw.get("job_url") or raw.get("url")),
        })
    return sorted(cleaned, key=lambda job: (job["posted_date"], job["job_title"]), reverse=True)


def build_payload(jobs: list[dict[str, Any]], updated: datetime | None = None) -> dict[str, Any]:
    return {"last_updated": (updated or datetime.now(PKT)).isoformat(timespec="seconds"), "count": len(jobs), "jobs": jobs}


def history_summary(snapshot_date: str, jobs: list[dict[str, Any]]) -> dict[str, Any]:
    skills = Counter(skill for job in jobs for skill in job["skills"])
    return {
        "date": snapshot_date,
        "total": len(jobs),
        "skills": dict(sorted(skills.items())),
        "cities": dict(sorted(Counter(job["city"] for job in jobs).items())),
        "experience": dict(sorted(Counter(job["experience_level"] for job in jobs).items())),
        "job_types": dict(sorted(Counter(job["job_type"] for job in jobs).items())),
    }


def write_outputs(jobs: list[dict[str, Any]], snapshot_date: date | None = None) -> None:
    day = snapshot_date or date.today()
    updated = datetime.combine(day, datetime.min.time(), PKT).replace(hour=8)
    payload = build_payload(jobs, updated)
    atomic_json(CURRENT_PATH, payload)
    atomic_json(HISTORY_DIR / f"{day.isoformat()}.json", payload)
    index_path = HISTORY_DIR / "index.json"
    try:
        index = json.loads(index_path.read_text(encoding="utf-8"))
        if not isinstance(index, list): index = []
    except (FileNotFoundError, json.JSONDecodeError):
        index = []
    index = [item for item in index if item.get("date") != day.isoformat()]
    index.append(history_summary(day.isoformat(), jobs))
    atomic_json(index_path, sorted(index, key=lambda item: item["date"])[-90:])
