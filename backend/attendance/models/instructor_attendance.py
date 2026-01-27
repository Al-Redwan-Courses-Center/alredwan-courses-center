from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from courses.models import Lecture, Weekday
from users.models import CustomUser, Instructor


class SupervisorSchedule(models.Model):
    instructor = models.ForeignKey(
        Instructor,
        on_delete=models.CASCADE,
        related_name="attendance_supervisor_schedules",
        verbose_name=_("المعلم/المشرف")
    )
    day_of_week = models.PositiveSmallIntegerField(choices=Weekday.choices, verbose_name=_("يوم الأسبوع"))
    start_time = models.TimeField(verbose_name=_("وقت البدء"))
    end_time = models.TimeField(verbose_name=_("وقت الانتهاء"))

    grace_period_minutes = models.PositiveIntegerField(default=20, verbose_name=_("دقائق فترة السماح"))
    auto_absent_after_minutes = models.PositiveIntegerField(default=60, verbose_name=_("دقائق الغياب التلقائي"))
    class Meta:
        unique_together = ("instructor", "day_of_week")
        verbose_name = "سجل حضور مدرس/مشرف"
        verbose_name_plural = "سجلات حضور المدرسين/المشرفين"

    def clean(self):
        """Ensure that end_time is after start_time."""
        if self.start_time >= self.end_time:
            raise ValidationError(
                {"end_time": _("End time must be after start time.")}
            )

    def __str__(self):
        return f"{self.instructor} — {self.get_day_of_week_display()} {self.start_time}-{self.end_time}"


class AttendanceStatus(models.TextChoices):
    PENDING = "pending", _("منتظر")
    PRESENT = "present", _("حاضر")
    ABSENT = "absent", _("غائب")
    LATE = "late", _("متأخر")
    NOT_STARTED = 'not_started', _('لم يبدأ')

