#!/usr/bin/env python3
from django.core.exceptions import ValidationError
from django.db import models, transaction
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
    INSTAPAY = 'instapay', _('إنستاباي')
    VODAFONE_CASH = 'vodafone_cash', _('فودافون كاش')


class EnrollmentRequest(models.Model):
    """Model representing an enrollment request."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    course = models.ForeignKey(
        'courses.Course', verbose_name="الدورة", null=True, blank=True,
        on_delete=models.CASCADE)
    online_course = models.ForeignKey(
        'courses_online.OnlineCourse', verbose_name="الدورة الإلكترونية",
        null=True, blank=True, on_delete=models.CASCADE)

    @property
    def course_instance(self):
        return self.course if self.course is not None else self.online_course

    parent = models.ForeignKey(
        'parents.Parent', null=True, blank=True, on_delete=models.CASCADE)
    student = models.ForeignKey(
        'users.StudentUser', null=True, blank=True, on_delete=models.CASCADE)
    child = models.ForeignKey('parents.Child', null=True,
                              blank=True, on_delete=models.CASCADE)

    # ALLOW null before save() sets it
    price = models.DecimalField(
        # parent may choose to pay a partial amount then pay the rest later
        max_digits=10, decimal_places=2, null=True, blank=True)

    status = models.CharField(max_length=20, choices=EnrollmentRequestStatus.choices,
                              default=EnrollmentRequestStatus.PENDING)

    created_at = models.DateTimeField(
        auto_now_add=True, verbose_name=("تاريخ الإنشاء"))
    processed_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    notes = models.TextField(null=True, blank=True)

    payment_method = models.CharField(max_length=20,
                                      choices=PaymentMethod.choices,
                                      default=PaymentMethod.CASH)

    processed_by = models.ForeignKey("users.CustomUser", null=True, blank=True,
                                     on_delete=models.SET_NULL, related_name="processed_enrollment_requests")

    class Meta:
        verbose_name = 'طلب إلتحاق'
        verbose_name_plural = 'طلبات الإلتحاق'

        indexes = [
            models.Index(fields=["course"], name="er_course_idx"),
            models.Index(fields=["parent"], name="er_parent_idx"),
            models.Index(fields=["student"], name="er_student_idx"),
            models.Index(fields=["child"], name="er_child_idx"),
        ]

        constraints = [

            # Parent + child OR student only
            models.CheckConstraint(
                condition=(
                    (Q(parent__isnull=False) & Q(child__isnull=False) & Q(student__isnull=True)) |
                    (Q(student__isnull=False) & Q(
                        parent__isnull=True) & Q(child__isnull=True))
                ),
                name='parent_child_or_student'
            ),

            # price must be positive (only when price not null)
            models.CheckConstraint(
                condition=Q(price__gt=0) | Q(price__isnull=True),
                name='positive_price'
            ),

            # Unique constraint when child is not null
            models.UniqueConstraint(
                fields=['course', 'child'],
                condition=Q(course__isnull=False, child__isnull=False),
                name='unique_course_child_request'
            ),

            # Unique constraint when student is not null
            models.UniqueConstraint(
                fields=['course', 'student'],
                condition=Q(course__isnull=False, student__isnull=False),
                name='unique_course_student_request'
            ),

            # Online requests are only unique while still in flight, so a
            # course can be bought again after a previous request is closed.
            # Mirrors the status scoping on Enrollment's online constraints.
            models.UniqueConstraint(
                fields=['online_course', 'child'],
                condition=Q(online_course__isnull=False, child__isnull=False,
                            status__in=['pending', 'processing']),
                name='unique_online_course_child_request'
            ),
            models.UniqueConstraint(
                fields=['online_course', 'student'],
                condition=Q(online_course__isnull=False, student__isnull=False,
                            status__in=['pending', 'processing']),
                name='unique_online_course_student_request'
            ),
            models.CheckConstraint(
                condition=(
                    (Q(course__isnull=False) & Q(online_course__isnull=True)) |
                    (Q(course__isnull=True) & Q(online_course__isnull=False))
                ),
                name='exact_one_course_type_per_request'
            ),
        ]

    def clean(self):
        '''Custom validation logic for EnrollmentRequest model.'''
        # Auto-set parent from child's primary_parent if child is provided without parent
        if self.child and not self.parent:
            self.parent = self.child.primary_parent
        
        # Clear parent/child if student is selected (mutual exclusivity)
        if self.student:
            self.parent = None
            self.child = None
            
        if (self.course is None and self.online_course is None) or (self.course is not None and self.online_course is not None):
            raise ValidationError(
                _("يجب تحديد إما الدورة الحضورية أو الدورة الإلكترونية فقط. / Must specify exactly one of course or online_course."))
        
        # Parent + child OR student only
        if not ((self.parent and self.child and not self.student) or
                (self.student and not self.parent and not self.child)):
            raise ValidationError(
                _("اختر إما (طفل) أو (طالب) فقط. / Select either a child OR a student alone."))

        if self.parent and self.child:
            if not (self.child.primary_parent_id == self.parent.id or self.child.extra_parents.filter(parent=self.parent).exists()):
                raise ValidationError(
                    _("ولي الأمر المحدد غير مرتبط بالطفل المختار. / The provided parent is not linked to the chosen child."))
        
        # expires_at must be future if provided
        if self.expires_at and self.expires_at <= timezone.now():
            raise ValidationError(_("تاريخ الانتهاء يجب أن يكون في المستقبل. / Expiration time must be in the future."))

    def save(self, *args, **kwargs):
        '''Override save to set default values and validate.'''  # a payer may make a partial payment, yet be accepted in a course.
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(days=7)

        if self.price is None:
            target = self.course_instance
            if target:
                self.price = target.price

        self.full_clean()
        super().save(*args, **kwargs)

    def get_participant(self):
        """Return the participant of the enrollment request, either a child or a student."""
        return self.child or self.student

    # link paid amount enrollment request price
    def approve(self, processed_by_user, paid_amount=None, payment_method=None, payment_notes=None):
        """Approve the enrollment request and create an Enrollment.

        This method is atomic - if payment creation fails, the enrollment
        creation will be rolled back.
        
        Payment amount logic:
        1. If paid_amount is explicitly provided, use it
        2. Otherwise, if self.price is set (partial/custom payment), use self.price
        3. Otherwise, use the full course price
        
        This allows for partial payments where the remaining amount can be
        collected later via additional Payment records.
        """
        if self.status != EnrollmentRequestStatus.PENDING and self.status != EnrollmentRequestStatus.PROCESSING:
            raise ValidationError("Only pending or processing requests may be approved.")

        from .enrollment import Enrollment, EnrollmentStatus

        with transaction.atomic():
            enrollment = Enrollment.objects.create(
                course=self.course,
                online_course=self.online_course,
                student=self.student,
                child=self.child,
                enrolled_at=timezone.now(),
                status=EnrollmentStatus.ACTIVE,
                created_by=processed_by_user
            )
            
            # Determine the payment amount:
            # Priority: paid_amount param > enrollment_request.price > course.price
            if paid_amount is not None:
                final_amount = paid_amount
            elif self.price is not None:
                final_amount = self.price
            else:
                target = self.course_instance
                final_amount = target.price if (target and target.price is not None) else 0
            
            # Determine payment method
            final_method = payment_method if payment_method else (self.payment_method or "cash")
            
            # Build payment notes to track partial payments
            final_notes = payment_notes or ""
            target = self.course_instance
            if target and self.price is not None and target.price and self.price < target.price:
                remaining = float(target.price) - float(self.price)
                partial_note = f"[دفعة جزئية] المبلغ المدفوع: {self.price} ج.م | المتبقي: {remaining} ج.م"
                final_notes = f"{partial_note}\n{final_notes}".strip() if final_notes else partial_note
            
            from .payment import Payment
            Payment.objects.create(
                enrollment=enrollment,
                payer_parent=self.parent if self.parent else None,
                payer_student=self.student if self.student else None,
                amount=final_amount,
                method=final_method,
                status="paid",
                processed_by=processed_by_user,
                processed_at=timezone.now(),
                notes=final_notes if final_notes else None
            )
            
            self.status = EnrollmentRequestStatus.ACCEPTED
            self.processed_by = processed_by_user
            self.processed_at = timezone.now()
            self.save(update_fields=["status", "processed_by", "processed_at"])

        return enrollment

    def reject(self, processed_by_user, reason=None):
        """Reject the enrollment request."""
        if self.status not in [EnrollmentRequestStatus.PENDING, EnrollmentRequestStatus.PROCESSING]:
            raise ValidationError(_("يمكن رفض الطلبات المعلقة أو قيد المعالجة فقط. / Only pending or processing requests may be rejected."))

        self.status = EnrollmentRequestStatus.REJECTED
        self.processed_by = processed_by_user
        self.processed_at = timezone.now()
        if reason:
            self.notes = (self.notes or "") + f"\n[سبب الرفض] {reason}"
        self.save(update_fields=[
                  "status", "processed_by", "processed_at", "notes"])

    def __str__(self):
        participant = self.student or self.child or 'Unknown'
        return f"Enrollment Request for {participant} in {self.course_instance}"
