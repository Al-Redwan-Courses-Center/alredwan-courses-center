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
    REFUNDED = 'refunded', 'Refunded'  # Enrollment refunded


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

    # Refund tracking (critical for dropped enrollments)
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    refund_date = models.DateTimeField(null=True, blank=True)
    refund_method = models.CharField(max_length=20, choices=PaymentMethod.choices, null=True, blank=True)
    refund_reference = models.CharField(max_length=100, null=True, blank=True)

    # Timestamps
    enrolled_at = models.DateTimeField(default=timezone.now, db_index=True)  # Renamed from created_at for clarity
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True, db_index=True)  # NEW - when course ended
    dropped_at = models.DateTimeField(null=True, blank=True)  # NEW - when enrollment was cancelled
    
    class Meta:
        """Meta class for Enrollment model."""
        constraints = [
            # Ensure either child or student is set, but not both
            models.CheckConstraint(
                check=Q(child__isnull=False, student__isnull=True) | Q(child__isnull=True, student__isnull=False),
                name='child_or_student_enrollment'  
            ),
            # Ensure amount is positive and refund amount is non-negative
            models.CheckConstraint(
                check=Q(amount__gt=0),
                name='positive_enrollment_amount'  
            ),
            models.CheckConstraint(
                check=Q(refund_amount__gte=0),
                name='non_negative_refund_amount'  
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
        # Refund amount cannot be negative
        if self.refund_amount is not None and self.refund_amount < 0:
            raise ValidationError("Refund amount cannot be negative.")
        # amoutt must be positive
        if self.amount <= 0:
            raise ValidationError("Enrollment amount must be positive.")
        
    def update_status(self, new_status):
        """Update enrollment status with timestamp management."""
        valid_transitions = {
            EnrollmentStatus.ACTIVE: [EnrollmentStatus.COMPLETED, EnrollmentStatus.DROPPED, EnrollmentStatus.SUSPENDED],
            EnrollmentStatus.SUSPENDED: [EnrollmentStatus.ACTIVE, EnrollmentStatus.DROPPED],
            EnrollmentStatus.COMPLETED: [],
            EnrollmentStatus.DROPPED: [],
            EnrollmentStatus.REFUNDED: [],
        }
        if new_status not in valid_transitions[self.status]:
            raise ValidationError(f"Invalid status transition from {self.status} to {new_status}.")

        self.status = new_status
        now = timezone.now()
        if new_status == EnrollmentStatus.COMPLETED:
            self.completed_at = now
        elif new_status == EnrollmentStatus.DROPPED:
            self.dropped_at = now
        self.save()

    def get_participant(self):
        """Get the enrolled participant (child or student)."""
        return self.child if self.child else self.student

    def save(self, *args, **kwargs):
        """Override save to ensure clean is called."""
        self.full_clean()  # Call clean method before saving
        super().save(*args, **kwargs)

    def __str__(self):
        """String representation of the Enrollment."""
        # Determine the participant based on child or student
        participant = self.student if self.student else self.child or 'Unknown'
        return f"Enrollment for {participant} in {self.course}"