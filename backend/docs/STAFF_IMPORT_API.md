# Staff Import API Documentation

Complete API documentation for importing staff members from Excel files and downloading password files.

## 🔐 Authentication

All endpoints require **Admin Authentication** with JWT token:

```
Authorization: JWT <admin_token>
```

---

## 📋 API Endpoints

### 1. Import Staff from Excel File

**Upload Excel file and import staff members**

- **URL:** `/api/users/staff/import/`
- **Method:** `POST`
- **Permission:** Admin only
- **Content-Type:** `multipart/form-data`

#### Request

**Form Data:**
- `file`: Excel file (.xlsx or .xls)

**Example using cURL:**
```bash
curl -X POST \
  -H "Authorization: JWT your_admin_token_here" \
  -F "file=@اكاديمية الرضوان.xlsx" \
  http://localhost:8000/api/users/staff/import/
```

**Example using JavaScript/Fetch:**
```javascript
const fileInput = document.getElementById('fileInput');
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('/api/users/staff/import/', {
    method: 'POST',
    headers: {
        'Authorization': `JWT ${adminToken}`
    },
    body: formData
});

const result = await response.json();
console.log(result);
```

**Example using Postman:**
1. Method: POST
2. URL: `http://localhost:8000/api/users/staff/import/`
3. Headers: `Authorization: JWT <your_token>`
4. Body: form-data
   - Key: `file` (type: File)
   - Value: Select your Excel file

#### Response

**Success (201 Created):**
```json
{
    "success": true,
    "message": "Successfully imported 2 staff member(s)",
    "stats": {
        "total": 2,
        "success": 2,
        "skipped": 0,
        "errors": 0
    },
    "download_url": "/api/users/staff/download-passwords/staff_passwords_20260228_143025.xlsx/",
    "filename": "staff_passwords_20260228_143025.xlsx",
    "expires_in": "24 hours",
    "errors": null
}
```

**Error (400 Bad Request):**
```json
{
    "error": "No file uploaded. Please provide an Excel file."
}
```

**Error (400 - No imports):**
```json
{
    "success": false,
    "message": "No staff members were imported",
    "stats": {
        "total": 2,
        "success": 0,
        "skipped": 2,
        "errors": 0
    },
    "errors": [
        "Row 2: Phone number +201025847029 already exists",
        "Row 3: Email mohamed@example.com already exists"
    ]
}
```

---

### 2. Download Password File

**Download the generated password Excel file**

- **URL:** `/api/users/staff/download-passwords/{filename}/`
- **Method:** `GET`
- **Permission:** Admin only

#### Request

**Example using cURL:**
```bash
curl -X GET \
  -H "Authorization: JWT your_admin_token_here" \
  -o staff_passwords.xlsx \
  http://localhost:8000/api/users/staff/download-passwords/staff_passwords_20260228_143025.xlsx/
```

**Example using JavaScript:**
```javascript
// Download file
const downloadUrl = '/api/users/staff/download-passwords/staff_passwords_20260228_143025.xlsx/';

const response = await fetch(downloadUrl, {
    headers: {
        'Authorization': `JWT ${adminToken}`
    }
});

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'staff_passwords.xlsx';
a.click();
```

**Direct Browser Download:**
```
http://localhost:8000/api/users/staff/download-passwords/staff_passwords_20260228_143025.xlsx/
```
*(Must be logged in as admin)*

#### Response

**Success:**
- File download starts (Excel file)
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

**Error (404):**
```json
{
    "error": "File not found. It may have been deleted or expired."
}
```

**Error (404 - Expired):**
```json
{
    "error": "File expired. Password files are automatically deleted after 24 hours for security."
}
```

---

### 3. List Available Password Files

**Get list of all available password files (not expired)**

- **URL:** `/api/users/staff/password-files/`
- **Method:** `GET`
- **Permission:** Admin only

#### Request

**Example using cURL:**
```bash
curl -X GET \
  -H "Authorization: JWT your_admin_token_here" \
  http://localhost:8000/api/users/staff/password-files/
```

**Example using JavaScript:**
```javascript
const response = await fetch('/api/users/staff/password-files/', {
    headers: {
        'Authorization': `JWT ${adminToken}`
    }
});

const data = await response.json();
console.log(data.files);
```

#### Response

**Success:**
```json
{
    "files": [
        {
            "filename": "staff_passwords_20260228_143025.xlsx",
            "created": "2026-02-28 14:30:25",
            "expires_in_hours": 12.5,
            "download_url": "/api/users/staff/download-passwords/staff_passwords_20260228_143025.xlsx/",
            "size_kb": 15.2
        },
        {
            "filename": "staff_passwords_20260228_100512.xlsx",
            "created": "2026-02-28 10:05:12",
            "expires_in_hours": 8.3,
            "download_url": "/api/users/staff/download-passwords/staff_passwords_20260228_100512.xlsx/",
            "size_kb": 12.8
        }
    ],
    "total": 2
}
```

