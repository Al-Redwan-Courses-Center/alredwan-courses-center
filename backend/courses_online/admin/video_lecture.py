from django.contrib import admin
from courses_online.models import VideoLecture, VideoWatchProgress, OnlineLectureMaterial

class OnlineLectureMaterialInline(admin.TabularInline):
    model = OnlineLectureMaterial
    extra = 0

@admin.register(VideoLecture)
class VideoLectureAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'order', 'video_platform', 'duration_seconds', 'is_live_stream')
    list_filter = ('video_platform', 'is_live_stream', 'course')
    search_fields = ('title', 'description', 'course__name')
    inlines = [OnlineLectureMaterialInline]

@admin.register(VideoWatchProgress)
class VideoWatchProgressAdmin(admin.ModelAdmin):
    list_display = ('lecture', 'student', 'child', 'completion_percentage', 'is_completed', 'last_watched_at')
    list_filter = ('is_completed', 'lecture__course')
    search_fields = ('lecture__title', 'student__user__username', 'child__name')
