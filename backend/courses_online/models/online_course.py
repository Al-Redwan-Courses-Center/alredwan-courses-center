import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from cloudinary.models import CloudinaryField

class OnlineCourse(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=128, verbose_name=_("اسم الدورة"))
    description = models.TextField(blank=True, verbose_name=_("الوصف"))
    image = CloudinaryField(
        'صورة الدورة الإلكترونية', blank=True, null=True,
        folder='courses_online',
        transformation={'width': 800, 'crop': 'limit', 'quality': 'auto:good', 'fetch_format': 'auto'},
    )
    instructor = models.ForeignKey(
        'users.Instructor', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='online_courses', verbose_name=_("المعلم"))
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name=_("السعر"))
    allow_replay = models.BooleanField(default=True, verbose_name=_("السماح بإعادة المشاهدة"))
    access_validity_days = models.PositiveIntegerField(default=365, verbose_name=_("مدة الصلاحية بالأيام"))
    is_published = models.BooleanField(default=True, verbose_name=_("منشور"))
    is_active = models.BooleanField(default=True, verbose_name=_("نشط"))
    tags = models.ManyToManyField('courses.Tag', blank=True, verbose_name=_("الوسوم"))
    slug = models.SlugField(max_length=150, blank=True, null=True, verbose_name=_("الرابط"))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("تاريخ الإنشاء"))
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = _("دورة إلكترونية")
        verbose_name_plural = _("الدورات الإلكترونية")

    def __str__(self):
        return self.name

    @property
    def enrolled_count(self):
        return self.online_enrollments.filter(status='active').count()
