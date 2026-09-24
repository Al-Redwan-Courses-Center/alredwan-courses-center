import uuid
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _

class VideoWatchProgress(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lecture = models.ForeignKey(
        'courses_online.VideoLecture', on_delete=models.CASCADE,
        related_name='watch_records', verbose_name=_("المحاضرة"))
    student = models.ForeignKey(
        'users.StudentUser', null=True, blank=True, on_delete=models.CASCADE,
        related_name='video_watch_progress', verbose_name=_("الطالب"))
    child = models.ForeignKey(
        'parents.Child', null=True, blank=True, on_delete=models.CASCADE,
        related_name='video_watch_progress', verbose_name=_("الطفل"))
    watched_seconds = models.PositiveIntegerField(default=0, verbose_name=_("الثواني المشاهدة"))
    total_seconds = models.PositiveIntegerField(default=0, verbose_name=_("إجمالي الثواني"))
    completion_percentage = models.FloatField(default=0.0, verbose_name=_("نسبة الإكمال"))
    is_completed = models.BooleanField(default=False, verbose_name=_("مكتمل"))
    last_position_seconds = models.PositiveIntegerField(default=0, verbose_name=_("آخر موضع"))
    watch_count = models.PositiveIntegerField(default=0, verbose_name=_("عدد المشاهدات المكتملة"))
    last_watched_at = models.DateTimeField(auto_now=True, verbose_name=_("آخر مشاهدة"))

    class Meta:
        verbose_name = _("تقدم المشاهدة")
        verbose_name_plural = _("تقدم المشاهدات")
        constraints = [
            models.UniqueConstraint(
                fields=['lecture', 'student'],
                condition=models.Q(student__isnull=False),
                name='unique_video_lecture_student_progress'),
            models.UniqueConstraint(
                fields=['lecture', 'child'],
                condition=models.Q(child__isnull=False),
                name='unique_video_lecture_child_progress'),
            models.CheckConstraint(
                condition=(models.Q(student__isnull=False) & models.Q(child__isnull=True)) | (models.Q(student__isnull=True) & models.Q(child__isnull=False)),
                name='video_watch_requires_participant'
            ),
        ]

    def clean(self):
        """Progress may only belong to a participant enrolled in the lecture's course.

        The API already verifies the enrollment before recording progress; this
        guards the admin (and any other ModelForm) so a record cannot be
        re-assigned to a student or child who is not enrolled in that course.
        """
        super().clean()
        if self.student_id and self.child_id:
            raise ValidationError(_("اختر طالباً أو طفلاً، وليس الاثنين معاً."))
        if not self.student_id and not self.child_id:
            raise ValidationError(_("يجب تحديد الطالب أو الطفل صاحب التقدم."))
        if not self.lecture_id:
            return

        from courses_online.participants import active_online_enrollments

        course = self.lecture.course
        participant_filter = {'student_id': self.student_id} if self.student_id else {'child_id': self.child_id}
        if not active_online_enrollments(course, **participant_filter).exists():
            field = 'student' if self.student_id else 'child'
            raise ValidationError({
                field: _("هذا المشارك غير مشترك (اشتراك نشط) في الدورة الإلكترونية «%(course)s».") % {'course': course.name},
            })