class InstructorAttendance(models.Model):
    """Track attendance and rating of instructors (check-in/check-out)."""

    instructor = models.ForeignKey(
        Instructor, on_delete=models.CASCADE, related_name="attendance_records",
        verbose_name=_("المعلم/المشرف")
    )
    date = models.DateField(default=timezone.localdate, verbose_name=_("التاريخ"))
    check_in_time = models.DateTimeField(null=True, blank=True, verbose_name=_("وقت تسجيل الدخول"))
    check_out_time = models.DateTimeField(null=True, blank=True, verbose_name=_("وقت تسجيل الخروج"))

    check_in_method = models.CharField(
        max_length=20, null=True, blank=True, verbose_name=_("طريقة تسجيل الدخول")
    )  # fingerprint, RFID, admin

    status = models.CharField(
        max_length=20,
        choices=AttendanceStatus.choices,
        default=AttendanceStatus.NOT_STARTED,
        verbose_name=_("الحالة")
    )
    schedule = models.ForeignKey(
        SupervisorSchedule,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="attendances",
        help_text=_("يوم جدول زمني مرتبط إذا كان هذا المدرب مشرفًا."),
    )
    lecture = models.ForeignKey(
        Lecture, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='instructor_attendances'
    )

    check_in_device = models.ForeignKey(
        "attendance.AttendanceDevice", on_delete=models.SET_NULL,
        null=True, blank=True
    )
    season = models.ForeignKey(
        "courses.Season",
        on_delete=models.CASCADE,
        related_name="instructor_attendance",
        verbose_name=_("الموسم")
    )
    
    # Rating: null if absent/not_started, 0 if attended (default), then admin can update
    rating = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        verbose_name=_("التقييم (1.00 - 10.00)"),
        validators=[MinValueValidator(0.00), MaxValueValidator(10.00)],
        null=True,
        blank=True,
        help_text=_("null للغائب، 0 للحاضر بدون تقييم، 1-10 للتقييم الفعلي")
    )

    rated_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="given_instructor_ratings",
        verbose_name=_("تم التقييم بواسطة"),
        help_text=_("المشرف/الأدمن الذي قام بتقييم هذا المعلم."),
    )
    
    rated_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("وقت التقييم"),
        help_text=_("تاريخ ووقت إضافة/تحديث التقييم")
    )
    
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("ملاحظات عامة")
    )

    class Meta:
        verbose_name = _("سجل حضور معلم/مشرف")
        verbose_name_plural = _("سجلات حضور المعلمين/المشرفين")
        unique_together = ("instructor", "date")
        indexes = [
            models.Index(fields=["instructor", "date"]),
            models.Index(fields=["season"]),
            models.Index(fields=["rated_by"]),
        ]

    def __str__(self):
        rating_display = f"{self.rating}/10" if self.rating is not None else "لم يتم التقييم"
        return f"{self.instructor} - {rating_display} on {self.date}"

    def clean(self):
        """Validate rating based on attendance status."""
        # If absent, not started, or pending, rating MUST be null
        if self.status in [AttendanceStatus.ABSENT, AttendanceStatus.NOT_STARTED, AttendanceStatus.PENDING]:
            if self.rating is not None:
                raise ValidationError({
                    'rating': _("لا يمكن تقييم المعلم الغائب أو الذي لم يبدأ. يجب أن يكون التقييم فارغاً.")
                })
        
        # If present or late, rating can be None (not rated), 0 (attended but not rated), or 1-10
        elif self.status in [AttendanceStatus.PRESENT, AttendanceStatus.LATE]:
            # If rating is provided and not 0, it must be between 1 and 10
            if self.rating is not None and self.rating > 0:
                if self.rating < 1 or self.rating > 10:
                    raise ValidationError({
                        'rating': _("التقييم يجب أن يكون بين 1.00 و 10.00")
                    })
                # If rating is provided (not 0), rated_by should also be provided
                if not self.rated_by:
                    raise ValidationError({
                        'rated_by': _("يجب تحديد المقيّم عند إضافة التقييم.")
                    })

    def save(self, *args, **kwargs):
        """Override save to automatically set rating based on attendance status."""
        # Ensure date is date only (no time component)
        if isinstance(self.date, timezone.datetime):
            self.date = self.date.date()
        
        # Auto-set rating based on status
        if self.status in [AttendanceStatus.ABSENT, AttendanceStatus.NOT_STARTED, AttendanceStatus.PENDING]:
            # If absent or not started, rating should be null
            if self.rating == 0:
                self.rating = None
        elif self.status in [AttendanceStatus.PRESENT, AttendanceStatus.LATE]:
            # If present or late, and rating is null, set it to 0 (not rated yet)
            if self.rating is None:
                self.rating = 0.00
        
        super().save(*args, **kwargs)

    def broadcast_update(self):
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "attendance_live",
            {
                "type": "attendance_update",
                "data": {
                    "instructor": self.instructor.user.get_full_name(),
                    "id": self.id,
                    "time": str(self.check_in_time),
                    "status": self.status,
                    "date": str(self.date),
                },
            },
        )

    def mark_checked_in(self, device=None, method="fingerprint"):
        now = timezone.now()
        self.check_in_time = now
        self.check_in_device = device
        self.check_in_method = method

        if self.schedule:
            shift_start = timezone.make_aware(
                timezone.datetime.combine(self.date, self.schedule.start_time)
            )
            if now > shift_start + timezone.timedelta(
                minutes=self.schedule.grace_period_minutes
            ):
                self.status = AttendanceStatus.LATE
            else:
                self.status = AttendanceStatus.PRESENT
        else:
            # If no schedule linked → treat as present by default
            self.status = AttendanceStatus.PRESENT
        
        # Set rating to 0 when instructor attends (not rated yet)
        self.rating = 0.00

        self.save()
        self.broadcast_update()

    def mark_checked_out(self):
        self.check_out_time = timezone.now()
        self.save()
        self.broadcast_update()

    def mark_absent(self):
        """Mark the instructor as absent for the day."""
        self.status = AttendanceStatus.ABSENT
        # Set rating to null for absent instructors
        self.rating = None
        self.rated_by = None
        self.rated_at = None
        self.save()

    def add_rating(self, value: float, admin_user: CustomUser, notes: str = None):
        """
        Add or update rating for an instructor who attended.
        Can only rate instructors who are present or late.
        Admin can update rating multiple times (last one wins).
        
        Args:
            value: Rating value between 1.00 and 10.00
            admin_user: The admin user adding the rating
            notes: Optional notes/comments about the rating
        
        Raises:
            ValidationError: If trying to rate absent instructor or invalid rating
        """
        # Validate that instructor attended
        if self.status in [AttendanceStatus.ABSENT, AttendanceStatus.NOT_STARTED, AttendanceStatus.PENDING]:
            raise ValidationError(
                _("لا يمكن تقييم المعلم الذي لم يحضر. الحالة الحالية: {}").format(
                    self.get_status_display()
                )
            )
        
        # Validate rating range
        if value < 1.00 or value > 10.00:
            raise ValidationError(
                _("التقييم يجب أن يكون بين 1.00 و 10.00")
            )
        
        # Update rating fields
        self.rating = value
        self.rated_by = admin_user
        self.rated_at = timezone.now()
        self.notes = notes
        
        self.save()
        return self

    @classmethod
    def generate_for_date_range(cls, start_date, end_date, season=None):
        """
        Generate attendance records for:
        - Supervisors based on their weekly schedules
        - Instructors assigned to lectures within the date range
        
        Args:
            start_date: Start date for the range
            end_date: End date for the range
            season: Optional Season instance. If not provided, uses the active season.
        """
        from datetime import timedelta
        from courses.models import Lecture, Season as SeasonModel

        # Get the active season if not provided
        if season is None:
            season = SeasonModel.objects.filter(is_active=True).first()
            if season is None:
                # No active season found, cannot create attendance records
                return 0

        created_count = 0
        current_date = start_date

        while current_date <= end_date:

            # Supervisors: Generate based on weekly schedule
            weekday = current_date.weekday()
            for schedule in SupervisorSchedule.objects.filter(day_of_week=weekday):
                obj, created = cls.objects.get_or_create(
                    instructor=schedule.instructor,
                    date=current_date,
                    defaults={
                        "schedule": schedule,
                        "status": AttendanceStatus.NOT_STARTED,
                        "season": season
                    }
                )
                if created:
                    created_count += 1

            # Normal instructors: Assign based on lectures that date
            for lecture in Lecture.objects.filter(day=current_date):
                obj, created = cls.objects.get_or_create(
                    instructor=lecture.instructor,
                    date=current_date,
                    defaults={
                        "lecture": lecture,
                        "status": AttendanceStatus.NOT_STARTED,
                        "season": season
                    }
                )
                if created:
                    created_count += 1

            current_date += timedelta(days=1)

        return created_count

    @classmethod
    def generate_weekly(cls):
        today = timezone.localdate()
        start = today
        end = today + timezone.timedelta(days=7)
        return cls.generate_for_date_range(start, end)
