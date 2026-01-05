#!/usr/bin/env python3
from django.db import models
import uuid
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db.models import Q


class PaymentMethod(models.TextChoices):
    """Enumeration for payment method choices."""
    CASH = 'cash', 'Cash'
    CARD = 'card', 'Card'
    BANK_TRANSFER = 'bank_transfer', 'Bank Transfer'
    INSTAPAY = 'instapay', 'Instapay'
    VODAFONE_CASH = 'vodafone_cash', 'Vodafone Cash'
    OTHER = 'other', 'Other'


class PaymentStatus(models.TextChoices):
    """Enumeration for payment status choices."""
    PENDING = 'pending', 'Pending'
    PAID = 'paid', 'Paid'
    REFUNDED = 'refunded', 'Refunded'
    VOID = 'void', 'Void'


class Payment(models.Model):
    """Model representing a payment transaction related to an enrollment or standalone payment."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    enrollment = models.ForeignKey("enrollments_payments.Enrollment", null=True,
                                   blank=True, on_delete=models.CASCADE, related_name="payments")

    payer_parent = models.ForeignKey(
        'parents.Parent', null=True, blank=True, on_delete=models.SET_NULL, related_name='payments')

    payer_student = models.ForeignKey(
        'users.StudentUser', null=True, blank=True, on_delete=models.SET_NULL, related_name='payments')

    amount = models.DecimalField(max_digits=10, decimal_places=2)

    method = models.CharField(
        max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.CASH)

    status = models.CharField(
        max_length=10, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)

    notes = models.TextField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    processed_by = models.ForeignKey(
        'users.CustomUser', null=True, blank=True, on_delete=models.SET_NULL, related_name='processed_payments')

    processed_at = models.DateTimeField(null=True, blank=True)

    reference_number = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        """Meta class for Payment model."""
        verbose_name = 'سجل دفع'
        verbose_name_plural = 'سجلات الدفع'

        constraints = [
            # Ensure that either payer_parent or payer_student is set, but not both
            models.CheckConstraint(
                check=Q(payer_parent__isnull=False, payer_student__isnull=True) | Q(
                    payer_parent__isnull=True, payer_student__isnull=False),
                name='payer_parent_or_student'
            ),
            # Ensure that payment_date is set if status is PAID or REFUNDED
            models.CheckConstraint(
                check=~Q(
                    status__in=[PaymentStatus.PAID, PaymentStatus.REFUNDED], processed_at__isnull=True),
                name='processed_at_required_for_paid_or_refunded'
            ),
            # Ensure amount is non-negative
            models.CheckConstraint(
                check=Q(amount__gte=0),
                name='amount_non_negative'
            )
        ]
        indexes = [
            models.Index(fields=["enrollment"], name="pay_enrollment_idx"),
            models.Index(fields=["payer_parent"], name="pay_parent_idx"),
            models.Index(fields=["payer_student"], name="pay_student_idx"),
            models.Index(fields=["status"], name="pay_status_idx"),
        ]

    def clean(self):
        """Validate payment record constraints."""
        # Ensure only one of payer_parent or payer_student is set
        if (self.payer_parent is None and self.payer_student is None) or (self.payer_parent is not None and self.payer_student is not None):
            raise ValidationError(
                "Must specify exactly one of payer parent or payer student.")

        if self.status in [PaymentStatus.PAID, PaymentStatus.REFUNDED] and self.processed_at is None:
            raise ValidationError(
                "Payment date must be set for paid or refunded status.")

        if self.amount is not None and self.amount < 0:
            raise ValidationError("Amount must be non-negative.")
        # Reference number must be set for bank transfer method
        if self.method == PaymentMethod.BANK_TRANSFER and not self.reference_number:
            raise ValidationError(
                "Reference number must be set for bank transfer method.")

    def update_status(self, new_status, processed_by=None, processed_at=None):
        """Update the payment status with validation."""
        allowed_transitions = {
            # From pending, can go to paid or void
            PaymentStatus.PENDING: [PaymentStatus.PAID, PaymentStatus.VOID],
            # From paid, can go to refunded
            PaymentStatus.PAID: [PaymentStatus.REFUNDED, PaymentStatus.PENDING],
            # From refunded, can go back to pending
            PaymentStatus.REFUNDED: [PaymentStatus.PENDING],
            # From void, no further transitions allowed
            PaymentStatus.VOID: [PaymentStatus.PENDING],
        }
        if new_status not in PaymentStatus.values:
            raise ValidationError(f"Invalid status: {new_status}")
        if new_status not in allowed_transitions.get(self.status, []):
            raise ValidationError(
                f"Cannot transition from {self.status} to {new_status}")
        self.status = new_status
        self.processed_by = processed_by
        # set provided payment date if given
        if new_status in [PaymentStatus.PAID, PaymentStatus.REFUNDED] and processed_at:
            self.processed_at = processed_at
        # set current time if not provided
        elif new_status in [PaymentStatus.PAID, PaymentStatus.REFUNDED] and self.processed_at is None:
            self.processed_at = timezone.now()
        self.save()

    def mark_paid(self, processed_by_user=None):
        """
        Mark this payment as paid (admin action).
        """
        if self.status == PaymentStatus.PAID:
            return
        self.status = PaymentStatus.PAID
        self.processed_at = timezone.now()
        if processed_by_user:
            self.processed_by = processed_by_user
        self.full_clean()
        self.save(update_fields=["status", "processed_at", "processed_by"])

    def mark_refunded(self, processed_by_user=None):
        """
        Mark this payment as refunded (admin action)."""
        if self.status == PaymentStatus.REFUNDED:
            return
        self.status = PaymentStatus.REFUNDED
        if processed_by_user:
            self.processed_by = processed_by_user
        self.processed_at = timezone.now()
        self.save(update_fields=["status", "processed_by", "processed_at"])

    def __str__(self):
        """String representation of the Payment."""
        payer = (self.payer_parent.first_name if self.payer_parent else (
            self.payer_student.first_name if self.payer_student else 'Unknown'))
        target = self.pending_enrollment or getattr(
            self, 'enrollment', None) or 'Unknown'
        return f"Payment of {self.amount} by {payer} for {target}"


class RefundRequest(models.Model):
    """
    Admin-only refunds: full-only per your requirements.
    Refund flow:
      - parent/student requests refund -> status 'requested'
      - admin approves and processes -> status 'processed' and Payment(s) marked refunded / enrollment marked refunded
    """

    class RefundStatus(models.TextChoices):
        REQUESTED = "requested", "Requested"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        PROCESSED = "processed", "Processed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    enrollment = models.ForeignKey(
        "enrollments_payments.Enrollment", on_delete=models.CASCADE, related_name="refund_requests")
    requested_by_parent = models.ForeignKey(
        "parents.Parent", null=True, blank=True, on_delete=models.SET_NULL, related_name="refund_requests")
    requested_by_student = models.ForeignKey(
        "users.StudentUser", null=True, blank=True, on_delete=models.SET_NULL, related_name="refund_requests")
    reason = models.TextField(null=True, blank=True)
    status = models.CharField(
        max_length=20, choices=RefundStatus.choices, default=RefundStatus.REQUESTED)

    created_at = models.DateTimeField(auto_now_add=True)
    processed_by = models.ForeignKey(
        "users.CustomUser", null=True, blank=True, on_delete=models.SET_NULL, related_name="processed_refunds")
    processed_at = models.DateTimeField(null=True, blank=True)
    processed_note = models.TextField(null=True, blank=True)

    class Meta:
        verbose_name = 'طلب إسترداد'
        verbose_name_plural = 'طلبات الإسترداد'
        indexes = [
            models.Index(fields=["enrollment"], name="refund_enrollment_idx"),
            models.Index(fields=["status"], name="refund_status_idx"),
        ]

    def approve_and_process(self, admin_user):
        """
        For full refunds only:
        - mark related payments as refunded
        - mark enrollment as REFUNDED and decrement course.enrolled_count
        - set refund request to processed
        """
        if self.status != self.RefundStatus.REQUESTED:
            raise ValidationError("Only requested refunds can be processed.")

        # get enrollment and its paid payments
        paid_payments = self.enrollment.payments.filter(
            status=PaymentStatus.PAID)
        # mark each payment refunded
        for p in paid_payments:
            p.mark_refunded(processed_by_user=admin_user)

        # mark enrollment refunded (this also decrements enrolled_count)
        self.enrollment.mark_refunded(refunded_by=admin_user)

        self.status = self.RefundStatus.PROCESSED
        self.processed_by = admin_user
        self.processed_at = timezone.now()
        self.save(update_fields=["status", "processed_by", "processed_at"])

    def reject(self, admin_user, note=None):
        self.status = self.RefundStatus.REJECTED
        self.processed_by = admin_user
        self.processed_at = timezone.now()
        if note:
            self.processed_note = note
        self.save(update_fields=["status", "processed_by",
                  "processed_at", "processed_note"])
