import uuid
from datetime import datetime, timezone
from db.db_helpers import (
    read_applications,
    write_applications,
    find_job_by_id,
    application_exists,
    read_jobs
)

def apply_to_job(job_identifier: str, recent_jobs: list[dict] | None = None) -> dict:
    if not job_identifier or not job_identifier.strip():
        return {
            "success": False,
            "message": "Please specify which job you want to apply to (e.g. 'apply to 1', 'apply to job_0001', or 'apply to Spotify')."
        }

    target_job = None
    clean_id = job_identifier.strip().lower()

    if clean_id.isdigit():
        idx = int(clean_id)
        if recent_jobs and 1 <= idx <= len(recent_jobs):
            target_job = recent_jobs[idx - 1]
        else:
            all_jobs = read_jobs()
            target_id = f"job_{idx:04d}"
            target_job = find_job_by_id(target_id)
            if not target_job and 1 <= idx <= len(all_jobs):
                target_job = all_jobs[idx - 1]

    if not target_job and clean_id.startswith("job_"):
        target_job = find_job_by_id(job_identifier.strip())

    if not target_job and recent_jobs:
        for rj in recent_jobs:
            if clean_id in rj.get("company", "").lower() or clean_id in rj.get("title", "").lower():
                target_job = rj
                break

    if not target_job:
        target_job = find_job_by_id(job_identifier.strip())

    if not target_job:
        all_jobs = read_jobs()
        for aj in all_jobs:
            if clean_id in aj.get("company", "").lower():
                target_job = aj
                break

    if not target_job:
        return {
            "success": False,
            "message": f"Job '{job_identifier}' was not found. Please select a valid number from your recommended list (e.g., 'apply to 1') or use the Job ID."
        }

    job_id = target_job["id"]

    if application_exists(job_id):
        apps = read_applications()
        existing = next((a for a in apps if a["job_id"] == job_id), None)
        applied_date = existing["applied_at"][:10] if existing and "applied_at" in existing else "recently"
        status = existing.get("status", "Applied") if existing else "Applied"
        return {
            "success": False,
            "already_applied": True,
            "message": f"You have already applied for '{target_job['title']}' at {target_job['company']} on {applied_date}. Current status: {status}.",
            "application": existing
        }

    new_app = {
        "application_id": f"app_{uuid.uuid4().hex[:8]}",
        "job_id": job_id,
        "job_title": target_job.get("title", ""),
        "company": target_job.get("company", ""),
        "location": target_job.get("location", ""),
        "sourceLink": target_job.get("sourceLink", ""),
        "applied_at": datetime.now(timezone.utc).isoformat(),
        "status": "Applied"
    }

    try:
        current_apps = read_applications()
        current_apps.append(new_app)
        write_applications(current_apps)
    except Exception as e:
        return {
            "success": False,
            "message": f"Database error while saving application: {str(e)}"
        }

    return {
        "success": True,
        "already_applied": False,
        "message": f"✅ Application submitted successfully for '{target_job['title']}' at {target_job['company']}! Reference ID: {new_app['application_id']}",
        "application": new_app
    }

def get_applications_list() -> list[dict]:
    try:
        return read_applications()
    except Exception:
        return []
