from django.db import models
import uuid
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db.models import Q

class LectureAttendance(models.Model):
    """Model representing attendance records for a lecture."""
    
    lecture = models.ForeignKey('lectures.Lecture', on_delete=models.CASCADE, related_name='lecture_attendances')
    child = models.ForeignKey('users.Child', null=True, blank=True, on_delete=models.CASCADE, related_name='lecture_attendances')
    student = models.ForeignKey('users.StudentUser', null=True, blank=True, on_delete=models.CASCADE, related_name='lecture_attendances')
    present = models.BooleanField(null=True) # null = not marked yet # defalut is not attended
    rating = models.DecimalField(max_digits=4, decimal_places=2, null=True, default=7.5, 
                                 validators=[
                                    models.validators.MinValueValidator(1.00),
                                    models.validators.MaxValueValidator(10.00)
                                ]) # 1.00 to 10.00 # default 7.5
    notes = models.TextField(null=True, blank=True)
    marked_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='marked_lecture_attendances') 
    marked_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Meta class for LectureAttendance model."""
        constraints = [
            # Ensure either child or student is set, but not both
            models.CheckConstraint(
                check=Q(child__isnull=False, student__isnull=True) | Q(child__isnull=True, student__isnull=False),
                name='child_or_student'
            ),
            # Ensure rating is between 1.00 and 10.00 if not null
            models.CheckConstraint(
                check=Q(rating__gte=1.00, rating__lte=10.00) | Q(rating__isnull=True),
                name='lecture_attendance_rating_range'
            ),
        ]
        indexes = [
            models.Index(fields=['lecture'], name='attendance_lecture_index'),
            models.Index(fields=['child'], name='attendance_child_index'),
            models.Index(fields=['student'], name='attendance_student_index'),
        ]
        verbose_name = 'Lecture Attendance'
        verbose_name_plural = 'Lecture Attendances'

    def clean(self):
        """Validate attendance record constraints."""
        if (self.child is None and self.student is None) or (self.child is not None and self.student is not None): # exactly one of child or student must be set
            raise ValidationError("Must specify exactly one of child or student.")
        if (self.present is not None or self.rating is not None) and self.marked_at is None: # if present or rating is provided, marked_at must be set
            raise ValidationError("Marked at must be set if present or rating is provided.")
        if self.rating is not None and (self.rating < 1.00 or self.rating > 10.00): # rating must be between 1.00 and 10.00
            raise ValidationError("Rating must be between 1.00 and 10.00.")

    # wait for edit 
    def update_attendance(self, present_value, rating_value=None, notes_value=None, marked_by=None):
        """Update attendance record with validation."""
        if present_value is not None and not isinstance(present_value, bool): # present must be boolean
            raise ValidationError("Present must be a boolean value.")
        if rating_value is not None and (rating_value < 1.00 or rating_value > 10.00): # rating must be between 1.00 and 10.00
            raise ValidationError("Rating must be between 1.00 and 10.00.")
        
        self.present = present_value
        self.rating = rating_value
        self.notes = notes_value # if you want to update the notes or rating or present
        self.marked_by = marked_by # who update the attendance 
        # Update marked_at only if present is not null or rating is provided
        self.marked_at = timezone.now() if (present_value is not None or rating_value is not None) else self.marked_at
        self.save()

    def save(self, *args, **kwargs):
        """clean before saving."""
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        """String representation of the LectureAttendance."""
        participant = self.child.first_name if self.child else self.student.first_name if self.student else 'Unknown'
        return f"Attendance for {participant} in {self.lecture}"