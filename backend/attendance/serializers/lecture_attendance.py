#!/usr/bin/env python3
"""Serializers for lecture attendance (students/children)."""

from rest_framework import serializers

from attendance.models.lecture_attendance import LectureAttendance
from courses.models.lecture import Lecture
from parents.models import Child
from users.models import StudentUser


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
                participant = Child.objects.get(unique_code=code)
                # Get or check the attendance record
                attendance = LectureAttendance.objects.filter(
                    lecture=lecture,
                    child=participant
                ).first()
            except Child.DoesNotExist:
                raise serializers.ValidationError(
                    f"Child with code '{code}' not found.")

        elif participant_type == 'student':
            try:
                participant = StudentUser.objects.get(unique_code=code)
                # Get or check the attendance record
                attendance = LectureAttendance.objects.filter(
                    lecture=lecture,
                    student=participant
                ).first()
            except StudentUser.DoesNotExist:
                raise serializers.ValidationError(
                    f"Student with code '{code}' not found.")

        if not attendance:
            raise serializers.ValidationError(
                f"No attendance record found for this {participant_type} in this lecture. "
                "The attendance record must be created first."
            )

        # Store for later use
        self.context['attendance'] = attendance
        self.context['participant'] = participant

        # Check if marking is allowed for this lecture (unless user is admin/supervisor)
        request = self.context.get('request')
        user = request.user if request else None

        if user and not self._is_admin_or_supervisor(user):
            # Non-admin/supervisor users must respect time window
            if not LectureAttendance.can_mark_now(lecture):
                raise serializers.ValidationError(
                    "Attendance can only be marked within the allowed time window "
                    "(from 24 hours before lecture start until 24 hours after)."
                )

        return data

    def _is_admin_or_supervisor(self, user):
        """
        Check if user is admin or supervisor (no time restrictions for past lectures).
        Checks: is_superuser, is_staff, role field, and instructor_profile.type
        """
        if user.is_superuser:
            return True
        if user.is_staff:
            return True
        # Check role field for admin or supervisor
        if hasattr(user, 'role') and user.role in ('admin', 'supervisor'):
            return True
        # Check instructor profile type
        if hasattr(user, 'instructor_profile') and user.instructor_profile and user.instructor_profile.type == 'supervisor':
            return True
        return False


class LectureAttendanceSerializer(serializers.ModelSerializer):
    """Serializer for reading LectureAttendance records."""

    participant_name = serializers.SerializerMethodField()
    participant_type = serializers.SerializerMethodField()
    participant_code = serializers.SerializerMethodField()
    lecture_title = serializers.CharField(
        source='lecture.title', read_only=True)
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
            return obj.child.unique_code
        elif obj.student:
            return obj.student.unique_code
        return None

    def get_marked_by_name(self, obj):
        """Get the name of the user who marked the attendance."""
        if obj.marked_by:
            return obj.marked_by.get_full_name() or obj.marked_by.username
        return None


class LectureAttendanceDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for LectureAttendance records.
    Includes full participant information: name, image, age, code, gender.
    """

    participant_name = serializers.SerializerMethodField()
    participant_full_name = serializers.SerializerMethodField()
    participant_type = serializers.SerializerMethodField()
    participant_code = serializers.SerializerMethodField()
    participant_image = serializers.SerializerMethodField()
    participant_age = serializers.SerializerMethodField()
    participant_gender = serializers.SerializerMethodField()
    lecture_title = serializers.CharField(
        source='lecture.title', read_only=True)
    marked_by_name = serializers.SerializerMethodField()

    class Meta:
        model = LectureAttendance
        fields = [
            'id', 'lecture', 'lecture_title',
            'participant_name', 'participant_full_name', 'participant_type',
            'participant_code', 'participant_image', 'participant_age', 'participant_gender',
            'present', 'rating', 'notes', 'marked_by', 'marked_by_name',
            'marked_via', 'marked_at', 'created_at', 'updated_at'
        ]
        read_only_fields = fields

    def get_participant_name(self, obj):
        """Get the first name of the participant (child or student)."""
        if obj.child:
            return obj.child.first_name
        elif obj.student and obj.student.user:
            return obj.student.user.first_name
        return None

    def get_participant_full_name(self, obj):
        """Get the full name of the participant."""
        if obj.child:
            return f"{obj.child.first_name} {obj.child.last_name}"
        elif obj.student and obj.student.user:
            return obj.student.user.get_full_name()
        return None

    def get_participant_type(self, obj):
        """Get the type of participant."""
        return "child" if obj.child else "student"

    def get_participant_code(self, obj):
        """Get the code of the participant."""
        if obj.child:
            return obj.child.unique_code
        elif obj.student:
            return obj.student.unique_code
        return None

    def get_participant_image(self, obj):
        """Get the image URL of the participant."""
        if obj.child and obj.child.image:
            return obj.child.image.url
        elif obj.student and obj.student.image:
            return obj.student.image.url
        return None

    def get_participant_age(self, obj):
        """Get the current age of the participant."""
        from django.utils import timezone
        today = timezone.now().date()

        if obj.child:
            return obj.child.get_age_on_date(today)
        elif obj.student and obj.student.user:
            return obj.student.user.get_age_on_date(today)
        return None

    def get_participant_gender(self, obj):
        """Get the gender of the participant."""
        if obj.child:
            return obj.child.gender
        elif obj.student and obj.student.user:
            return obj.student.user.gender
        return None

    def get_marked_by_name(self, obj):
        """Get the name of the user who marked the attendance."""
        if obj.marked_by:
            return obj.marked_by.get_full_name() or obj.marked_by.username
        return None


# Bulk Attendance Serializers

class BulkAttendanceItemSerializer(serializers.Serializer):
    """Serializer for individual attendance item in bulk request."""

    code = serializers.CharField(
        max_length=50,
        help_text="The unique code of the student or child"
    )
    participant_type = serializers.ChoiceField(
        choices=['student', 'child'],
        help_text="Type of participant: 'student' or 'child'"
    )
    rating = serializers.IntegerField(
        min_value=1,
        max_value=10,
        required=True,
        help_text="Rating from 1 to 10"
    )
    notes = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        default="",
        help_text="Optional notes about the attendance"
    )
    present = serializers.BooleanField(
        default=True,
        help_text="Whether the participant was present (default: True)"
    )


class BulkMarkAttendanceSerializer(serializers.Serializer):
    """Serializer for bulk marking attendance."""

    marked_via = serializers.ChoiceField(
        choices=['manual', 'qr_scan'],
        default='manual',
        help_text="Method used to mark attendance"
    )
    attendances = serializers.ListField(
        child=BulkAttendanceItemSerializer(),
        min_length=1,
        help_text="List of attendance records to mark"
    )

    def validate(self, data):
        """Validate the bulk attendance request."""
        lecture = self.context.get('lecture')
        if not lecture:
            raise serializers.ValidationError("Lecture context is required.")

        # Check if marking is allowed for this lecture (unless user is admin/supervisor)
        request = self.context.get('request')
        user = request.user if request else None

        if user and not self._is_admin_or_supervisor(user):
            # Non-admin/supervisor users must respect time window
            if not LectureAttendance.can_mark_now(lecture):
                raise serializers.ValidationError(
                    "Attendance can only be marked within the allowed time window "
                    "(from 24 hours before lecture start until 24 hours after)."
                )

        # Validate that all codes exist and have attendance records
        attendances_data = data.get('attendances', [])
        validated_items = []
        errors = []

        for idx, item in enumerate(attendances_data):
            code = item.get('code')
            participant_type = item.get('participant_type')

            try:
                # Find the participant
                participant = None
                attendance = None

                if participant_type == 'child':
                    try:
                        participant = Child.objects.get(unique_code=code)
                        attendance = LectureAttendance.objects.filter(
                            lecture=lecture,
                            child=participant
                        ).first()
                    except Child.DoesNotExist:
                        errors.append({
                            'index': idx,
                            'code': code,
                            'error': f"Child with code '{code}' not found."
                        })
                        continue

                elif participant_type == 'student':
                    try:
                        participant = StudentUser.objects.get(unique_code=code)
                        attendance = LectureAttendance.objects.filter(
                            lecture=lecture,
                            student=participant
                        ).first()
                    except StudentUser.DoesNotExist:
                        errors.append({
                            'index': idx,
                            'code': code,
                            'error': f"Student with code '{code}' not found."
                        })
                        continue

                if not attendance:
                    errors.append({
                        'index': idx,
                        'code': code,
                        'error': f"No attendance record found for this {participant_type} in this lecture."
                    })
                    continue

                # Store validated attendance record with its data
                validated_items.append({
                    'attendance': attendance,
                    'participant': participant,
                    'data': item
                })

            except Exception as e:
                errors.append({
                    'index': idx,
                    'code': code,
                    'error': str(e)
                })

        # Store results in context
        self.context['validated_items'] = validated_items
        self.context['validation_errors'] = errors

        return data

    def _is_admin_or_supervisor(self, user):
        """
        Check if user is admin or supervisor (no time restrictions for past lectures).
        Checks: is_superuser, is_staff, role field, and instructor_profile.type
        """
        if user.is_superuser:
            return True
        if user.is_staff:
            return True
        # Check role field for admin or supervisor
        if hasattr(user, 'role') and user.role in ('admin', 'supervisor'):
            return True
        # Check instructor profile type
        if hasattr(user, 'instructor_profile') and user.instructor_profile and user.instructor_profile.type == 'supervisor':
            return True
        return False
