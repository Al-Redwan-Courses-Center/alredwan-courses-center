# Import Staff Data Guide

This guide explains how to import **Instructors** and **Supervisors** data from Excel files into the system.

## 📋 Required Excel Format

### Excel File Columns

Create an Excel file (`.xlsx` or `.xls`) with the following columns **exactly as shown**:

| Column Name | Data Type | Required | Description | Example |
|-------------|-----------|----------|-------------|---------|
| `phone_number1` | Text | ✅ Yes | Primary WhatsApp number (with country code) | `+201012345678` |
| `phone_number2` | Text | ❌ No | Alternative phone number (with country code) | `+201087654321` |
| `first_name` | Text | ✅ Yes | First and second name in Arabic or English | `محمد أحمد` |
| `last_name` | Text | ✅ Yes | Third and fourth name in Arabic or English | `علي حسن` |
| `email` | Email | ❌ No | Email address (must be unique) | `mohamed@example.com` |
| `dob` | Date | ✅ Yes | Date of birth (YYYY-MM-DD or DD/MM/YYYY) | `1990-05-15` or `15/05/1990` |
| `gender` | Text | ✅ Yes | Gender: `male` or `female` (or `ذكر` or `أنثى`) | `male` or `ذكر` |
| `identity_number` | Text | ❌ No | National ID or Passport number (must be unique) | `29005151234567` |
| `identity_type` | Text | ❌ No | Type: `nid`, `passport`, or `other` | `nid` |
| `address` | Text | ❌ No | Full address | `10 شارع الجامعة، القاهرة` |
| `location` | URL | ❌ No | Google Maps location URL | `https://maps.google.com/?q=30.0444,31.2357` |
| `role` | Text | ✅ Yes | Must be `instructor` or `supervisor` (or `مدرس` or `مشرف`) | `instructor` |
| `monthly_salary` | Number | ✅ Yes | Monthly salary amount | `5000.00` |
| `bio` | Text | ❌ No | Biography or description | `خبرة 10 سنوات في تدريس الرياضيات` |
| `type` | Text | ✅ Yes | For instructors: `supervisor` or `normal` | `normal` |
| `fingerprint_id` | Text | ❌ No | Fingerprint device ID (must be unique) | `FP001` |
| `password` | Text | ❌ No | Login password (if empty, uses phone_number1) | `SecurePass123` |

---

## 📝 Important Notes

### 1. **Phone Number Format**
- Must include country code (e.g., `+20` for Egypt)
- Examples: `+201012345678`, `+966501234567`, `+971501234567`
- The system will automatically validate and format phone numbers

### 2. **Gender Values**
Accept either English or Arabic:
- English: `male` or `female`
- Arabic: `ذكر` or `أنثى`

### 3. **Role Values**
Accept either English or Arabic:
- English: `instructor` or `supervisor`
- Arabic: `مدرس` or `مشرف`

### 4. **Type Values**
For the instructor type field:
- English: `supervisor` or `normal`
- Arabic: `مشرف` or `عادي`

### 5. **Date Format**
Dates can be in multiple formats:
- `YYYY-MM-DD` (e.g., `1990-05-15`)
- `DD/MM/YYYY` (e.g., `15/05/1990`)
- Excel date format (will be auto-converted)

### 6. **Duplicate Detection**
The script will **skip duplicates** based on:
- Phone number (`phone_number1`)
- Email (if provided)
- Identity number (if provided)
- Fingerprint ID (if provided)

Only **new records** will be inserted!

---

## 📊 Sample Excel Data

Here's an example of how your Excel should look:

| phone_number1 | phone_number2 | first_name | last_name | email | dob | gender | identity_number | identity_type | address | role | monthly_salary | bio | type | fingerprint_id | password |
|---------------|---------------|------------|-----------|-------|-----|--------|-----------------|---------------|---------|------|----------------|-----|------|----------------|----------|
| +201012345678 | +201087654321 | محمد أحمد | علي حسن | mohamed@example.com | 1990-05-15 | male | 29005151234567 | nid | 10 شارع الجامعة، القاهرة | instructor | 5000.00 | خبرة 10 سنوات | normal | FP001 | Pass123 |
| +201098765432 | | أحمد محمود | إبراهيم | ahmed@example.com | 1985-03-20 | ذكر | 28503201234568 | nid | 25 شارع النيل، الجيزة | supervisor | 7000.00 | مشرف التدريس | supervisor | FP002 | |
| +201055555555 | | فاطمة سعيد | محمد | fatma@example.com | 1992-08-10 | female | 29208101234569 | nid | | instructor | 4500.00 | | normal | | |

---

## 🚀 How to Use the Import Script

### Step 1: Prepare Your Excel File
1. Create an Excel file with the columns above
2. Fill in your instructor and supervisor data
3. Save the file (e.g., `staff_data.xlsx`)

### Step 2: Place the File
Put your Excel file in one of these locations:
- Same directory as the script
- Or provide the full path when running the script

### Step 3: Run the Import Script

**While the Django server is running**, open a new terminal and run:

```bash
# Navigate to backend directory
cd backend

# Run the import script
python scripts/import_staff_from_excel.py path/to/your/staff_data.xlsx
```

Or if the file is in the scripts directory:

```bash
python scripts/import_staff_from_excel.py staff_data.xlsx
```

### Step 4: Review the Results
The script will show:
- ✅ Successfully imported records
- ⚠️ Skipped duplicates
- ❌ Errors (if any)
- 📊 Summary statistics

---

## 🔍 Example Output

```
Starting import from: staff_data.xlsx
================================================================================

Processing row 2...
✅ Created user: محمد أحمد علي حسن (+201012345678)
✅ Created instructor profile for: محمد أحمد علي حسن

Processing row 3...
⚠️  Skipped: Phone number +201098765432 already exists

Processing row 4...
✅ Created user: فاطمة سعيد محمد (+201055555555)
✅ Created instructor profile for: فاطمة سعيد محمد

================================================================================
📊 IMPORT SUMMARY
================================================================================
Total rows processed: 3
✅ Successfully imported: 2
⚠️  Skipped (duplicates): 1
❌ Failed (errors): 0
================================================================================
```

---

## ⚠️ Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid phone number` | Wrong format | Use international format with + and country code |
| `Phone number already exists` | Duplicate entry | This is normal - the script skips duplicates |
| `Email already exists` | Duplicate email | Change the email or leave it empty |
| `Invalid gender value` | Wrong text | Use `male`/`female` or `ذكر`/`أنثى` |
| `Invalid date format` | Wrong date | Use YYYY-MM-DD or DD/MM/YYYY |
| `Missing required field` | Empty required column | Fill in all required fields marked with ✅ |

---

## 🔒 Security Notes

1. **Passwords**: If no password is provided, the system will use `phone_number1` as the default password
2. **Verification**: All imported users will have `is_verified = False` by default
3. **Staff Status**: Users will have `is_staff = False` (not admin users)
4. **Unique Constraints**: Phone numbers, emails, identity numbers, and fingerprint IDs must be unique

---

## 📞 Support

If you encounter any issues:
1. Check that your Excel column names match exactly
2. Verify all required fields are filled
3. Check the error messages for specific issues
4. Review the sample Excel format above

---

**Last Updated**: February 2026
