#!/usr/bin/env python3
"""
Admin configuration for Lecture model.
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone

from courses.models import Lecture
from core.utils import ExcelExportMixin
from .base import ArabicLabelsMixin, OptimizedQuerysetMixin
from .filters import LectureDateRangeFilter
from .actions import mark_lectures_completed, mark_lectures_cancelled, reschedule_next_week


@admin.register(Lecture)
class LectureAdmin(ArabicLabelsMixin, OptimizedQuerysetMixin, ExcelExportMixin, admin.ModelAdmin):
    """Admin configuration for Lecture model with enhanced UX."""

    select_related_fields = [
        'course', 'course__season', 'instructor', 'instructor__user',
        'course__instructor__user', 'course__instructor'
    ]

    list_display = (
        'action_checkbox', 'get_lecture_title', 'get_course_link', 'get_lecture_number', 'get_day_display',
        'get_time_range', 'get_instructor_name', 'get_status_badge',
        'get_acceptance_status', 'get_attendance_status'
    )
    list_filter = (
        'status', 'is_accepted', 'attendance_taken', LectureDateRangeFilter,
        'course__season', 'course', 'instructor'
    )
    search_fields = (
        'title', 'course__name',
        'instructor__user__first_name', 'instructor__user__last_name'
    )
    date_hierarchy = 'day'
    autocomplete_fields = ['course', 'instructor']
    list_per_page = 25
    ordering = ('-day', 'course', 'lecture_number')
    save_on_top = True
    actions = [mark_lectures_completed, mark_lectures_cancelled, reschedule_next_week]
    list_select_related = (
        'course', 'instructor', 'course__season',
        'instructor__user', 'course__instructor__user', 'course__instructor'
    )
    
    # Excel export configuration
    excel_filename = 'lectures'
    # excel_export_exclude = []  # Optional: exclude specific fields

    fieldsets = (
        (_('معلومات المحاضرة'), {
            'fields': ('title', 'course', 'lecture_number'),
            'description': _('المعلومات الأساسية للمحاضرة')
        }),
        (_('المدرس'), {
            'fields': ('instructor',),
            'description': _('يمكن ترك هذا الحقل فارغاً ليتم استخدام مدرس الدورة')
        }),
        (_('التوقيت'), {
            'fields': ('day', 'start_time', 'end_time'),
        }),
        (_('الحالة والحضور'), {
            'fields': ('status', 'is_accepted', 'attendance_taken'),
        }),
    )

    @admin.display(description=_('المحاضرة'))
    def get_lecture_title(self, obj):
        """Display lecture title with number."""
        return format_html(
            '<strong>#{}</strong> {}',
            obj.lecture_number, obj.title or '-'
        )

    def get_lecture_number(self, obj):
        """Display lecture number."""
        return obj.lecture_number
    get_lecture_number.short_description = _('رقم المحاضرة')
    get_lecture_number.admin_order_field = 'lecture_number'

    @admin.display(description=_('الدورة'), ordering='course__name')
    def get_course_link(self, obj):
        """Display course as a clickable link."""
        if obj.course:
            url = reverse('admin:courses_course_change', args=[obj.course.pk])
            return format_html(
                '<a href="{}" style="color: #2980b9; text-decoration: none;">'
                '📚 {}</a>',
                url, obj.course.name
            )
        return '-'

    @admin.display(description=_('التاريخ'), ordering='day')
    def get_day_display(self, obj):
        """Display day with relative indicator."""
        today = timezone.now().date()
        day_diff = (obj.day - today).days

        date_str = obj.day.strftime('%Y/%m/%d (%A)')

        if day_diff == 0:
            return format_html(
                '<span style="color: #e67e22; font-weight: bold;">📍 اليوم</span><br>'
                '<small>{}</small>',
                date_str
            )
        elif day_diff == 1:
            return format_html(
                '<span style="color: #3498db;">غداً</span><br>'
                '<small>{}</small>',
                date_str
            )
        elif day_diff == -1:
            return format_html(
                '<span style="color: #95a5a6;">أمس</span><br>'
                '<small>{}</small>',
                date_str
            )
        elif day_diff < 0:
            return format_html(
                '<span style="color: #95a5a6;">{}</span>',
                date_str
            )
        else:
            return format_html(
                '<span style="color: #2ecc71;">{}</span>',
                date_str
            )

    @admin.display(description=_('التوقيت'))
    def get_time_range(self, obj):
        """Display time range."""
        if obj.start_time and obj.end_time:
            return format_html(
                '<span style="font-family: monospace; font-size: 0.9em;">'
                '{} - {}</span>',
                obj.start_time.strftime('%H:%M'),
                obj.end_time.strftime('%H:%M')
            )
        return '-'

    @admin.display(description=_('المدرس'), ordering='instructor__user__first_name')
    def get_instructor_name(self, obj):
        """Display instructor name."""
        instructor = obj.instructor or (
            obj.course.instructor if obj.course else None)
        if instructor:
            return format_html('👨‍🏫 {}', instructor)
        return '-'

    @admin.display(description=_('الحالة'), ordering='status')
    def get_status_badge(self, obj):
        """Display status as colored badge."""
        status_config = {
            'scheduled': ('📅', '#3498db', 'مجدولة'),
            'in_progress': ('▶️', '#f39c12', 'جارية'),
            'completed': ('✅', '#27ae60', 'مكتملة'),
            'cancelled': ('❌', '#e74c3c', 'ملغاة'),
        }

        icon, color, label = status_config.get(
            obj.status, ('❓', '#95a5a6', obj.get_status_display())
        )

        return format_html(
            '<span style="background: {}; color: white; padding: 2px 8px; '
            'border-radius: 10px; font-size: 0.85em;">{} {}</span>',
            color, icon, label
        )

    @admin.display(description=_('الحضور'), boolean=True)
    def get_attendance_status(self, obj):
        """Display attendance status."""
        return obj.attendance_taken

    @admin.display(description=_('مقبولة'), boolean=True, ordering='is_accepted')
    def get_acceptance_status(self, obj):
        """Display acceptance status."""
        return obj.is_accepted
