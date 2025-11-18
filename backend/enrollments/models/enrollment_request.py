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
    PENDING = 'pending', _('Pending')  # Initial state when request is created

    # State when enrollment is being processed ==> mainly if we integrate with external payment gateways will use this
    PROCESSING = 'processing', _('Processing')

    PROCESSED = 'processed', _('Processed')


class PaymentMethod(models.TextChoices):
    """Enumeration for payment method choices."""
    CASH = 'cash', _('Cash')
    CARD = 'card', _('Card')
    BANK_TRANSFER = 'bank_transfer', _('Bank Transfer')
    INSTAPAY = 'instapay', _('Instapay')
    VODAFONE_CASH = 'vodafone_cash', _(
        'Vodafone Cash')
    OTHER = 'other', _('Other')


class EnrollmentRequest(models.Model):
    """Model representing an enrollment request."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE)

    parent = models.ForeignKey(
        'users.Parent', null=True, blank=True, on_delete=models.CASCADE)
    student = models.ForeignKey(
        'users.StudentUser', null=True, blank=True, on_delete=models.CASCADE)
    child = models.ForeignKey('users.Child', null=True,
                              blank=True, on_delete=models.CASCADE)

    # ALLOW null before save() sets it
    price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True)  # parent may choose to pay a partial amount then pay the rest later

    status = models.CharField(max_length=20, choices=EnrollmentRequestStatus.choices,
                              default=EnrollmentRequestStatus.PENDING)

    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    notes = models.TextField(null=True, blank=True)

    payment_method = models.CharField(max_length=20,
                                      choices=PaymentMethod.choices,
                                      default=PaymentMethod.CASH)

    class Meta:
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

    def __str__(self):
        participant = self.student or self.child or 'Unknown'
        return f"Enrollment Request for {participant} in {self.course}"
