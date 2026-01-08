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
