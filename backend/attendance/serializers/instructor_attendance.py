#!/usr/bin/env python3
"""Serializers for instructor attendance (fingerprint devices and admin dashboard)."""

from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from attendance.models import (
    InstructorAttendance,
    AttendanceDevice,
    SupervisorSchedule,
    CheckInMethod,
)
from courses.models import CourseSchedule
from users.models import Instructor


class AttendanceDeviceSerializer(serializers.ModelSerializer):
    """Serializer for AttendanceDevice model."""

    class Meta:
        model = AttendanceDevice
        fields = ["id", "device_id", "name", "location", "is_active"]
        read_only_fields = ["id"]


class FingerprintCheckInSerializer(serializers.Serializer):
    """
    Serializer for fingerprint check-in requests from devices.

    The fingerprint device sends the fingerprint_id which maps to an instructor.
    """

    fingerprint_id = serializers.CharField(
        max_length=100, help_text=_("The unique fingerprint ID from the device")
    )
    device_id = serializers.CharField(
        max_length=50, help_text=_("The ID of the attendance device")
    )
    method = serializers.ChoiceField(
        choices=CheckInMethod.choices,
        default=CheckInMethod.FINGERPRINT,
        help_text=_("The check-in method used"),
    )

    def validate_fingerprint_id(self, value):
        """Validate that the fingerprint_id maps to an instructor."""
        try:
            instructor = Instructor.objects.get(fingerprint_id=value)
        except Instructor.DoesNotExist:
            raise serializers.ValidationError(
                _("No instructor found with this fingerprint ID.")
            )
        return value

    def validate_device_id(self, value):
        """Validate that the device exists and is active."""
        try:
            device = AttendanceDevice.objects.get(device_id=value, is_active=True)
        except AttendanceDevice.DoesNotExist:
            raise serializers.ValidationError(_("Invalid or inactive device."))
        return value


class FingerprintCheckOutSerializer(FingerprintCheckInSerializer):
    """Serializer for fingerprint check-out requests from devices."""

    pass  # Same validation as check-in


class FingerprintScanSerializer(serializers.Serializer):
    """
    Unified serializer for fingerprint scans from devices.

    The device just captures fingerprints without specifying if it's check-in or check-out.
    The system will intelligently determine the action based on current state.

    Logic:
    1. No attendance record for today → Auto-create and check-in
    2. Has record but not checked-in → Check-in
    3. Checked-in but not out → Check-out
    4. Already checked out → Re-entry (creates new scan log, updates check-out to null)
    """

    fingerprint_id = serializers.CharField(
        max_length=100, help_text=_("The unique fingerprint ID from the device")
    )
    device_id = serializers.CharField(
        max_length=50, help_text=_("The ID of the attendance device")
    )
    timestamp = serializers.DateTimeField(
        required=False,
        help_text=_(
            "Optional timestamp from device (for offline sync). Defaults to server time if not provided."
        ),
    )

    def validate_fingerprint_id(self, value):
        """Validate that the fingerprint_id maps to an instructor."""
        try:
            instructor = Instructor.objects.get(fingerprint_id=value)
            self.context["instructor"] = instructor
        except Instructor.DoesNotExist:
            raise serializers.ValidationError(
                _("No instructor found with this fingerprint ID.")
            )
        return value

    def validate_device_id(self, value):
        """Validate that the device exists and is active."""
        try:
            device = AttendanceDevice.objects.get(device_id=value, is_active=True)
            self.context["device"] = device
        except AttendanceDevice.DoesNotExist:
            raise serializers.ValidationError(_("Invalid or inactive device."))
        return value


class FingerprintScanLogSerializer(serializers.ModelSerializer):
    """Serializer for fingerprint scan log entries."""

    instructor_name = serializers.CharField(
        source="attendance.instructor.user.get_full_name", read_only=True
    )

    class Meta:
        from attendance.models import FingerprintScanLog

        model = FingerprintScanLog
        fields = [
            "id",
            "attendance",
            "instructor_name",
            "scan_time",
            "device",
            "action",
            "is_processed",
            "notes",
        ]
        read_only_fields = ["id", "scan_time"]


