from django.db import models
import uuid
from django.core.exceptions import ValidationError

class Status(models.TextChoices): 
    """Enumeration for enrollment status choices."""

    ACTIVE = 'active', 'Active' # default status when enrollment is approved
    COMPLETED = 'completed', 'Completed' # when the course is finished
    DROPPED = 'dropped', 'Dropped' # when the enrollment is cancelled
    SUSPENDED = 'suspended', 'Suspended' # when the enrollment is temporarily paused


class Enrollment(models.Model):
    """Model representing an enrollment of a student or child in a course."""
    
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE, related_name='enrollments') 
    student = models.ForeignKey('student_users.StudentUser', null=True, blank=True, on_delete=models.CASCADE, related_name='enrollments') 
    child = models.ForeignKey('children.Child', null=True, blank=True, on_delete=models.CASCADE, related_name='enrollments')
    payment = models.OneToOneField('payments.Payment', null=True, blank=True, on_delete=models.SET_NULL, related_name='enrollment') 
    processed_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, related_name='created_enrollments') # connected to admin who approved the enrollment
    notes = models.TextField(null=True, blank=True)
    enrolled_at = models.DateTimeField() # date time when he wanted to enroll from pending enrollment to active enrollment
    status = models.CharField(max_length=10, choices=Status.choices, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    
    class Meta:
        """meta class for Enrollment model."""
        
        """"Ensure either child or student is set, but not both or neither."""
        constraints = [
            models.CheckConstraint(
                check=
                models.Q(child__isnull=False, student__isnull=True) | 
                models.Q(child__isnull=True, student__isnull=False),
                name='one_child_or_student'
            ),
            # unique constraint to prevent duplicate enrollments for the same course and child/student
            models.UniqueConstraint(fields=['course', 'child'], name='unique_course_child'), 
            models.UniqueConstraint(fields=['course', 'student'], name='unique_course_student'),
        ]

        indexes = [
            models.Index(fields=['course'], name='course_index'),
            models.Index(fields=['student'], name='student_index'),
            models.Index(fields=['child'], name='child_index'),
        ]
    
        verbose_name = 'Enrollment'
        verbose_name_plural = 'Enrollments'
 

    def update_status(self, new_status):
        """Update the enrollment status with validation and related actions"""
        from django.core.exceptions import ValidationError

        allowed_transitions = {
            Status.ACTIVE: [Status.COMPLETED, Status.DROPPED, Status.SUSPENDED],
            Status.COMPLETED: [], 
            Status.DROPPED: [], # rejected
            Status.SUSPENDED: [Status.ACTIVE],
        }

        if new_status not in Status.values:
            raise ValidationError(f"Invalid status: {new_status}")

        if new_status not in allowed_transitions[self.status]:
            raise ValidationError(f"Cannot transition from {self.status} to {new_status}")

        self.status = new_status
        self.active = new_status == Status.ACTIVE
        self.save()
            
    def clean(self):
        """Ensure either child or student is set, but not both or neither."""

        if (self.child is None and self.student is None) or (self.child is not None and self.student is not None):
            raise ValidationError("Select exactly one of student or child.")
        
    def save(self, *args, **kwargs):
        """clean before saving."""
        self.clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        """String representation of the Enrollment."""
        participant = self.student if self.student else self.child or 'Unknown'
        return f"Enrollment for {participant} in {self.course}"
    
