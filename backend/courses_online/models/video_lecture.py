import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _

class VideoPlatform(models.TextChoices):
    YOUTUBE = 'youtube', _('YouTube Unlisted')
    VIMEO = 'vimeo', _('Vimeo Pro')
    BUNNY = 'bunny', _('Bunny Stream')

class VideoLecture(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(
        'courses_online.OnlineCourse', on_delete=models.CASCADE,
        related_name='video_lectures', verbose_name=_("الدورة"))
    order = models.PositiveIntegerField(verbose_name=_("الترتيب"))
    title = models.CharField(max_length=255, verbose_name=_("العنوان"))
    description = models.TextField(blank=True, verbose_name=_("الوصف"))
    video_url = models.URLField(verbose_name=_("رابط الفيديو"), null=True, blank=True)
    video_platform = models.CharField(
        max_length=30, choices=VideoPlatform.choices,
        default=VideoPlatform.YOUTUBE, verbose_name=_("منصة الفيديو"))
    duration_seconds = models.PositiveIntegerField(default=0, verbose_name=_("المدة بالثواني"))
    is_live_stream = models.BooleanField(default=False, verbose_name=_("بث مباشر"))
    live_stream_time = models.DateTimeField(null=True, blank=True, verbose_name=_("موعد البث المباشر"))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("تاريخ الإنشاء"))
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']
        verbose_name = _("محاضرة فيديو")
        verbose_name_plural = _("محاضرات الفيديو")

    def __str__(self):
        return f"{self.course.name} — {self.title}"
