from django.db import models
import uuid
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db.models import Q, F


class EnrollmentStatus(models.TextChoices):
    """Enumeration for enrollment status choices."""
    ACTIVE = 'active', 'Active'  # Current enrollment in progress
    COMPLETED = 'completed', 'Completed'  # Enrollment finished successfully
    DROPPED = 'dropped', 'Dropped'  # Enrollment cancelled or dropped
    REFUNDED = 'refunded', 'Refunded'  # Enrollment refunded


class Enrollment(models.Model):
    """Model representing an active enrollment."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(
        'courses.Course', on_delete=models.CASCADE, related_name='enrollments')
    student = models.ForeignKey(
        'users.StudentUser', null=True, blank=True, on_delete=models.CASCADE, related_name='enrollments')
    child = models.ForeignKey('users.Child', null=True, blank=True,
                              on_delete=models.CASCADE, related_name='enrollments')

    enrolled_at = models.DateTimeField(default=timezone.now, db_index=True)

    status = models.CharField(max_length=10, choices=EnrollmentStatus.choices,
                              default=EnrollmentStatus.ACTIVE)

    created_by = models.ForeignKey("users.CustomUser", null=True, blank=True,
                                   on_delete=models.SET_NULL, related_name="created_enrollments")

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Meta class for Enrollment model."""
        constraints = [
            models.CheckConstraint(
                check=Q(child__isnull=False, student__isnull=True) | Q(
                    child__isnull=True, student__isnull=False),
                name='child_or_student_enrollment'
            ),

            models.UniqueConstraint(
                fields=['course', 'child'], name='unique_course_child_enrollment'),
            models.UniqueConstraint(
                fields=['course', 'student'], name='unique_course_student_enrollment'),
        ]

        indexes = [
            models.Index(fields=['course'], name='enrollment_course_index'),
            models.Index(fields=['student'], name='enrollment_student_index'),
            models.Index(fields=['child'], name='enrollment_child_index'),
        ]

    def clean(self):
        """Validate enrollment constraints."""
        # Ensure only one of child or student is set
        if (self.child is None and self.student is None) or (self.child is not None and self.student is not None):
            raise ValidationError(
                "Must specify exactly one of child or student.")

    def get_payments(self):
        """Return queryset of payments for this enrollment (payments app)."""
        from .payment import Payment
        return Payment.objects.filter(enrollment=self)

    def amount_paid(self):
        """Calculate total amount paid for this enrollment."""
        qs = self.get_payments().filter(status="paid")
        total = qs.aggregate(total=models.Sum("amount"))["total"] or 0
        return total

    def remaining_amount(self):
        """Calculate remaining amount to be paid for this enrollment."""
        return float(self.course.price) - float(self.amount_paid())

    def mark_refunded(self, refunded_by):
        """
        Mark enrollment as refunded — used when refund approved and processed.
        This method will decrement course.enrolled_count.
        """
        if self.status == EnrollmentStatus.REFUNDED:
            return
        self.status = EnrollmentStatus.REFUNDED
        self.save(update_fields=["status", "updated_at"])

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
            raise ValidationError(
                f"Invalid status transition from {self.status} to {new_status}.")

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
        participant = self.get_participant() or 'Unknown'
        return f"Enrollment for {participant} in {self.course}"
