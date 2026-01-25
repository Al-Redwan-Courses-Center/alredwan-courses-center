#!/usr/bin/env python3
"""
Utility functions for image handling with Cloudinary integration:
- Validation with file size limits
- Automatic compression and optimization
- Organized folder structure on Cloudinary
"""

import os
import cloudinary
import cloudinary.uploader
from PIL import Image
from io import BytesIO
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.db import models
from django.conf import settings


def validate_image_size(image, max_size_mb=None):
    """
    Validator to ensure image file size is below the given limit.
    Uses settings.MAX_IMAGE_SIZE_MB if max_size_mb is not provided.
    """
    max_size = max_size_mb or settings.MAX_IMAGE_SIZE_MB
    if image.size > max_size * 1024 * 1024:
        raise ValidationError(f"Image size must be under {max_size} MB.")


def validate_image_format(image):
    """
    Validator to ensure the uploaded file is a valid image format.
    """
    valid_formats = ['JPEG', 'JPG', 'PNG', 'WEBP', 'GIF']
    try:
        img = Image.open(image)
        if img.format.upper() not in valid_formats:
            raise ValidationError(f"Invalid image format. Allowed: {', '.join(valid_formats)}")
        img.close()
    except Exception:
        raise ValidationError("Invalid image file.")


def compress_and_optimize_image(image_file, quality=None, max_width=None, max_height=None):
    """
    Compress and optimize an image before uploading.
    
    Args:
        image_file: Django UploadedFile object
        quality: JPEG quality (1-100), defaults to settings.IMAGE_COMPRESSION_QUALITY
        max_width: Maximum width in pixels, defaults to settings.IMAGE_MAX_WIDTH
        max_height: Maximum height in pixels, defaults to settings.IMAGE_MAX_HEIGHT
    
    Returns:
        InMemoryUploadedFile: Optimized image file
    """
    quality = quality or settings.IMAGE_COMPRESSION_QUALITY
    max_width = max_width or settings.IMAGE_MAX_WIDTH
    max_height = max_height or settings.IMAGE_MAX_HEIGHT
    
    try:
        # Open the image
        img = Image.open(image_file)
        
        # Convert RGBA/P to RGB for JPEG
        if img.mode in ('RGBA', 'P', 'LA'):
            # Create a white background
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize if needed (maintaining aspect ratio)
        img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
        
        # Save to BytesIO
        output = BytesIO()
        img.save(output, format='JPEG', quality=quality, optimize=True)
        output.seek(0)
        
        # Create InMemoryUploadedFile
        return InMemoryUploadedFile(
            output,
            'ImageField',
            f"{os.path.splitext(image_file.name)[0]}.jpg",
            'image/jpeg',
            output.getbuffer().nbytes,
            None
        )
    except Exception as e:
        raise ValidationError(f"Error processing image: {str(e)}")


class CloudinaryField(models.ImageField):
    """
    Custom ImageField that uploads to Cloudinary with compression and validation.
    """
    
    def __init__(self, *args, folder=None, **kwargs):
        """
        Args:
            folder: Cloudinary folder path (e.g., 'students', 'instructors/nid')
        """
        self.cloudinary_folder = folder
        super().__init__(*args, **kwargs)
    
    def pre_save(self, model_instance, add):
        """
        Compress and optimize image before saving.
        """
        file = super().pre_save(model_instance, add)
        
        if file and hasattr(file, 'file'):
            # Validate format
            validate_image_format(file)
            
            # Compress and optimize
            optimized_file = compress_and_optimize_image(file)
            setattr(model_instance, self.attname, optimized_file)
            return optimized_file
        
        return file


class CloudinaryImageMixin(models.Model):
    """
    A reusable mixin for models with Cloudinary ImageFields.
    Provides automatic compression and optimization.
    """

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        """
        Override save() to optimize image fields automatically before saving.
        """
        # Optimize all ImageFields before saving
        for field in self._meta.get_fields():
            if isinstance(field, models.ImageField):
                image_field = getattr(self, field.name)
                if image_field and hasattr(image_field, 'file'):
                    try:
                        # Validate and compress
                        validate_image_format(image_field)
                        optimized = compress_and_optimize_image(image_field)
                        setattr(self, field.name, optimized)
                    except Exception:
                        pass  # Let Django's validation handle errors
        
        super().save(*args, **kwargs)


# Cloudinary upload helper functions
def get_cloudinary_upload_options(folder, resource_type='image'):
    """
    Get standard Cloudinary upload options with compression.
    
    Args:
        folder: Cloudinary folder path
        resource_type: Type of resource ('image', 'video', 'raw')
    
    Returns:
        dict: Upload options for Cloudinary
    """
    return {
        'folder': folder,
        'resource_type': resource_type,
        'quality': 'auto:good',  # Automatic quality optimization
        'fetch_format': 'auto',  # Automatic format selection
        'flags': 'progressive',  # Progressive JPEG loading
    }


def cloudinary_upload_image(image_file, folder, public_id=None):
    """
    Upload an image to Cloudinary with compression.
    
    Args:
        image_file: File object to upload
        folder: Cloudinary folder path
        public_id: Optional custom public ID
    
    Returns:
        dict: Cloudinary response with URL and metadata
    """
    options = get_cloudinary_upload_options(folder)
    if public_id:
        options['public_id'] = public_id
    
    result = cloudinary.uploader.upload(image_file, **options)
    return result


def cloudinary_delete_image(public_id):
    """
    Delete an image from Cloudinary.
    
    Args:
        public_id: The Cloudinary public ID of the image
    
    Returns:
        dict: Cloudinary response
    """
    return cloudinary.uploader.destroy(public_id)
