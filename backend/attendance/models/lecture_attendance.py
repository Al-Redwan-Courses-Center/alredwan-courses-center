from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db.models import Q
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

class LectureAttendance(models.Model):
    """Model representing attendance records for a lecture."""

    lecture = models.ForeignKey(
        'courses.Lecture', on_delete=models.CASCADE, related_name='lecture_attendances')
    child = models.ForeignKey('users.Child', null=True, blank=True,
                              on_delete=models.CASCADE, related_name='lecture_attendances')
    student = models.ForeignKey('users.StudentUser', null=True, blank=True,
                                on_delete=models.CASCADE, related_name='lecture_attendances')

    # null = not marked yet
    present = models.BooleanField(null=True, default=None)
    # rating required at submit time (1.00 - 10.00). We enforce rating presence at API level,
    # and add a DB-level check that rating is present if present is not null.
    rating = models.DecimalField(max_digits=4, decimal_places=2, null=True, default=None,
                                 validators=[
                                    MinValueValidator(1.00),
                                    MaxValueValidator(10.00),
                                 ])
    notes = models.TextField(null=True, blank=True)
    marked_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                  null=True, blank=True, related_name='marked_lecture_attendances')
    marked_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            # exactly one of child or student (enforced in clean() too)
            models.CheckConstraint(
                check=Q(child__isnull=False, student__isnull=True) | Q(
                    child__isnull=True, student__isnull=False),
                name='child_or_student'
            ),
            # rating range when set
            models.CheckConstraint(
                check=Q(rating__gte=1.00, rating__lte=10.00) | Q(
                    rating__isnull=True),
                name='lecture_attendance_rating_range'
            ),
            # ensure rating is set when present is not null (API also enforces)
            models.CheckConstraint(
                check=Q(present__isnull=True) | Q(rating__isnull=False),
                name='present_requires_rating'
            ),
            # conditional unique constraints per participant type
            models.UniqueConstraint(fields=['lecture', 'child'], condition=Q(
                child__isnull=False), name='unique_lecture_child_attendance'),
            models.UniqueConstraint(fields=['lecture', 'student'], condition=Q(
                student__isnull=False), name='unique_lecture_student_attendance'),
        ]
        indexes = [
            models.Index(fields=['lecture'], name='attendance_lecture_index'),
            models.Index(fields=['child'], name='attendance_child_index'),
            models.Index(fields=['student'], name='attendance_student_index'),
        ]
        verbose_name = 'Lecture Attendance'
        verbose_name_plural = 'Lecture Attendances'

    def __str__(self):
        participant = self.child.first_name if self.child else (
            self.student.user.first_name if self.student and self.student.user else 'Unknown')
        return f"Attendance for {participant} in {self.lecture}"

    def clean(self):
        """Validate attendance record constraints."""
        # exactly one participant
        has_child = self.child is not None
        has_student = self.student is not None
        if has_child == has_student:
            raise ValidationError(
                "Exactly one of 'child' or 'student' must be set.")

        # if present or rating is provided, marked_at must be set (we also allow marked_at to be auto-set by code)
        if (self.present is not None or self.rating is not None) and self.marked_at is None:
            raise ValidationError(
                "marked_at must be set when present or rating is provided.")

        # rating range is enforced by CheckConstraint but we keep a check here
        if self.rating is not None and (self.rating < 1.00 or self.rating > 10.00):
            raise ValidationError("Rating must be between 1.00 and 10.00.")

    def save(self, *args, **kwargs):
        """Ensure clean() runs and updated fields set properly."""
        self.full_clean()
        super().save(*args, **kwargs)

    # ---- Business helper methods ----
    @staticmethod
    def allowed_marking_window(lecture):
        """
        Return a tuple (start_dt, end_dt) representing the allowed window to mark attendance.
        Business rule:
          - Instructors can mark attendance for a lecture on that lecture's day and up to 24 hours after the lecture start.
          - Admins can bypass this restriction (checked in view layer).
        """
        start_dt = lecture.get_start_datetime()
        end_dt = start_dt + timezone.timedelta(hours=24)
        return start_dt, end_dt

    @classmethod
    def can_mark_now(cls, lecture, now=None):
        """
        Check if marking is allowed right now for instructors.
        Returns True if now is within [start_dt, start_dt + 24h] or on same day before start (we also allow marking starting 24h before start per your earlier note).
        Business: we allowed "today's lecture and 24 hours before" — so we allow marking from start_dt - 24h up to start_dt + 24h,
        but frontend will block future marking (future meaning start_dt > now). We must prevent marking for future lectures.
        Implementation: allow if now >= start_dt - 24h and now <= start_dt + 24h and start_dt <= now (i.e., not start in future).
        To follow your final decision: **no marking in future**. So:
        only allow if now >= start_dt - 24h and now <= start_dt + 24h and now >= start_dt.date() start? Simpler check below.
        """
        if now is None:
            now = timezone.now()
        start_dt = lecture.get_start_datetime()
        window_start = start_dt - timezone.timedelta(hours=24)
        window_end = start_dt + timezone.timedelta(hours=24)
        # not allowed if start_dt is in future (we do not permit marking future lectures)
        if start_dt > now:
            return False
        # The view should call LectureAttendance.can_mark_now(lecture) and if False return 403 unless user is admin.
        return (now >= window_start) and (now <= window_end)

    def mark(self, present: bool, marked_by_user):
        """Helper to set present and rating requirement should be enforced by the caller before calling mark."""
        self.present = present
        self.marked_by = marked_by_user
        self.marked_at = timezone.now()
        # rating must be set by caller; we do not auto set rating here.
        self.save()
