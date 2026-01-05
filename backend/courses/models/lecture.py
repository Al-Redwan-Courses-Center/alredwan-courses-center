#!/usr/bin/env python3
"""Model representing a lecture scheduled for a course."""
import datetime
from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class LectureStatus(models.TextChoices):
    """Enumeration for lecture status choices."""
    SCHEDULED = 'scheduled', _('Scheduled')
    COMPLETED = 'completed', _('Completed')
    CANCELLED = 'cancelled', _('Cancelled')


class Lecture(models.Model):
    """Model representing a lecture scheduled for a course."""

    title = models.CharField(max_length=255, blank=True, verbose_name=_("Title"))
    course = models.ForeignKey(
        'courses.Course', on_delete=models.CASCADE, related_name='lectures', verbose_name=_("Course"))
    day = models.DateField(verbose_name=_("Day"))  # date of lecture (local date in Africa/Cairo)
    start_time = models.TimeField(null=True, blank=True, verbose_name=_("Start time"))
    end_time = models.TimeField(null=True, blank=True, verbose_name=_("End time"))
    lecture_number = models.PositiveIntegerField(verbose_name=_("Lecture number"))
    instructor = models.ForeignKey('users.Instructor', null=True, blank=True,
                                   on_delete=models.SET_NULL, related_name='lectures', verbose_name=_("Instructor"))
    status = models.CharField(
        max_length=10, choices=LectureStatus.choices, default=LectureStatus.SCHEDULED, verbose_name=_("Status"))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Created at"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("Updated at"))

    attendance_taken = models.BooleanField(default=False, verbose_name=_("Attendance taken"))

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['course', 'lecture_number'], name='unique_course_lecture'),
        ]
        indexes = [
            models.Index(fields=['course'], name='lecture_course_index'),
            models.Index(fields=['day'], name='lecture_day_index'),
            models.Index(fields=['course', 'lecture_number'],
                         name='lecture_course_lecture_index')
        ]
        verbose_name = _("محاضرة")
        verbose_name_plural = _("المحاضرات")

    def __str__(self):
        return f"{self.title or f'Lecture {self.lecture_number}'} — {self.course} @ {self.day}"

    def clean(self):
        """Validate lecture scheduling and time coherence."""
        # Validate lecture_number
        if self.lecture_number <= 0:
            raise ValidationError("Lecture number must be a positive integer.")

        # Validate times
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValidationError("Start time must be before end time.")

        # For scheduled lectures, prevent scheduling in the past
        if self.status == LectureStatus.SCHEDULED:
            # combine day + start_time into datetime if start_time exists, else compare dates
            now = timezone.now()
            if self.start_time:
                start_dt = timezone.make_aware(datetime.datetime.combine(
                    self.day, self.start_time), timezone.get_current_timezone())
                if start_dt < now:
                    raise ValidationError(
                        "Scheduled lectures cannot be in the past.")
            else:
                # compare date only (no time)
                if self.day < now.date():
                    raise ValidationError(
                        "Scheduled lectures cannot be in the past.")

    def delete(self, using=None, keep_parents=False):
        """Prevent deletion if attendance has been taken."""
        if self.attendance_taken:
            raise ValidationError(
                "Cannot delete lecture with taken attendance.")
        return super().delete(using=using, keep_parents=keep_parents)

    def get_start_datetime(self):
        """Return timezone-aware start datetime for this lecture (best-effort)."""
        if self.start_time:
            return timezone.make_aware(datetime.datetime.combine(self.day, self.start_time), timezone.get_current_timezone())
        # fallback: start of the day
        return timezone.make_aware(datetime.datetime.combine(self.day, datetime.time.min), timezone.get_current_timezone())

    def get_end_datetime(self):
        """Return timezone-aware end datetime for this lecture (best-effort)."""
        if self.end_time:
            return timezone.make_aware(datetime.datetime.combine(self.day, self.end_time), timezone.get_current_timezone())
        # fallback: end of the day
        return timezone.make_aware(datetime.datetime.combine(self.day, datetime.time.max), timezone.get_current_timezone())

    def update_status(self, new_status):
        """Update the lecture status with validation."""
        allowed_transitions = {
            LectureStatus.SCHEDULED: [LectureStatus.COMPLETED, LectureStatus.CANCELLED],
            LectureStatus.COMPLETED: [],
            LectureStatus.CANCELLED: [],
        }
        if new_status not in LectureStatus.values:
            raise ValidationError(f"Invalid status: {new_status}")
        if new_status not in allowed_transitions[self.status]:
            raise ValidationError(
                f"Cannot transition from {self.status} to {new_status}")
        self.status = new_status
        self.save()

    def save(self, *args, **kwargs):
        """Clean before saving; also auto-set title if empty."""
        self.clean()
        if not self.title:
            self.title = f"Lecture {self.lecture_number}"
        super().save(*args, **kwargs)

    def duration_hours(self):
        """Return duration in hours (float) or None."""
        if self.start_time and self.end_time:
            start_dt = datetime.datetime.combine(
                datetime.date.today(), self.start_time)
            end_dt = datetime.datetime.combine(
                datetime.date.today(), self.end_time)
            return (end_dt - start_dt).total_seconds() / 3600.0
        return None
