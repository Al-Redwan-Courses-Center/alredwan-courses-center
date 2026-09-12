from django.db.models import Count, Q
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
    list_display = ('name', 'instructor', 'price', 'is_published', 'get_video_count', 'get_enrolled_count', 'created_at')
    list_filter = ('is_published', 'is_active', 'instructor')
    search_fields = ('name', 'description')
    inlines = [VideoLectureInline]
    excel_filename = 'online_courses'

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        qs = qs.select_related('instructor', 'instructor__user').prefetch_related('tags')
        qs = qs.annotate(
            annotated_video_count=Count('video_lectures', distinct=True),
            annotated_enrolled_count=Count('online_enrollments', filter=Q(online_enrollments__status='active'), distinct=True)
        )
        return qs

    def get_video_count(self, obj):
        return getattr(obj, 'annotated_video_count', obj.video_lectures.count())
    get_video_count.short_description = _("عدد الفيديوهات")

    def get_enrolled_count(self, obj):
        return getattr(obj, 'annotated_enrolled_count', obj.enrolled_count)
    get_enrolled_count.short_description = _("عدد المسجلين")
    get_enrolled_count.admin_order_field = 'annotated_enrolled_count'

    enrolled_count = get_enrolled_count
