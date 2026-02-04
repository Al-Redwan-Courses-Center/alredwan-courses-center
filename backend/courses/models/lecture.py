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
    @transaction.atomic
    def create_instructor_lecture(cls, course, day, start_time=None, end_time=None, 
                                   instructor=None, title=''):
        """
        Create a new lecture by an instructor (additional lecture).
        Automatically assigns lecture_number based on chronological order (DATE ONLY).
        Default status is ADDITIONAL and is_accepted is False.
        
        Args:
            course: Course instance
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
        
        # Create lecture with temporary lecture_number
        lecture = cls(
            course=course,
            lecture_number=9999,  # Temporary number
            day=day,
            start_time=start_time,
            end_time=end_time,
            instructor=instructor,
            title=title,
            status=cls.LectureStatus.ADDITIONAL,
            is_accepted=False
        )
        lecture.save()
        
        # Recalculate all lecture numbers for this course
        cls.recalculate_lecture_numbers(course)
        
        # Reload to get the correct lecture_number
        lecture.refresh_from_db()
        
        # Set default title if not provided
        if not lecture.title:
            lecture.title = f"Lecture {lecture.lecture_number}"
            lecture.save(update_fields=['title'])
        
        # Update course end_date if this lecture is after current end date
        if course.end_date and day > course.end_date:
            course.end_date = day
            course.save(update_fields=['end_date', 'updated_at'])
        
        return lecture

    @classmethod
    @transaction.atomic
    def recalculate_lecture_numbers(cls, course):
        """
        Recalculate lecture numbers for all accepted lectures in a course
        based on chronological order (DATE ONLY - time is ignored).
        
        Lectures on the same day are ordered by their creation time.
        
        Args:
            course: Course instance
        """
        # Get all accepted lectures ordered by day only (then by created_at for same-day lectures)
        lectures = cls.objects.filter(
            course=course,
            is_accepted=True
        ).select_for_update().order_by('day', 'created_at')
        
        # Reassign lecture numbers sequentially
        for index, lecture in enumerate(lectures, start=1):
            if lecture.lecture_number != index:
                lecture.lecture_number = index
                lecture.save(update_fields=['lecture_number', 'updated_at'])

    @classmethod
    def check_date_conflict(cls, course, day, start_time, end_time, exclude_id=None):
        """
        Check if there's a time conflict with existing lectures on the same day.
        
        Args:
            course: Course instance
            day: Date of the lecture
            start_time: Start time
            end_time: End time
            exclude_id: Lecture ID to exclude from check (for updates)
            
        Returns:
            Dictionary with conflict information
        """
        # Get all accepted lectures on the same day
        lectures_on_day = cls.objects.filter(
            course=course,
            day=day,
            is_accepted=True
        )
        
        if exclude_id:
            lectures_on_day = lectures_on_day.exclude(id=exclude_id)
        
        conflicts = []
        for lecture in lectures_on_day:
            # Check if times overlap (only if both lectures have times)
            if start_time and end_time and lecture.start_time and lecture.end_time:
                # Check for overlap: new lecture starts before existing ends AND new lecture ends after existing starts
                if start_time < lecture.end_time and end_time > lecture.start_time:
                    conflicts.append({
                        'id': str(lecture.id),
                        'lecture_number': lecture.lecture_number,
                        'start_time': lecture.start_time.strftime('%H:%M:%S'),
                        'end_time': lecture.end_time.strftime('%H:%M:%S'),
                        'title': lecture.title
                    })
        
        return {
            'has_conflict': len(conflicts) > 0,
            'conflicts': conflicts,
            'date': day.isoformat(),
            'total_lectures_on_day': lectures_on_day.count()
        }

    @classmethod
    def get_lecture_position_info(cls, course, day, start_time=None):
        """
        Get information about where a new lecture would be inserted
        based on chronological order (DATE ONLY - time is ignored).
        
        Args:
            course: Course instance
            day: Date of the lecture
            start_time: Start time (optional, not used for positioning)
            
        Returns:
            Dictionary with position information
        """
        # Get all accepted lectures ordered by date only
        all_lectures = cls.objects.filter(
            course=course,
            is_accepted=True
        ).order_by('day', 'created_at')
        
        # Count lectures before this date
        lectures_before = cls.objects.filter(
            course=course,
            is_accepted=True,
            day__lt=day
        ).count()
        
        projected_number = lectures_before + 1
        total_lectures = all_lectures.count()
        
        # Get surrounding lectures (by date only)
        prev_lecture = cls.objects.filter(
            course=course,
            is_accepted=True,
            day__lt=day
        ).order_by('-day', '-created_at').first()
        
        next_lecture = cls.objects.filter(
            course=course,
            is_accepted=True,
            day__gt=day
        ).order_by('day', 'created_at').first()
        
        return {
            'projected_lecture_number': projected_number,
            'total_lectures': total_lectures,
            'position': 'beginning' if projected_number == 1 else ('end' if projected_number > total_lectures else 'middle'),
            'previous_lecture': {
                'id': str(prev_lecture.id),
                'lecture_number': prev_lecture.lecture_number,
                'day': prev_lecture.day.isoformat(),
                'start_time': prev_lecture.start_time.strftime('%H:%M:%S') if prev_lecture.start_time else None,
                'title': prev_lecture.title
            } if prev_lecture else None,
            'next_lecture': {
                'id': str(next_lecture.id),
                'lecture_number': next_lecture.lecture_number,
                'day': next_lecture.day.isoformat(),
                'start_time': next_lecture.start_time.strftime('%H:%M:%S') if next_lecture.start_time else None,
                'title': next_lecture.title
            } if next_lecture else None
        }
