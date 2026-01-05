#!/usr/bin/env python3
from django.forms import ValidationError
from django.utils import timezone
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.translation import gettext_lazy as _

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from core.utils.image_utils import validate_image_size

from courses.models.lecture import Lecture
from .user import CustomUser
# Create your models here.
'''
Module for Instructor model that represents an instructor user profile
'''


def nid_upload_path(instance, filename):
    """Generate file path for uploading NID images of an instructor."""
    return f"instructors/{instance.user.id}/nid/{filename}"


def instructor_upload_path(instance, filename):
    """Generate file path for uploading profile images of an instructor."""
    return f"instructors/{instance.id}/{filename}"


class Instructor(models.Model):
    '''
    Instructor model that represents an instructor or supervisor user
    '''
    class InstructorType(models.TextChoices):
        SUPERVISOR = "supervisor", _("Supervisor")
        NORMAL = "normal", _("Normal / External")

    user = models.OneToOneField(
        CustomUser, on_delete=models.CASCADE, related_name='instructor_profile',  verbose_name=_("User"))
    bio = models.TextField(null=True, blank=True,  verbose_name=_("Bio"))
    monthly_salary = models.DecimalField(max_digits=10, decimal_places=2,  verbose_name=_("Monthly salary"))

    nid_front = models.ImageField(
        upload_to=nid_upload_path,
        validators=[validate_image_size],
        blank=True,
        null=True,
        verbose_name=_("Nid front")
    )
    nid_back = models.ImageField(
        upload_to=nid_upload_path,
        validators=[validate_image_size],
        blank=True,
        null=True,
        verbose_name=_("Nid back")
    )
    image = models.ImageField(
        upload_to=instructor_upload_path,
        validators=[validate_image_size],
        default="defaults/user_default.png",
        blank=True,
        null=True,
        verbose_name=_("Image")
    )
    joined_date = models.DateField(auto_now_add=True,  verbose_name=_("Joined date"))

    type = models.CharField(
        max_length=20,
        choices=InstructorType.choices,
        default=InstructorType.NORMAL,
        verbose_name=_("Type")
    )

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.type})"
    class Meta:
        verbose_name = _("معلم")
        verbose_name_plural = _("المعلمون")

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
        Instructor,
        on_delete=models.CASCADE,
        related_name="supervisor_schedules",
        verbose_name = _("Course")
    )
    day_of_week = models.PositiveSmallIntegerField(choices=Weekday.choices,  verbose_name=_("Day of week"))
    start_time = models.TimeField(verbose_name=_("Start time"))
    end_time = models.TimeField(verbose_name=_("End time"))

    grace_period_minutes = models.PositiveIntegerField(default=20, verbose_name=_("Grace period minutes"))
    auto_absent_after_minutes = models.PositiveIntegerField(default=60, verbose_name=_("Auto absent after minutes"))

    class Meta:
        unique_together = ("instructor", "day_of_week")
        verbose_name = "instructor Schedule"
        verbose_name_plural = "instructor Schedules"

    def clean(self):
        """Ensure that end_time is after start_time."""
        if self.start_time >= self.end_time:
            raise ValidationError(
                {"end_time": _("End time must be after start time.")}
            )

    def __str__(self):
        return f"{self.instructor} — {self.get_day_of_week_display()} {self.start_time}-{self.end_time}"


class AttendanceStatus(models.TextChoices):
    PENDING = "pending", _("Pending")
    PRESENT = "present", _("Present")
    ABSENT = "absent", _("Absent")
    LATE = "late", _("Late")
    NOT_STARTED = 'not_started', _('Not Started')


