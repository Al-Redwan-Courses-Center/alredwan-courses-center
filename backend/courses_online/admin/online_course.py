"""Online course admin.

Everything that belongs to a course is edited from the course page itself:
the course fields, its lectures (ordered, draggable) and, inside each
lecture, its materials. Lectures and materials are therefore not listed as
separate entries on the admin index; see ``video_lecture.py``.
"""
from django.contrib import admin
from django.db.models import Count, Q
from django.utils.translation import gettext_lazy as _
from nested_admin import NestedModelAdmin, NestedStackedInline, NestedTabularInline

from core.utils import ExcelExportMixin
from courses_online.models import OnlineCourse, OnlineLectureMaterial, VideoLecture


class OnlineLectureMaterialInline(NestedTabularInline):
    """Files and links attached to one lecture (PDFs, images, documents, Drive links)."""
    model = OnlineLectureMaterial
    extra = 0
    sortable_field_name = 'order'
    fields = ('order', 'title', 'file_type', 'file', 'external_url')
    verbose_name = _("مادة تعليمية")
    verbose_name_plural = _("المواد التعليمية (ملفات، صور، روابط)")


class VideoLectureInline(NestedStackedInline):
    """One lecture: video or live stream, written notes, and its materials."""
    model = VideoLecture
    extra = 0
    sortable_field_name = 'order'
    inlines = [OnlineLectureMaterialInline]
    verbose_name = _("محاضرة")
    verbose_name_plural = _("محتوى الدورة (المحاضرات بالترتيب)")
    fieldsets = (
        (None, {
            'fields': (('order', 'title'), 'description'),
        }),
        (_("الفيديو"), {
            'fields': (('video_platform', 'duration_seconds'), 'video_url'),
        }),
        (_("البث المباشر"), {
            'classes': ('collapse',),
            'fields': (('is_live_stream', 'live_stream_time'),),
            'description': _("فعّل البث المباشر وحدد موعده؛ يُستخدم رابط الفيديو أعلاه كرابط الانضمام."),
        }),
    )


@admin.register(OnlineCourse)
class OnlineCourseAdmin(ExcelExportMixin, NestedModelAdmin):
    list_display = ('name', 'instructor', 'price', 'is_published', 'is_active',
                    'get_video_count', 'get_enrolled_count', 'created_at')
    list_filter = ('is_published', 'is_active', 'instructor')
    search_fields = ('name', 'description', 'video_lectures__title')
    readonly_fields = ('created_at', 'updated_at', 'get_enrolled_count')
    autocomplete_fields = ('tags',)
    inlines = [VideoLectureInline]
    excel_filename = 'online_courses'
    save_on_top = True

    fieldsets = (
        (_("بيانات الدورة"), {
            'fields': ('name', 'description', 'image', 'instructor', 'tags', 'slug'),
        }),
        (_("السعر والصلاحية"), {
            'fields': (('price', 'access_validity_days'), 'allow_replay'),
        }),
        (_("النشر"), {
            'fields': (('is_published', 'is_active'), 'get_enrolled_count', ('created_at', 'updated_at')),
        }),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        qs = qs.select_related('instructor', 'instructor__user').prefetch_related('tags')
        qs = qs.annotate(
            annotated_video_count=Count('video_lectures', distinct=True),
            annotated_enrolled_count=Count(
                'online_enrollments', filter=Q(online_enrollments__status='active'), distinct=True),
        )
        return qs

    @admin.display(description=_("عدد المحاضرات"), ordering='annotated_video_count')
    def get_video_count(self, obj):
        return getattr(obj, 'annotated_video_count', obj.video_lectures.count())

    @admin.display(description=_("عدد المسجلين"), ordering='annotated_enrolled_count')
    def get_enrolled_count(self, obj):
        if obj is None or obj.pk is None:
            return 0
        return getattr(obj, 'annotated_enrolled_count', obj.enrolled_count)
