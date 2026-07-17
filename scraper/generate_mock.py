"""Create a deterministic, realistic starter dataset and 30 daily snapshots."""

from __future__ import annotations

import random
from datetime import date, datetime, time, timedelta

from cleaner import HISTORY_DIR, PKT, RAW_PATH, atomic_json, build_payload, clean_jobs, history_summary, write_outputs

random.seed(20260717)

COMPANIES = [
    "Systems Limited", "NetSol Technologies", "Arbisoft", "10Pearls", "Contour Software", "VentureDive",
    "Tkxel", "Devsinc", "Dubizzle Labs", "Afiniti", "Motive", "Careem", "S&P Global", "Confiz",
    "Folio3", "Educative", "Bazaar Technologies", "Dastgyr", "Bykea", "Meezan Digital", "Jazz Digital",
    "LMKR", "i2c Inc.", "NorthBay Solutions", "Emumba", "Creative Chaos", "PureLogics", "Techlogix",
]

ROLES = [
    ("Frontend Engineer", ["React", "TypeScript", "JavaScript"]),
    ("Full Stack Developer", ["Next.js", "Node.js", "PostgreSQL"]),
    ("Python Backend Engineer", ["Python", "Django", "PostgreSQL"]),
    ("Mobile App Developer", ["Flutter", "Dart", "Firebase"]),
    ("Cloud DevOps Engineer", ["AWS", "Docker", "Kubernetes"]),
    ("Machine Learning Engineer", ["AI/ML", "Python", "PyTorch"]),
    ("Quality Assurance Engineer", ["QA", "Selenium", "Cypress"]),
    ("Java Software Engineer", ["Java", "Spring", "SQL"]),
    ("PHP Web Developer", ["PHP", "Laravel", "MySQL"]),
    ("Android Engineer", ["Android", "Kotlin", "Firebase"]),
    ("iOS Engineer", ["iOS", "Swift", "Firebase"]),
    ("Data Engineer", ["Python", "SQL", "AWS"]),
    ("MERN Stack Developer", ["React", "Node.js", "MongoDB"]),
    ("Angular Developer", ["Angular", "TypeScript", "Node.js"]),
    ("AI Product Engineer", ["AI/ML", "FastAPI", "Python"]),
]

CITIES = ["Lahore"] * 7 + ["Karachi"] * 7 + ["Islamabad"] * 5 + ["Rawalpindi"] * 2 + ["Peshawar"] + ["Faisalabad"]
EXPERIENCE = [
    ("Fresh graduate / 0-1 year", "Junior"),
    ("2-4 years of relevant experience", ""),
    ("2-4 years of relevant experience", ""),
    ("5-8 years of relevant experience", "Senior"),
    ("9+ years with team leadership", "Lead"),
]
SOURCES = [
    ("Rozee.pk", "https://rozee.pk/job/jsearch/q/technology"),
    ("Mustakbil.com", "https://www.mustakbil.com/jobs/it-telecom/"),
    ("Glassdoor", "https://www.glassdoor.com/Job/pakistan-tech-jobs-SRCH_IL.0,8_IN192_KO9,13.htm"),
]
DOMAINS = ["Platform", "Payments", "Commerce", "Analytics", "Growth", "Infrastructure", "Automation", "Core Product"]


def generate(count: int = 240) -> list[dict]:
    today = date.today()
    records: list[dict] = []
    keys: set[tuple[str, str, str]] = set()
    attempts = 0
    while len(records) < count and attempts < 10_000:
        attempts += 1
        role, skills = random.choice(ROLES)
        experience, prefix = random.choice(EXPERIENCE)
        domain = random.choice(DOMAINS)
        title = " ".join(part for part in (prefix, role, f"— {domain}") if part)
        company = random.choice(COMPANIES)
        city = random.choice(CITIES)
        arrangement = random.choices(["Onsite", "Remote", "Hybrid"], weights=[56, 24, 20], k=1)[0]
        location = "Pakistan (Remote)" if arrangement == "Remote" else city
        key = (title.casefold(), company.casefold(), location.casefold())
        if key in keys:
            continue
        keys.add(key)
        source, url = random.choice(SOURCES)
        age = random.randint(0, 59)
        base = {"Junior": 70_000, "": 150_000, "Senior": 280_000, "Lead": 430_000}[prefix]
        salary_min = int((base + random.randint(-20_000, 40_000)) / 5_000) * 5_000
        salary_max = salary_min + random.choice([50_000, 70_000, 100_000, 140_000])
        salary = "" if random.random() < 0.28 else f"PKR {salary_min:,} - {salary_max:,} per month"
        records.append({
            "job_title": title,
            "company_name": company,
            "location": location,
            "description": f"Join {company}'s {domain.lower()} team to build production systems with {', '.join(skills)}. This {arrangement.lower()} role values clear communication, testing, ownership and reliable delivery.",
            "experience": experience,
            "job_type": arrangement,
            "salary": salary,
            "posted_date": (today - timedelta(days=age)).isoformat(),
            "source": source,
            "job_url": url,
        })
    if len(records) != count:
        raise RuntimeError(f"Could only create {len(records)} unique mock records")
    return records


def main() -> None:
    today = date.today()
    raw = generate()
    atomic_json(RAW_PATH, raw)
    jobs = clean_jobs(raw, reference_date=today)
    write_outputs(jobs, snapshot_date=today)

    index = []
    for offset in range(29, -1, -1):
        day = today - timedelta(days=offset)
        snapshot_jobs = [job for job in jobs if job["posted_date"] <= day.isoformat()]
        updated = datetime.combine(day, time(hour=8), tzinfo=PKT)
        atomic_json(HISTORY_DIR / f"{day.isoformat()}.json", build_payload(snapshot_jobs, updated))
        index.append(history_summary(day.isoformat(), snapshot_jobs))
    atomic_json(HISTORY_DIR / "index.json", index)
    print(f"Generated {len(jobs)} normalized mock jobs and {len(index)} daily snapshots.")


if __name__ == "__main__":
    main()
