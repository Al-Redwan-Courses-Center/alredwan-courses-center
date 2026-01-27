#!/usr/bin/env python3
"""
Inline admin classes for courses app.
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from courses.models import CourseSchedule, Lecture, Exam, ExamResult, Course


class CourseScheduleInline(admin.TabularInline):
    """Inline admin for course schedules."""
    model = CourseSchedule
    extra = 1
    min_num = 0
    max_num = 7
    fields = ('weekday', 'start_time', 'end_time')
    ordering = ('weekday',)

    verbose_name = _('جدول الدورة')
    verbose_name_plural = _('جداول الدورة')


class LectureInline(admin.TabularInline):
    """Inline admin for course lectures - shows recent lectures."""
    model = Lecture
    extra = 0
    max_num = 10
    fields = ('lecture_number', 'title', 'day', 'status', 'attendance_taken')
    readonly_fields = ('attendance_taken',)
    ordering = ('-day', '-lecture_number')
    show_change_link = True

    verbose_name = _('محاضرة')
    verbose_name_plural = _('آخر المحاضرات')

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('instructor', 'instructor__user')


class ExamInline(admin.TabularInline):
    """Inline admin for course exams."""
    model = Exam
    extra = 0
    fields = ('name', 'exam_type', 'scheduled_at', 'total_marks')
    readonly_fields = ('scheduled_at',)
    show_change_link = True

    verbose_name = _('امتحان')
    verbose_name_plural = _('امتحانات الدورة')

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('instructor', 'instructor__user')


class ExamResultInline(admin.TabularInline):
    """Inline admin for exam results."""
    model = ExamResult
    extra = 1
    fields = ('student', 'child', 'marks_obtained', 'percentage', 'passed')
    readonly_fields = ('percentage', 'passed')
    autocomplete_fields = ['student']
    raw_id_fields = ['child']

    verbose_name = _('نتيجة')
    verbose_name_plural = _('نتائج الامتحان')

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'student', 'student__user', 'child', 'entered_by'
        )


class TagCourseInline(admin.TabularInline):
    """Inline to show courses that have this tag."""
    model = Course.tags.through
    extra = 0
    verbose_name = _('دورة')
    verbose_name_plural = _('الدورات المرتبطة')
    autocomplete_fields = ['course']
    classes = ['collapse']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'course', 'course__instructor', 'course__instructor__user', 'course__season'
        )


class TagInstructorInline(admin.TabularInline):
    """Inline to show instructors associated with this tag."""
    from users.models import Instructor
    model = Instructor.tags.through
    extra = 0
    verbose_name = _('مدرس')
    verbose_name_plural = _('المدرسون المرتبطون')
    classes = ['collapse']
    autocomplete_fields = ['instructor']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'instructor', 'instructor__user'
        )
