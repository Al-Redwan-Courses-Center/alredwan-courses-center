#!/usr/bin/env python3
"""Serializers for the attendance app."""

from rest_framework import serializers
from django.utils.translation import gettext_lazy as _

from .models import (
    InstructorAttendance,
    AttendanceDevice,
    SupervisorSchedule,
    AttendanceStatus,
    AttendanceType,
    CheckInMethod,
)
from users.models import Instructor


class AttendanceDeviceSerializer(serializers.ModelSerializer):
    """Serializer for AttendanceDevice model."""

    class Meta:
        model = AttendanceDevice
        fields = ['id', 'device_id', 'name', 'location', 'is_active']
        read_only_fields = ['id']


class FingerprintCheckInSerializer(serializers.Serializer):
    """
    Serializer for fingerprint check-in requests from devices.

    The fingerprint device sends the fingerprint_id which maps to an instructor.
    """
    fingerprint_id = serializers.CharField(
        max_length=100,
        help_text=_("The unique fingerprint ID from the device")
    )
    device_id = serializers.CharField(
        max_length=50,
        help_text=_("The ID of the attendance device")
    )
    method = serializers.ChoiceField(
        choices=CheckInMethod.choices,
        default=CheckInMethod.FINGERPRINT,
        help_text=_("The check-in method used")
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
            device = AttendanceDevice.objects.get(
                device_id=value, is_active=True)
        except AttendanceDevice.DoesNotExist:
            raise serializers.ValidationError(
                _("Invalid or inactive device.")
            )
        return value


class FingerprintCheckOutSerializer(FingerprintCheckInSerializer):
    """Serializer for fingerprint check-out requests from devices."""
    pass  # Same validation as check-in


class InstructorAttendanceSerializer(serializers.ModelSerializer):
    """Serializer for InstructorAttendance model."""

    instructor_name = serializers.CharField(
        source='instructor.user.get_full_name',
        read_only=True
    )
    instructor_type = serializers.CharField(
        source='instructor.get_type_display',
        read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True
    )
    attendance_type_display = serializers.CharField(
        source='get_attendance_type_display',
        read_only=True
    )
    rated_by_name = serializers.CharField(
        source='rated_by.get_full_name',
        read_only=True,
        allow_null=True
    )
    lecture_title = serializers.CharField(
        source='lecture.title',
        read_only=True,
        allow_null=True
    )
    schedule_info = serializers.SerializerMethodField()

    class Meta:
        model = InstructorAttendance
        fields = [
            'id',
            'instructor',
            'instructor_name',
            'instructor_type',
            'date',
            'check_in_time',
            'check_out_time',
            'check_in_method',
            'check_out_method',
            'status',
            'status_display',
            'attendance_type',
            'attendance_type_display',
            'schedule',
            'schedule_info',
            'lecture',
            'lecture_title',
            'season',
            'rating',
            'rated_by',
            'rated_by_name',
            'rated_at',
            'notes',
        ]
        read_only_fields = [
            'id',
            'check_in_time',
            'check_out_time',
            'check_in_method',
            'check_out_method',
            'check_in_device',
            'check_out_device',
        ]

    def get_schedule_info(self, obj):
        """Get readable schedule information."""
        if obj.schedule:
            return {
                'day': obj.schedule.get_day_of_week_display(),
                'start_time': str(obj.schedule.start_time),
                'end_time': str(obj.schedule.end_time),
            }
        return None


class InstructorAttendanceListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing attendance records."""

    instructor_name = serializers.CharField(
        source='instructor.user.get_full_name',
        read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True
    )
    attendance_type_display = serializers.CharField(
        source='get_attendance_type_display',
        read_only=True
    )

    class Meta:
        model = InstructorAttendance
        fields = [
            'id',
            'instructor',
            'instructor_name',
            'date',
            'check_in_time',
            'check_out_time',
            'status',
            'status_display',
            'attendance_type',
            'attendance_type_display',
            'rating',
        ]


class RateInstructorSerializer(serializers.Serializer):
    """Serializer for rating an instructor's attendance."""

    rating = serializers.DecimalField(
        max_digits=4,
        decimal_places=2,
        min_value=1,
        max_value=10,
        help_text=_("Rating value between 1.00 and 10.00")
    )
    notes = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        help_text=_("Optional notes about the rating")
    )


class SupervisorScheduleSerializer(serializers.ModelSerializer):
    """Serializer for SupervisorSchedule model."""

    instructor_name = serializers.CharField(
        source='instructor.user.get_full_name',
        read_only=True
    )
    day_display = serializers.CharField(
        source='get_day_of_week_display',
        read_only=True
    )

    class Meta:
        model = SupervisorSchedule
        fields = [
            'id',
            'instructor',
            'instructor_name',
            'day_of_week',
            'day_display',
            'start_time',
            'end_time',
            'grace_period_minutes',
            'auto_absent_after_minutes',
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
