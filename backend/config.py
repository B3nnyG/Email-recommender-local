from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    anthropic_model: str = "claude-sonnet-5"
    anthropic_api_key: str = ""

    max_file_size_bytes: int = 10 * 1024 * 1024  # 10MB, per FR1.4

    resume_extensions: set[str] = {".pdf", ".docx"}
    screenshot_extensions: set[str] = {".jpg", ".jpeg", ".png"}

    cors_origins: list[str] = ["http://localhost:3000", "https://email-recommender-local.vercel.app"]

    class Config:
        env_file = ".env"


settings = Settings()
