#!/usr/bin/env python3
"""
Admin configuration for CourseSchedule model.
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from datetime import datetime

from core.utils import ExcelExportMixin
from courses.models import CourseSchedule
from .base import ArabicLabelsMixin, OptimizedQuerysetMixin


@admin.register(CourseSchedule)
class CourseScheduleAdmin(ExcelExportMixin, ArabicLabelsMixin, OptimizedQuerysetMixin, admin.ModelAdmin):
    """Admin configuration for CourseSchedule model."""

    select_related_fields = ['course', 'course__instructor']

    list_display = (
        'course', 'get_weekday_badge', 'get_time_range', 'get_duration'
    )
    list_filter = ('weekday', 'course__season', 'course')
    search_fields = ('course__name',)
    autocomplete_fields = ['course']
    list_per_page = 50
    ordering = ('weekday', 'start_time')

    # Excel export configuration
    excel_filename = 'course_schedules'

    @admin.display(description=_('اليوم'), ordering='weekday')
    def get_weekday_badge(self, obj):
        """Display weekday as a colored badge."""
        colors = {
            0: '#e74c3c',  # Saturday
            1: '#e67e22',  # Sunday
            2: '#f1c40f',  # Monday
            3: '#2ecc71',  # Tuesday
            4: '#3498db',  # Wednesday
            5: '#9b59b6',  # Thursday
            6: '#1abc9c',  # Friday
        }
        color = colors.get(obj.weekday, '#95a5a6')
        return format_html(
            '<span style="background: {}; color: white; padding: 3px 10px; '
            'border-radius: 12px; font-size: 0.85em;">{}</span>',
            color, obj.get_weekday_display()
        )

    @admin.display(description=_('التوقيت'))
    def get_time_range(self, obj):
        """Display time range."""
        return format_html(
            '<span style="font-family: monospace;">{} - {}</span>',
            obj.start_time.strftime('%H:%M') if obj.start_time else '-',
            obj.end_time.strftime('%H:%M') if obj.end_time else '-'
        )

    @admin.display(description=_('المدة'))
    def get_duration(self, obj):
        """Calculate and display duration."""
        if obj.start_time and obj.end_time:
            start = datetime.combine(datetime.today(), obj.start_time)
            end = datetime.combine(datetime.today(), obj.end_time)
            duration = end - start
            hours, remainder = divmod(duration.seconds, 3600)
            minutes = remainder // 60

            if hours > 0:
                return format_html(
                    '<span style="color: #7f8c8d;">{}س {}د</span>',
                    hours, minutes
                )
            return format_html(
                '<span style="color: #7f8c8d;">{}د</span>',
                minutes
            )
        return '-'
