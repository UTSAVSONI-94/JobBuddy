from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from agents.orchestrator import process_chat

router = APIRouter()

class ChatPayload(BaseModel):
    message: str
    history: list[dict] = []
    resume: dict | None = None

@router.get("/health")
async def health():
    return {"status": "JobBuddy API is running ✅"}

@router.post("/chat")
async def chat_endpoint(payload: ChatPayload):
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    try:
        response = process_chat(
            message=payload.message,
            history=payload.history,
            resume_profile=payload.resume
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat: {str(e)}")
