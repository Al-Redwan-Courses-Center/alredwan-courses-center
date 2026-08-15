from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from core.utils import ExcelExportMixin
from courses_online.models import OnlineCourse, VideoLecture, OnlineLectureMaterial

class VideoLectureInline(admin.TabularInline):
    model = VideoLecture
    extra = 0
    fields = ('order', 'title', 'video_url', 'video_platform', 'duration_seconds')

@admin.register(OnlineCourse)
class OnlineCourseAdmin(ExcelExportMixin, admin.ModelAdmin):
    list_display = ('name', 'instructor', 'price', 'is_published', 'get_video_count', 'enrolled_count', 'created_at')
    list_filter = ('is_published', 'is_active', 'instructor')
    search_fields = ('name', 'description')
    inlines = [VideoLectureInline]
    excel_filename = 'online_courses'

    def get_video_count(self, obj):
        return obj.video_lectures.count()
    get_video_count.short_description = _("عدد الفيديوهات")
