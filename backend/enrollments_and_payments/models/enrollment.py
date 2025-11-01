from django.db import models
import uuid
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db.models import Q


class EnrollmentStatus(models.TextChoices):
    """Enumeration for enrollment status choices."""
    ACTIVE = 'active', 'Active'  # Current enrollment in progress
    COMPLETED = 'completed', 'Completed'  # Enrollment finished successfully
    DROPPED = 'dropped', 'Dropped'  # Enrollment cancelled or dropped
    SUSPENDED = 'suspended', 'Suspended'  # Enrollment temporarily paused


class PaymentMethod(models.TextChoices):
    """Enumeration for payment method choices."""
    CASH = 'cash', 'Cash'  # Payment in cash at the center
    CARD = 'card', 'Card'  # Credit/debit card payment
    BANK_TRANSFER = 'bank_transfer', 'Bank Transfer'  # Bank wire transfer
    INSTAPAY = 'instapay', 'Instapay'  # Instapay service
    VODAFONE_CASH = 'vodafone_cash', 'Vodafone Cash'  # Vodafone cash service
    OTHER = 'other', 'Other'  # Other payment methods


class Enrollment(models.Model):
    """Model representing an active enrollment."""
    
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE)  # The course being enrolled in
    student = models.ForeignKey('users.StudentUser', null=True, blank=True, on_delete=models.CASCADE)  
    child = models.ForeignKey('users.Child', null=True, blank=True, on_delete=models.CASCADE)  
    status = models.CharField(max_length=10, choices=EnrollmentStatus.choices, default=EnrollmentStatus.ACTIVE)  # Current status of the enrollment
    amount = models.DecimalField(max_digits=10, decimal_places=2)  # could take from the enrolment request
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.CASH)  # Method used for payment
    reference_number = models.CharField(max_length=100, null=True, blank=True)  # Optional transaction reference for ex BANK_TRANSFER
    transaction_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)  # Unique transaction identifier auto created
    notes = models.TextField(null=True, blank=True)  # Notes on payment, refunds, etc.
    processed_by = models.ForeignKey('users.User', on_delete=models.SET_NULL)  # Admin who processed the enrollment
    created_at = models.DateTimeField(auto_now_add=True)  # Timestamp when enrollment was created
    updated_at = models.DateTimeField(auto_now=True)  # Timestamp when enrollment was last updated

    class Meta:
        """Meta class for Enrollment model."""
        constraints = [
            # Ensure either child or student is set, but not both
            models.CheckConstraint(
                check=Q(child__isnull=False, student__isnull=True) | Q(child__isnull=True, student__isnull=False),
                name='child_or_student_enrollment'  
            ),

            models.UniqueConstraint(fields=['course', 'child'], name='unique_course_child_enrollment'),  # Prevent duplicate enrollments for child
            models.UniqueConstraint(fields=['course', 'student'], name='unique_course_student_enrollment'),  # Prevent duplicate enrollments for student
        ]

        indexes = [
            models.Index(fields=['course'], name='enrollment_course_index'),  
            models.Index(fields=['student'], name='enrollment_student_index'),  
            models.Index(fields=['child'], name='enrollment_child_index'),  
        ]

        verbose_name = 'Enrollment'  
        verbose_name_plural = 'Enrollments'  

    def clean(self):
        """Validate enrollment constraints."""
        # Ensure only one of child or student is set
        if (self.child is None and self.student is None) or (self.child is not None and self.student is not None):
            raise ValidationError("Must specify exactly one of child or student.")

    def __str__(self):
        """String representation of the Enrollment."""
        # Determine the participant based on child or student
        participant = self.student if self.student else self.child or 'Unknown'
        return f"Enrollment for {participant} in {self.course}"