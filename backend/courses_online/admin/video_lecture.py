"""Lecture-level admin.

Lectures and their materials are managed from inside the course page
(``online_course.py``). ``VideoLectureAdmin`` stays registered so links to a
lecture (from watch-progress rows, for example) still resolve, but it is kept
off the admin index so the course is the single entry point for content.
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from courses_online.models import OnlineLectureMaterial, VideoLecture, VideoWatchProgress


class OnlineLectureMaterialInline(admin.TabularInline):
    model = OnlineLectureMaterial
    extra = 0
    fields = ('order', 'title', 'file_type', 'file', 'external_url')


@admin.register(VideoLecture)
class VideoLectureAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'order', 'video_platform', 'duration_seconds', 'is_live_stream')
    list_filter = ('video_platform', 'is_live_stream', 'course')
    search_fields = ('title', 'description', 'course__name')
    autocomplete_fields = ('course',)
    inlines = [OnlineLectureMaterialInline]

    def has_module_permission(self, request):
        # Hidden from the index: content is edited from the course page.
        return False


@admin.register(VideoWatchProgress)
class VideoWatchProgressAdmin(admin.ModelAdmin):
    list_display = ('lecture', 'get_course', 'student', 'child',
                    'completion_percentage', 'is_completed', 'last_watched_at')
    list_filter = ('is_completed', 'lecture__course')
    list_select_related = ('lecture', 'lecture__course', 'student__user', 'child')
    search_fields = ('lecture__title', 'student__user__first_name', 'student__user__last_name',
                     'child__first_name', 'child__last_name')

    @admin.display(description=_("الدورة"), ordering='lecture__course__name')
    def get_course(self, obj):
        return obj.lecture.course
