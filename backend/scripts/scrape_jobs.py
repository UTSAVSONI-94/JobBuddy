import requests
import json
import uuid
import time
import re
import os

BASE_DIR  = os.path.dirname(os.path.dirname(__file__))
JOBS_PATH = os.path.join(BASE_DIR, "db", "jobs.json")

KNOWN_SKILLS = [
    "Python", "JavaScript", "TypeScript", "React", "Node.js", "Vue.js",
    "Angular", "Next.js", "Django", "FastAPI", "Flask", "Express",
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "GraphQL", "REST API",
    "Docker", "Kubernetes", "AWS", "GCP", "Azure", "Terraform",
    "Git", "CI/CD", "Linux", "Bash", "Java", "Kotlin", "Swift",
    "Go", "Rust", "C++", "C#", ".NET", "PHP", "Ruby", "Rails",
    "Flutter", "React Native", "HTML", "CSS", "Tailwind CSS",
    "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch",
    "Pandas", "NumPy", "Scikit-learn", "LangChain", "OpenAI",
    "Figma", "Jira", "Agile", "Scrum", "DevOps", "Microservices",
]


def extract_skills_from_text(text: str) -> list[str]:
    if not text:
        return []
    found = []
    text_lower = text.lower()
    for skill in KNOWN_SKILLS:
        if skill.lower() in text_lower:
            found.append(skill)
    return found[:15]


def clean_html(text: str) -> str:
    if not text:
        return ""
    clean = re.sub(r"<[^>]+>", " ", text)
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean[:800]


def make_job(
    title: str,
    company: str,
    location: str,
    description: str,
    source_link: str,
    skills: list[str] | None = None,
    experience: str = "Not specified",
    posted_at: str = "",
    counter: list | None = None,
) -> dict:
    if counter is not None:
        counter[0] += 1
        job_id = f"job_{counter[0]:04d}"
    else:
        job_id = f"job_{uuid.uuid4().hex[:8]}"

    if not skills:
        skills = extract_skills_from_text(description)

    return {
        "id":          job_id,
        "title":       title.strip() or "Software Engineer",
        "company":     company.strip() or "Unknown Company",
        "location":    location.strip() or "Remote",
        "experience":  experience,
        "skills":      skills,
        "description": clean_html(description),
        "sourceLink":  source_link,
        "postedAt":    posted_at,
    }


def scrape_remoteok(counter: list) -> list[dict]:
    print("\n📡 [1/5] Fetching RemoteOK jobs...")
    jobs = []
    try:
        headers = {"User-Agent": "JobBuddy/1.0 (educational project)"}
        res = requests.get("https://remoteok.com/api", headers=headers, timeout=20)
        data = res.json()
        listings = [d for d in data if isinstance(d, dict) and d.get("id")]
        for item in listings:
            desc   = clean_html(item.get("description", ""))
            skills = list(item.get("tags", []))[:12]
            if not skills:
                skills = extract_skills_from_text(desc)
            jobs.append(make_job(
                title       = item.get("position", ""),
                company     = item.get("company", ""),
                location    = item.get("location") or "Remote",
                description = desc,
                source_link = item.get("url", "https://remoteok.com"),
                skills      = skills,
                posted_at   = item.get("date", ""),
                counter     = counter,
            ))
        print(f"   ✅ RemoteOK: {len(jobs)} jobs")
    except Exception as e:
        print(f"   ⚠️  RemoteOK failed: {e}")
    return jobs


def scrape_arbeitnow(counter: list, max_pages: int = 40) -> list[dict]:
    print("\n📡 [2/5] Fetching Arbeitnow jobs...")
    jobs = []
    base_url = "https://arbeitnow.com/api/job-board-api"
    for page in range(1, max_pages + 1):
        try:
            res  = requests.get(base_url, params={"page": page}, timeout=15)
            data = res.json()
            listings = data.get("data", [])
            if not listings:
                print(f"   ℹ️  No more pages after page {page}")
                break
            for item in listings:
                desc   = clean_html(item.get("description", ""))
                skills = list(item.get("tags", []))[:12]
                if not skills:
                    skills = extract_skills_from_text(desc)
                loc = "Remote" if item.get("remote") else item.get("location", "")
                jobs.append(make_job(
                    title       = item.get("title", ""),
                    company     = item.get("company_name", ""),
                    location    = loc,
                    description = desc,
                    source_link = item.get("url", "https://arbeitnow.com"),
                    skills      = skills,
                    posted_at   = item.get("created_at", ""),
                    counter     = counter,
                ))
            print(f"   Page {page:02d}: +{len(listings)} jobs (total: {len(jobs)})")
            time.sleep(0.3)
        except Exception as e:
            print(f"   ⚠️  Arbeitnow page {page} failed: {e}")
            break
    print(f"   ✅ Arbeitnow: {len(jobs)} jobs")
    return jobs


