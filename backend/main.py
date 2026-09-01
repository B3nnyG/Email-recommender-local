from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import generate, parse, translate

app = FastAPI(title="Email Recommendation Generator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(parse.router)
app.include_router(translate.router)
app.include_router(generate.router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
