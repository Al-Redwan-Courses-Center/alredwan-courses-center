#!/usr/bin/env python3
"""Admin configuration for Landing Page Featured Instructors"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from django.urls import reverse
from django.db.models import Count, Q
from core.utils import ExcelExportMixin
from users.models import LandingPageInstructor


class ArabicLabelsMixin:
    """Mixin to automatically apply Arabic labels to admin forms."""
    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        ARABIC_FIELD_LABELS = {
            'instructor': 'المعلم',
            'order': 'الترتيب',
        }
        for field_name, label in ARABIC_FIELD_LABELS.items():
            if field_name in form.base_fields:
                form.base_fields[field_name].label = label
        return form


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


@admin.register(LandingPageInstructor)
class LandingPageInstructorAdmin(ArabicLabelsMixin, OptimizedQuerysetMixin, admin.ModelAdmin, ExcelExportMixin):
    """Admin configuration for Landing Page Featured Instructors."""

    select_related_fields = ['instructor', 'instructor__user']

    list_display = (
        'get_order_badge', 'get_instructor_link', 'get_instructor_type',
        'get_courses_count', 'get_bio_preview', 'created_at'
    )
    list_filter = ('instructor__type',)
    search_fields = (
        'instructor__user__first_name', 'instructor__user__last_name',
        'instructor__user__email', 'instructor__bio'
    )
    autocomplete_fields = ['instructor']
    list_per_page = 25
    ordering = ('-order', '-created_at')

    fieldsets = (
        (_('معلم الصفحة الرئيسية'), {
            'fields': ('instructor', 'order'),
            'description': _('اختر المعلم وحدد ترتيب ظهوره (الأرقام الأعلى تظهر أولاً)')
        }),
    )

    # Excel export configuration
    excel_filename = 'landing_page_instructors'

    @admin.display(description=_('الترتيب'), ordering='order')
    def get_order_badge(self, obj):
        """Display order as a prominent badge."""
        return format_html(
            '<span style="background: #9b59b6; color: white; padding: 5px 12px; '
            'border-radius: 15px; font-size: 1.1em; font-weight: bold;">{}</span>',
            obj.order
        )

    @admin.display(description=_('المعلم'), ordering='instructor__user__first_name')
    def get_instructor_link(self, obj):
        """Display instructor as a clickable link with avatar icon."""
        if obj.instructor:
            url = reverse('admin:users_instructor_change', args=[obj.instructor.pk])
            full_name = obj.instructor.user.get_full_name()
            return format_html(
                '<a href="{}" style="color: #2980b9; text-decoration: none;">'
                '👨‍🏫 <strong>{}</strong></a>',
                url, full_name
            )
        return '-'

    @admin.display(description=_('النوع'), ordering='instructor__type')
    def get_instructor_type(self, obj):
        """Display instructor type as a badge."""
        if obj.instructor:
            type_config = {
                'supervisor': ('🔵', '#3498db', obj.instructor.get_type_display()),
                'normal': ('🟢', '#27ae60', obj.instructor.get_type_display()),
            }
            
            icon, color, label = type_config.get(
                obj.instructor.type, ('⚪', '#95a5a6', obj.instructor.get_type_display())
            )
            
            return format_html(
                '<span style="background: {}; color: white; padding: 2px 8px; '
                'border-radius: 10px; font-size: 0.85em;">{} {}</span>',
                color, icon, label
            )
        return '-'

    @admin.display(description=_('عدد الكورسات'))
    def get_courses_count(self, obj):
        """Display number of courses taught by this instructor."""
        if obj.instructor:
            count = getattr(obj.instructor, 'courses_count', obj.instructor.courses.filter(is_active=True).count())
            if count > 0:
                return format_html(
                    '<span style="background: #3498db; color: white; padding: 2px 8px; '
                    'border-radius: 10px;">{}</span>',
                    count
                )
            return format_html('<span style="color: #95a5a6;">0</span>')
        return '-'

    @admin.display(description=_('نبذة'))
    def get_bio_preview(self, obj):
        """Display a preview of instructor bio."""
        if obj.instructor and obj.instructor.bio:
            bio = obj.instructor.bio
            preview = bio[:50] + '...' if len(bio) > 50 else bio
            return format_html(
                '<span style="color: #7f8c8d; font-size: 0.9em;" title="{}">{}</span>',
                bio, preview
            )
        return format_html('<span style="color: #bdc3c7;">لا توجد نبذة</span>')

    def get_queryset(self, request):
        """Optimize queryset and annotate with courses count."""
        qs = super().get_queryset(request)
        qs = qs.annotate(
            courses_count=Count('instructor__courses', filter=Q(instructor__courses__is_active=True))
        )
        return qs
