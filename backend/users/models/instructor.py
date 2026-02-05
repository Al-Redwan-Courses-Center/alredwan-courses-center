#!/usr/bin/env python3
from cloudinary.models import CloudinaryField
from django.db import models
from django.utils.translation import gettext_lazy as _


from courses.models.lecture import Lecture
from .user import CustomUser
# Create your models here.
'''
Module for Instructor model that represents an instructor user profile
'''


class Instructor(models.Model):
    '''
    Instructor model that represents an instructor or supervisor user
    '''
    class InstructorType(models.TextChoices):
        SUPERVISOR = "supervisor", _("مشرف")
        NORMAL = "normal", _("عادي / خارجي")

    user = models.OneToOneField(
        CustomUser, on_delete=models.CASCADE, related_name='instructor_profile')
    bio = models.TextField(null=True, blank=True)
    monthly_salary = models.DecimalField(max_digits=10, decimal_places=2)

    # NID images - higher quality for document readability
    nid_front = CloudinaryField(
        'nid_front',
        blank=True,
        null=True,
        folder='instructors/nid',
        transformation={
            'width': 1200,
            'crop': 'limit',
            'quality': 'auto:good',  # Higher quality for documents
            'fetch_format': 'auto',
        },
    )
    nid_back = CloudinaryField(
        'nid_back',
        blank=True,
        null=True,
        folder='instructors/nid',
        transformation={
            'width': 1200,
            'crop': 'limit',
            'quality': 'auto:good',
            'fetch_format': 'auto',
        },
    )
    # Profile image - face-focused cropping
    image = CloudinaryField(
        'instructor_image',
        blank=True,
        null=True,
        folder='instructors/profiles',
        transformation={
            'width': 400,
            'height': 400,
            'crop': 'thumb',
            'gravity': 'face',  # Auto-detect and focus on face
            'quality': 'auto:good',
            'fetch_format': 'auto',
        },
    )
    joined_date = models.DateField(
        auto_now_add=True, verbose_name=_("تاريخ الانضمام"))

    type = models.CharField(
        max_length=20,
        choices=InstructorType.choices,
        default=InstructorType.NORMAL,
        verbose_name=_("نوع المعلم"),
    )
    tags = models.ManyToManyField(
        "courses.Tag",
        related_name="instructors",
        blank=True,
        verbose_name=_("الفئات"),
    )
    
    # Fingerprint device integration
    fingerprint_id = models.CharField(
        max_length=100,
        unique=True,
        null=True,
        blank=True,
        verbose_name=_("معرف البصمة"),
        help_text=_("المعرف الفريد المستخدم من جهاز البصمة لتحديد هذا المعلم")
    )
    
    def __str__(self):
        return f"{self.user.get_full_name()} ({self.get_type_display()})"

    class Meta:
        verbose_name = _("معلم")
        verbose_name_plural = _("المعلمون")


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
