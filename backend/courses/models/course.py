#!/usr/bin/env python3
''' Models for Course app'''
from datetime import timedelta
from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
# Create your models here.


# ---------------------------------------------------------------------
# Choices
# ---------------------------------------------------------------------

class SeasonChoices(models.TextChoices):
    """Enumeration for season_type status choices."""
    SUMMER_CAMP = 'summer_camp', _('Summer camp')
    SCHOOL = 'school',      _('School')
    RAMADAN = 'ramadan',     _('Ramadan')
    EID = 'eid',         _('Eid')
    OTHER = 'other',       _('Other')


class Weekday(models.IntegerChoices):
    """Enumeration for weekday choices."""
    SATURDAY = 0, _('Saturday')
    SUNDAY = 1, _('Sunday')
    MONDAY = 2, _('Monday')
    TUESDAY = 3, _('Tuesday')
    WEDNESDAY = 4, _('Wednesday')
    THURSDAY = 5, _('Thursday')
    FRIDAY = 6, _('Friday')


class Season(models.Model):
    """
    Season model
    """

    # consider adding a celery task to deactivate old seasons and activate new ones based on dates
    name = models.CharField(max_length=128)
    season_type = models.CharField(
        max_length=32, choices=SeasonChoices.choices)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # we could cache number of lectures and enrolled students

    class Meta:
        indexes = [
            models.Index(fields=['start_date'], name='season_start_date_idx'),
            models.Index(fields=['end_date'],   name='season_end_date_idx'),
        ]
        ordering = ['-start_date', 'name']

    def clean(self):
        # end_date is optional. If provided, it must be >= start_date.
        if self.end_date and self.end_date < self.start_date:
            raise ValidationError(
                _("End date must be on or after start date."))

    def __str__(self):
        end = self.end_date or 'open'
        return f"{self.name} ({self.start_date} → {end})"
# Model Tag


class Tag(models.Model):
    """
    Tags model
    """

    name = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

# Model Course


class Course(models.Model):
    """
    Course model
    """

    name = models.CharField(max_length=128)
    description = models.TextField(blank=True)

    start_date = models.DateField()
    # optional if you later drive off schedules/lectures
    end_date = models.DateField(null=True, blank=True)

    # compute this from Lectures or use it to compute lectures
    num_lectures = models.IntegerField(null=True, blank=True)
    capacity = models.IntegerField(validators=[MinValueValidator(1)])
    price = models.DecimalField(max_digits=10, decimal_places=2)
    enrolled_count = models.IntegerField(
        default=0, validators=[MinValueValidator(0)])
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    season = models.ForeignKey('courses.Season', on_delete=models.SET_NULL, null=True, blank=True,
                               related_name="courses")
    instructor = models.ForeignKey('users.Instructor', on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name="courses")
    tags = models.ManyToManyField(
        'courses.Tag', related_name="courses", blank=True)
    for_adults = models.BooleanField(default=True)
    min_age = models.PositiveSmallIntegerField(null=True, blank=True)
    max_age = models.PositiveSmallIntegerField(null=True, blank=True)

    slug = models.SlugField(max_length=150, blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=['instructor'], name='course_instructor_idx'),
            models.Index(fields=['season'],     name='course_season_idx'),
            models.Index(fields=['start_date'], name='course_start_date_idx'),
        ]
        ordering = ['-start_date', 'name']

    def clean(self):
        '''Validate the course before saving'''
        if self.end_date and self.end_date < self.start_date:
            raise ValidationError(
                _("End date must be on or after start date."))

        # Require either end_date or num_lectures
        if not self.end_date and not self.num_lectures:
            raise ValidationError(
                _("Either 'end_date' or 'num_lectures' must be provided."))

        # If bound to a season, the course window should be inside season (if season has an end)
        if self.season:
            if self.start_date < self.season.start_date:
                raise ValidationError(
                    _("Course start date cannot be before its season start date."))
            if self.season.end_date and self.end_date and self.end_date > self.season.end_date:
                raise ValidationError(
                    _("Course end date cannot be after its season end date."))

        # enrolled_count cannot exceed capacity
        if self.enrolled_count and self.enrolled_count > self.capacity:
            raise ValidationError(_("Enrolled count cannot exceed capacity."))

    def generate_lectures(self):
        ''' Generate lectures based on course schedules
        Only used if all the Course Schedules for a course are created before any lectures.
        '''
        from .lecture import Lecture
        course_start_date = self.start_date
        course_end_date = self.end_date if self.end_date else None
        course_number_of_lectures = self.num_lectures if self.num_lectures else None
        created_at, updated_at = self.created_at, self.updated_at
        if course_end_date and not course_number_of_lectures:
            count = 0
            current_date = course_start_date
            schedules = self.schedules.all()
            while current_date <= course_end_date:
                for schedule in schedules:
                    if current_date.weekday() == schedule.weekday:
                        Lecture.objects.create(
                            course=self,
                            day=current_date,
                            start_time=schedule.start_time,
                            end_time=schedule.end_time,
                            lecture_number=count + 1,
                            instructor=self.instructor,
                            created_at=created_at,
                            updated_at=updated_at,
                        )
                        count += 1
                current_date += timedelta(days=1)
            self.num_lectures = count
        elif course_number_of_lectures:
            count = 0
            current_date = course_start_date
            end_date = None
            schedules = self.schedules.all()
            while count < course_number_of_lectures:
                for schedule in schedules:
                    if current_date.weekday() == schedule.weekday and count < course_number_of_lectures:
                        Lecture.objects.create(
                            course=self,
                            day=current_date,
                            start_time=schedule.start_time,
                            end_time=schedule.end_time,
                            lecture_number=count + 1,
                            instructor=self.instructor,
                            created_at=created_at,
                            updated_at=updated_at,
                        )
                        end_date = current_date
                        count += 1
                current_date += timedelta(days=1)
            self.end_date = end_date


    def delete_lectures(self):
        """Delete all lectures generated for this course and reset lecture information."""
        from .lecture import Lecture

        # Delete all existing lectures for this course
        Lecture.objects.filter(course=self).delete()

        # Reset fields that depend on generated lectures
        self.num_lectures = None
        self.end_date = None

        # Save the course after cleanup
        self.save()

    def __str__(self):
        return f"{self.name}"


class CourseSchedule(models.Model):
    """
    Course Schedule mode
    """

    course = models.ForeignKey(
        'courses.Course', on_delete=models.CASCADE, related_name='schedules')
    weekday = models.PositiveSmallIntegerField(choices=Weekday.choices)
    start_time = models.TimeField()
    end_time = models.TimeField()

    def clean(self):
        '''Validate the course schedule.'''
        if self.end_time <= self.start_time:
            raise ValidationError(_("End time must be after start time."))

    class Meta:
        indexes = [
            models.Index(fields=['course'], name='course_schedule_course_idx'),
        ]
        ordering = ['course', 'weekday', 'start_time']

    def __str__(self):
        return f"{self.course} — {self.get_weekday_display()} {self.start_time}-{self.end_time}"
