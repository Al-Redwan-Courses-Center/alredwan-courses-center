# Database Seeding Guide

This guide explains how to use the database seeding script to fill your database with test data.

## Overview

The `seed_data` management command generates realistic test data for your Quran courses center application. It creates:

- **Users**: Students, Instructors, Parents
- **Courses**: With schedules and lectures
- **Enrollments**: Student and child enrollments in courses
- **Payments**: Various payment scenarios (full, partial, installments)
- **Seasons**: Past, current, and future seasons
- **Tags**: Course and instructor categories

## Basic Usage

### Simple Seeding (Uses Today's Date)

```bash
python scripts/seed_data.py
```

This creates:
- 20 students
- 5 instructors
- 10 parents (with 1-3 children each)
- 10 courses
- Enrollments and payments

### Clear and Reseed Database

```bash
python scripts/seed_data.py --clear
```

⚠️ **Warning**: This deletes all existing data (except superusers) before seeding!

## Advanced Usage

### Custom Base Date

Test data is generated relative to a base date. You can specify any date:

```bash
# Seed data as if it's January 1, 2026
python scripts/seed_data.py --base-date 2026-01-01

# Seed data for a past date
python scripts/seed_data.py --base-date 2025-06-15

# Seed data for a future date
python scripts/seed_data.py --base-date 2027-03-20
```

**How base date works:**
- Seasons are created around the base date (past, current, future)
- Course start dates are relative to season dates
- Enrollment dates are between course start and base date
- User ages are calculated from the base date

### Custom Data Quantities

```bash
# Create more students and courses
python scripts/seed_data.py --students 50 --courses 20

# Create fewer instructors and parents
python scripts/seed_data.py --instructors 3 --parents 5

# Combine all options
python scripts/seed_data.py --clear --base-date 2026-06-01 --students 30 --instructors 8 --courses 15 --parents 15
```

### Available Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--clear` | flag | False | Clear existing data before seeding |
| `--base-date` | string | Today | Base date for data generation (YYYY-MM-DD) |
| `--students` | integer | 20 | Number of student accounts to create |
| `--instructors` | integer | 5 | Number of instructor accounts to create |
| `--parents` | integer | 10 | Number of parent accounts to create |
| `--courses` | integer | 10 | Number of courses to create |

## Example Scenarios

### Testing Enrollment Features

Create a large dataset with many students and courses:

```bash
python scripts/seed_data.py --clear --students 100 --courses 25
```

### Testing Payment Systems

Create many parents to test payment workflows:

```bash
python scripts/seed_data.py --clear --parents 30 --students 20
```

### Testing with Historical Data

Seed data as if you're 3 months into a season:

```bash
python scripts/seed_data.py --clear --base-date 2026-06-01
```

This creates:
- A past season (ended 1 month before base date)
- A current active season (started 1 month before base date, ends in 2 months)
- A future season (starts in 3 months)

### Testing Future Planning

Seed data for a future date to test course planning:

```bash
python scripts/seed_data.py --base-date 2027-01-01
```

## Generated Data Details

### Users & Authentication

**Phone Number Patterns:**
- Instructors: `+201001000000` to `+201001000004` (for 5 instructors)
- Students: `+201012000000` to `+201012000019` (for 20 students)
- Parents: `+201023000000` to `+201023000009` (for 10 parents)

**Password:** All test accounts use `password123`

**Login Examples:**
```
Student:    +201012000000 / password123
Instructor: +201001000000 / password123
Parent:     +201023000000 / password123
```

### Courses

Courses are created with:
- Random capacity (15-40 students)
- Random price (500-3000 EGP)
- 12-36 lectures per course
- 1-3 weekly sessions
- Age restrictions (either for adults 15+ or children 5-15)
- Associated with instructors and tags
- Linked to seasons

### Enrollments

- Students enroll in 1-3 courses
- Children enroll in 1-2 courses
- Enrollment dates are between course start and base date
- Only eligible participants are enrolled (age restrictions respected)
- Courses won't exceed capacity

### Payments

Three payment scenarios are generated:
1. **Full Payment** (33% chance): Course price paid in full
2. **Partial Payment** (33% chance): 50-80% of course price paid
3. **Installments** (33% chance): 2-3 installments, first always paid, others 70% chance

Payment methods vary (Cash, Card, Bank Transfer, Instapay, Vodafone Cash)

### Seasons

Three seasons are created:
1. **Past Season**: Ended 30 days before base date
2. **Current Season**: Started 30 days ago, ends in 60 days (ACTIVE)
3. **Future Season**: Starts in 90 days

## Testing Specific Scenarios

### Test Overdue Payments

```bash
# Create data with historical base date
python scripts/seed_data.py --clear --base-date 2026-01-01

# Some payments will be overdue relative to current date
```

### Test Course Completion

```bash
# Create data in the past
python scripts/seed_data.py --clear --base-date 2025-12-01

# Some courses will have ended
```

### Test Enrollment Capacity

```bash
# Create many students and few courses
python scripts/seed_data.py --clear --students 100 --courses 5

# Some courses will reach capacity
```

## Verification

After seeding, verify the data:

```bash
# Check Django admin
python manage.py runserver
# Visit http://localhost:8000/admin

# Or use Django shell
python manage.py shell
```

```python
from users.models import StudentUser, Instructor
from courses.models import Course, Season
from enrollments_payments.models import Enrollment, Payment

print(f"Students: {StudentUser.objects.count()}")
print(f"Instructors: {Instructor.objects.count()}")
print(f"Courses: {Course.objects.count()}")
print(f"Active Enrollments: {Enrollment.objects.filter(status='active').count()}")
print(f"Paid Payments: {Payment.objects.filter(status='paid').count()}")
print(f"Active Seasons: {Season.objects.filter(is_active=True).count()}")
```

## Tips

1. **Start Fresh**: Always use `--clear` when you want a clean slate
2. **Realistic Dates**: Use recent dates for realistic testing
3. **Scale Testing**: Gradually increase numbers to test performance
4. **Backup First**: If you have important data, back it up before using `--clear`
5. **Check Logs**: The command prints a summary showing what was created

## Troubleshooting

### Phone Number Conflicts

If you see "phone number already exists" errors:
- Use `--clear` to remove existing test data
- Or manually delete conflicting users

### Validation Errors

The script respects all model validations:
- Age restrictions for courses
- Course capacity limits
- Season date constraints
- Payment validations

If you see validation errors, it means the script is working correctly and preventing invalid data.

## Quick Reference

```bash
# Minimal dataset
python manage.py seed_data --students 5 --instructors 2 --courses 3 --parents 3

# Standard dataset
python manage.py seed_data --clear

# Large dataset
python manage.py seed_data --clear --students 100 --instructors 20 --courses 50 --parents 50

# Historical testing
python manage.py seed_data --clear --base-date 2025-06-01

# Future planning
python manage.py seed_data --clear --base-date 2027-01-01
```

## Summary Output

After seeding, you'll see a summary like:

```
============================================================
SEEDING SUMMARY
============================================================
Tags:         8
Seasons:      3
Instructors:  5
Students:     20
Parents:      10
Children:     23
Courses:      10
Lectures:     247
Enrollments:  45
Payments:     67
============================================================

TEST ACCOUNT CREDENTIALS:
Student: +201012000000 / password123
Instructor: +201001000000 / password123
Parent: +201023000000 / password123
============================================================
```
