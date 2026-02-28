#!/usr/bin/env python3
"""
Admin configuration for Season model.
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from django.db.models import Count

from core.utils import ExcelExportMixin
from courses.models import Season
from .base import ArabicLabelsMixin, OptimizedQuerysetMixin
from .filters import ActiveStatusFilter
from .actions import activate_selected, deactivate_selected, duplicate_selected


@admin.register(Season)
class SeasonAdmin(ArabicLabelsMixin, OptimizedQuerysetMixin, admin.ModelAdmin, ExcelExportMixin):
    """Admin configuration for Season model."""

    list_display = (
        'name', 'season_type', 'get_date_range',
        'get_active_status', 'get_courses_count', 'created_at'
    )
    list_filter = ('season_type', ActiveStatusFilter, 'start_date')
    search_fields = ('name', 'description')
    date_hierarchy = 'start_date'
    list_editable = ('is_active',) if False else ()  # Disabled for cleaner UX
    list_per_page = 25
    ordering = ('-start_date',)
    actions = [activate_selected, deactivate_selected, duplicate_selected]
    save_on_top = True

    # Excel export configuration
    excel_filename = 'seasons'

    fieldsets = (
        (_('معلومات الموسم'), {
            'fields': ('name', 'season_type', 'description'),
            'description': _('أدخل المعلومات الأساسية للموسم')
        }),
        (_('التواريخ والحالة'), {
            'fields': ('start_date', 'end_date', 'is_active'),
            'description': _('حدد فترة الموسم وحالته')
        }),
    )

    @admin.display(description=_('الفترة'), ordering='start_date')
    def get_date_range(self, obj):
        """Display date range in a formatted way."""
        if obj.start_date and obj.end_date:
            return format_html(
                '<span style="white-space: nowrap;">{} → {}</span>',
                obj.start_date.strftime('%Y/%m/%d'),
                obj.end_date.strftime('%Y/%m/%d')
            )
        return '-'

    @admin.display(description=_('الحالة'), ordering='is_active')
    def get_active_status(self, obj):
        """Display active status with color indicator."""
        if obj.is_active:
            return format_html(
                '<span style="color: #27ae60; font-weight: bold;">✅ نشط</span>'
            )
        return format_html(
            '<span style="color: #e74c3c;">🔴 غير نشط</span>'
        )

    @admin.display(description=_('عدد الدورات'), ordering='courses_count')
    def get_courses_count(self, obj):
        """Display the number of courses in this season.

        Uses annotated 'courses_count' from get_queryset to avoid N+1 queries.
        Falls back to direct count only when annotation is missing (e.g., detail view).
        """
        count = getattr(obj, 'courses_count', None)
        if count is None:
            count = obj.courses.count()
        return format_html(
            '<span style="background: #3498db; color: white; padding: 2px 8px; '
            'border-radius: 10px;">{}</span>',
            count
        )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.annotate(courses_count=Count('courses'))
