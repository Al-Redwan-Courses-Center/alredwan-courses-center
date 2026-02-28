# Import Staff Data Guide (Google Forms Format)

This guide explains how to import **Instructors** and **Supervisors** data from Excel files exported from Google Forms.

## 📋 Excel Format (Arabic Headers from Google Forms)

Your Excel file should have these **Arabic column headers** (as they appear in Google Forms):

| Arabic Column Header | Required | Description | Example |
|---------------------|----------|-------------|---------|
| `الاسم الأول` | ✅ Yes | First name | `محمد` |
| `الاسم الثاني` | ✅ Yes | Second name | `أحمد` |
| `الاسم الثالث` | ✅ Yes | Third name | `محمد` |
| `اسم الرابع` | ✅ Yes | Fourth name | `السيد` |
| `البريد الإلكتروني` | ❌ No | Email address | `mohamed@example.com` |
| `تاريخ الميلاد` | ✅ Yes | Date of birth | `2/4/2026` or `1990-05-15` |
| `الجنس` | ✅ Yes | Gender: `ذكر` or `أنثى` | `ذكر` |
| `رقم الهاتف الأساسي (رقم 1)` | ✅ Yes | Primary phone (WhatsApp) | `01025847029` |
| `رقم هاتف إضافي (رقم 2) - اختياري` | ❌ No | Alternative phone | `01556851539` |
| `نوع الهوية` | ❌ No | ID type | `بطاقة هوية وطنية` or `رخصة قيادة` |
| `رقم الهوية / الوثيقة` | ❌ No | National ID / Document number | `30306171300114` |
| `تحميل صورة الواجهة الأمامية لوثيقة الهوية` | ❌ No | Front ID image (Google Drive URL) | `https://drive.google.com/open?id=...` |
| `تحميل صورة الواجهة الخلفية لوثيقة الهوية` | ❌ No | Back ID image (Google Drive URL) | `https://drive.google.com/open?id=...` |
| `العنوان بالتفصيل` | ❌ No | Detailed address | `الاسماعيلية ارض الجمعيات` |
| `الموقع الجغرافي (المدينة/المنطقة)` | ❌ No | Geographic location | `ismailia elshaek zaid` |
| `الدور في الأكاديمية` | ✅ Yes | Role: `معلم` or `مشرف` | `معلم` |
| `الراتب الشهري المتوقع/المتفق عليه` | ✅ Yes | Monthly salary | `10000` |
| `نبذة شخصية وسيرة ذاتية مختصرة (Bio)` | ❌ No | Biography | `good` or detailed bio |
| `تعيين كلمة مرور مؤقتة للنظام الداخلي` | ❌ No | Temporary password | `mohamed123` |

---

## ✨ New Features

### 1. **Auto-Generated Fingerprint IDs**
The script automatically generates unique fingerprint IDs for each staff member:
- Format: `FP0001`, `FP0002`, `FP0003`, etc.
- Continues from the last existing fingerprint ID in the database
- No need to provide this manually!

### 2. **Automatic Google Drive Image Download**
The script automatically:
- ✅ Extracts file IDs from Google Drive URLs
- ✅ Downloads ID images (front and back)
- ✅ Uploads them to Cloudinary
- ✅ Links them to the instructor profile

**Supported Google Drive URL formats:**
- `https://drive.google.com/open?id=FILE_ID`
- `https://drive.google.com/file/d/FILE_ID/view`

### 3. **Phone Number Auto-Formatting**
Egyptian phone numbers are automatically formatted:
- `01025847029` → `+201025847029`
- `1025847029` → `+201025847029`
- Already formatted numbers are kept as-is

---

## 📊 Sample Data (As in Your Excel)

```
الاسم الأول: mohamed
الاسم الثاني: ahmed
الاسم الثالث: mohamed
اسم الرابع: elsayed
البريد الإلكتروني: mohamed.aboellil0@gmail.com
تاريخ الميلاد: 2/4/2026
الجنس: ذكر
رقم الهاتف الأساسي: 01025847029
نوع الهوية: بطاقة هوية وطنية
رقم الهوية: 30306171300114
تحميل صورة الواجهة الأمامية: https://drive.google.com/open?id=1Y29Sd18EZzsCXPkfM77qTTxkXhL4zyup
تحميل صورة الواجهة الخلفية: https://drive.google.com/open?id=12q5uVg1pJUKd_WkUeO8VqkdHQh4LSlPm
العنوان: الاسماعيلية ارض الجمعيات
الدور في الأكاديمية: معلم
الراتب الشهري: 10000
نبذة شخصية: good
كلمة المرور: mohamed123
```

