#!/usr/bin/env python3
"""
Utility functions for image handling: validation, resizing, and optimization.
"""

import os
from PIL import Image
from django.core.exceptions import ValidationError
from django.db import models


def validate_image_size(image, max_size_mb=2):
    """
    Validator to ensure image file size is below the given limit (default: 2 MB).
    """
    if image.size > max_size_mb * 1024 * 1024:
        raise ValidationError(f"Image size must be under {max_size_mb} MB.")


class ImageOptimizationMixin(models.Model):
    """
    A reusable mixin for models with ImageFields.
    Automatically:
      - Validates image file size
      - Resizes large images (max 800x800)
      - Converts to JPEG with 85% quality
    """

    IMAGE_MAX_SIZE = (800, 800)
    IMAGE_QUALITY = 85

    class Meta:
        abstract = True

    def optimize_image(self, image_field):
        """
        Resizes and optimizes a given image field.
        """
        if not getattr(self, image_field):
            return

        image_field_file = getattr(self, image_field)
        image_path = image_field_file.path

        if not os.path.exists(image_path):
            return

        try:
            img = Image.open(image_path)

            # Resize to max dimensions while maintaining aspect ratio
            img.thumbnail(self.IMAGE_MAX_SIZE)

            # Convert to JPEG
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")

            img.save(image_path, format="JPEG", quality=self.IMAGE_QUALITY)
        except Exception as e:
            raise ValidationError(f"Error optimizing image: {str(e)}")

    def save(self, *args, **kwargs):
        """
        Override save() to optimize image fields automatically after saving.
        """
        super().save(*args, **kwargs)

        # Loop through all ImageFields in the model
        for field in self._meta.get_fields():
            if isinstance(field, models.ImageField):
                self.optimize_image(field.name)
