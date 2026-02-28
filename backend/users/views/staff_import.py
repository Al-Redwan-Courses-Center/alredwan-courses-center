#!/usr/bin/env python3
"""
API views for staff import functionality
Handles Excel upload, import, and password file download
"""

from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.http import FileResponse, Http404
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


@api_view(['POST'])
@permission_classes([IsAdminUser])
@parser_classes([MultiPartParser, FormParser])
def import_staff_from_upload(request):
    """
    Upload Excel file and import staff members
    
    **Permission:** Admin only
    
    **URL:** `/api/users/staff/import/`
    
    **Method:** POST
    
    **Content-Type:** multipart/form-data
    
    **Request Body:**
    - `file`: Excel file (.xlsx) with staff data
    
    **Response:**
    ```json
    {
        "success": true,
        "message": "Successfully imported 5 staff members",
        "stats": {
            "total": 5,
            "success": 5,
            "skipped": 0,
            "errors": 0
        },
        "download_url": "/api/users/staff/download-passwords/staff_passwords_20260228_143025.xlsx/",
        "filename": "staff_passwords_20260228_143025.xlsx",
        "expires_in": "24 hours"
    }
    ```
    
    **Example using cURL:**
    ```bash
    curl -X POST \
      -H "Authorization: JWT <admin_token>" \
      -F "file=@staff_data.xlsx" \
      http://localhost:8000/api/users/staff/import/
    ```
    
    **Example using JavaScript:**
    ```javascript
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    
    fetch('/api/users/staff/import/', {
        method: 'POST',
        headers: {
            'Authorization': `JWT ${token}`
        },
        body: formData
    });
    ```
    """
    try:
        # Validate file upload
        if 'file' not in request.FILES:
            return Response(
                {'error': 'No file uploaded. Please provide an Excel file.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        excel_file = request.FILES['file']
        
        # Validate file extension
        if not excel_file.name.endswith(('.xlsx', '.xls')):
            return Response(
                {'error': 'Invalid file format. Please upload an Excel file (.xlsx or .xls)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create temp directory for uploads
        temp_dir = Path(settings.MEDIA_ROOT) / 'temp' / 'uploads'
        temp_dir.mkdir(parents=True, exist_ok=True)
        
        # Save uploaded file temporarily
        temp_file = temp_dir / excel_file.name
        
        with open(temp_file, 'wb+') as destination:
            for chunk in excel_file.chunks():
                destination.write(chunk)
        
        # Import staff from Excel
        import sys
        from pathlib import Path as FilePath
        scripts_dir = FilePath(__file__).resolve().parent.parent.parent / 'scripts'
        sys.path.insert(0, str(scripts_dir))
        
        from import_staff_from_excel import StaffImporter
        
        importer = StaffImporter(str(temp_file))
        importer.import_from_excel()
        password_file = importer.export_passwords_to_excel()
        
        # Clean up uploaded temp file
        if temp_file.exists():
            os.remove(temp_file)
        
        # Prepare response
        if password_file and importer.stats['success'] > 0:
            filename = Path(password_file).name
            download_url = f"/api/users/staff/download-passwords/{filename}/"
            
            return Response({
                'success': True,
                'message': f"Successfully imported {importer.stats['success']} staff member(s)",
                'stats': importer.stats,
                'download_url': download_url,
                'filename': filename,
                'expires_in': '24 hours',
                'errors': importer.error_messages if importer.error_messages else None
            }, status=status.HTTP_201_CREATED)
        
        elif importer.stats['success'] == 0 and importer.stats['total'] > 0:
            return Response({
                'success': False,
                'message': 'No staff members were imported',
                'stats': importer.stats,
                'errors': importer.error_messages
            }, status=status.HTTP_400_BAD_REQUEST)
        
        else:
            return Response({
                'success': False,
                'message': 'Import completed but password file creation failed',
                'stats': importer.stats,
                'errors': importer.error_messages
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        # Clean up temp file on error
        if 'temp_file' in locals() and temp_file.exists():
            os.remove(temp_file)
        
        import traceback
        error_trace = traceback.format_exc()
        
        return Response({
            'error': f'Import failed: {str(e)}',
            'details': error_trace if settings.DEBUG else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def list_available_password_files(request):
    """
    List all available password files (not expired)
    
    **Permission:** Admin only
    
    **URL:** `/api/users/staff/password-files/`
    
    **Method:** GET
    
    **Response:**
    ```json
    {
        "files": [
            {
                "filename": "staff_passwords_20260228_143025.xlsx",
                "created": "2026-02-28 14:30:25",
                "expires_in_hours": 12.5,
                "download_url": "/api/users/staff/download-passwords/staff_passwords_20260228_143025.xlsx/",
                "size_kb": 15.2
            }
        ],
        "total": 1
    }
    ```
    """
    try:
        import datetime
        
        files_dir = Path(settings.MEDIA_ROOT) / 'temp' / 'staff_imports'
        
        if not files_dir.exists():
            return Response({
                'files': [],
                'total': 0,
                'message': 'No password files available'
            })
        
        files_list = []
        current_time = time.time()
        
        for file_path in files_dir.glob('*.xlsx'):
            file_age = current_time - os.path.getmtime(file_path)
            
            # Skip expired files (older than 24 hours)
            if file_age > 86400:
                os.remove(file_path)  # Auto-cleanup
                continue
            
            # Calculate remaining time
            expires_in_hours = (86400 - file_age) / 3600
            
            # Get file info
            file_stat = os.stat(file_path)
            created_timestamp = os.path.getmtime(file_path)
            created_date = datetime.datetime.fromtimestamp(created_timestamp)
            
            files_list.append({
                'filename': file_path.name,
                'created': created_date.strftime('%Y-%m-%d %H:%M:%S'),
                'expires_in_hours': round(expires_in_hours, 1),
                'download_url': f"/api/users/staff/download-passwords/{file_path.name}/",
                'size_kb': round(file_stat.st_size / 1024, 1)
            })
        
        # Sort by creation time (newest first)
        files_list.sort(key=lambda x: x['created'], reverse=True)
        
        return Response({
            'files': files_list,
            'total': len(files_list)
        })
        
    except Exception as e:
        return Response({
            'error': f'Error listing files: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
