#!/usr/bin/env python3
"""Model for tracking fingerprint scan logs."""

from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone


class ScanAction(models.TextChoices):
    """Action type determined by the system for each scan."""
    CHECK_IN = "check_in", _("تسجيل دخول")
    CHECK_OUT = "check_out", _("تسجيل خروج")
    RE_ENTRY = "re_entry", _("إعادة دخول بعد خروج")
    IGNORED = "ignored", _("تم تجاهله (مكرر)")
    AUTO_CREATED = "auto_created", _("إنشاء تلقائي للحضور")


class FingerprintScanLog(models.Model):
    """
    Log of all fingerprint scans from devices.
    
    This model captures every scan, regardless of action, for:
    - Audit trail
    - Debugging device issues
    - Tracking unusual patterns (e.g., many scans in short time)
    - Offline sync support
    
    The system determines the action based on current attendance state.
    """
    
    attendance = models.ForeignKey(
        'attendance.InstructorAttendance',
        on_delete=models.CASCADE,
        related_name='scan_logs',
        verbose_name=_("سجل الحضور"),
        null=True,
        blank=True,
        help_text=_("قد يكون فارغاً إذا فشل إنشاء سجل الحضور")
    )
    
    instructor = models.ForeignKey(
        'users.Instructor',
        on_delete=models.CASCADE,
        related_name='fingerprint_scans',
        verbose_name=_("المعلم/المشرف")
    )
    
    scan_time = models.DateTimeField(
        default=timezone.now,
        verbose_name=_("وقت البصمة"),
        help_text=_("الوقت الفعلي للبصمة (قد يختلف عن وقت المعالجة في حالة الoffline)")
    )
    
    received_time = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("وقت الاستلام"),
        help_text=_("وقت وصول البصمة للسيرفر")
    )
    
    device = models.ForeignKey(
        'attendance.AttendanceDevice',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='scan_logs',
        verbose_name=_("الجهاز")
    )
    
    action = models.CharField(
        max_length=20,
        choices=ScanAction.choices,
        verbose_name=_("الإجراء"),
        help_text=_("الإجراء الذي تم تحديده بواسطة النظام")
    )
    
    is_processed = models.BooleanField(
        default=True,
        verbose_name=_("تمت المعالجة"),
        help_text=_("هل تم تطبيق هذا السجل على سجل الحضور؟")
    )
    
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("ملاحظات"),
        help_text=_("ملاحظات إضافية أو سبب التجاهل")
    )
    
    # For offline sync - device may send batch of scans
    device_sequence = models.IntegerField(
        null=True,
        blank=True,
        verbose_name=_("تسلسل الجهاز"),
        help_text=_("رقم التسلسل من الجهاز لتتبع الترتيب")
    )
    
    class Meta:
        verbose_name = _("سجل بصمة")
        verbose_name_plural = _("سجلات البصمات")
        ordering = ['-scan_time']
        indexes = [
            models.Index(fields=['instructor', 'scan_time']),
            models.Index(fields=['attendance']),
            models.Index(fields=['device', 'scan_time']),
            models.Index(fields=['action']),
        ]
    
    def __str__(self):
        return f"{self.instructor} - {self.get_action_display()} @ {self.scan_time}"
    
    @classmethod
    def get_recent_scans(cls, instructor, minutes=5):
        """
        Get recent scans for an instructor within the last N minutes.
        Used to detect rapid repeated scans.
        """
        cutoff = timezone.now() - timezone.timedelta(minutes=minutes)
        return cls.objects.filter(
            instructor=instructor,
            scan_time__gte=cutoff
        ).order_by('-scan_time')