**No files:**
```json
{
    "files": [],
    "total": 0,
    "message": "No password files available"
}
```

---

## 🚀 Complete Workflow Example

### Step-by-Step: Import Staff and Download Passwords

```javascript
// Step 1: Upload and Import Staff
async function importStaff(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/users/staff/import/', {
        method: 'POST',
        headers: {
            'Authorization': `JWT ${adminToken}`
        },
        body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
        console.log(`✅ Imported ${result.stats.success} staff members`);
        
        // Step 2: Automatically download password file
        downloadPasswordFile(result.filename);
    } else {
        console.error('Import failed:', result.errors);
    }
}

// Step 2: Download Password File
async function downloadPasswordFile(filename) {
    const downloadUrl = `/api/users/staff/download-passwords/${filename}/`;
    
    const response = await fetch(downloadUrl, {
        headers: {
            'Authorization': `JWT ${adminToken}`
        }
    });
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    console.log('✅ Password file downloaded');
}

// Usage
const fileInput = document.getElementById('staffFileInput');
fileInput.addEventListener('change', (e) => {
    importStaff(e.target.files[0]);
});
```

---

## 📊 Excel File Format

The Excel file should have **Arabic column headers** from Google Forms. See [IMPORT_STAFF_DATA_GUIDE.md](./IMPORT_STAFF_DATA_GUIDE.md) for complete format details.

**Required Columns:**
- الاسم الأول (First Name)
- الاسم الثاني (Second Name)
- الاسم الثالث (Third Name)
- اسم الرابع (Fourth Name)
- تاريخ الميلاد (Date of Birth)
- الجنس (Gender: ذكر/أنثى)
- رقم الهاتف الأساسي (Primary Phone)
- الدور في الأكاديمية (Role: معلم/مشرف)
- الراتب الشهري (Monthly Salary)

---

## 🔒 Security Features

1. **Admin-Only Access:** All endpoints require admin authentication
2. **Auto-Expiry:** Password files auto-delete after 24 hours
3. **Secure Storage:** Files stored in `media/temp/staff_imports/` (not publicly accessible)
4. **Auto-Generated Passwords:** Strong 12-character passwords with validation
5. **Duplicate Detection:** Prevents duplicate entries by phone, email, ID number

---

## ⚙️ Configuration

### Ensure Media Directory Exists

Add to your Django settings if not already present:

```python
# settings.py
MEDIA_ROOT = BASE_DIR / 'media'
MEDIA_URL = '/media/'
```

### Auto-Cleanup Cron Job (Optional)

Add to settings for automatic cleanup of expired files:

```python
# settings.py
CRONJOBS = [
    # ... existing cron jobs
    ('0 0 * * *', 'users.cron.cleanup_expired_password_files'),  # Daily at midnight
]
```

Create cleanup function:
```python
# users/cron.py
def cleanup_expired_password_files():
    from pathlib import Path
    from django.conf import settings
    import os
    import time
    
    files_dir = Path(settings.MEDIA_ROOT) / 'temp' / 'staff_imports'
    if not files_dir.exists():
        return
    
    current_time = time.time()
    deleted = 0
    
    for file_path in files_dir.glob('*.xlsx'):
        file_age = current_time - os.path.getmtime(file_path)
        if file_age > 86400:  # 24 hours
            os.remove(file_path)
            deleted += 1
    
    print(f"Cleaned up {deleted} expired password files")
```

---

## 📝 Error Codes

| Status Code | Meaning |
|-------------|---------|
| 200 | Success (download) |
| 201 | Created (import success) |
| 400 | Bad Request (invalid file, no imports) |
| 401 | Unauthorized (not authenticated) |
| 403 | Forbidden (not admin) |
| 404 | Not Found (file doesn't exist or expired) |
| 500 | Server Error |

---

## 🎯 Best Practices

1. **Always check the response** before attempting download
2. **Save password files immediately** - they expire in 24 hours
3. **Distribute passwords securely** - don't email them
4. **Delete local copies** after distribution
5. **Use HTTPS** in production for secure uploads

---

## 📞 Support

For issues or questions about the API:
1. Check error messages in response
2. Verify admin authentication token
3. Ensure Excel file format matches requirements
4. Check server logs for detailed errors

---

**Last Updated:** February 28, 2026
