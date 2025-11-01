from django.db import models
import uuid
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db.models import Q
from datetime import timedelta


class EnrollmentRequestStatus(models.TextChoices):
    """Enumeration for enrollment request status choices."""
    PENDING = 'pending', 'Pending'  # Initial state when request is created
    PROCESSING = 'processing', 'Processing'  # State when admin is reviewing or payment is being processed


class EnrollmentRequest(models.Model):
    """Model representing an enrollment request."""
    
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE)  # Link to the course being requested to enroll in
    parent = models.ForeignKey('users.Parent', null=True, blank=True, on_delete=models.CASCADE) 
    student = models.ForeignKey('users.StudentUser', null=True, blank=True, on_delete=models.CASCADE)  
    child = models.ForeignKey('users.Child', null=True, blank=True, on_delete=models.CASCADE)  
    price = models.DecimalField(max_digits=10, decimal_places=2)  # Price pulled from course at creation time
    status = models.CharField(max_length=10, choices=EnrollmentRequestStatus.choices, default=EnrollmentRequestStatus.PENDING)  # Current status of the request
    created_at = models.DateTimeField(auto_now_add=True)  # Timestamp when the request was created
    expires_at = models.DateTimeField(null=True, blank=True)  # Optional expiration date for auto-expiry # default after 7days
    notes = models.TextField(null=True, blank=True)  # Optional notes from user or admin

    class Meta:
        """Meta class for EnrollmentRequest model."""
        constraints = [
            # Ensure that either (parent and child) or (student) is provided, but not both
            models.CheckConstraint(
                check=(
                    (Q(parent__isnull=False) & Q(child__isnull=False) & Q(student__isnull=True)) |  
                    (Q(student__isnull=False) & Q(parent__isnull=True) & Q(child__isnull=True))  
                ),
                name='parent_child_or_student'  
            ),
            # ensure positive price
            models.CheckConstraint(
                check=Q(price__gt=0),
                name='positive_price'
            ),
            # ensure expires_at is in the future if set
            models.CheckConstraint(
                check=Q(expires_at__gt=timezone.now()) | Q(expires_at__isnull=True),
                name='valid_expires_at'
            ),

            models.UniqueConstraint(fields=['course', 'child'], name='unique_course_child_request'),  # Prevent duplicate requests for the same course and child
            models.UniqueConstraint(fields=['course', 'student'], name='unique_course_student_request'),  # Prevent duplicate requests for the same course and student
        ]

        indexes = [
            models.Index(fields=['course'], name='request_course_index'),
            models.Index(fields=['parent'], name='request_parent_index'),  
            models.Index(fields=['student'], name='request_student_index'),  
            models.Index(fields=['child'], name='request_child_index'),
            models.Index(fields=['expires_at'], name='request_expires_index'),  
        ]
        
        verbose_name = 'Enrollment Request'  
        verbose_name_plural = 'Enrollment Requests'  

    def clean(self):
        """Validate enrollment request constraints."""
        # Validate that the request is either for a parent and child or for a student alone
        if not ((self.parent is not None and self.child is not None and self.student is None) or 
                (self.student is not None and self.parent is None and self.child is None)):
            raise ValidationError("Select either a parent and child together or a student alone.")

    def save(self, *args, **kwargs):
        """Override save to set defaults and validate."""
        # Auto-set expires_at if not provided (7 days from creation)
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(days=7)
        # get price from course if not set
        if not self.price:
            self.price = self.course.price

        self.full_clean()
        super().save(*args, **kwargs)

    def get_participant(self):
        """Get the participant (child or student)."""
        return self.child if self.child else self.student

    def __str__(self):
        """String representation of the EnrollmentRequest."""
        # Determine the participant based on whether it's a student or child
        participant = self.student if self.student else self.child or 'Unknown'
        return f"Enrollment Request for {participant} in {self.course}"
