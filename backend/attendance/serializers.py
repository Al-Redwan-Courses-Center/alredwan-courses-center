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
from .models.lecture_attendance import LectureAttendance
from courses.models.lecture import Lecture
from parents.models import Child
from users.models import Instructor, StudentUser


# =============================================================================
# Lecture Attendance Serializers (for students/children)
# =============================================================================

class MarkAttendanceSerializer(serializers.Serializer):
    """Serializer for marking attendance for a student or child."""
    
    lecture_id = serializers.IntegerField(
        help_text="ID of the lecture"
    )
    code = serializers.CharField(
        max_length=50,
        help_text="The unique code of the student or child (e.g., 'M64793')"
    )
    participant_type = serializers.ChoiceField(
        choices=['student', 'child'],
        help_text="Type of participant: 'student' or 'child'"
    )
    rating = serializers.IntegerField(
        min_value=1,
        max_value=10,
        required=True,
        help_text="Rating from 1 to 10 (required when marking attendance)"
    )
    notes = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        help_text="Optional notes about the attendance"
    )

    def validate_lecture_id(self, value):
        """Validate that the lecture exists."""
        try:
            lecture = Lecture.objects.get(id=value)
            self.context['lecture'] = lecture
            return value
        except Lecture.DoesNotExist:
            raise serializers.ValidationError("Lecture not found.")

    def validate(self, data):
        """Validate the attendance marking request."""
        lecture = self.context.get('lecture')
        code = data.get('code')
        participant_type = data.get('participant_type')
        
        if not lecture:
            raise serializers.ValidationError("Invalid lecture.")
        
        # Find the participant based on type and code
        participant = None
        attendance = None
        
        if participant_type == 'child':
            try:
                participant = Child.objects.get(code=code)
                # Get or check the attendance record
                attendance = LectureAttendance.objects.filter(
                    lecture=lecture,
                    child=participant
                ).first()
            except Child.DoesNotExist:
                raise serializers.ValidationError(f"Child with code '{code}' not found.")
        
        elif participant_type == 'student':
            try:
                participant = StudentUser.objects.get(code=code)
                # Get or check the attendance record
                attendance = LectureAttendance.objects.filter(
                    lecture=lecture,
                    student=participant
                ).first()
            except StudentUser.DoesNotExist:
                raise serializers.ValidationError(f"Student with code '{code}' not found.")
        
        if not attendance:
            raise serializers.ValidationError(
                f"No attendance record found for this {participant_type} in this lecture. "
                "The attendance record must be created first."
            )
        
        # Store for later use
        self.context['attendance'] = attendance
        self.context['participant'] = participant
        
        # Check if marking is allowed for this lecture (unless user is admin)
        request = self.context.get('request')
        user = request.user if request else None
        
        if user and not user.is_staff:  # Non-admin users must respect time window
            if not LectureAttendance.can_mark_now(lecture):
                raise serializers.ValidationError(
                    "Attendance can only be marked within the allowed time window "
                    "(from 24 hours before lecture start until 24 hours after)."
                )
        
        return data


class LectureAttendanceSerializer(serializers.ModelSerializer):
    """Serializer for reading LectureAttendance records."""
    
    participant_name = serializers.SerializerMethodField()
    participant_type = serializers.SerializerMethodField()
    participant_code = serializers.SerializerMethodField()
    lecture_title = serializers.CharField(source='lecture.title', read_only=True)
    marked_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = LectureAttendance
        fields = [
            'id', 'lecture', 'lecture_title', 'child', 'student',
            'participant_name', 'participant_type', 'participant_code',
            'present', 'rating', 'notes', 'marked_by', 'marked_by_name',
            'marked_at', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'marked_by', 'marked_at', 'created_at', 'updated_at'
        ]
    
    def get_participant_name(self, obj):
        """Get the name of the participant (child or student)."""
        if obj.child:
            return obj.child.first_name
        elif obj.student and obj.student.user:
            return obj.student.user.get_full_name() or obj.student.user.username
        return "Unknown"
    
    def get_participant_type(self, obj):
        """Get the type of participant."""
        return "child" if obj.child else "student"
    
    def get_participant_code(self, obj):
        """Get the code of the participant."""
        if obj.child:
            return obj.child.code
        elif obj.student:
            return obj.student.code
        return None
    
    def get_marked_by_name(self, obj):
        """Get the name of the user who marked the attendance."""
        if obj.marked_by:
            return obj.marked_by.get_full_name() or obj.marked_by.username
        return None


# =============================================================================
# Instructor Attendance Serializers (for fingerprint devices)
# =============================================================================

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
