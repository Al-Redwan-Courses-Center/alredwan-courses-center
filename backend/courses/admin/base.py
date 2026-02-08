#!/usr/bin/env python3
"""
Base module for courses admin - contains constants, mixins, and helper functions.
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils import timezone


# =============================================================================
# Constants and Configuration
# =============================================================================
ARABIC_FIELD_LABELS = {
    'name': 'الاسم',
    'season_type': 'نوع الموسم',
    'description': 'الوصف',
    'start_date': 'تاريخ البداية',
    'end_date': 'تاريخ النهاية',
    'is_active': 'نشط',
    'created_at': 'تاريخ الإنشاء',
    'updated_at': 'تاريخ التحديث',
    'instructor': 'المدرس',
    'season': 'الموسم',
    'num_lectures': 'عدد المحاضرات',
    'capacity': 'السعة',
    'price': 'السعر',
    'for_adults': 'للبالغين',
    'min_age': 'الحد الأدنى للعمر',
    'max_age': 'الحد الأقصى للعمر',
    'tags': 'الفئات',
    'slug': 'الرابط المختصر',
    'course': 'الدورة',
    'weekday': 'اليوم',
    'start_time': 'وقت البداية',
    'end_time': 'وقت النهاية',
    'title': 'العنوان',
    'lecture_number': 'رقم المحاضرة',
    'day': 'اليوم',
    'status': 'الحالة',
    'attendance_taken': 'تم أخذ الحضور',
    'exam_type': 'نوع الامتحان',
    'scheduled_at': 'موعد الامتحان',
    'total_marks': 'مجموع الدرجات',
    'exam': 'الامتحان',
    'student': 'الطالب',
    'child': 'الطفل',
    'marks_obtained': 'الدرجة المحصلة',
    'percentage': 'النسبة المئوية',
    'passed': 'نجح',
    'notes': 'ملاحظات',
    'entered_by': 'تم الإدخال بواسطة',
    'entered_at': 'تاريخ الإدخال',
}

# Status colors for visual indicators
STATUS_COLORS = {
    'scheduled': '#3498db',    # Blue
    'in_progress': '#f39c12',  # Orange
    'completed': '#27ae60',    # Green
    'cancelled': '#e74c3c',    # Red
}


# =============================================================================
# Helper Functions
# =============================================================================
def apply_arabic_labels(form):
    """Apply Arabic labels to form fields."""
    for field_name, label in ARABIC_FIELD_LABELS.items():
        if field_name in form.base_fields:
            form.base_fields[field_name].label = label
    return form


# =============================================================================
# Mixins
# =============================================================================
class ArabicLabelsMixin:
    """Mixin to automatically apply Arabic labels to admin forms."""

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        return apply_arabic_labels(form)


class OptimizedQuerysetMixin:
    """Mixin to optimize querysets with select_related and prefetch_related."""
    select_related_fields = []
    prefetch_related_fields = []

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if self.select_related_fields:
            qs = qs.select_related(*self.select_related_fields)
        if self.prefetch_related_fields:
            qs = qs.prefetch_related(*self.prefetch_related_fields)
        return qs


class ExportMixin:
    """Mixin to add export actions to admin."""

    def get_export_filename(self, file_format):
        """Generate a filename for export."""
        date_str = timezone.now().strftime('%Y-%m-%d')
        return f'{self.model._meta.verbose_name_plural}_{date_str}'
