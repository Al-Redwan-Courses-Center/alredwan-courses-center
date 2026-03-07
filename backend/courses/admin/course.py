#!/usr/bin/env python3
"""
Admin configuration for Course model.
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from django.urls import reverse
from django.db.models import Count, Q

from courses.models import Course
from core.utils import ExcelExportMixin
from .base import ArabicLabelsMixin, OptimizedQuerysetMixin
from .filters import ActiveStatusFilter, CapacityStatusFilter, DateRangeFilter
from .actions import activate_selected, deactivate_selected, duplicate_selected
from .inlines import CourseScheduleInline, LectureInline, ExamInline, CourseEnrollmentInline


@admin.register(Course)
class CourseAdmin(ArabicLabelsMixin, OptimizedQuerysetMixin, ExcelExportMixin, admin.ModelAdmin):
    """Admin configuration for Course model with enhanced UX."""

    select_related_fields = ['instructor', 'instructor__user', 'season']
    prefetch_related_fields = ['tags']

    list_display = (
        'action_checkbox', 'name', 'get_instructor_link', 'get_season', 'get_date_range',
        'get_capacity_bar', 'get_price_display', 'get_active_status'
    )
    list_filter = (
        ActiveStatusFilter, CapacityStatusFilter, 'season',
        'instructor', 'for_adults', DateRangeFilter, 'tags'
    )
    search_fields = (
        'name', 'description', 'slug',
        'instructor__user__first_name', 'instructor__user__last_name'
    )
    date_hierarchy = 'start_date'
    filter_horizontal = ('tags',)
    prepopulated_fields = {'slug': ('name',)}
    autocomplete_fields = ['instructor', 'season']
    list_per_page = 25
    ordering = ('-start_date', 'name')
    save_on_top = True
    actions = [activate_selected, deactivate_selected, duplicate_selected]
    
    # Excel export configuration
    excel_filename = 'courses'

    # Inlines for related models
    inlines = [CourseScheduleInline, LectureInline, CourseEnrollmentInline]

    fieldsets = (
        (_('معلومات الدورة الأساسية'), {
            'fields': ('name', 'slug', 'description', 'image'),
            'description': _('المعلومات الأساسية للدورة')
        }),
        (_('المدرس والموسم'), {
            'fields': ('instructor', 'season'),
        }),
        (_('التواريخ والمحاضرات'), {
            'fields': ('start_date', 'end_date', 'num_lectures'),
            'description': _('حدد فترة الدورة وعدد المحاضرات المخطط لها، من الأفضل إدخال إما تاريخ النهاية أو عدد المحاضرات (أي واحد فقط منهما)  ')
        }),
        (_('السعة والتسجيل'), {
            'fields': ('capacity', 'price'),
            'description': _('السعة الكلية والسعر (عدد المسجلين يُحسب تلقائياً)')
        }),
        (_('الفئة العمرية'), {
            'fields': ('for_adults', 'min_age', 'max_age'),
            'classes': ('collapse',),
            'description': _('حدد الفئة العمرية المستهدفة')
        }),
        (_('إعدادات إضافية'), {
            'fields': ('tags', 'is_active'),
            'classes': ('collapse',),
        }),
    )

    def get_queryset(self, request):
        """Override to annotate enrolled_count from actual enrollments."""
        qs = super().get_queryset(request)
        # Annotate with actual active enrollment count (use different name to avoid property conflict)
        qs = qs.annotate(
            _enrolled_count=Count(
                'enrollments',
                filter=Q(enrollments__status='active')
            )
        )
        return qs

    @admin.display(description=_('المدرس'), ordering='instructor__user__first_name')
    def get_instructor_link(self, obj):
        """Display instructor as a clickable link."""
        if obj.instructor:
            url = reverse('admin:users_instructor_change',
                          args=[obj.instructor.pk])
            return format_html(
                '<a href="{}" style="color: #2980b9; text-decoration: none;">'
                '👨‍🏫 {}</a>',
                url, obj.instructor
            )
        return '-'

    def get_season(self, obj):
        return obj.season
    get_season.short_description = 'الموسم'
    get_season.admin_order_field = 'season'

    @admin.display(description=_('الفترة'), ordering='start_date')
    def get_date_range(self, obj):
        """Display date range."""
        if obj.start_date and obj.end_date:
            return format_html(
                '<span style="white-space: nowrap; font-size: 0.9em;">'
                '{} → {}</span>',
                obj.start_date.strftime('%m/%d'),
                obj.end_date.strftime('%m/%d')
            )
        return '-'

    @admin.display(description=_('السعة'))
    def get_capacity_bar(self, obj):
        """Display capacity as a visual progress bar."""
        if obj.capacity and obj.capacity > 0:
            # Use annotated value if available, otherwise fall back to property
            enrolled = getattr(obj, '_enrolled_count', None)
            if enrolled is None:
                enrolled = obj.enrolled_count
            percentage = min((enrolled / obj.capacity) * 100, 100)

            if percentage >= 100:
                color = '#e74c3c'
                status = 'ممتلئ'
            elif percentage >= 80:
                color = '#f39c12'
                status = 'شبه ممتلئ'
            else:
                color = '#27ae60'
                status = 'متاح'

            return format_html(
                '<div style="width: 100px; background: #ecf0f1; border-radius: 4px; '
                'overflow: hidden; font-weight: 700;" title="{}"; >'
                '<div style="width: {}%; background: {}; padding: 2px 0; '
                'text-align: center; color: black; font-size: 0.75em;">'
                '{}/{}</div></div>',
                status, percentage, color, enrolled, obj.capacity
            )
        return '-'

    @admin.display(description=_('السعر'), ordering='price')
    def get_price_display(self, obj):
        """Display price with currency."""
        if obj.price:
            return format_html(
                '<span style="color: #27ae60; font-weight: bold;">{} ج.م</span>',
                obj.price
            )
        return format_html('<span style="color: #27ae60;">مجاني</span>')

    @admin.display(description=_('الحالة'), ordering='is_active')
    def get_active_status(self, obj):
        """Display active status with color indicator."""
        if obj.is_active:
            return format_html(
                '<span style="color: #27ae60;">🟢</span>'
            )
        return format_html('<span style="color: #e74c3c;">🔴</span>')
