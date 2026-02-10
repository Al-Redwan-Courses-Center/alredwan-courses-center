#!/usr/bin/env python3
"""Serializers for instructor enrollment views."""
from rest_framework import serializers
from ..models import Enrollment
from ..models.enrollment import EnrollmentStatus


class InstructorEnrollmentListSerializer(serializers.ModelSerializer):
    """Serializer for instructor viewing enrollments - no financial data"""
    # Course info
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_start_date = serializers.DateField(source='course.start_date', read_only=True)
    course_end_date = serializers.DateField(source='course.end_date', read_only=True)
    
    # Participant info
    participant_name = serializers.SerializerMethodField()
    participant_type = serializers.SerializerMethodField()
    participant_phone = serializers.SerializerMethodField()
    
    # Status
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    # Progress (no payment info)
    completion_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = [
            'id', 'course', 'course_name', 'course_start_date', 'course_end_date',
            'participant_name', 'participant_type', 'participant_phone',
            'status', 'status_display',
            'enrolled_at', 'completed_at',
            'completion_percentage'
        ]
        read_only_fields = fields

    def get_participant_name(self, obj):
        if obj.child:
            return f"{obj.child.first_name} {obj.child.last_name}"
        elif obj.student:
            return obj.student.user.get_full_name()
        return None

    def get_participant_type(self, obj):
        return 'child' if obj.child else 'student' if obj.student else None

    def get_participant_phone(self, obj):
        """Get contact phone for the participant"""
        if obj.child:
            # Return parent's phone
            if obj.child.primary_parent and obj.child.primary_parent.user:
                return obj.child.primary_parent.user.phone_number1
            return obj.child.phone
        elif obj.student:
            return obj.student.user.phone_number1
        return None

    def get_completion_percentage(self, obj):
        progress = obj.get_completion_progress()
        return progress.get('percentage', 0)


class CourseEnrollmentStatsSerializer(serializers.Serializer):
    """Serializer for course enrollment statistics"""
    course_id = serializers.UUIDField()
    course_name = serializers.CharField()
    capacity = serializers.IntegerField()
    enrolled_count = serializers.IntegerField()
    available_spots = serializers.IntegerField()
    active_students = serializers.IntegerField()
    suspended_students = serializers.IntegerField()
    completed_students = serializers.IntegerField()
    dropped_students = serializers.IntegerField()
    refunded_students = serializers.IntegerField()
