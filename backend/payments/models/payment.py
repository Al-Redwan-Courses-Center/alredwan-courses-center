from django.db import models
import uuid
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db.models import Q

class Method(models.TextChoices):
    """Enumeration for payment method choices."""
    CASH = 'cash', 'Cash'
    CARD = 'card', 'Card'
    BANK_TRANSFER = 'bank_transfer', 'Bank Transfer'
    INSTAPAY = 'instapay', 'Instapay'
    VODAFONE_CASH = 'vodafone_cash', 'Vodafone Cash'
    OTHER = 'other', 'Other'

class Status(models.TextChoices):
    """Enumeration for payment status choices."""
    PENDING = 'pending', 'Pending' # pendeng payment when created
    PAID = 'paid', 'Paid' # payment completed
    REFUNDED = 'refunded', 'Refunded' # payment refunded
    VOID = 'void', 'Void' # payment voided/cancelled

class Payment(models.Model):
    """Model representing a payment transaction."""
    # uuid payment id
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pending_enrollment = models.OneToOneField('enrollments.PendingEnrollment', null=True, blank=True, on_delete=models.SET_NULL, related_name='payments')
    payer_parent = models.ForeignKey('users.Parent', null=True, blank=True, on_delete=models.SET_NULL, related_name='payments')
    payer_student = models.ForeignKey('users.StudentUser', null=True, blank=True, on_delete=models.SET_NULL, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2) # auto field from pending enrollment 
    method = models.CharField(max_length=20, choices=Method.choices, default=Method.CASH)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING) # pendeng payment when created
    payment_date = models.DateTimeField(null=True, blank=True) # Date when payment was completed
    processed_by = models.ForeignKey('users.User', null=True, blank=True, on_delete=models.SET_NULL, related_name='payments')
    transaction_id = models.UUIDField(unique=True, auto_created=True) # transaction ID, etc., auto generated
    reference_number = models.CharField(max_length=100, null=True, blank=True) # For bank transfers, etc. # search # make check for method 
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Meta class for Payment model."""
        constraints = [
            # Ensure that either payer_parent or payer_student is set, but not both
            models.CheckConstraint(
                check=Q(payer_parent__isnull=False, payer_student__isnull=True) | Q(payer_parent__isnull=True, payer_student__isnull=False),
                name='payer_parent_or_student'
            ),
            # Ensure that payment_date is set if status is PAID or REFUNDED
            models.CheckConstraint(
                check=~Q(status__in=[Status.PAID, Status.REFUNDED], payment_date__isnull=True),
                name='payment_date_required_for_paid_or_refunded'
            ),
            # Ensure amount is non-negative
            models.CheckConstraint(
                check=Q(amount__gte=0),
                name='amount_non_negative'
            ),
            # Ensure reference_number is set for bank transfer method
            models.CheckConstraint(
                check=~Q(method=Method.BANK_TRANSFER, reference_number__isnull=True),
                name='reference_number_required_for_bank_transfer'
            ),
        ]
        indexes = [
            models.Index(fields=['pending_enrollment'], name='payment_pending_enrollment_index'),
            models.Index(fields=['payer_parent'], name='payment_payer_parent_index'),
            models.Index(fields=['payer_student'], name='payment_payer_student_index'),
            models.Index(fields=['status'], name='payment_status_index'),
            models.Index(fields=['payment_date'], name='payment_payment_date_index'),
        ]
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'

    def clean(self):
        """Validate payment record constraints."""

        # Ensure only one of payer_parent or payer_student is set
        if (self.payer_parent is None and self.payer_student is None) or (self.payer_parent is not None and self.payer_student is not None):
            raise ValidationError("Must specify exactly one of payer parent or payer student.")
        # Payment date must be set for paid or refunded status
        if self.status in [Status.PAID, Status.REFUNDED] and self.payment_date is None: 
            raise ValidationError("Payment date must be set for paid or refunded status.")
        # Amount must be non-negative
        if self.amount < 0:
            raise ValidationError("Amount must be non-negative.")
        # Reference number must be set for bank transfer method
        if self.method == Method.BANK_TRANSFER and not self.reference_number:
            raise ValidationError("Reference number must be set for bank transfer method.")
        

    def update_status(self, new_status, processed_by=None, payment_date=None):
        """Update the payment status with validation."""
        allowed_transitions = {
            Status.PENDING: [Status.PAID, Status.VOID], # From pending, can go to paid or void
            Status.PAID: [Status.REFUNDED, Status.PENDING], # From paid, can go to refunded
            Status.REFUNDED: [Status.PENDING], # From refunded, can go back to pending
            Status.VOID: [Status.PENDING], # From void, no further transitions allowed
        }

        if new_status not in Status.values:
            raise ValidationError(f"Invalid status: {new_status}")
        if new_status not in allowed_transitions[self.status]:
            raise ValidationError(f"Cannot transition from {self.status} to {new_status}")

        self.status = new_status
        self.processed_by = processed_by
        if new_status in [Status.PAID, Status.REFUNDED] and payment_date: # set provided payment date if given
            self.payment_date = payment_date
        elif new_status in [Status.PAID, Status.REFUNDED] and self.payment_date is None: # set current time if I didn't give you one
            self.payment_date = timezone.now()
        self.save()

    def save(self, *args, **kwargs):
        # Auto-set amount from pending enrollment if not set
        if not self.amount and self.pending_enrollment:
            self.amount = self.pending_enrollment.price
        self.clean()  # Validate before saving
        super().save(*args, **kwargs)

    def __str__(self):
        """String representation of the Payment."""
        payer = self.payer_parent.first_name if self.payer_parent else self.payer_student.first_name if self.payer_student else 'Unknown'
        target = self.pending_enrollment or self.enrollment or 'Unknown'
        return f"Payment of {self.amount} by {payer} for {target}"