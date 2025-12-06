from django.db import models
import uuid
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db.models import Q

class RejectionReason(models.TextChoices):
    """Enumeration for rejection reason choices."""
    CAPACITY_FULL = 'capacity_full', 'Capacity Full'  # Rejected due to course being full
    INELIGIBLE = 'ineligible', 'Ineligible'  # Rejected due to ineligibility
    EXPIRED = 'expired', 'Expired'  # Rejected due to expiry
    PAYMENT_FAILED = 'payment_failed', 'Payment Failed'  # Rejected due to payment failure
    OTHER = 'other', 'Other'  # Other reasons

# Model for storing rejected enrollments for auditing
class RejectedEnrollment(models.Model):
    """Model representing a rejected enrollment."""
    
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE)  
    student = models.ForeignKey('users.StudentUser', null=True, blank=True, on_delete=models.CASCADE)  
    child = models.ForeignKey('users.Child', null=True, blank=True, on_delete=models.CASCADE)  
    parent = models.ForeignKey('users.Parent', null=True, blank=True, on_delete=models.CASCADE)  
    rejection_reason = models.CharField(max_length=20, choices=RejectionReason.choices, default=RejectionReason.OTHER)  
    notes = models.TextField(null=True, blank=True)  # Detailed notes on rejection
    processed_by = models.ForeignKey('users.User', null=True, blank=True, on_delete=models.SET_NULL)  # Optional, admin who rejected (null for auto)
    created_at = models.DateTimeField(auto_now_add=True)  # Timestamp when the enrollment was attempted

    class Meta:
        """Meta class for RejectedEnrollment model."""
        constraints = [
            # Ensure that either (parent and child) or (student) is provided, but not both
            models.CheckConstraint(
                check=(
                    (Q(parent__isnull=False) & Q(child__isnull=False) & Q(student__isnull=True)) |
                    (Q(parent__isnull=True) & Q(child__isnull=True) & Q(student__isnull=False))
                ),
                name='valid_participant_constraint'
            ),
        ]

        indexes = [
            models.Index(fields=['course'], name='rejected_course_index'),  
            models.Index(fields=['rejected_at'], name='rejected_at_index'),  
            models.Index(fields=['rejection_reason'], name='rejected_reason_index'), 
        ]

        verbose_name = 'Rejected Enrollment' 
        verbose_name_plural = 'Rejected Enrollments'  

    def __str__(self):
        """String representation of the RejectedEnrollment."""
        # Determine the participant based on student or child
        participant = self.student if self.student else self.child or 'Unknown'
        return f"Rejected Enrollment for {participant} in {self.course}"