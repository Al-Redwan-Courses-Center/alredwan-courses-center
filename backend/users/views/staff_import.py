#!/usr/bin/env python3
"""
API view for staff password file download
Admin-only endpoint for downloading generated password Excel files
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.http import FileResponse
from django.conf import settings
from pathlib import Path
import os
import time


@api_view(['GET'])
@permission_classes([IsAdminUser])
def download_staff_passwords(request, filename):
    """
    Download staff password Excel file
    
    **Permission:** Admin only
    
    **URL:** `/api/users/staff/download-passwords/{filename}/`
    
    **Method:** GET
    
    **Security Features:**
    - Requires admin authentication
    - Files auto-expire after 24 hours
    - Files stored in secure temp directory
    
    **Response:**
    - Success: Excel file download
    - Error 404: File not found or expired
    
    **Example:**
    ```
    GET /api/users/staff/download-passwords/staff_passwords_20260228_143025.xlsx/
    Authorization: JWT <admin_token>
    ```
    """
    try:
        # Construct file path
        file_path = Path(settings.MEDIA_ROOT) / 'temp' / 'staff_imports' / filename
        
        # Check if file exists
        if not file_path.exists():
            return Response(
                {'error': 'File not found. It may have been deleted or expired.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if file is older than 24 hours and delete
        file_age = time.time() - os.path.getmtime(file_path)
        if file_age > 86400:  # 24 hours in seconds
            os.remove(file_path)
            return Response(
                {'error': 'File expired. Password files are automatically deleted after 24 hours for security.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Serve the file
        response = FileResponse(
            open(file_path, 'rb'),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
        
    except Exception as e:
        return Response(
            {'error': f'Error downloading file: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
