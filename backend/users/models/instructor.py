
from django.utils import timezone
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

from core.utils.image_utils import validate_image_size
from django.utils.translation import gettext_lazy as _
from .user import CustomUser
# Create your models here.
'''
Module for Instructor model that represents an instructor user profile
'''


def nid_upload_path(instance, filename):
    return f"instructors/{instance.user.id}/nid/{filename}"


def instructor_upload_path(instance, filename):
    return f"instructors/{instance.id}/{filename}"


class Instructor(models.Model):
    '''
    Instructor model that represents an instructor or supervisor user
    '''
    class InstructorType(models.TextChoices):
        SUPERVISOR = "supervisor", _("Supervisor")
        NORMAL = "normal", _("Normal / External")

    user = models.OneToOneField(
        'users.CustomUser', on_delete=models.CASCADE, related_name='instructor_profile')
    bio = models.TextField(null=True, blank=True)
    monthly_salary = models.DecimalField(max_digits=10, decimal_places=2)

    nid_front = models.ImageField(
        upload_to=nid_upload_path,
        validators=[validate_image_size],
        blank=True,
        null=True,
    )
    nid_back = models.ImageField(
        upload_to=nid_upload_path,
        validators=[validate_image_size],
        blank=True,
        null=True,
    )
    image = models.ImageField(
        upload_to=instructor_upload_path,
        validators=[validate_image_size],
        default="defaults/user_default.png",
        blank=True,
        null=True,
    )
    joined_date = models.DateField(auto_now_add=True)

    type = models.CharField(
        max_length=20,
        choices=InstructorType.choices,
        default=InstructorType.NORMAL,
    )

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.type})"


class Weekday(models.IntegerChoices):
    SATURDAY = 0, _("Saturday")
    SUNDAY = 1, _("Sunday")
    MONDAY = 2, _("Monday")
    TUESDAY = 3, _("Tuesday")
    WEDNESDAY = 4, _("Wednesday")
    THURSDAY = 5, _("Thursday")
    FRIDAY = 6, _("Friday")


class SupervisorSchedule(models.Model):
    instructor = models.ForeignKey(
        "users.Instructor",
        on_delete=models.CASCADE,
        related_name="supervisor_schedules"
    )
    day_of_week = models.PositiveSmallIntegerField(choices=Weekday.choices)
    start_time = models.TimeField()
    end_time = models.TimeField()

    class Meta:
        unique_together = ("instructor", "day_of_week")
        verbose_name = "instructor Schedule"
        verbose_name_plural = "instructor Schedules"

    def __str__(self):
        return f"{self.instructor} — {self.get_day_of_week_display()} {self.start_time}-{self.end_time}"


class InstructorAttendance(models.Model):
    """Track attendance and rating of instructors (check-in/check-out)."""

    class Status(models.TextChoices):
        PENDING = "pending", _("Pending")
        PRESENT = "present", _("Present")
        ABSENT = "absent", _("Absent")
        LATE = "late", _("Late")

    instructor = models.ForeignKey(
        "Instructor", on_delete=models.CASCADE, related_name="attendance_records"
    )
    date = models.DateField()
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)
    schedule = models.ForeignKey(
        SupervisorSchedule,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="attendance_records",
        help_text=_("Linked schedule if this instructor is a supervisor."),
    )
    course = models.ForeignKey(
        "Course",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="instructor_attendance_records",
        help_text=_("Linked course if this instructor teaches on this day."),
    )

    season = models.ForeignKey(
        "Season",
        on_delete=models.CASCADE,
        related_name="instructor_attendance",
    )
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PENDING
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        null=True,
        blank=True,
    )

    rated_by = models.ForeignKey(
        "CustomUser",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="given_instructor_ratings",
        help_text=_("The admin who rated or updated this attendance."),
    )
    notes = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Instructor Attendance"
        verbose_name_plural = "Instructor Attendance Records"
        unique_together = ("instructor", "date")
        indexes = [
            models.Index(fields=["instructor", "date"]),
            models.Index(fields=["season"]),
        ]

    def __str__(self):
        return f"{self.instructor} - {self.rating}/10 on {self.date}"

    def mark_checked_in(self):
        """Mark the instructor as checked in for the day."""
        self.status = self.Status.PRESENT
        self.check_in = timezone.now().time()
        self.save()

    def mark_absent(self):
        """Mark the instructor as absent for the day."""
        self.status = self.Status.ABSENT
        self.save()

    def rate(self, value: int, admin_user: CustomUser, notes: str = None):
        """
        Rate the instructor (only once per day by one admin).
        If another admin tries, only update is allowed depending on role/permissions.
        """
        self.rating = value
        self.rated_by = admin_user
        self.notes = notes

        self.save()

    @classmethod
    def generate_for_season(cls, season):
        """
        Generates attendance records for all instructors based on their type:
        - Supervisors: From their weekly schedules
        - Normal instructors: Based on their course dates
        """
        from datetime import timedelta
        # from courses.models import Course  # local import

        start, end = season.start_date, season.end_date

        # Supervisors
        for supervisor in Instructor.objects.filter(type="supervisor"):
            for schedule in supervisor.supervisor_schedules.all():
                current_date = start
                while current_date <= end:
                    if current_date.weekday() == schedule.day_of_week:
                        cls.objects.get_or_create(
                            instructor=supervisor,
                            date=current_date,
                            season=season,
                            defaults={"schedule": schedule,
                                      "status": cls.Status.PENDING},
                        )
                    current_date += timedelta(days=1)

        # Normal instructors

        # when course is done, import it
        for course in Course.objects.filter(season=season):
            for lecture in getattr(course, "lectures", []).all():
                cls.objects.get_or_create(
                    instructor=lecture.instructor,
                    date=lecture.date,
                    season=season,
                    defaults={"course": course, "status": cls.Status.PENDING},
                )
# add ratings here, and figure out the rating system
