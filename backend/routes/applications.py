from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from agents.job_applier import apply_to_job, get_applications_list

router = APIRouter()

class ApplyRequest(BaseModel):
    job_identifier: str

@router.get("/applications")
async def get_applications():
    apps = get_applications_list()
    return {"applications": apps, "total": len(apps)}

@router.post("/applications/apply")
async def apply_job_endpoint(payload: ApplyRequest):
    if not payload.job_identifier.strip():
        raise HTTPException(status_code=400, detail="Job identifier cannot be empty.")

    result = apply_to_job(payload.job_identifier)
    return result
