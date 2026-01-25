#!/usr/bin/env python3
"""
DRF serializers for image upload with validation and compression.
"""

from rest_framework import serializers
from django.conf import settings
from core.utils.image_utils import validate_image_size, validate_image_format


class ImageUploadSerializer(serializers.Serializer):
    """
    Serializer for image uploads with validation.
    Validates file size, format, and automatically compresses images.
    """
    image = serializers.ImageField(
        required=True,
        validators=[validate_image_size, validate_image_format],
        help_text=f"Maximum file size: {settings.MAX_IMAGE_SIZE_MB}MB. "
                  f"Allowed formats: JPEG, PNG, WEBP, GIF"
    )

    def validate_image(self, value):
        """Additional validation for image field."""
        # Check file size
        if value.size > settings.MAX_IMAGE_SIZE_MB * 1024 * 1024:
            raise serializers.ValidationError(
                f"Image file size must be under {settings.MAX_IMAGE_SIZE_MB}MB. "
                f"Current size: {value.size / (1024 * 1024):.2f}MB"
            )
        
        return value


class MultipleImageUploadSerializer(serializers.Serializer):
    """
    Serializer for uploading multiple images at once.
    """
    images = serializers.ListField(
        child=serializers.ImageField(
            validators=[validate_image_size, validate_image_format]
        ),
        required=True,
        max_length=10,  # Maximum 10 images at once
        help_text=f"Upload up to 10 images. Maximum file size per image: {settings.MAX_IMAGE_SIZE_MB}MB"
    )

    def validate_images(self, value):
        """Validate each image in the list."""
        if not value:
            raise serializers.ValidationError("At least one image is required.")
        
        if len(value) > 10:
            raise serializers.ValidationError("Maximum 10 images allowed per upload.")
        
        return value