---

## 🚀 How to Use

### Step 1: Export Excel from Google Forms
1. Open your Google Forms responses
2. Click on the **Google Sheets icon** to view responses
3. In Google Sheets: **File → Download → Microsoft Excel (.xlsx)**
4. Save the file to your computer

### Step 2: Run the Import Script

**While your Django server is running**, open a new terminal:

```bash
# Navigate to backend directory
cd backend

# Run the import script
python scripts/import_staff_from_excel.py "path/to/your_file.xlsx"
```

**Example:**
```bash
python scripts/import_staff_from_excel.py "C:/Users/Downloads/staff_responses.xlsx"
```

### Step 3: Watch the Progress

The script will show detailed progress:

```
Starting import from: staff_responses.xlsx
================================================================================
Found 21 columns
Mapped headers: first_name_1, first_name_2, last_name_1, last_name_2, email...
================================================================================

Processing row 2...
✅ Created user: mohamed ahmed mohamed elsayed (+201025847029)
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
  📄 Processing front ID image...
  📥 Downloading image from Google Drive...
  ☁️  Uploading to Cloudinary...
  ✅ Uploaded to Cloudinary successfully
  📄 Processing back ID image...
  📥 Downloading image from Google Drive...
  ☁️  Uploading to Cloudinary...
  ✅ Uploaded to Cloudinary successfully
✅ Created instructor profile (Fingerprint: FP0002)

================================================================================
📊 IMPORT SUMMARY
================================================================================
Total rows processed: 2
✅ Successfully imported: 2
⚠️  Skipped (duplicates): 0
❌ Failed (errors): 0
================================================================================
```

---

## 📝 Important Notes

### 1. **Gender Values (Arabic)**
- `ذكر` = Male
- `أنثى` = Female

### 2. **Role Values (Arabic)**
- `معلم` = Instructor
- `مشرف` = Supervisor

### 3. **Identity Types (Arabic)**
- `بطاقة هوية وطنية` = National ID
- `جواز سفر` = Passport
- `رخصة قيادة` = Driving License (stored as "other")

### 4. **Date Formats Accepted**
- `2/4/2026` (M/D/YYYY)
- `04/02/2026` (D/M/YYYY)
- `2026-02-04` (YYYY-MM-DD)
- Excel date numbers

### 5. **Duplicate Detection**
The script will **skip** users if any of these already exist:
- Phone number
- Email address
- Identity number
- Fingerprint ID

### 6. **Google Drive Image Requirements**
- Images must be shared with "Anyone with the link can view"
- Supported formats: JPG, PNG, GIF
- The script will skip images that fail to download

### 7. **Password Handling**
- If password field is empty: Uses phone number as default password
- Any password is accepted (no validation)
- Users should change password after first login!

---

## ⚠️ Common Issues and Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| `Could not extract file ID from URL` | Invalid Google Drive URL | Make sure images are uploaded to Google Drive and shared properly |
| `Failed to download image (Status: 403)` | Image not shared | Set Google Drive sharing to "Anyone with the link can view" |
| `Phone number already exists` | Duplicate entry | This is normal - script skips duplicates |
| `Invalid gender value` | Wrong text | Use `ذكر` or `أنثى` |
| `Invalid role value` | Wrong text | Use `معلم` or `مشرف` |

---

## 🔒 Security Notes

1. **Passwords** are securely hashed before storage (never stored in plain text)
2. **Images** are uploaded to Cloudinary with proper transformations
3. **Phone numbers** are validated and normalized
4. **All imports** use database transactions (rollback on error)

---

## 📞 Support

If you encounter issues:
1. Check that column headers match exactly (copy-paste from Google Forms)
2. Ensure all required fields are filled
3. Verify Google Drive image links are accessible
4. Check the error messages for specific details

---

**Last Updated**: February 28, 2026
