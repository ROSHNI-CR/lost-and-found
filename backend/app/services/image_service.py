import os
import hashlib
from typing import Optional
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings
from app.utils.file_validation import validate_image_file

class ImageService:
    @staticmethod
    async def save_image(file: UploadFile) -> str:
        """
        Validate and save uploaded image.
        Returns the relative URL path for accessing the image.
        """
        content = await file.read()
        
        is_valid, error_msg, ext = validate_image_file(file, content)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg or "Invalid image file"
            )
            
        # Optional Cloudinary upload if configured
        if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
            try:
                import cloudinary
                import cloudinary.uploader
                cloudinary.config(
                    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                    api_key=settings.CLOUDINARY_API_KEY,
                    api_secret=settings.CLOUDINARY_API_SECRET
                )
                upload_res = cloudinary.uploader.upload(content, folder="findit_ai")
                return upload_res.get("secure_url")
            except Exception as e:
                # Fallback to local storage if Cloudinary fails
                pass

        # Local storage
        upload_dir = os.path.join(os.getcwd(), settings.UPLOAD_DIR)
        os.makedirs(upload_dir, exist_ok=True)
        
        # File hashing for unique filename and deduplication
        file_hash = hashlib.sha256(content).hexdigest()[:16]
        filename = f"{file_hash}{ext}"
        filepath = os.path.join(upload_dir, filename)
        
        with open(filepath, "wb") as f:
            f.write(content)
            
        return f"/uploads/{filename}"

image_service = ImageService()
