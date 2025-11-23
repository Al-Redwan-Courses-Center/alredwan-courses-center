
from django.forms import ValidationError
from django.utils import timezone
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

from core.utils.image_utils import validate_image_size
from django.utils.translation import gettext_lazy as _

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
        CustomUser, on_delete=models.CASCADE, related_name='instructor_profile')
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
        Instructor,
        on_delete=models.CASCADE,
        related_name="supervisor_schedules"
    )
    day_of_week = models.PositiveSmallIntegerField(choices=Weekday.choices)
    start_time = models.TimeField()
    end_time = models.TimeField()

    grace_period_minutes = models.PositiveIntegerField(default=20)
    auto_absent_after_minutes = models.PositiveIntegerField(default=60)

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
        "Instructor", on_delete=models.CASCADE, related_name="attendance_records"
    )
    date = models.DateField(default=timezone.localdate)
    check_in_time = models.DateTimeField(null=True, blank=True)
    check_out_time = models.DateTimeField(null=True, blank=True)

    check_in_method = models.CharField(
        max_length=20, null=True, blank=True
    )  # fingerprint, RFID, admin

    status = models.CharField(
        max_length=20,
        choices=AttendanceStatus.choices,
        default=AttendanceStatus.NOT_STARTED
    )
    schedule = models.ForeignKey(
        SupervisorSchedule,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="attendances",
        help_text=_("Linked schedule if this instructor is a supervisor."),
    )
    lecture = models.ForeignKey(
        Lecture, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='instructor_attendances'
    )

    check_in_device = models.ForeignKey(
        "attendance.AttendanceDevice", on_delete=models.SET_NULL,
        null=True, blank=True
    )
    season = models.ForeignKey(
        "courses.Season",
        on_delete=models.CASCADE,
        related_name="instructor_attendance",
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        null=True,
        blank=True,
        help_text=_("Rating of the instructor for the day (1-10)."),
        default=8
    )

    rated_by = models.ForeignKey(
        CustomUser,
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

    def mark_checked_out(self):
        self.check_out_time = timezone.now()
        self.save()

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
