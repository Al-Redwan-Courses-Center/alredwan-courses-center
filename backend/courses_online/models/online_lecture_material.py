import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from cloudinary.models import CloudinaryField

class MaterialType(models.TextChoices):
    PDF = 'pdf', _('PDF')
    IMAGE = 'image', _('صورة')
    DOC = 'doc', _('مستند')

from django.core.files.storage import FileSystemStorage
from django.conf import settings

local_storage = FileSystemStorage(location=settings.MEDIA_ROOT, base_url=settings.MEDIA_URL)

class OnlineLectureMaterial(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lecture = models.ForeignKey(
        'courses_online.VideoLecture', on_delete=models.CASCADE,
        related_name='materials', verbose_name=_("المحاضرة"))
    title = models.CharField(max_length=255, verbose_name=_("العنوان"))
    file = models.FileField('الملف', upload_to='online_materials/', blank=True, null=True)
    external_url = models.URLField(max_length=500, blank=True, null=True, verbose_name=_("رابط خارجي (مثل Google Drive)"))
    file_type = models.CharField(
        max_length=20, choices=MaterialType.choices, verbose_name=_("نوع الملف"))
    order = models.PositiveIntegerField(default=0, verbose_name=_("الترتيب"))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("تاريخ الإنشاء"))

    class Meta:
        ordering = ['order']
        verbose_name = _("مادة تعليمية")
        verbose_name_plural = _("المواد التعليمية")

    def __str__(self):
        return f"{self.lecture.title} — {self.title}"
