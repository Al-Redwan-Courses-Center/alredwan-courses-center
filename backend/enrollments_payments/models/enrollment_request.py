# pyrefly: ignore [missing-import]
import uuid

from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from ..signals import enrollment_request_approved


class PaymentMethod(models.TextChoices):
    """Enumeration for payment method choices."""

    CASH = "cash", _("نقدًا")
    CARD = "card", _("بطاقة")
    BANK_TRANSFER = "bank_transfer", _("تحويل بنكي")
    INSTAPAY = "instapay", _("إنستاباي")
    VODAFONE_CASH = "vodafone_cash", _("فودافون كاش")
    OTHER = "other", _("طريقة أخرى")


class EnrollmentRequest(models.Model):
    """Model representing a request for enrollment."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    course = models.ForeignKey(
        "courses.Course",
        verbose_name="الدورة",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
    )
    online_course = models.ForeignKey(
        "courses_online.OnlineCourse",
        verbose_name="الدورة الإلكترونية",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
    )

    @property
    def course_instance(self):
        return self.course if self.course is not None else self.online_course

    parent = models.ForeignKey(
        "parents.Parent", null=True, blank=True, on_delete=models.CASCADE
    )
    child = models.ForeignKey(
        "parents.Child", null=True, blank=True, on_delete=models.CASCADE
    )
    student = models.ForeignKey(
        "users.StudentUser", null=True, blank=True, on_delete=models.CASCADE
    )

    STATUS_CHOICES = [
        ("pending", _("معلق")),
        ("processing", _("جاري المعالجة")),
        ("approved", _("مقبول")),
        ("rejected", _("مرفوض")),
        ("cancelled", _("ملغى")),
    ]
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
        verbose_name=_("الحالة"),
    )

    price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True, verbose_name=_("السعر")
    )

    notes = models.TextField(blank=True, verbose_name=_("ملاحظات"))

    # Tracking
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("تاريخ الإنشاء"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("تاريخ التحديث"))
    processed_at = models.DateTimeField(
        null=True, blank=True, verbose_name=_("تاريخ المعالجة")
    )
    processed_by = models.ForeignKey(
        "users.CustomUser",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        verbose_name=_("معالج بواسطة"),
        related_name="processed_enrollment_requests",
    )

    class Meta:
        verbose_name = _("طلب التحاق")
        verbose_name_plural = _("طلبات الالتحاق")
        ordering = ["-created_at"]
        constraints = [
            # Check either parent+child OR student is provided
            models.CheckConstraint(
                condition=Q(parent__isnull=False, child__isnull=False, student__isnull=True)
                | Q(parent__isnull=True, child__isnull=True, student__isnull=False),
                name="parent_child_or_student",
            ),
            # price must be non-negative (only when price not null); 0 allowed for free courses
            models.CheckConstraint(
                condition=Q(price__gte=0) | Q(price__isnull=True), name="positive_price"
            ),
            # Exactly one course type
            models.CheckConstraint(
                condition=(
                    (Q(course__isnull=False) & Q(online_course__isnull=True))
                    | (Q(course__isnull=True) & Q(online_course__isnull=False))
                ),
                name="exact_one_course_type_per_request",
            ),
            # Unique constraint when child is not null
            models.UniqueConstraint(
                fields=["course", "child"],
                condition=Q(course__isnull=False, child__isnull=False),
                name="unique_course_child_request",
            ),
            # Unique constraint when student is not null
            models.UniqueConstraint(
                fields=["course", "student"],
                condition=Q(course__isnull=False, student__isnull=False),
                name="unique_course_student_request",
            ),

            # Online requests are only unique while still in flight, so a
            # user can request again if previous was rejected/cancelled.
            models.UniqueConstraint(
                fields=["online_course", "child"],
                condition=Q(online_course__isnull=False, child__isnull=False, status__in=["pending", "processing"]),
                name="unique_pending_online_course_child_request"
            ),
            models.UniqueConstraint(
                fields=["online_course", "student"],
                condition=Q(online_course__isnull=False, student__isnull=False, status__in=["pending", "processing"]),
                name="unique_pending_online_course_student_request"
            ),
        ]

    def clean(self):
        super().clean()

        if self.student:
            self.parent = None
            self.child = None

        if (self.course is None and self.online_course is None) or (self.course is not None and self.online_course is not None):
            raise ValidationError(
                _("يجب تحديد إما الدورة الحضورية أو الدورة الإلكترونية فقط. / Must specify exactly one of course or online_course."))

        # Parent + child OR student only
        if not (
            (self.parent and self.child and not self.student)
            or (self.student and not self.parent and not self.child)
        ):
            raise ValidationError(
                _("يجب تحديد ولي أمر وطالب، أو طالب جامعي/خريج. / Must specify parent and child, or student.")
            )

        if self.child and self.child.parent != self.parent:
            raise ValidationError(
                _("الطالب لا ينتمي لولي الأمر المحدد. / Child does not belong to specified parent.")
            )

        if self.price is not None and self.price < 0:
            raise ValidationError(
                _("لا يمكن أن يكون السعر أقل من الصفر. / Price cannot be negative.")
            )

    def approve(
        self,
        processor,
        payment_amount=None,
        payment_method=None,
        payment_reference="",
        payment_notes="",
    ):
        """
        Approves the request, creates an Enrollment, and records a Payment if required.
        Emits the enrollment_request_approved signal.
        """
        from .enrollment import Enrollment
        from .payment import Payment, PaymentStatus

        if self.status not in ["pending", "processing"]:
            raise ValueError("Can only approve pending or processing requests.")

        from django.db import transaction

        with transaction.atomic():
            # Update request status
            self.status = "approved"
            self.processed_by = processor
            self.processed_at = timezone.now()
            self.save(update_fields=["status", "processed_by", "processed_at"])

            # Create Enrollment
            enrollment = Enrollment.objects.create(
                course=self.course,
                online_course=self.online_course,
                student=self.student,
                child=self.child,
                created_by=processor,
                status="active",
            )

            # Record Payment
            # Determine payment amount
            if payment_amount is not None:
                final_amount = payment_amount
            elif self.price is not None:
                final_amount = self.price
            else:
                target = self.course_instance
                final_amount = (
                    target.price if (
                        target and target.price is not None) else 0
                )

            # Determine payment method
            final_method = (
                payment_method if payment_method else (
                    PaymentMethod.CASH if final_amount > 0 else None
                )
            )

            # Build payment notes to track partial payments
            final_notes = payment_notes or ""
            target = self.course_instance
            if (
                target
                and self.price is not None
                and target.price
                and self.price < target.price
            ):
                remaining = float(target.price) - float(self.price)
                partial_note = f"[دفعة جزئية] المبلغ المدفوع: {self.price} ج.م | المتبقي: {remaining} ج.م"
                final_notes = (
                    f"{partial_note}\n{final_notes}".strip()
                    if final_notes else partial_note
                )

            if final_amount > 0 and final_method:
                Payment.objects.create(
                    enrollment=enrollment,
                    amount=final_amount,
                    payment_method=final_method,
                    reference_number=payment_reference or "",
                    notes=final_notes,
                    status=PaymentStatus.PAID,
                    processed_by=processor,
                    processed_at=timezone.now(),
                )

        # Trigger signal outside transaction so handlers can run safely
        enrollment_request_approved.send(
            sender=self.__class__, instance=self, enrollment=enrollment
        )

        return enrollment

    def reject(self, processor, reason=""):
        """Rejects the request without creating enrollment."""
        if self.status not in ["pending", "processing"]:
            raise ValueError("Can only reject pending or processing requests.")

        self.status = "rejected"
        self.processed_by = processor
        self.processed_at = timezone.now()
        if reason:
            self.notes = f"{self.notes}\nسبب الرفض: {reason}".strip()
        self.save(update_fields=[
                  "status", "processed_by", "processed_at", "notes"])

    def __str__(self):
        participant = self.student or self.child or "Unknown"
        return f"Enrollment Request for {participant} in {self.course_instance}"
