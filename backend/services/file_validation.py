import os

from fastapi import HTTPException, UploadFile

from config import settings


async def read_and_validate(upload_file: UploadFile, allowed_extensions: set[str], label: str) -> bytes:
    """Validate extension and size, then return the file's bytes.

    Per NFR1.2, files are read fully into memory and never written to disk.
    """
    ext = os.path.splitext(upload_file.filename or "")[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"{label}: unsupported file type '{ext or 'unknown'}'. "
            f"Allowed: {', '.join(sorted(allowed_extensions))}",
        )

    content = await upload_file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail=f"{label}: uploaded file is empty")
    if len(content) > settings.max_file_size_bytes:
        max_mb = settings.max_file_size_bytes / (1024 * 1024)
        raise HTTPException(status_code=400, detail=f"{label}: file exceeds {max_mb:.0f}MB limit")

    return content
