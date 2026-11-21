import io
from typing import Tuple, Optional
from PIL import Image
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}

def validate_image_file(file: UploadFile, content: bytes) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Validate uploaded image:
    1. Size within MAX_UPLOAD_SIZE_MB
    2. Extension in allowed list
    3. True binary format verified via PIL
    Returns: (is_valid, error_message, detected_extension)
    """
    # 1. Size check
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        return False, f"File size exceeds maximum allowed limit of {settings.MAX_UPLOAD_SIZE_MB}MB.", None
    
    if len(content) == 0:
        return False, "Uploaded file is empty.", None

    # 2. Filename check
    filename = file.filename or "upload.jpg"
    ext = "." + filename.split(".")[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        return False, f"Unsupported file extension '{ext}'. Allowed extensions: {', '.join(ALLOWED_EXTENSIONS)}", None

    # 3. Binary verification with Pillow
    try:
        image = Image.open(io.BytesIO(content))
        image.verify()  # Verifies integrity without loading full pixel buffer
        detected_format = (image.format or "").upper()
        
        format_map = {
            "JPEG": ".jpg",
            "PNG": ".png",
            "WEBP": ".webp"
        }
        
        if detected_format not in format_map:
            return False, f"File content is not a valid JPEG, PNG, or WEBP image (detected: {detected_format}).", None
            
        return True, None, format_map[detected_format]
    except Exception as e:
        return False, f"Invalid or corrupted image data: {str(e)}", None
