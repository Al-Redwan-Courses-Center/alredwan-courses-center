#!/usr/bin/env python3
"""
Middleware for enforcing image upload size limits at request level.
Provides early validation before reaching views.
"""

from django.http import JsonResponse
from django.conf import settings


class ImageUploadSizeLimitMiddleware:
    """
    Middleware to enforce file size limits on image uploads.
    Checks Content-Length header before processing the request.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.max_size_bytes = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024
    
    def __call__(self, request):
        # Check if this is a file upload request
        if request.method in ['POST', 'PUT', 'PATCH']:
            content_length = request.META.get('CONTENT_LENGTH')
            
            if content_length:
                try:
                    content_length = int(content_length)
                    
                    # If request is too large, reject early
                    if content_length > self.max_size_bytes:
                        return JsonResponse({
                            'error': 'File too large',
                            'detail': f'Maximum upload size is {settings.MAX_IMAGE_SIZE_MB}MB. '
                                     f'Your upload is {content_length / (1024 * 1024):.2f}MB',
                            'max_size_mb': settings.MAX_IMAGE_SIZE_MB
                        }, status=413)  # 413 Payload Too Large
                
                except (ValueError, TypeError):
                    pass
        
        response = self.get_response(request)
        return response