class InstructorAttendanceSerializer(serializers.ModelSerializer):
    """Serializer for InstructorAttendance model."""

    instructor_name = serializers.CharField(
        source="instructor.user.get_full_name", read_only=True
    )
    instructor_type = serializers.CharField(
        source="instructor.get_type_display", read_only=True
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    attendance_type_display = serializers.CharField(
        source="get_attendance_type_display", read_only=True
    )
    rated_by_name = serializers.CharField(
        source="rated_by.get_full_name", read_only=True, allow_null=True
    )
    lecture_title = serializers.CharField(
        source="lecture.title", read_only=True, allow_null=True
    )
    schedule_info = serializers.SerializerMethodField()

    class Meta:
        model = InstructorAttendance
        fields = [
            "id",
            "instructor",
            "instructor_name",
            "instructor_type",
            "date",
            "check_in_time",
            "check_out_time",
            "check_in_method",
            "check_out_method",
            "status",
            "status_display",
            "attendance_type",
            "attendance_type_display",
            "schedule",
            "schedule_info",
            "lecture",
            "lecture_title",
            "season",
            "rating",
            "rated_by",
            "rated_by_name",
            "rated_at",
            "notes",
        ]
        read_only_fields = [
            "id",
            "check_in_time",
            "check_out_time",
            "check_in_method",
            "check_out_method",
            "check_in_device",
            "check_out_device",
        ]

    def get_schedule_info(self, obj):
        """Get readable schedule information."""
        if obj.schedule:
            return {
                "day": obj.schedule.get_day_of_week_display(),
                "start_time": str(obj.schedule.start_time),
                "end_time": str(obj.schedule.end_time),
            }
        return None


class InstructorAttendanceListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing attendance records."""

    instructor_name = serializers.CharField(
        source="instructor.user.get_full_name", read_only=True
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    attendance_type_display = serializers.CharField(
        source="get_attendance_type_display", read_only=True
    )

    scheduled_check_in_time = serializers.SerializerMethodField(read_only=True)

    scheduled_check_out_time = serializers.SerializerMethodField(read_only=True)

    lecture_info = serializers.SerializerMethodField(read_only=True)

    def get_scheduled_check_in_time(self, obj: InstructorAttendance):
        if obj.schedule:
            return obj.schedule.start_time

        if obj.lecture:
            return obj.lecture.start_time

        return None

    def get_scheduled_check_out_time(self, obj: InstructorAttendance):
        if obj.schedule:
            return obj.schedule.end_time

        if obj.lecture:
            return obj.lecture.end_time

        return None

    def get_lecture_info(self, obj: InstructorAttendance):
        if obj.lecture:
            return {
                "lecture_title": obj.lecture.title,
                "course_title": obj.lecture.course.name,
            }

        return None

    class Meta:
        model = InstructorAttendance
        fields = [
            "id",
            "instructor",
            "instructor_name",
            "lecture_info",
            "date",
            "scheduled_check_in_time",
            "scheduled_check_out_time",
            "check_in_time",
            "check_out_time",
            "status",
            "status_display",
            "attendance_type",
            "attendance_type_display",
            "rating",
        ]


class RateInstructorSerializer(serializers.Serializer):
    """Serializer for rating an instructor's attendance."""

    rating = serializers.DecimalField(
        max_digits=4,
        decimal_places=2,
        min_value=1,
        max_value=10,
        help_text=_("Rating value between 1.00 and 10.00"),
    )
    notes = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        help_text=_("Optional notes about the rating"),
    )


class SupervisorScheduleSerializer(serializers.ModelSerializer):
    """Serializer for SupervisorSchedule model."""

    instructor_name = serializers.CharField(
        source="instructor.user.get_full_name", read_only=True
    )
    day_display = serializers.CharField(
        source="get_day_of_week_display", read_only=True
    )

    class Meta:
        model = SupervisorSchedule
        fields = [
            "id",
            "instructor",
            "instructor_name",
            "day_of_week",
            "day_display",
            "start_time",
            "end_time",
            "grace_period_minutes",
            "auto_absent_after_minutes",
        ]


class TodayAttendanceSummarySerializer(serializers.Serializer):
    """Serializer for daily attendance summary statistics."""

    date = serializers.DateField()
    total_expected = serializers.IntegerField()
    checked_in = serializers.IntegerField()
    checked_out = serializers.IntegerField()
    present = serializers.IntegerField()
    late = serializers.IntegerField()
    absent = serializers.IntegerField()
    pending = serializers.IntegerField()
    not_started = serializers.IntegerField()
    lecture_attendance_count = serializers.IntegerField()
    supervision_attendance_count = serializers.IntegerField()


class GenerateAttendanceSerializer(serializers.Serializer):
    """
    Serializer for the attendance generation endpoint.

    Allows superusers to manually generate attendance records for a date range.
    """
    start_date = serializers.DateField(
        help_text="Start date for generating attendance records (YYYY-MM-DD)"
    )
    end_date = serializers.DateField(
        help_text="End date for generating attendance records (YYYY-MM-DD)"
    )
    season_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="Optional: Season ID. If not provided, uses the active season."
    )

    def validate(self, data):
        """Validate the date range."""
        start_date = data.get('start_date')
        end_date = data.get('end_date')

        if start_date > end_date:
            raise serializers.ValidationError({
                'end_date': 'End date must be on or after start date.'
            })

        # Limit to maximum 30 days to prevent accidental large generations
        from datetime import timedelta
        if (end_date - start_date).days > 30:
            raise serializers.ValidationError({
                'end_date': 'Date range cannot exceed 30 days.'
            })

        return data


class InstructorCourseScheduleSerializer(serializers.ModelSerializer):
    """
    Serializer for CourseSchedule entries scoped to an instructor.

    Used in the my-schedule endpoint to surface lecture-day schedules
    alongside supervision schedules.  All related objects are fetched
    via select_related in the view so no extra queries are issued here.
    """

    course_id = serializers.IntegerField(source="course.id", read_only=True)
    course_name = serializers.CharField(source="course.name", read_only=True)
    season_id = serializers.IntegerField(
        source="course.season.id", read_only=True, allow_null=True
    )
    season_name = serializers.CharField(
        source="course.season.name", read_only=True, allow_null=True
    )
    weekday_display = serializers.CharField(
        source="get_weekday_display", read_only=True
    )

    class Meta:
        model = CourseSchedule
        fields = [
            "id",
            "course_id",
            "course_name",
            "season_id",
            "season_name",
            "weekday",
            "weekday_display",
            "start_time",
            "end_time",
        ]
