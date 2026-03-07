#!/usr/bin/env python3
"""Model representing a lecture scheduled for a course."""
import datetime
from django.db import models, transaction
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class LectureStatus(models.TextChoices):
    """Enumeration for lecture status choices."""
    SCHEDULED = 'scheduled', _('مجدولة')
    COMPLETED = 'completed', _('مكتملة')
    CANCELLED = 'cancelled', _('ملغاة')
    ADDITIONAL = 'additional', _('اضافية')


class Lecture(models.Model):
    """Model representing a lecture scheduled for a course."""

    title = models.CharField(max_length=255, blank=True)
    course = models.ForeignKey(
        'courses.Course', verbose_name="الدورة", on_delete=models.CASCADE, related_name='lectures')
    # date of lecture (local date in Africa/Cairo)
    day = models.DateField(verbose_name=_("تاريخ المحاضرة"))
    start_time = models.TimeField(null=True, blank=True, verbose_name=_("وقت البدء"))
    end_time = models.TimeField(null=True, blank=True, verbose_name=_("وقت الانتهاء"))
    lecture_number = models.PositiveIntegerField(verbose_name=_("رقم المحاضرة"))
    instructor = models.ForeignKey('users.Instructor', null=True, blank=True,
                                   on_delete=models.SET_NULL, related_name='lectures', verbose_name=_("المعلم"))
    status = models.CharField(
        max_length=10, choices=LectureStatus.choices, default=LectureStatus.SCHEDULED, verbose_name=_("حالة المحاضرة"))
    is_accepted = models.BooleanField(default=True, verbose_name=_("هل تم قبول المحاضرة"))
    created_at = models.DateTimeField(
        auto_now_add=True, verbose_name=("تاريخ الإنشاء"))
    updated_at = models.DateTimeField(auto_now=True)

    attendance_taken = models.BooleanField(
        default=False, verbose_name=_("هل تم أخذ الحضور"))

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['course', 'lecture_number'], name='unique_course_lecture'),
        ]
        indexes = [
            models.Index(fields=['course'], name='lecture_course_index'),
            models.Index(fields=['day'], name='lecture_day_index'),
            models.Index(fields=['course', 'lecture_number'],
                         name='lecture_course_lecture_index'),
            models.Index(fields=['course', 'is_accepted'], name='lecture_course_accepted_index'),
        ]
        verbose_name = _("محاضرة")
        verbose_name_plural = _("المحاضرات")

    def __str__(self):
        return f"{self.title or f'محاضرة {self.lecture_number}'} — {self.course} @ {self.day}"

    def clean(self):
        """Validate lecture scheduling and time coherence."""
        # Validate lecture_number
        if self.lecture_number <= 0:
            raise ValidationError(_("رقم المحاضرة يجب أن يكون عددًا صحيحًا موجبًا."))

        # Validate times
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValidationError(_("وقت البداية يجب أن يكون قبل وقت النهاية."))
        
        # NOTE: Past-date validation is NOT enforced at the model level.
        # This allows admins to:
        #   - Backdate lectures for record-keeping
        #   - Import historical data
        #   - Create makeup lectures in the past
        # The API layer should enforce past-date restrictions for non-admin users.

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
            LectureStatus.ADDITIONAL: [LectureStatus.COMPLETED, LectureStatus.CANCELLED],
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

    @classmethod
    def create_instructor_lecture(cls, course, lecture_number, day, start_time=None, end_time=None, 
                                   instructor=None, title=''):
        """
        Create a new lecture by an instructor (additional lecture).
        Default status is ADDITIONAL and is_accepted is False.
        
        Args:
            course: Course instance
            lecture_number: The lecture number to assign
            day: Date of the lecture
            start_time: Optional start time
            end_time: Optional end time
            instructor: Optional instructor (defaults to course instructor)
            title: Optional lecture title
            
        Returns:
            Lecture instance
        """
        if instructor is None:
            instructor = course.instructor
        
        lecture = cls(
            course=course,
            lecture_number=lecture_number,
            day=day,
            start_time=start_time,
            end_time=end_time,
            instructor=instructor,
            title=title or f"Lecture {lecture_number}",
            status=LectureStatus.ADDITIONAL,
            is_accepted=False
        )
        lecture.save()
        return lecture

    @classmethod
    @transaction.atomic
    def add_lecture_by_datetime(cls, course, day, start_time=None, end_time=None, 
                                instructor=None, title='', status=None, is_accepted=False):
        """
        Add a new lecture by date and time, automatically calculating the lecture number.
        
        The lecture number is determined by the chronological order of lectures.
        If a lecture already exists at the same date+time, raises ValidationError.
        If the new lecture falls between existing lectures, subsequent lectures are renumbered.
        
        Args:
            course: Course instance
            day: Date of the lecture
            start_time: Start time (if None, uses midnight for comparison)
            end_time: Optional end time
            instructor: Optional instructor (defaults to course instructor)
            title: Optional lecture title
            status: Lecture status (defaults to ADDITIONAL for instructor-created lectures)
            is_accepted: Whether the lecture is accepted (defaults to False for instructor-created)
            
        Returns:
            Lecture instance
            
        Raises:
            ValidationError: If a lecture already exists at the same date+time
        """
        if instructor is None:
            instructor = course.instructor
        
        if status is None:
            status = LectureStatus.ADDITIONAL
        
        # Check for duplicate date+time (only for accepted lectures)
        existing_at_datetime = cls.objects.filter(
            course=course,
            day=day,
            start_time=start_time,
            is_accepted=True
        ).first()
        
        if existing_at_datetime:
            raise ValidationError(
                f"A lecture already exists on {day} at {start_time or 'midnight'}. "
                "Cannot create duplicate lectures at the same date and time."
            )
        
        # Get all accepted lectures ordered by day and start_time
        existing_lectures = list(cls.objects.filter(
            course=course,
            is_accepted=True
        ).order_by('day', 'start_time'))
        
        # Determine the position where this lecture should be inserted
        # Create datetime for comparison (use midnight if no start_time)
        new_lecture_dt = timezone.make_aware(
            datetime.datetime.combine(day, start_time or datetime.time.min),
            timezone.get_current_timezone()
        )
        
        insert_position = None
        for idx, lecture in enumerate(existing_lectures):
            lecture_dt = lecture.get_start_datetime()
            if new_lecture_dt < lecture_dt:
                insert_position = idx
                break
        
        # If no position found, append at the end
        if insert_position is None:
            target_number = len(existing_lectures) + 1
        else:
            target_number = insert_position + 1
            
            # Shift all lectures from insert_position onwards
            lectures_to_shift = cls.objects.filter(
                course=course,
                lecture_number__gte=target_number,
                is_accepted=True
            ).select_for_update().order_by('-lecture_number')
            
            # First pass: Move to temporary numbers
            temp_offset = 1000000
            temp_mapping = {}
            for lecture in lectures_to_shift:
                temp_number = temp_offset + lecture.lecture_number
                temp_mapping[temp_number] = lecture.lecture_number
                lecture.lecture_number = temp_number
                lecture.save(update_fields=['lecture_number', 'updated_at'])
            
            # Second pass: Move to final positions
            for lecture in cls.objects.filter(
                course=course,
                lecture_number__gte=temp_offset
            ).order_by('lecture_number'):
                original_number = temp_mapping[lecture.lecture_number]
                lecture.lecture_number = original_number + 1
                lecture.save(update_fields=['lecture_number', 'updated_at'])
        
        # Update course end_date if necessary
        if course.end_date and day > course.end_date:
            course.end_date = day
            course.save(update_fields=['end_date', 'updated_at'])
        
        # Create the new lecture
        new_lecture = cls(
            course=course,
            lecture_number=target_number,
            day=day,
            start_time=start_time,
            end_time=end_time,
            instructor=instructor,
            title=title or f"Lecture {target_number}",
            status=status,
            is_accepted=is_accepted
        )
        new_lecture.save()
        
        return new_lecture

    @classmethod
    @transaction.atomic
    def add_lecture_with_shift(cls, course, lecture_data):
        """
        Add a new lecture and shift subsequent lectures if necessary.
        
        If the lecture_number already exists, this will:
        1. Insert the new lecture at that number
        2. Increment all subsequent lecture numbers by 1
        3. Update course end_date if the lecture date exceeds current end_date
        
        Args:
            course: Course instance
            lecture_data: Dictionary with lecture fields (lecture_number, day, start_time, etc.)
            
        Returns:
            Lecture instance
        """
        target_number = lecture_data['lecture_number']
        lecture_day = lecture_data.get('day')
        
        # Check if lecture with this number exists (including unaccepted lectures)
        existing_lecture = cls.objects.filter(
            course=course,
            lecture_number=target_number
        ).first()
        
        if existing_lecture:
            # Get all lectures with number >= target_number, ordered by number descending
            # This prevents unique constraint violations by updating in reverse order
            lectures_to_shift = cls.objects.filter(
                course=course,
                lecture_number__gte=target_number
            ).select_for_update().order_by('-lecture_number')
            
            # First pass: Move all lectures to temporary large positive numbers to avoid conflicts
            # Using numbers starting from 1000000 to avoid conflicts with actual lecture numbers
            temp_offset = 1000000
            temp_mapping = {}
            for idx, lecture in enumerate(lectures_to_shift):
                temp_number = temp_offset + lecture.lecture_number
                temp_mapping[temp_number] = lecture.lecture_number
                lecture.lecture_number = temp_number
                lecture.save(update_fields=['lecture_number', 'updated_at'])
            
            # Second pass: Move from temporary to final positions
            for lecture in cls.objects.filter(
                course=course,
                lecture_number__gte=temp_offset
            ).order_by('lecture_number'):
                original_number = temp_mapping[lecture.lecture_number]
                lecture.lecture_number = original_number + 1
                lecture.save(update_fields=['lecture_number', 'updated_at'])
        
        # Always check if the new lecture date exceeds the course end_date
        # Update course end_date if necessary
        if lecture_day and course.end_date and lecture_day > course.end_date:
            course.end_date = lecture_day
            course.save(update_fields=['end_date', 'updated_at'])
        
        # Create the new lecture
        new_lecture = cls(
            course=course,
            lecture_number=target_number,
            day=lecture_data['day'],
            start_time=lecture_data.get('start_time'),
            end_time=lecture_data.get('end_time'),
            instructor=lecture_data.get('instructor') or course.instructor,
            title=lecture_data.get('title', f"Lecture {target_number}"),
            status=lecture_data.get('status', LectureStatus.SCHEDULED),
            is_accepted=lecture_data.get('is_accepted', True)
        )
        new_lecture.save()
        
        return new_lecture
