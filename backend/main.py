from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.chat import router as chat_router
from routes.upload import router as upload_router
from routes.applications import router as applications_router

app = FastAPI(
    title="JobBuddy API",
    description="AI-powered job assistant backend",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router,         prefix="/api")
app.include_router(upload_router,       prefix="/api")
app.include_router(applications_router, prefix="/api")

@app.get("/")
def root():
    return {"status": "JobBuddy API is running ✅"}
