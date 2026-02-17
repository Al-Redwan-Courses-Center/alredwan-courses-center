#!/usr/bin/env python3
"""
Admin configuration for Tag model.
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from django.db.models import Count

from core.utils import ExcelExportMixin
from courses.models import Tag
from .base import ArabicLabelsMixin
from .inlines import TagCourseInline, TagInstructorInline


@admin.register(Tag)
class TagAdmin(ExcelExportMixin, ArabicLabelsMixin, admin.ModelAdmin):
    """Admin configuration for Tag model."""

    list_display = ('name', 'get_courses_count', 'get_instructors_count', 'created_at')
    search_fields = ('name',)
    list_per_page = 50
    ordering = ('name',)
    inlines = [TagCourseInline, TagInstructorInline]
    prefetch_related_fields = ['courses', 'courses__instructor', 'courses__instructor__user']

    # Excel export configuration
    excel_filename = 'tags'

    @admin.display(description=_('عدد الدورات'), ordering='courses_count')
    def get_courses_count(self, obj):
        """Display number of courses using this tag."""
        count = getattr(obj, 'courses_count', None)
        if count is None:
            count = obj.courses.count()
        if count > 0:
            return format_html(
                '<span style="background: #9b59b6; color: white; padding: 2px 8px; '
                'border-radius: 10px;">{}</span>',
                count
            )
        return format_html('<span style="color: #95a5a6;">0</span>')

    @admin.display(description=_('عدد المدرسين'), ordering='instructors_count')
    def get_instructors_count(self, obj):
        """Display number of unique instructors teaching courses with this tag."""
        count = getattr(obj, 'instructors_count', None)
        if count is None:
            count = obj.courses.values('instructor').distinct().count()
        if count > 0:
            return format_html(
                '<span style="background: #3498db; color: white; padding: 2px 8px; '
                'border-radius: 10px;">👨‍🏫 {}</span>',
                count
            )
        return format_html('<span style="color: #95a5a6;">0</span>')

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.annotate(
            courses_count=Count('courses', distinct=True),
            instructors_count=Count('instructors', distinct=True)
        )
