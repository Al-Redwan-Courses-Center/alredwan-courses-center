#!/usr/bin/env python3
"""
Admin configuration for LandingPageCourse model.
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from django.urls import reverse
from django.db.models import Count

from courses.models import LandingPageCourse
from .base import ArabicLabelsMixin, OptimizedQuerysetMixin


@admin.register(LandingPageCourse)
class LandingPageCourseAdmin(ArabicLabelsMixin, OptimizedQuerysetMixin, admin.ModelAdmin):
    """Admin configuration for LandingPageCourse with drag ordering support."""

    select_related_fields = [
        'course', 'course__season', 'course__instructor',
        'course__instructor__user'
    ]

    list_display = (
        'get_order_badge', 'get_course_info', 'get_instructor_name',
        'get_enrollment_status', 'get_course_active_status', 'get_drag_handle'
    )
    list_display_links = ('get_course_info',)
    list_filter = ('course__is_active', 'course__season', 'course__instructor')
    search_fields = ('course__name', 'course__instructor__user__first_name')
    autocomplete_fields = ['course']
    list_per_page = 25
    ordering = ('order', '-created_at')
    save_on_top = True

    fieldsets = (
        (_('إعدادات العرض'), {
            'fields': ('course', 'order'),
            'description': _('حدد الدورة وترتيب عرضها في الصفحة الرئيسية')
        }),
    )

    @admin.display(description='#', ordering='order')
    def get_order_badge(self, obj):
        """Display order number with visual styling."""
        if obj.order <= 3:
            # Top 3 get special colors
            colors = {
                1: '#f1c40f',  # Gold
                2: '#bdc3c7',  # Silver
                3: '#cd6133',  # Bronze
            }
            color = colors.get(obj.order, '#3498db')
            return format_html(
                '<span style="background: {}; color: white; width: 28px; '
                'height: 28px; border-radius: 50%; display: inline-flex; '
                'align-items: center; justify-content: center; font-weight: bold; '
                'font-size: 0.9em; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">{}</span>',
                color, obj.order
            )
        return format_html(
            '<span style="background: #ecf0f1; color: #2c3e50; width: 24px; '
            'height: 24px; border-radius: 50%; display: inline-flex; '
            'align-items: center; justify-content: center; font-size: 0.85em;">{}</span>',
            obj.order
        )

    @admin.display(description=_('الدورة'), ordering='course__name')
    def get_course_info(self, obj):
        """Display course with season badge."""
        if not obj.course:
            return '-'

        url = reverse('admin:courses_course_change', args=[obj.course.pk])
        season_badge = ''
        if obj.course.season:
            season_badge = format_html(
                '<span style="background: #9b59b6; color: white; padding: 1px 6px; '
                'border-radius: 8px; font-size: 0.75em; margin-right: 5px;">{}</span>',
                obj.course.season.name
            )

        return format_html(
            '{}<a href="{}" style="color: #2980b9; text-decoration: none;">{}</a>',
            season_badge, url, obj.course.name
        )

    @admin.display(description=_('المدرس'))
    def get_instructor_name(self, obj):
        """Display instructor name with avatar placeholder."""
        if obj.course and obj.course.instructor:
            return format_html(
                '<span style="color: #2c3e50;">👨‍🏫 {}</span>',
                obj.course.instructor
            )
        return '-'

    @admin.display(description=_('التسجيل'))
    def get_enrollment_status(self, obj):
        """Display enrollment status with capacity indicator."""
        if not obj.course:
            return '-'

        course = obj.course
        enrolled = getattr(course, '_enrolled_count', None)
        if enrolled is None:
            enrolled = course.enrolled_count

        capacity = course.capacity or '∞'

        if course.is_full:
            return format_html(
                '<span style="background: #e74c3c; color: white; padding: 2px 8px; '
                'border-radius: 10px; font-size: 0.85em;">🚫 مكتمل ({}/{})</span>',
                enrolled, capacity
            )

        percentage = (enrolled / course.capacity *
                      100) if course.capacity else 0
        if percentage >= 80:
            color = '#e67e22'
            icon = '⚠️'
        else:
            color = '#27ae60'
            icon = '✓'

        return format_html(
            '<span style="color: {};">{} {}/{}</span>',
            color, icon, enrolled, capacity
        )

    @admin.display(description=_('الحالة'), boolean=True, ordering='course__is_active')
    def get_course_active_status(self, obj):
        """Display course active status."""
        if obj.course:
            return obj.course.is_active
        return False

    @admin.display(description='↕️')
    def get_drag_handle(self, obj):
        """Display drag handle for reordering."""
        return format_html(
            '<span style="cursor: move; color: #bdc3c7; font-size: 1.2em;" '
            'title="اسحب لإعادة الترتيب">☰</span>'
        )

    def get_queryset(self, request):
        """Optimize queryset with enrollment count annotation."""
        qs = super().get_queryset(request)
        return qs.annotate(
            _course_enrolled_count=Count('course__enrollments')
        )

    class Media:
        css = {
            'all': (
                # Admin ordering CSS if needed
            )
        }
        js = (
            # Admin ordering JS if needed
        )