def scrape_themuse(counter: list, max_pages: int = 50) -> list[dict]:
    print("\n📡 [3/5] Fetching The Muse jobs...")
    jobs = []
    base_url = "https://www.themuse.com/api/public/jobs"
    for page in range(1, max_pages + 1):
        try:
            res  = requests.get(base_url, params={"page": page, "count": 20}, timeout=15)
            data = res.json()
            listings = data.get("results", [])
            if not listings:
                break
            for item in listings:
                desc_parts = []
                for section in item.get("contents", "").split("<section"):
                    text = re.sub(r"<[^>]+>", " ", section)
                    text = re.sub(r"\s+", " ", text).strip()
                    if text:
                        desc_parts.append(text)
                desc    = " ".join(desc_parts)[:800]
                skills  = extract_skills_from_text(desc)
                locations = item.get("locations", [])
                loc = locations[0].get("name", "Remote") if locations else "Remote"
                cats = item.get("categories", [])
                cat  = cats[0].get("name", "") if cats else ""
                jobs.append(make_job(
                    title       = item.get("name", ""),
                    company     = item.get("company", {}).get("name", ""),
                    location    = loc,
                    description = desc,
                    source_link = item.get("refs", {}).get("landing_page", "https://themuse.com"),
                    skills      = skills,
                    experience  = cat or "Not specified",
                    posted_at   = item.get("publication_date", "")[:10] if item.get("publication_date") else "",
                    counter     = counter,
                ))
            print(f"   Page {page:02d}: +{len(listings)} jobs (total: {len(jobs)})")
            time.sleep(0.3)
        except Exception as e:
            print(f"   ⚠️  The Muse page {page} failed: {e}")
            break
    print(f"   ✅ The Muse: {len(jobs)} jobs")
    return jobs


def scrape_himalayas(counter: list, max_pages: int = 20) -> list[dict]:
    print("\n📡 [4/5] Fetching Himalayas jobs...")
    jobs = []
    base_url = "https://himalayas.app/jobs/api"
    for page in range(1, max_pages + 1):
        try:
            res  = requests.get(base_url, params={"limit": 100, "offset": (page - 1) * 100}, timeout=20)
            data = res.json()
            listings = data.get("jobs", [])
            if not listings:
                break
            for item in listings:
                desc   = clean_html(item.get("description", ""))
                skills = [s.get("title", "") for s in item.get("techStack", [])][:12]
                if not skills:
                    skills = extract_skills_from_text(desc)
                exp = item.get("yearsOfExperience", "")
                experience = f"{exp} years" if exp else "Not specified"
                jobs.append(make_job(
                    title       = item.get("title", ""),
                    company     = item.get("companyName", ""),
                    location    = item.get("locationRestrictions") or "Remote",
                    description = desc,
                    source_link = item.get("applicationLink") or item.get("url", "https://himalayas.app"),
                    skills      = skills,
                    experience  = experience,
                    posted_at   = item.get("createdAt", "")[:10] if item.get("createdAt") else "",
                    counter     = counter,
                ))
            print(f"   Page {page:02d}: +{len(listings)} jobs (total: {len(jobs)})")
            time.sleep(0.4)
        except Exception as e:
            print(f"   ⚠️  Himalayas page {page} failed: {e}")
            break
    print(f"   ✅ Himalayas: {len(jobs)} jobs")
    return jobs


def scrape_jobicy(counter: list) -> list[dict]:
    print("\n📡 [5/5] Fetching Jobicy jobs...")
    jobs   = []
    categories = [
        "engineering", "design", "marketing", "sales",
        "product", "data", "devops", "management", ""
    ]
    seen_ids = set()
    for cat in categories:
        try:
            params = {"count": 50, "geo": "worldwide"}
            if cat:
                params["industry"] = cat
            res  = requests.get("https://jobicy.com/api/v2/remote-jobs", params=params, timeout=15)
            data = res.json()
            for item in data.get("jobs", []):
                jid = str(item.get("id", ""))
                if jid in seen_ids:
                    continue
                seen_ids.add(jid)
                desc   = clean_html(item.get("jobDescription", ""))
                skills = list(item.get("jobIndustry", []) or [])[:6]
                if not skills:
                    skills = extract_skills_from_text(desc)
                jobs.append(make_job(
                    title       = item.get("jobTitle", ""),
                    company     = item.get("companyName", ""),
                    location    = item.get("jobGeo") or "Remote",
                    description = desc,
                    source_link = item.get("url", "https://jobicy.com"),
                    skills      = skills,
                    experience  = item.get("jobLevel", "Not specified"),
                    posted_at   = item.get("pubDate", "")[:10] if item.get("pubDate") else "",
                    counter     = counter,
                ))
            print(f"   Category '{cat or 'all'}': +{len(data.get('jobs', []))} jobs")
            time.sleep(0.5)
        except Exception as e:
            print(f"   ⚠️  Jobicy category '{cat}' failed: {e}")
    print(f"   ✅ Jobicy: {len(jobs)} jobs")
    return jobs


def main():
    print("=" * 60)
    print("  🤖 JobBuddy — Job Scraper")
    print("  Target: 1,500 – 2,000 real job listings")
    print("=" * 60)

    counter = [0]

    all_jobs: list[dict] = []
    all_jobs += scrape_remoteok(counter)
    all_jobs += scrape_arbeitnow(counter, max_pages=40)
    all_jobs += scrape_themuse(counter,   max_pages=50)
    all_jobs += scrape_himalayas(counter, max_pages=20)
    all_jobs += scrape_jobicy(counter)

    print("\n🔄 Deduplicating...")
    seen   = set()
    unique = []
    for job in all_jobs:
        key = (job["title"].lower().strip(), job["company"].lower().strip())
        if key not in seen:
            seen.add(key)
            unique.append(job)

    for i, job in enumerate(unique, start=1):
        job["id"] = f"job_{i:04d}"

    os.makedirs(os.path.dirname(JOBS_PATH), exist_ok=True)
    with open(JOBS_PATH, "w", encoding="utf-8") as f:
        json.dump(unique, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 60)
    print(f"  ✅Saved {len(unique):,} unique jobs to db/jobs.json")
    print("=" * 60)

    if len(unique) < 1000:
        print("\n⚠️  Got fewer than 1,000 jobs. Wait 5 minutes and re-run.\n")
    else:
        print(f"\n Done! {len(unique):,} jobs ready for matching.\n")


if __name__ == "__main__":
    main()
