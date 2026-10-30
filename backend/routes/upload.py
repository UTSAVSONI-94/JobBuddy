from fastapi import APIRouter, UploadFile, File, HTTPException
from utils.file_parser import extract_text
from agents.resume_parser import parse_resume

router = APIRouter()

MAX_FILE_SIZE = 5 * 1024 * 1024

@router.post("/upload")
async def upload_resume_file(file: UploadFile = File(...)):
    filename = file.filename or ""
    lower_name = filename.lower()
    if not (lower_name.endswith(".pdf") or lower_name.endswith(".docx")):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Please upload a PDF (.pdf) or Word document (.docx)."
        )

    try:
        contents = await file.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to read the uploaded file stream.")

    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty (0 bytes).")

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File size exceeds the 5MB limit. Please upload a smaller resume."
        )

    try:
        raw_text = extract_text(filename, contents)
    except (ValueError, ImportError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error reading resume: {str(e)}")

    try:
        profile = parse_resume(raw_text)
        print(f"Uploaded: {filename} | Extracted {len(profile.get('skills', []))} skills: {profile.get('skills', [])}")
        return profile
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing resume structure: {str(e)}")
