import json
import os

BASE_DIR  = os.path.dirname(__file__)
JOBS_PATH = os.path.join(BASE_DIR, "jobs.json")
APPS_PATH = os.path.join(BASE_DIR, "applications.json")


def read_jobs() -> list[dict]:
    with open(JOBS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def read_applications() -> list[dict]:
    with open(APPS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def write_applications(applications: list[dict]) -> None:
    with open(APPS_PATH, "w", encoding="utf-8") as f:
        json.dump(applications, f, indent=2)


def write_jobs(jobs: list[dict]) -> None:
    with open(JOBS_PATH, "w", encoding="utf-8") as f:
        json.dump(jobs, f, indent=2, ensure_ascii=False)


def find_job_by_id(job_id: str) -> dict | None:
    jobs = read_jobs()
    for job in jobs:
        if job["id"] == job_id:
            return job
    return None


def application_exists(job_id: str) -> bool:
    applications = read_applications()
    return any(app["job_id"] == job_id for app in applications)