class InstructorAttendance(models.Model):
    """Track attendance and rating of instructors (check-in/check-out)."""

    instructor = models.ForeignKey(
        "Instructor", on_delete=models.CASCADE, related_name="attendance_records", verbose_name=_("Instructor")
    )
    date = models.DateField(default=timezone.localdate, verbose_name=_("date"))
    check_in_time = models.DateTimeField(null=True, blank=True, verbose_name=_("Check in time"))
    check_out_time = models.DateTimeField(null=True, blank=True, verbose_name=_("Check out time"))

    check_in_method = models.CharField(
        max_length=20, null=True, blank=True, verbose_name=_("Check in method")
    )  # fingerprint, RFID, admin

    status = models.CharField(
        max_length=20,
        choices=AttendanceStatus.choices,
        default=AttendanceStatus.NOT_STARTED,
        verbose_name=_("Status")
    )
    schedule = models.ForeignKey(
        SupervisorSchedule,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="attendances",
        help_text=_("Linked schedule if this instructor is a supervisor."),
        verbose_name=_("Schedule")
    )
    lecture = models.ForeignKey(
        Lecture, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='instructor_attendances',
        verbose_name = _("Lecture")
    )

    check_in_device = models.ForeignKey(
        "attendance.AttendanceDevice", on_delete=models.SET_NULL,
        null=True, blank=True,
        verbose_name=_("Check in device")
    )
    season = models.ForeignKey(
        "courses.Season",
        on_delete=models.CASCADE,
        related_name="instructor_attendance",
        verbose_name=_("Season")
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        null=True,
        blank=True,
        help_text=_("Rating of the instructor for the day (1-10)."),
        default=8,
        verbose_name=_("Rating")
    )

    rated_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="given_instructor_ratings",
        help_text=_("The admin who rated or updated this attendance."),
        verbose_name=_("Rated by")
    )
    notes = models.TextField(blank=True, null=True, verbose_name=_("Notes"))

    class Meta:
        verbose_name = _("سجل حضور معلم")
        verbose_name_plural = _("سجلات حضور المعلمين")
        unique_together = ("instructor", "date")
        indexes = [
            models.Index(fields=["instructor", "date"]),
            models.Index(fields=["season"]),
        ]

    def __str__(self):
        return f"{self.instructor} - {self.rating}/10 on {self.date}"

    def broadcast_update(self):
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "attendance_live",
            {
                "type": "attendance_update",
                "data": {
                    "instructor": self.instructor.user.get_full_name(),
                    "id": self.id,
                    "time": str(self.check_in_time),
                    "status": self.status,
                    "date": str(self.date),
                },
            },
        )

    def mark_checked_in(self, device=None, method="fingerprint"):
        now = timezone.now()
        self.check_in_time = now
        self.check_in_device = device
        self.check_in_method = method

        if self.schedule:
            shift_start = timezone.make_aware(
                timezone.datetime.combine(self.date, self.schedule.start_time)
            )
            if now > shift_start + timezone.timedelta(
                minutes=self.schedule.grace_period_minutes
            ):
                self.status = AttendanceStatus.LATE
            else:
                self.status = AttendanceStatus.PRESENT
        else:
            # If no schedule linked → treat as present by default
            self.status = AttendanceStatus.PRESENT

        self.save()
        self.broadcast_update()

    def mark_checked_out(self):
        self.check_out_time = timezone.now()
        self.save()
        self.broadcast_update()

    def mark_absent(self):
        """Mark the instructor as absent for the day."""
        self.status = AttendanceStatus.ABSENT
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
    def generate_for_date_range(cls, start_date, end_date):
        """
        Generate attendance records for:
        - Supervisors based on their weekly schedules
        - Instructors assigned to lectures within the date range
        """
        from datetime import timedelta
        from courses.models import Lecture

        created_count = 0
        current_date = start_date

        while current_date <= end_date:

            # Supervisors: Generate based on weekly schedule
            weekday = current_date.weekday()
            for schedule in SupervisorSchedule.objects.filter(day_of_week=weekday):
                obj, created = cls.objects.get_or_create(
                    instructor=schedule.instructor,
                    date=current_date,
                    defaults={
                        "schedule": schedule,
                        "status": AttendanceStatus.NOT_STARTED
                    }
                )
                if created:
                    created_count += 1

            # Normal instructors: Assign based on lectures that date
            for lecture in Lecture.objects.filter(start_time__date=current_date):
                obj, created = cls.objects.get_or_create(
                    instructor=lecture.instructor,
                    date=current_date,
                    defaults={
                        "lecture": lecture,
                        "status": AttendanceStatus.NOT_STARTED
                    }
                )
                if created:
                    created_count += 1

            current_date += timedelta(days=1)

        return created_count

    @classmethod
    def generate_weekly(cls):
        today = timezone.localdate()
        start = today
        end = today + timezone.timedelta(days=7)
        return cls.generate_for_date_range(start, end)


'''
    @classmethod
    def generate_for_season(cls, season):
        """
        Generates attendance records for all instructors based on their type:
        - Supervisors: From their weekly schedules
        - Normal instructors: Based on their course dates
        """
        from datetime import timedelta
        from courses.models import Course

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
                                      "status": AttendanceStatus.PENDING},
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
'''
