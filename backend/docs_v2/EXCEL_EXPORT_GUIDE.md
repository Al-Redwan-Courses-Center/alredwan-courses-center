# Django Admin Excel Export Guide

This guide explains how to add Excel export functionality to any Django admin model.

## Features

✅ **Export filtered data** - Exports only the data that appears after applying filters
✅ **Respect search queries** - Includes search results in the export
✅ **Maintain ordering** - Preserves the column ordering from the admin
✅ **Clean formatting** - Professional Excel formatting with headers and borders
✅ **Arabic support** - Proper right-to-left alignment for Arabic text
✅ **HTML removal** - Automatically strips HTML tags from display methods
✅ **Auto-width columns** - Adjusts column widths based on content

## Installation

The required package has already been added to `requirements.txt`:

```bash
pip install openpyxl==3.1.2
```

## Basic Usage

To add Excel export to any admin class, simply add `ExcelExportMixin` as the first parent class:

```python
from django.contrib import admin
from core.utils import ExcelExportMixin
from .models import MyModel

@admin.register(MyModel)
class MyModelAdmin(ExcelExportMixin, admin.ModelAdmin):
    list_display = ['field1', 'field2', 'field3']
```

That's it! The admin page will now have an "Export to Excel" action in the actions dropdown.

## How to Use

1. Go to any admin page that has the `ExcelExportMixin`
2. Apply any filters, search queries, or ordering you want
3. Select the records you want to export (or don't select any to export all filtered results)
4. Choose "تصدير إلى Excel (Export to Excel)" from the Actions dropdown
5. Click "Go" button
6. The Excel file will be downloaded automatically

**Note:** The export respects ALL filters and searches applied, even if you don't select any rows.

## Configuration Options

### 1. Custom Filename

```python
class MyModelAdmin(ExcelExportMixin, admin.ModelAdmin):
    excel_filename = 'my_custom_name'  # Without .xlsx extension
```

### 2. Specify Export Fields

By default, all fields in `list_display` are exported. You can customize this:

```python
class MyModelAdmin(ExcelExportMixin, admin.ModelAdmin):
    list_display = ['field1', 'field2', 'field3', 'field4']
    excel_export_fields = ['field1', 'field2', 'field3']  # Only export these
```

### 3. Exclude Fields

```python
class MyModelAdmin(ExcelExportMixin, admin.ModelAdmin):
    list_display = ['name', 'email', 'password', 'status']
    excel_export_exclude = ['password']  # Don't export password field
```

## Examples

### Example 1: Course Admin with Excel Export

```python
from django.contrib import admin
from core.utils import ExcelExportMixin
from courses.models import Course

@admin.register(Course)
class CourseAdmin(ExcelExportMixin, admin.ModelAdmin):
    list_display = ['name', 'instructor', 'season', 'start_date', 'price']
    list_filter = ['season', 'instructor', 'is_active']
    search_fields = ['name', 'description']
    
    # Excel configuration
    excel_filename = 'courses'
```

### Example 2: Student Admin with Custom Fields

```python
from django.contrib import admin
from core.utils import ExcelExportMixin
from users.models import Student

@admin.register(Student)
class StudentAdmin(ExcelExportMixin, admin.ModelAdmin):
    list_display = ['get_full_name', 'email', 'phone', 'get_courses_count', 'created_at']
    
    # Only export specific fields
    excel_export_fields = ['get_full_name', 'email', 'phone', 'created_at']
    excel_filename = 'students'
    
    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"
    get_full_name.short_description = 'Full Name'
```

### Example 3: Enrollment Admin with Excluded Fields

```python
from django.contrib import admin
from core.utils import ExcelExportMixin
from enrollments_payments.models import Enrollment

@admin.register(Enrollment)
class EnrollmentAdmin(ExcelExportMixin, admin.ModelAdmin):
    list_display = ['student', 'course', 'status', 'payment_status', 'internal_notes']
    
    # Don't export internal notes
    excel_export_exclude = ['internal_notes']
    excel_filename = 'enrollments'
```

## Already Enabled On

The Excel export functionality has been added to:
- ✅ **Lecture Admin** (`courses.admin.lecture.LectureAdmin`)

## How to Add to Other Admin Classes

### Step 1: Import the Mixin

```python
from core.utils import ExcelExportMixin
```

### Step 2: Add to Admin Class

```python
# Before
class MyAdmin(admin.ModelAdmin):
    pass

# After
class MyAdmin(ExcelExportMixin, admin.ModelAdmin):
    pass
```

**Important:** `ExcelExportMixin` must be the **first** parent class (leftmost) for proper method resolution.

### Step 3: Optional Configuration

```python
class MyAdmin(ExcelExportMixin, admin.ModelAdmin):
    excel_filename = 'custom_name'  # Optional
    excel_export_exclude = ['sensitive_field']  # Optional
```

## Technical Details

### What Gets Exported

- All fields defined in `list_display` (or `excel_export_fields`)
- Values from model fields, properties, and admin display methods
- Automatically cleans HTML tags from formatted output
- Boolean values converted to "نعم/لا" (Yes/No in Arabic)
- Dates and times formatted consistently

### Excel Formatting

- **Header Row:** Blue background, white text, bold font, centered
- **Data Rows:** Border around cells, auto-adjusted width
- **Arabic Text:** Right-to-left alignment
- **English/Numbers:** Left alignment
- **First Row:** Frozen for easy scrolling

### Performance

The export uses the same queryset as the admin changelist, so:
- All `select_related` and `prefetch_related` optimizations apply
- Large datasets are handled efficiently
- Filters and pagination are respected

## Troubleshooting

### Issue: Action doesn't appear

**Solution:** Make sure `ExcelExportMixin` is the first parent class:

```python
# Wrong
class MyAdmin(admin.ModelAdmin, ExcelExportMixin):

# Correct
class MyAdmin(ExcelExportMixin, admin.ModelAdmin):
```

### Issue: Some fields are empty in Excel

**Solution:** Check that display methods have `short_description` attribute:

```python
def my_field(self, obj):
    return obj.something
my_field.short_description = 'My Field Label'
```

### Issue: HTML tags in exported data

**Solution:** This should be automatic, but if it persists, the mixin's `clean_html` method might need adjustment for specific HTML patterns.

## Next Steps

To add Excel export to all your admin classes, simply:

1. Import the mixin: `from core.utils import ExcelExportMixin`
2. Add it as the first parent class
3. Optionally configure `excel_filename` and `excel_export_exclude`

That's it! The functionality is fully automated and respects all your existing admin configurations.
