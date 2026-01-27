#!/usr/bin/env python3
"""Cloudinary configuration and utility functions.

Note: When using django-cloudinary-storage, configuration is handled
automatically via CLOUDINARY_STORAGE in Django settings.py.
This module provides utility functions for custom transformations.
"""
import cloudinary
import cloudinary.uploader
from django.conf import settings


def get_optimized_url(public_id, **options):
    """
    Generate an optimized Cloudinary URL with transformations.
    
    Args:
        public_id: The Cloudinary public ID of the image
        **options: Override default transformations
        
    Returns:
        str: Optimized image URL
        
    Example:
        url = get_optimized_url('courses/my-image', width=400, height=300)
    """
    default_options = {
        'quality': 'auto:good',
        'fetch_format': 'auto',
        'secure': True,
    }
    default_options.update(options)
    return cloudinary.CloudinaryImage(public_id).build_url(**default_options)


def get_thumbnail_url(public_id, width=200, height=200):
    """
    Generate a thumbnail URL for an image.
    
    Args:
        public_id: The Cloudinary public ID
        width: Thumbnail width (default 200)
        height: Thumbnail height (default 200)
        
    Returns:
        str: Thumbnail URL
    """
    return cloudinary.CloudinaryImage(public_id).build_url(
        width=width,
        height=height,
        crop='fill',
        gravity='auto',  # Smart cropping - focuses on important parts
        quality='auto:low',  # Lower quality for thumbnails
        fetch_format='auto',
        secure=True,
    )


# Preset transformations for common use cases
TRANSFORMATIONS = {
    'course_card': {
        'width': 400,
        'height': 300,
        'crop': 'fill',
        'gravity': 'auto',
        'quality': 'auto:good',
        'fetch_format': 'auto',
    },
    'course_detail': {
        'width': 800,
        'crop': 'limit',
        'quality': 'auto:good',
        'fetch_format': 'auto',
    },
    'profile_thumbnail': {
        'width': 150,
        'height': 150,
        'crop': 'thumb',
        'gravity': 'face',  # Focus on face for profile pics
        'quality': 'auto:good',
        'fetch_format': 'auto',
    },
    'profile_large': {
        'width': 400,
        'height': 400,
        'crop': 'fill',
        'gravity': 'face',
        'quality': 'auto:good',
        'fetch_format': 'auto',
    },
}
