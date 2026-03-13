#!/usr/bin/env python3
"""
Admin configuration for Exam and ExamResult models.
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from django.db.models import Count, Avg

from core.utils import ExcelExportMixin
from courses.models import Exam, ExamResult
from .base import ArabicLabelsMixin, OptimizedQuerysetMixin
from .filters import PassedFilter
from .inlines import ExamResultInline


@admin.register(Exam)
class ExamAdmin(ArabicLabelsMixin, OptimizedQuerysetMixin, ExcelExportMixin, admin.ModelAdmin):
    """Admin configuration for Exam model."""

    select_related_fields = [
        'course', 'course__season', 'instructor', 'instructor__user'
    ]

    list_display = (
        'action_checkbox', 'name', 'get_exam_type_badge', 'get_course_link',
        'get_instructor_name', 'get_scheduled_at', 'total_marks',
        'get_results_summary'
    )
    list_filter = ('exam_type', 'course__season',
                   'course', 'instructor', 'scheduled_at')
    search_fields = ('name', 'description', 'course__name',
                     'instructor__user__first_name')
    date_hierarchy = 'scheduled_at'
    autocomplete_fields = ['course', 'instructor']
    list_per_page = 25
    ordering = ('-scheduled_at',)
    save_on_top = True

    # Inline for exam results
    inlines = [ExamResultInline]

    fieldsets = (
        (_('معلومات الامتحان'), {
            'fields': ('name', 'exam_type', 'description'),
            'description': _('أدخل المعلومات الأساسية للامتحان')
        }),
        (_('الدورة والمدرس'), {
            'fields': ('course', 'instructor'),
        }),
        (_('التوقيت والدرجات'), {
            'fields': ('scheduled_at', 'total_marks'),
        }),
    )

    @admin.display(description=_('نوع الامتحان'), ordering='exam_type')
    def get_exam_type_badge(self, obj):
        """Display exam type as colored badge."""
        type_config = {
            'quiz': ('📝', '#9b59b6', 'اختبار قصير'),
            'midterm': ('📋', '#3498db', 'نصفي'),
            'final': ('📚', '#e74c3c', 'نهائي'),
            'practical': ('🔧', '#27ae60', 'عملي'),
        }

        icon, color, label = type_config.get(
            obj.exam_type, ('📄', '#95a5a6', obj.get_exam_type_display())
        )

        return format_html(
            '<span style="background: {}; color: white; padding: 2px 8px; '
            'border-radius: 10px; font-size: 0.85em;">{} {}</span>',
            color, icon, label
        )

    @admin.display(description=_('الدورة'), ordering='course__name')
    def get_course_link(self, obj):
        """Display course as clickable link."""
        if obj.course:
            url = reverse('admin:courses_course_change', args=[obj.course.pk])
            return format_html(
                '<a href="{}" style="color: #2980b9;">{}</a>',
                url, obj.course.name
            )
        return '-'

    @admin.display(description=_('المدرس'))
    def get_instructor_name(self, obj):
        """Display instructor name."""
        if obj.instructor:
            return format_html('👨‍🏫 {}', obj.instructor)
        return '-'

    @admin.display(description=_('الموعد'), ordering='scheduled_at')
    def get_scheduled_at(self, obj):
        """Display scheduled date with relative indicator."""
        if not obj.scheduled_at:
            return '-'

        today = timezone.now().date()
        exam_date = obj.scheduled_at.date() if hasattr(
            obj.scheduled_at, 'date') else obj.scheduled_at
        day_diff = (exam_date - today).days

        date_str = obj.scheduled_at.strftime('%Y/%m/%d %H:%M')

        if day_diff < 0:
            return format_html(
                '<span style="color: #95a5a6;">✓ {}</span>',
                date_str
            )
        elif day_diff == 0:
            return format_html(
                '<span style="color: #e67e22; font-weight: bold;">📍 اليوم - {}</span>',
                obj.scheduled_at.strftime('%H:%M')
            )
        elif day_diff <= 7:
            return format_html(
                '<span style="color: #e74c3c; font-weight: bold;">⏰ {}</span>',
                date_str
            )
        else:
            return format_html('<span>{}</span>', date_str)

    @admin.display(description=_('النتائج'))
    def get_results_summary(self, obj):
        """Display results summary."""
        results_count = getattr(obj, 'results_count', 0)
        if results_count > 0:
            avg = getattr(obj, 'results_avg', 0) or 0

            return format_html(
                '<span title="عدد النتائج: {}">'
                '<span style="background: #3498db; color: white; padding: 2px 6px; '
                'border-radius: 10px; margin-left: 5px;">{}</span>'
                '<span style="color: #27ae60; font-size: 0.9em;"> ~{:.0f}%</span>'
                '</span>',
                results_count, results_count, avg
            )
        return format_html('<span style="color: #bdc3c7;">لا توجد نتائج</span>')

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.annotate(
            results_count=Count('results'),
            results_avg=Avg('results__percentage')
        )

    # Excel export configuration
    excel_filename = 'exams'


@admin.register(ExamResult)
class ExamResultAdmin(ArabicLabelsMixin, OptimizedQuerysetMixin, ExcelExportMixin, admin.ModelAdmin):
    """Admin configuration for ExamResult model with enhanced UX."""

    select_related_fields = [
        'exam', 'exam__course', 'student', 'student__user',
        'child', 'entered_by'
    ]

    list_display = (
        'action_checkbox', 'get_exam_info', 'get_participant_display', 'get_marks_display',
        'get_percentage_bar', 'get_passed_status', 'get_entered_info'
    )
    list_filter = (
        PassedFilter, 'exam__course__season', 'exam__course',
        'exam', 'entered_at'
    )
    search_fields = (
        'exam__name', 'exam__course__name',
        'student__user__first_name', 'student__user__last_name',
        'child__first_name', 'child__last_name', 'notes'
    )
    date_hierarchy = 'entered_at'
    readonly_fields = ('percentage', 'passed', 'created_at', 'updated_at')
    autocomplete_fields = ['exam', 'student', 'entered_by']
    raw_id_fields = ['child']
    list_per_page = 25
    ordering = ('-entered_at',)
    save_on_top = True

    fieldsets = (
        (_('معلومات النتيجة'), {
            'fields': ('exam', 'student', 'child'),
            'description': _('حدد الامتحان والطالب أو الطفل')
        }),
        (_('الدرجات'), {
            'fields': ('marks_obtained', 'percentage', 'passed'),
            'description': _('أدخل الدرجة المحصلة وسيتم حساب النسبة تلقائياً')
        }),
        (_('ملاحظات وتسجيل'), {
            'fields': ('notes', 'entered_by', 'entered_at'),
        }),
        (_('معلومات النظام'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    @admin.display(description=_('الامتحان'))
    def get_exam_info(self, obj):
        """Display exam info with course."""
        if obj.exam:
            url = reverse('admin:courses_exam_change', args=[obj.exam.pk])
            return format_html(
                '<a href="{}" style="color: #2980b9; text-decoration: none;">'
                '<strong>{}</strong></a><br>'
                '<small style="color: #7f8c8d;">{}</small>',
                url, obj.exam.name,
                obj.exam.course.name if obj.exam.course else '-'
            )
        return '-'

    @admin.display(description=_('الطالب/الطفل'))
    def get_participant_display(self, obj):
        """Display participant with type indicator."""
        if obj.student:
            return format_html(
                '<span style="color: #2980b9;">👤 {}</span>',
                obj.student
            )
        elif obj.child:
            return format_html(
                '<span style="color: #9b59b6;">👶 {}</span>',
                obj.child
            )
        return '-'

    @admin.display(description=_('الدرجة'), ordering='marks_obtained')
    def get_marks_display(self, obj):
        """Display marks obtained vs total."""
        if obj.marks_obtained is not None and obj.exam:
            return format_html(
                '<span style="font-family: monospace; font-size: 1.1em;">'
                '<strong>{}</strong> / {}</span>',
                obj.marks_obtained, obj.exam.total_marks
            )
        return '-'

    @admin.display(description=_('النسبة'), ordering='percentage')
    def get_percentage_bar(self, obj):
        """Display percentage as visual bar."""
        if obj.percentage is not None:
            # Determine color based on percentage
            if obj.percentage >= 90:
                color = '#27ae60'  # Green - Excellent
                grade = 'ممتاز'
            elif obj.percentage >= 80:
                color = '#2ecc71'  # Light green - Very good
                grade = 'جيد جداً'
            elif obj.percentage >= 70:
                color = '#3498db'  # Blue - Good
                grade = 'جيد'
            elif obj.percentage >= 60:
                color = '#f39c12'  # Orange - Acceptable
                grade = 'مقبول'
            elif obj.percentage >= 50:
                color = '#e67e22'  # Dark orange - Pass
                grade = 'نجاح'
            else:
                color = '#e74c3c'  # Red - Fail
                grade = 'رسوب'

            return format_html(
                '<div style="width: 80px; background: #ecf0f1; border-radius: 4px; '
                'overflow: hidden;" title="{}">'
                '<div style="width: {}%; background: {}; padding: 2px 0; '
                'text-align: center; color: white; font-size: 0.8em; font-weight: bold;">'
                '{:.0f}%</div></div>',
                grade, min(obj.percentage, 100), color, obj.percentage
            )
        return '-'

    @admin.display(description=_('النتيجة'), boolean=True, ordering='passed')
    def get_passed_status(self, obj):
        """Display pass/fail status."""
        return obj.passed

    @admin.display(description=_('تم الإدخال'))
    def get_entered_info(self, obj):
        """Display who entered and when."""
        entered_by = obj.entered_by.get_full_name() if obj.entered_by else '-'
        entered_at = obj.entered_at.strftime(
            '%m/%d %H:%M') if obj.entered_at else '-'

        return format_html(
            '<small style="color: #7f8c8d;">{}<br>{}</small>',
            entered_by, entered_at
        )

    def save_model(self, request, obj, form, change):
        """Auto-set entered_by to current user if not set."""
        if not obj.entered_by:
            obj.entered_by = request.user
        super().save_model(request, obj, form, change)

    def get_readonly_fields(self, request, obj=None):
        """Make some fields readonly after creation."""
        readonly = list(self.readonly_fields)
        if obj:  # Editing existing object
            readonly.extend(['exam', 'student', 'child'])
        return readonly

    # Excel export configuration
    excel_filename = 'exam_results'
