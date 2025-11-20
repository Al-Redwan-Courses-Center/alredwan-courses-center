import datetime
from django.db import models
import uuid
from django.core.exceptions import ValidationError
from django.utils import timezone


class Status(models.TextChoices):
    """Enumeration for lecture status choices."""
    SCHEDULED = 'scheduled', 'Scheduled'
    COMPLETED = 'completed', 'Completed'
    CANCELLED = 'cancelled', 'Cancelled'


class Lecture(models.Model):
    """Model representing a lecture scheduled for a course."""

    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE,
                               related_name='lectures')  # protect course is perpenant
    day = models.DateField()  # override from course schedule
    # Optional override from course schedule
    start_time = models.TimeField(null=True, blank=True)
    # Optional override from course schedule
    end_time = models.TimeField(null=True, blank=True)
    lecture_number = models.IntegerField()
    instructor = models.ForeignKey('users.Instructor', null=True, blank=True,
                                   on_delete=models.SET_NULL, related_name='lectures')  # Can override course instructor
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.SCHEDULED)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Meta class for Lecture model."""
        constraints = [
            models.UniqueConstraint(
                fields=['course', 'lecture_number'], name='unique_course_lecture'),
        ]
        indexes = [
            models.Index(fields=['course'], name='lecture_course_index'),
            models.Index(fields=['scheduled_at'],
                         name='lecture_scheduled_at_index'),
            models.Index(fields=['course', 'lecture_number'],
                         name='lecture_course_lecture_index'),
        ]
        verbose_name = 'Lecture'
        verbose_name_plural = 'Lectures'

    def clean(self):
        """Validate lecture scheduling and time coherence."""
        if self.status == Status.SCHEDULED and self.scheduled_at and self.scheduled_at < timezone.now():  # cannot schedule in the past
            raise ValidationError("Scheduled lectures cannot be in the past.")
        if self.start_time and self.end_time and self.start_time >= self.end_time:  # start time must be before end time
            raise ValidationError("Start time must be before end time.")

    def update_status(self, new_status):
        """Update the lecture status with validation."""
        allowed_transitions = {
            # status can change from scheduled to completed or cancelled
            Status.SCHEDULED: [Status.COMPLETED, Status.CANCELLED],
            Status.COMPLETED: [],
            Status.CANCELLED: [],  # no transitions allowed from completed or cancelled
        }

        if new_status not in Status.values:
            # check if new status is valid
            raise ValidationError(f"Invalid status: {new_status}")
        if new_status not in allowed_transitions[self.status]:
            # check if transition is allowed
            raise ValidationError(
                f"Cannot transition from {self.status} to {new_status}")

        self.status = new_status
        self.save()

    def get_duration(self):
        """Calculate the duration of the lecture."""
        if self.start_time and self.end_time:
            duration = (datetime.combine(datetime.date.today(), self.end_time) -
                        datetime.combine(datetime.date.today(), self.start_time))
            return duration.total_seconds() / 3600  # return duration in hours
        return None

    def update_scheduled_time(self, new_scheduled_at, start_time=None, end_time=None):
        """Update the scheduled time of the lecture with validation."""
        if new_scheduled_at < timezone.now():
            raise ValidationError("Cannot reschedule to a past time.")
        if start_time:
            self.start_time = start_time
        if end_time:
            self.end_time = end_time
        self.scheduled_at = new_scheduled_at
        self.save()

    def save(self, *args, **kwargs):
        """Clean before saving."""
        self.clean()  # Validate before saving
        super().save(*args, **kwargs)

    # Function for auto-generating
    def __str__(self):
        """String representation of the Lecture."""
        return f"Lecture {self.lecture_number} for {self.course} at {self.scheduled_at}"
