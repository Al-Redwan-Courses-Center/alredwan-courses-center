from django.db import models
import uuid
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db.models import Q, F


class EnrollmentStatus(models.TextChoices):
    """Enumeration for enrollment status choices."""
    ACTIVE = 'active', 'نشط'  # Current enrollment in progress
    SUSPENDED = 'suspended', 'معلق'  # Enrollment temporarily paused
    COMPLETED = 'completed', 'مكتمل'  # Enrollment finished successfully
    DROPPED = 'dropped', 'ملغى'  # Enrollment cancelled or dropped
    REFUNDED = 'refunded', 'مسترد'  # Enrollment refunded


class EnrollmentManager(models.Manager):
    """Custom manager for Enrollment model with utility methods."""

    def active(self):
        """Return only active enrollments."""
        return self.filter(status=EnrollmentStatus.ACTIVE)

    def get_completable_enrollments(self):
        """
        Get active enrollments that should be marked as completed.

        Criteria for completion:
        1. Course end_date has passed, OR
        2. All lectures in the course are completed (status='completed')
        """
        today = timezone.localdate()

        # Get active enrollments
        active_enrollments = self.active().select_related(
            'course').prefetch_related('course__lectures')

        completable = []
        for enrollment in active_enrollments:
            if enrollment.should_be_completed():
                completable.append(enrollment.pk)

        return self.filter(pk__in=completable)

    def mark_completed_enrollments(self):
        """
        Find and mark all enrollments that should be completed.
        Returns the count of enrollments marked as completed.
        """
        completable = self.get_completable_enrollments()
        count = 0

        for enrollment in completable:
            try:
                enrollment.update_status(EnrollmentStatus.COMPLETED)
                count += 1
            except ValidationError:
                # Skip if status transition is not valid
                pass

        return count


