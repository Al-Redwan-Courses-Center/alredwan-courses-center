#!/usr/bin/env python3
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from datetime import timedelta
import uuid


'''Enrollment Request related Models'''


class EnrollmentRequestStatus(models.TextChoices):
    """Enumeration for enrollment request status choices."""
    PENDING = "pending", _("معلق")
    PROCESSING = "processing", _("قيد المعالجة")
    REJECTED = "rejected", _("مرفوض")
    # accepted but not necessarily paid (we'll treat accept==create enrollment)
    ACCEPTED = "accepted", _("مقبول")
    EXPIRED = "expired", _("منتهي الصلاحية")


class PaymentMethod(models.TextChoices):
    """Enumeration for payment method choices."""
    CASH = 'cash', _('نقدًا')
    CARD = 'card', _('بطاقة')
    BANK_TRANSFER = 'bank_transfer', _('تحويل بنكي')
    INSTAPAY = 'instapay', _('إنستاباي')
    VODAFONE_CASH = 'vodafone_cash', _(
        'فودافون كاش')
    OTHER = 'other', _('طريقة أخرى')


class EnrollmentRequest(models.Model):
    """Model representing an enrollment request."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE, verbose_name=_("Course"))

    parent = models.ForeignKey(
        'parents.Parent', null=True, blank=True, on_delete=models.CASCADE, verbose_name=_("Parent"))
    student = models.ForeignKey(
        'users.StudentUser', null=True, blank=True, on_delete=models.CASCADE, verbose_name=_("Student"))
    child = models.ForeignKey('parents.Child', null=True,
                              blank=True, on_delete=models.CASCADE, verbose_name=_("Child"))

    # ALLOW null before save() sets it
    price = models.DecimalField(
        # parent may choose to pay a partial amount then pay the rest later
        max_digits=10, decimal_places=2, null=True, blank=True, verbose_name=_("Price"))

    status = models.CharField(max_length=20, choices=EnrollmentRequestStatus.choices,
                              default=EnrollmentRequestStatus.PENDING, verbose_name=_("Status"))

    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Created at"))
    processed_at = models.DateTimeField(null=True, blank=True, verbose_name=_("Processed at"))
    expires_at = models.DateTimeField(null=True, blank=True, verbose_name=_("Expires at"))

    notes = models.TextField(null=True, blank=True, verbose_name=_("Notes"))

    payment_method = models.CharField(max_length=20,
                                      choices=PaymentMethod.choices,
                                      default=PaymentMethod.CASH, verbose_name=_("Payment method"))

    processed_by = models.ForeignKey("users.CustomUser", null=True, blank=True,
                                     on_delete=models.SET_NULL, related_name="processed_enrollment_requests", verbose_name=_("Processed by"))

    class Meta:
        verbose_name = 'طلب إلتحاق'
        verbose_name_plural = 'طلبات الإلنحاق'

        indexes = [
            models.Index(fields=["course"], name="er_course_idx"),
            models.Index(fields=["parent"], name="er_parent_idx"),
            models.Index(fields=["student"], name="er_student_idx"),
            models.Index(fields=["child"], name="er_child_idx"),
        ]

        constraints = [

            # Parent + child OR student only
            models.CheckConstraint(
                check=(
                    (Q(parent__isnull=False) & Q(child__isnull=False) & Q(student__isnull=True)) |
                    (Q(student__isnull=False) & Q(
                        parent__isnull=True) & Q(child__isnull=True))
                ),
                name='parent_child_or_student'
            ),

            # price must be positive (only when price not null)
            models.CheckConstraint(
                check=Q(price__gt=0) | Q(price__isnull=True),
                name='positive_price'
            ),

            # Unique constraint when child is not null
            models.UniqueConstraint(
                fields=['course', 'child'],
                condition=Q(child__isnull=False),
                name='unique_course_child_request'
            ),

            # Unique constraint when student is not null
            models.UniqueConstraint(
                fields=['course', 'student'],
                condition=Q(student__isnull=False),
                name='unique_course_student_request'
            ),
        ]

    def clean(self):
        '''Custom validation logic for EnrollmentRequest model.'''
        # Parent + child OR student only
        if not ((self.parent and self.child and not self.student) or
                (self.student and not self.parent and not self.child)):
            raise ValidationError(
                "Select either a parent+child OR a student alone.")

        if self.parent and self.child:
            if not (self.child.primary_parent_id == self.parent.id or self.child.extra_parents.filter(parent=self.parent).exists()):
                raise ValidationError(
                    "The provided parent is not linked to the chosen child.")
        # expires_at must be future if provided
        if self.expires_at and self.expires_at <= timezone.now():
            raise ValidationError("Expiration time must be in the future.")

    def save(self, *args, **kwargs):
        '''Override save to set default values and validate.'''  # a payer may make a partial payment, yet be accepted in a course.
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(days=7)

        if self.price is None:
            self.price = self.course.price

        self.full_clean()
        super().save(*args, **kwargs)

    def get_participant(self):
        """Return the participant of the enrollment request, either a child or a student."""
        return self.child or self.student

    # link paid amount enrollment request price
    def approve(self, processed_by_user, paid_amount=None, payment_method=None, payment_notes=None):
        """Approve the enrollment request and create an Enrollment."""
        if self.status != EnrollmentRequestStatus.PENDING:
            raise ValidationError("Only pending requests may be approved.")

        from .enrollment import Enrollment, EnrollmentStatus

        enrollment = Enrollment.objects.create(
            course=self.course,
            student=self.student,
            child=self.child,
            enrolled_at=timezone.now(),
            status=EnrollmentStatus.ACTIVE,
            created_by=processed_by_user
        )
        if paid_amount:
            from .payment import Payment
            Payment.objects.create(
                enrollment=enrollment,
                payer_parent=self.parent if self.parent else None,
                payer_student=self.student if self.student else None,
                amount=paid_amount,
                method=payment_method if payment_method else "cash",
                status="paid",
                processed_by=processed_by_user,
                processed_at=timezone.now(),
                notes=payment_notes
            )
        self.status = EnrollmentRequestStatus.ACCEPTED
        self.processed_by = processed_by_user
        self.processed_at = timezone.now()
        self.save(update_fields=["status", "processed_by", "processed_at"])

        return enrollment

    def reject(self, processed_by_user, reason=None):
        """Reject the enrollment request."""
        if self.status != EnrollmentRequestStatus.PENDING:
            raise ValidationError("Only pending requests may be rejected.")

        self.status = EnrollmentRequestStatus.REJECTED
        self.processed_by = processed_by_user
        self.processed_at = timezone.now()
        if reason:
            self.note = (self.note or "") + f"\n[REJECTION REASON] {reason}"
        self.save(update_fields=[
                  "status", "processed_by", "processed_at", "note"])

    def __str__(self):
        participant = self.student or self.child or 'Unknown'
        return f"Enrollment Request for {participant} in {self.course}"
