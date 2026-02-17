#!/usr/bin/env python3
"""Admin configuration for SupervisorSchedule model."""

from django.contrib import admin
from django.utils.html import format_html
from core.utils import ExcelExportMixin
from ..models.instructor_attendance import SupervisorSchedule
from courses.models import Weekday


@admin.register(SupervisorSchedule)
class SupervisorScheduleAdmin(ExcelExportMixin, admin.ModelAdmin):
    """Admin interface for managing supervisor schedules."""
    
    list_display = (
        'get_instructor_name',
        'get_day_display',
        'get_time_range',
        'grace_period_minutes',
        'auto_absent_after_minutes',
    )
    list_filter = ('day_of_week',)
    search_fields = (
        'instructor__user__first_name',
        'instructor__user__last_name',
        'instructor__user__phone_number1',
    )
    ordering = ('day_of_week', 'start_time')
    
    fieldsets = (
        ('معلومات المشرف', {
            'fields': ('instructor',)
        }),
        ('الجدول الزمني', {
            'fields': ('day_of_week', 'start_time', 'end_time')
        }),
        ('إعدادات الحضور', {
            'fields': ('grace_period_minutes', 'auto_absent_after_minutes'),
            'description': 'فترة السماح بالتأخير ووقت التغييب التلقائي'
        }),
    )
    
    autocomplete_fields = ['instructor']
    
    def get_instructor_name(self, obj):
        """Get the full name of the instructor."""
        return obj.instructor.user.get_full_name()
    get_instructor_name.short_description = 'المشرف'
    get_instructor_name.admin_order_field = 'instructor__user__first_name'
    
    def get_day_display(self, obj):
        """Get the Arabic day name."""
        return obj.get_day_of_week_display()
    get_day_display.short_description = 'اليوم'
    get_day_display.admin_order_field = 'day_of_week'
    
    def get_time_range(self, obj):
        """Display time range in a formatted way."""
        return format_html(
            '<span style="color: #2196F3;">{}</span> - <span style="color: #4CAF50;">{}</span>',
            obj.start_time.strftime('%H:%M'),
            obj.end_time.strftime('%H:%M')
        )
    get_time_range.short_description = 'فترة العمل'
    
    def get_form(self, request, obj=None, **kwargs):
        """Customize form labels to Arabic."""
        form = super().get_form(request, obj, **kwargs)
        if 'instructor' in form.base_fields:
            form.base_fields['instructor'].label = 'المشرف'
        if 'day_of_week' in form.base_fields:
            form.base_fields['day_of_week'].label = 'يوم الأسبوع'
        if 'start_time' in form.base_fields:
            form.base_fields['start_time'].label = 'وقت البدء'
        if 'end_time' in form.base_fields:
            form.base_fields['end_time'].label = 'وقت الانتهاء'
        if 'grace_period_minutes' in form.base_fields:
            form.base_fields['grace_period_minutes'].label = 'دقائق فترة السماح'
            form.base_fields['grace_period_minutes'].help_text = 'عدد الدقائق المسموح بها للتأخير قبل اعتباره متأخراً'
        if 'auto_absent_after_minutes' in form.base_fields:
            form.base_fields['auto_absent_after_minutes'].label = 'دقائق التغييب التلقائي'
            form.base_fields['auto_absent_after_minutes'].help_text = 'عدد الدقائق بعد موعد البدء لاعتباره غائباً تلقائياً'
        return form
    
    # Excel export configuration
    excel_filename = 'supervisor_schedules'