class Enrollment(models.Model):
    """Model representing an active enrollment."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(
        'courses.Course', verbose_name="الدورة", null=True, blank=True,
        on_delete=models.CASCADE, related_name='enrollments')
    online_course = models.ForeignKey(
        'courses_online.OnlineCourse', verbose_name="الدورة الإلكترونية",
        null=True, blank=True, on_delete=models.CASCADE,
        related_name='online_enrollments')
    student = models.ForeignKey(
        'users.StudentUser', null=True, blank=True, on_delete=models.CASCADE, related_name='enrollments')
    child = models.ForeignKey('parents.Child', null=True, blank=True,
                              on_delete=models.CASCADE, related_name='enrollments')

    enrolled_at = models.DateTimeField(default=timezone.now, db_index=True)

    status = models.CharField(max_length=10, choices=EnrollmentStatus.choices,
                              default=EnrollmentStatus.ACTIVE)

    created_by = models.ForeignKey("users.CustomUser", null=True, blank=True,
                                   on_delete=models.SET_NULL, related_name="created_enrollments")

    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    dropped_at = models.DateTimeField(null=True, blank=True)

    # Custom manager
    objects = EnrollmentManager()

    class Meta:
        """Meta class for Enrollment model."""
        verbose_name = 'إلتحاق'
        verbose_name_plural = 'الإلتحاقات'
        constraints = [
            models.CheckConstraint(
                condition=(
                    (Q(course__isnull=False) & Q(online_course__isnull=True)) |
                    (Q(course__isnull=True) & Q(online_course__isnull=False))
                ),
                name='exact_one_course_type_per_enrollment'
            ),
            models.CheckConstraint(
                check=Q(child__isnull=False, student__isnull=True) | Q(
                    child__isnull=True, student__isnull=False),
                name='child_or_student_enrollment'
            ),
            models.UniqueConstraint(
                fields=['course', 'child'],
                condition=Q(course__isnull=False, child__isnull=False),
                name='unique_course_child_enrollment'),
            models.UniqueConstraint(
                fields=['course', 'student'],
                condition=Q(course__isnull=False, student__isnull=False),
                name='unique_course_student_enrollment'),
            models.UniqueConstraint(
                fields=['online_course', 'child'],
                condition=Q(online_course__isnull=False, child__isnull=False, status__in=['active', 'suspended']),
                name='unique_online_course_child_enrollment'),
            models.UniqueConstraint(
                fields=['online_course', 'student'],
                condition=Q(online_course__isnull=False, student__isnull=False, status__in=['active', 'suspended']),
                name='unique_online_course_student_enrollment'),
        ]

        indexes = [
            models.Index(fields=['course'], name='enrollment_course_index'),
            models.Index(fields=['student'], name='enrollment_student_index'),
            models.Index(fields=['child'], name='enrollment_child_index'),
        ]
        ordering = ['-enrolled_at']

    def clean(self):
        """Validate enrollment constraints."""
        # Ensure only one of child or student is set
        if (self.child is None and self.student is None) or (self.child is not None and self.student is not None):
            raise ValidationError(
                "Must specify exactly one of child or student.")

        # Ensure exactly one course type is set
        if (self.course is None and self.online_course is None) or (self.course is not None and self.online_course is not None):
            raise ValidationError(
                "Must specify exactly one of course or online_course.")

        """ if (self.get_participant() is not None and
                self.course_instance.is_participant_eligible(self.get_participant()) is False):
            raise ValidationError("هذا المستخدم ليس طالبًا") """

    def get_payments(self):
        """Return queryset of payments for this enrollment (payments app)."""
        from .payment import Payment
        return Payment.objects.filter(enrollment=self)

    def amount_paid(self):
        """Calculate total amount paid for this enrollment."""
        qs = self.get_payments().filter(status="paid")
        total = qs.aggregate(total=models.Sum("amount"))["total"] or 0
        return total

    @property
    def course_instance(self):
        """Proxy property returning whichever course this enrollment belongs to."""
        return self.course if self.course is not None else self.online_course

    def get_course_instance(self):
        """Method wrapper for proxy property."""
        return self.course_instance

    @property
    def is_online(self):
        """Whether this is an online course enrollment."""
        return self.online_course is not None

    def remaining_amount(self):
        """Calculate remaining amount to be paid for this enrollment."""
        target = self.get_course_instance()
        if not target:
            return 0
        return float(target.price) - float(self.amount_paid())

    def mark_refunded(self, refunded_by):
        """
        Mark enrollment as refunded — used when refund approved and processed.
        This method will decrement course.enrolled_count.
        """
        if self.status == EnrollmentStatus.REFUNDED:
            return
        self.update_status(EnrollmentStatus.REFUNDED)

    def update_status(self, new_status):
        """Update enrollment status with timestamp management."""
        valid_transitions = {
            EnrollmentStatus.ACTIVE: [EnrollmentStatus.COMPLETED, EnrollmentStatus.DROPPED, EnrollmentStatus.SUSPENDED, EnrollmentStatus.REFUNDED],
            EnrollmentStatus.SUSPENDED: [EnrollmentStatus.ACTIVE, EnrollmentStatus.DROPPED, EnrollmentStatus.REFUNDED],
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

    def should_be_completed(self):
        """
        Check if this enrollment should be automatically marked as completed.

        Returns True if:
        1. The course end_date has passed (if end_date is set), OR
        2. All scheduled lectures have been completed (if num_lectures is set)

        Only applies to ACTIVE enrollments.
        """
        if self.status != EnrollmentStatus.ACTIVE:
            return False

        today = timezone.localdate()

        # Check 1: Course end_date has passed
        target = self.get_course_instance()
        if not target:
            return False
        # Online courses don't auto-complete by date
        if self.is_online:
            return False

        if hasattr(target, 'end_date') and target.end_date and target.end_date < today:
            return True

        # Check 2: All lectures are completed
        if hasattr(target, 'num_lectures') and target.num_lectures:
            from courses.models.lecture import LectureStatus

            total_lectures = target.lectures.count()
            completed_lectures = target.lectures.filter(
                status=LectureStatus.COMPLETED
            ).count()

            # If we have the expected number of lectures and all are completed
            if total_lectures >= target.num_lectures and completed_lectures >= target.num_lectures:
                return True

        return False

    def get_completion_progress(self):
        """
        Get the completion progress of this enrollment.

        Returns a dict with:
        - total_lectures: Total number of lectures in course
        - completed_lectures: Number of completed lectures
        - percentage: Completion percentage (0-100)
        - end_date_passed: Whether course end date has passed
        - is_completable: Whether enrollment can be marked as completed
        """
        from courses.models.lecture import LectureStatus

        today = timezone.localdate()
        target = self.get_course_instance()
        if not target:
            return {}

        if self.is_online:
            from courses_online.models import VideoWatchProgress
            total = target.video_lectures.count()
            completed = VideoWatchProgress.objects.filter(
                lecture__course=target,
                student=self.student,
                child=self.child,
                is_completed=True
            ).count()
            percentage = (completed / total * 100) if total > 0 else 0
            
            return {
                'total_lectures': total,
                'expected_lectures': total,
                'completed_lectures': completed,
                'percentage': round(percentage, 1),
                'end_date_passed': False,
                'course_end_date': None,
                'is_completable': (total > 0 and completed == total),
            }

        total_lectures = target.lectures.count()
        completed_lectures = target.lectures.filter(
            status=LectureStatus.COMPLETED
        ).count()

        expected_lectures = target.num_lectures or total_lectures
        percentage = (completed_lectures / expected_lectures *
                      100) if expected_lectures > 0 else 0

        end_date_passed = bool(
            hasattr(target, 'end_date') and target.end_date and target.end_date < today)

        return {
            'total_lectures': total_lectures,
            'expected_lectures': expected_lectures,
            'completed_lectures': completed_lectures,
            'percentage': round(percentage, 1),
            'end_date_passed': end_date_passed,
            'course_end_date': getattr(target, 'end_date', None),
            'is_completable': self.should_be_completed(),
        }

    def save(self, *args, **kwargs):
        """Override save to ensure clean is called."""
        self.full_clean()  # Call clean method before saving
        super().save(*args, **kwargs)

    def __str__(self):
        """String representation of the Enrollment."""
        participant = self.get_participant() or 'Unknown'
        target = self.get_course_instance()
        return f"إلتحاق {participant} في {target}"
