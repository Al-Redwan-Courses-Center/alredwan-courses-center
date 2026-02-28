# Staff Import Commands & Usage Guide

Complete guide with all commands for importing staff members and managing password files.

---

## 📋 Table of Contents

1. [Import Staff from Excel](#1-import-staff-from-excel)
2. [Access Password Files](#2-access-password-files)
3. [Cleanup Expired Files](#3-cleanup-expired-files)
4. [Schedule Automatic Cleanup](#4-schedule-automatic-cleanup)
5. [File Locations](#5-file-locations)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Import Staff from Excel

### Basic Import Command

**Navigate to backend directory:**
```bash
cd backend
```

**Run import script:**
```bash
python scripts/import_staff_from_excel.py "path/to/excel_file.xlsx"
```

### Examples

**Example 1: File in same directory**
```bash
python scripts/import_staff_from_excel.py "اكاديمية الرضوان.xlsx"
```

**Example 2: File with full path (Windows)**
```bash
python scripts/import_staff_from_excel.py "C:\Users\MOHAMED-ABOELLIL\Desktop\اكاديمية الرضوان.xlsx"
```

**Example 3: File with full path (Linux/Mac)**
```bash
python scripts/import_staff_from_excel.py "/home/user/Desktop/staff_data.xlsx"
```

**Example 4: File in scripts folder**
```bash
python scripts/import_staff_from_excel.py "scripts/اكاديمية الرضوان.xlsx"
```

### Expected Output

```
Starting import from: اكاديمية الرضوان.xlsx
================================================================================
Found 21 columns
Mapped headers: first_name_1, first_name_2, last_name_1, last_name_2, email...
================================================================================

Processing row 2...
✅ Created user: mohamed ahmed mohamed elsayed (+201025847029)
  🔑 Generated password: Xy8@aB3!pQ2z
  📄 Processing front ID image...
  📥 Downloading image from Google Drive...
  ☁️  Uploading to Cloudinary...
  ✅ Uploaded to Cloudinary successfully
  📄 Processing back ID image...
  📥 Downloading image from Google Drive...
  ☁️  Uploading to Cloudinary...
  ✅ Uploaded to Cloudinary successfully
✅ Created instructor profile (Fingerprint: FP0001)

Processing row 3...
✅ Created user: محمد احمد محمد السيد (+201025847026)
  🔑 Generated password: Mn7&Qp2@Aa9!
✅ Created instructor profile (Fingerprint: FP0002)

  🗑️  Deleted old file: staff_passwords_20260228_100000.xlsx

================================================================================
📊 IMPORT SUMMARY
================================================================================
Total rows processed: 2
✅ Successfully imported: 2
⚠️  Skipped (duplicates): 0
❌ Failed (errors): 0
================================================================================

📄 ✅ Password Excel file saved successfully!
📁 File location: C:\...\backend\media\temp\staff_imports\staff_passwords_20260301_001145.xlsx
📊 Contains: 2 staff members (new import)
🗑️  Replaced: 1 old file(s) deleted
================================================================================

🔒 SECURITY INFORMATION:
   ⏰ File will auto-expire and be deleted after 24 hours
   📂 Access the file directly from the server
   🔄 Old files are automatically replaced with new imports
   🚫 No API download endpoint (manual server access only)
================================================================================
```

---

## 2. Access Password Files

### File Location

Password files are saved in:
```
backend/media/temp/staff_imports/staff_passwords_YYYYMMDD_HHMMSS.xlsx
```

**Example:**
```
backend/media/temp/staff_imports/staff_passwords_20260301_001145.xlsx
```

### Access Methods

#### Method 1: Local Access (if running locally)

**Windows:**
```bash
# Navigate to the file location
cd backend\media\temp\staff_imports

# List files
dir

# Open the file
start staff_passwords_20260301_001145.xlsx
```

**Linux/Mac:**
```bash
# Navigate to the file location
cd backend/media/temp/staff_imports

# List files
ls -lh

# Open the file (Mac)
open staff_passwords_20260301_001145.xlsx

# Open the file (Linux)
xdg-open staff_passwords_20260301_001145.xlsx
```

#### Method 2: Copy to Desktop

**Windows:**
```bash
# Copy from backend to your desktop
copy "backend\media\temp\staff_imports\staff_passwords_20260301_001145.xlsx" "%USERPROFILE%\Desktop\"
```

**Linux/Mac:**
```bash
# Copy from backend to your desktop
cp backend/media/temp/staff_imports/staff_passwords_20260301_001145.xlsx ~/Desktop/
```

#### Method 3: Remote Server Access (SCP)

**Download from server to local machine:**
```bash
# Replace with your server details
scp user@server.com:/path/to/backend/media/temp/staff_imports/staff_passwords_20260301_001145.xlsx ~/Desktop/
```

**Example:**
```bash
scp admin@192.168.1.100:/var/www/alredwan/backend/media/temp/staff_imports/staff_passwords_20260301_001145.xlsx ~/Desktop/
```

#### Method 4: FTP/SFTP

Use any FTP client (FileZilla, WinSCP, etc.):
1. Connect to your server
2. Navigate to: `backend/media/temp/staff_imports/`
3. Download the `staff_passwords_*.xlsx` file

---

## 3. Cleanup Expired Files

### Manual Cleanup Command

**Navigate to backend directory:**
```bash
cd backend
```

**Run cleanup command:**
```bash
python manage.py cleanup_password_files
```

### Expected Output

**If files are found and deleted:**
```
🔍 Checking for expired files in: C:\...\backend\media\temp\staff_imports
================================================================================
🗑️  Deleted: staff_passwords_20260228_100000.xlsx (Age: 25.3 hours)
✅ Kept: staff_passwords_20260301_001145.xlsx (Expires in: 23.5 hours)
================================================================================
✅ Cleanup complete: 1 file(s) deleted, 1 file(s) kept
```

**If no expired files:**
```
🔍 Checking for expired files in: C:\...\backend\media\temp\staff_imports
================================================================================
✅ Kept: staff_passwords_20260301_001145.xlsx (Expires in: 23.5 hours)
================================================================================
✅ Cleanup complete: No expired files found (1 active file(s))
```

**If no files at all:**
```
⚠️  No temp directory found. Nothing to clean.
```

---

## 4. Schedule Automatic Cleanup

### Option A: Django Cron (Recommended)

**1. Update Django settings:**

Edit `backend/Redwan_courses_center/settings.py`:

```python
CRONJOBS = [
    # ...existing cron jobs...
    
    # Clean up expired password files daily at midnight
    ('0 0 * * *', 'django.core.management.call_command', ['cleanup_password_files']),
]
```

**2. Add cron job:**
```bash
cd backend
python manage.py crontab add
```

**3. List active cron jobs:**
```bash
python manage.py crontab show
```

**4. Remove cron jobs (if needed):**
```bash
python manage.py crontab remove
```

### Option B: System Cron (Linux/Mac)

**1. Edit crontab:**
```bash
crontab -e
```

**2. Add this line:**
```bash
# Clean up expired staff password files daily at midnight
0 0 * * * cd /path/to/backend && python manage.py cleanup_password_files
```

**Example:**
```bash
0 0 * * * cd /var/www/alredwan/backend && python manage.py cleanup_password_files
```

**3. Save and exit**

**4. Verify cron job:**
```bash
crontab -l
```

### Option C: Windows Task Scheduler

**1. Create batch file:**

Create `cleanup_passwords.bat`:
```batch
@echo off
cd C:\Users\MOHAMED-ABOELLIL\Desktop\New folder\elradwan\alredwan-courses-center\backend
python manage.py cleanup_password_files
pause
```

**2. Open Task Scheduler:**
- Press `Win + R`
- Type `taskschd.msc`
- Press Enter

**3. Create Basic Task:**
- Click "Create Basic Task"
- Name: "Cleanup Staff Password Files"
- Trigger: Daily
- Time: 00:00 (midnight)
- Action: Start a program
- Program: `C:\Users\MOHAMED-ABOELLIL\Desktop\New folder\elradwan\alredwan-courses-center\backend\cleanup_passwords.bat`

**4. Test manually:**
```bash
cleanup_passwords.bat
```

### Cleanup Schedule Options

| Schedule | Cron Expression | Description |
|----------|----------------|-------------|
| Every hour | `0 * * * *` | Clean up every hour on the hour |
| Every 6 hours | `0 */6 * * *` | Clean up every 6 hours |
| Daily at midnight | `0 0 * * *` | Clean up once per day at midnight |
| Daily at 2 AM | `0 2 * * *` | Clean up once per day at 2 AM |
| Twice daily | `0 0,12 * * *` | Clean up at midnight and noon |

---

## 5. File Locations

### Important Paths

| Description | Path |
|-------------|------|
| **Import Script** | `backend/scripts/import_staff_from_excel.py` |
| **Password Files** | `backend/media/temp/staff_imports/` |
| **Cleanup Command** | `backend/users/management/commands/cleanup_password_files.py` |
| **Excel Format Guide** | `backend/scripts/IMPORT_STAFF_DATA_GUIDE.md` |
| **Password Requirements** | `backend/scripts/PASSWORD_REQUIREMENTS.md` |

### File Naming Convention

Password files follow this pattern:
```
staff_passwords_YYYYMMDD_HHMMSS.xlsx
```

**Examples:**
- `staff_passwords_20260301_001145.xlsx` - Created on March 1, 2026 at 00:11:45
- `staff_passwords_20260301_143025.xlsx` - Created on March 1, 2026 at 14:30:25
- `staff_passwords_20260228_090512.xlsx` - Created on February 28, 2026 at 09:05:12

---

## 6. Troubleshooting

### Common Issues and Solutions

#### Issue 1: "File not found"

**Error:**
```
❌ Error: File not found: اكاديمية الرضوان.xlsx
```

**Solutions:**
```bash
# Option 1: Use full path
python scripts/import_staff_from_excel.py "C:\Full\Path\To\اكاديمية الرضوان.xlsx"

# Option 2: Copy file to backend directory first
copy "C:\Path\To\اكاديمية الرضوان.xlsx" .
python scripts/import_staff_from_excel.py "اكاديمية الرضوان.xlsx"

# Option 3: Use relative path
python scripts/import_staff_from_excel.py "../اكاديمية الرضوان.xlsx"
```

#### Issue 2: "Invalid date format"

**Error:**
```
❌ Error: Row 2: Invalid date format: 2026-02-04 00:00:00
```

**Solution:**
This should now be fixed, but if it persists:
- Ensure dates are in format: `YYYY-MM-DD`, `DD/MM/YYYY`, or `MM/DD/YYYY`
- Remove time component from date cells in Excel

#### Issue 3: "Phone number already exists"

**Output:**
```
⚠️  Skipped: Phone number +201025847029 already exists
```

**This is normal!** The script skips duplicates. If you need to update existing staff:
1. Delete the old record from Django admin
2. Re-run the import

#### Issue 4: "Could not extract file ID from URL"

**Output:**
```
⚠️  Could not extract file ID from URL: https://...
```

**Solutions:**
1. Ensure Google Drive links are in format: `https://drive.google.com/open?id=FILE_ID`
2. Make sure files are shared with "Anyone with the link can view"
3. The import will continue without the images

#### Issue 5: "Module not found"

**Error:**
```
ModuleNotFoundError: No module named 'openpyxl'
```

**Solution:**
```bash
cd backend
pip install -r requirements.txt
```

#### Issue 6: "Cannot access password file"

**Check if file exists:**
```bash
# Windows
dir backend\media\temp\staff_imports

# Linux/Mac
ls -lh backend/media/temp/staff_imports/
```

**If no files found:**
- Run import again to create new file
- Check if cleanup command deleted it (files expire after 24 hours)

---

## 7. Quick Reference

### All Commands Summary

```bash
# ========================================
# IMPORT STAFF
# ========================================

# Basic import
cd backend
python scripts/import_staff_from_excel.py "اكاديمية الرضوان.xlsx"

# Import with full path (Windows)
python scripts/import_staff_from_excel.py "C:\Users\Desktop\اكاديمية الرضوان.xlsx"

# Import with full path (Linux/Mac)
python scripts/import_staff_from_excel.py "/home/user/Desktop/staff_data.xlsx"


# ========================================
# ACCESS PASSWORD FILES
# ========================================

# Navigate to password files directory (Windows)
cd backend\media\temp\staff_imports

# Navigate to password files directory (Linux/Mac)
cd backend/media/temp/staff_imports

# List files (Windows)
dir

# List files (Linux/Mac)
ls -lh

# Copy to desktop (Windows)
copy "staff_passwords_*.xlsx" "%USERPROFILE%\Desktop\"

# Copy to desktop (Linux/Mac)
cp staff_passwords_*.xlsx ~/Desktop/

# Download from server (SCP)
scp user@server:/path/to/file.xlsx ~/Desktop/


# ========================================
# CLEANUP EXPIRED FILES
# ========================================

# Manual cleanup
cd backend
python manage.py cleanup_password_files


# ========================================
# SETUP AUTO-CLEANUP
# ========================================

# Add Django cron job
python manage.py crontab add

# Show active cron jobs
python manage.py crontab show

# Remove cron jobs
python manage.py crontab remove


# ========================================
# SYSTEM CRON (Linux/Mac)
# ========================================

# Edit crontab
crontab -e

# Add this line for daily cleanup at midnight:
# 0 0 * * * cd /path/to/backend && python manage.py cleanup_password_files

# View active cron jobs
crontab -l
```

---

## 8. Security Best Practices

### ⚠️ Important Security Guidelines

1. **Download immediately** - Password files are created only during import
2. **Expire after 24 hours** - Use cleanup command or wait for auto-cleanup
3. **One file at a time** - New imports replace old files automatically
4. **No API access** - Files must be accessed directly from server
5. **Secure distribution** - Don't share via email or messaging apps
6. **Delete after use** - Remove local copies after distributing passwords
7. **Change default passwords** - Users should change passwords on first login

### Workflow Checklist

- [ ] Import staff from Excel
- [ ] Download password file immediately
- [ ] Save to secure location (encrypted folder)
- [ ] Distribute passwords to staff securely
- [ ] Verify staff can login
- [ ] Delete local password file
- [ ] Let server auto-delete after 24 hours

---

## 9. Support & Documentation

### Related Documentation

- **Excel Format Guide**: `backend/scripts/IMPORT_STAFF_DATA_GUIDE.md`
- **Password Requirements**: `backend/scripts/PASSWORD_REQUIREMENTS.md`
- **General Documentation**: `backend/docs/`

### Getting Help

If you encounter issues:

1. Check error messages in terminal output
2. Verify Excel file format matches the guide
3. Ensure all required fields are filled
4. Check Django server logs for detailed errors
5. Review this documentation for solutions

---

**Last Updated:** March 1, 2026  
**Version:** 1.0
