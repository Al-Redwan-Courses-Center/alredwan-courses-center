#!/usr/bin/env python3
"""Serializers for Enrollment model in enrollments_payments app."""
from rest_framework import serializers
from django.db.models import Sum

from ..models import Enrollment
from ..models.enrollment import EnrollmentStatus
from ..models.payment import Payment, PaymentStatus


class EnrollmentListSerializer(serializers.ModelSerializer):
    """Serializer for listing user's enrollments with course and payment summary"""
    # Course info
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_price = serializers.DecimalField(
        source='course.price', max_digits=10, decimal_places=2, read_only=True)
    course_start_date = serializers.DateField(
        source='course.start_date', read_only=True)
    course_end_date = serializers.DateField(
        source='course.end_date', read_only=True)
    course_instructor = serializers.SerializerMethodField()

    # Participant info
    child_id = serializers.UUIDField(
        source='child.id', read_only=True, default=None)
    participant_name = serializers.SerializerMethodField()
    participant_type = serializers.SerializerMethodField()

    # Status
    status_display = serializers.CharField(
        source='get_status_display', read_only=True)

    # Payment summary
    amount_paid = serializers.SerializerMethodField()
    remaining_amount = serializers.SerializerMethodField()
    payment_status = serializers.SerializerMethodField()

    # Progress summary
    completion_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = [
            'id', 'course', 'course_name', 'course_price',
            'course_start_date', 'course_end_date', 'course_instructor',
            'child_id', 'participant_name', 'participant_type',
            'status', 'status_display',
            'enrolled_at', 'completed_at',
            'amount_paid', 'remaining_amount', 'payment_status',
            'completion_percentage'
        ]
        read_only_fields = fields

    def get_course_instructor(self, obj):
        if obj.course and obj.course.instructor:
            return obj.course.instructor.user.get_full_name()
        return None

    def get_participant_name(self, obj):
        if obj.child:
            return f"{obj.child.first_name} {obj.child.last_name}"
        elif obj.student:
            return obj.student.user.get_full_name()
        return None

    def get_participant_type(self, obj):
        return 'child' if obj.child else 'student' if obj.student else None

    def get_amount_paid(self, obj):
        return str(obj.amount_paid())

    def get_remaining_amount(self, obj):
        return str(obj.remaining_amount())

    def get_payment_status(self, obj):
        remaining = obj.remaining_amount()
        if remaining <= 0:
            return 'fully_paid'
        elif obj.amount_paid() > 0:
            return 'partial'
        return 'unpaid'

    def get_completion_percentage(self, obj):
        progress = obj.get_completion_progress()
        return progress.get('percentage', 0)


class PaymentSummarySerializer(serializers.ModelSerializer):
    """Serializer for payment records in enrollment detail"""
    method_display = serializers.CharField(
        source='get_method_display', read_only=True)
    status_display = serializers.CharField(
        source='get_status_display', read_only=True)
    processed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            'id', 'amount', 'method', 'method_display',
            'status', 'status_display',
            'created_at', 'processed_at',
            'processed_by_name', 'notes', 'reference_number'
        ]
        read_only_fields = fields

    def get_processed_by_name(self, obj):
        if obj.processed_by:
            return obj.processed_by.get_full_name()
        return None


class EnrollmentDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for viewing a single enrollment"""
    # Course info
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_description = serializers.CharField(
        source='course.description', read_only=True)
    course_price = serializers.DecimalField(
        source='course.price', max_digits=10, decimal_places=2, read_only=True)
    course_start_date = serializers.DateField(
        source='course.start_date', read_only=True)
    course_end_date = serializers.DateField(
        source='course.end_date', read_only=True)
    course_instructor = serializers.SerializerMethodField()
    course_num_lectures = serializers.IntegerField(
        source='course.num_lectures', read_only=True)

    # Participant info
    participant_name = serializers.SerializerMethodField()
    participant_type = serializers.SerializerMethodField()
    participant_id = serializers.SerializerMethodField()

    # Status
    status_display = serializers.CharField(
        source='get_status_display', read_only=True)

    # Payment info
    amount_paid = serializers.SerializerMethodField()
    remaining_amount = serializers.SerializerMethodField()
    payment_status = serializers.SerializerMethodField()
    payments = serializers.SerializerMethodField()

    # Progress
    completion_progress = serializers.SerializerMethodField()

    # Created by
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = [
            'id', 'course', 'course_name', 'course_description',
            'course_price', 'course_start_date', 'course_end_date',
            'course_instructor', 'course_num_lectures',
            'student', 'child',
            'participant_name', 'participant_type', 'participant_id',
            'status', 'status_display',
            'enrolled_at', 'updated_at', 'completed_at', 'dropped_at',
            'amount_paid', 'remaining_amount', 'payment_status', 'payments',
            'completion_progress',
            'created_by', 'created_by_name'
        ]
        read_only_fields = fields

    def get_course_instructor(self, obj):
        if obj.course and obj.course.instructor:
            return obj.course.instructor.user.get_full_name()
        return None

    def get_participant_name(self, obj):
        if obj.child:
            return f"{obj.child.first_name} {obj.child.last_name}"
        elif obj.student:
            return obj.student.user.get_full_name()
        return None

    def get_participant_type(self, obj):
        return 'child' if obj.child else 'student' if obj.student else None

    def get_participant_id(self, obj):
        if obj.child:
            return str(obj.child.id)
        elif obj.student:
            return str(obj.student.id)
        return None

    def get_amount_paid(self, obj):
        return str(obj.amount_paid())

    def get_remaining_amount(self, obj):
        return str(obj.remaining_amount())

    def get_payment_status(self, obj):
        remaining = obj.remaining_amount()
        if remaining <= 0:
            return 'fully_paid'
        elif obj.amount_paid() > 0:
            return 'partial'
        return 'unpaid'

    def get_payments(self, obj):
        """Get all payments for this enrollment"""
        payments = obj.payments.all().order_by('-created_at')
        return PaymentSummarySerializer(payments, many=True).data

    def get_completion_progress(self, obj):
        return obj.get_completion_progress()

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name()
        return None


class EnrollmentProgressSerializer(serializers.Serializer):
    """Serializer for enrollment progress response"""
    total_lectures = serializers.IntegerField()
    expected_lectures = serializers.IntegerField()
    completed_lectures = serializers.IntegerField()
    percentage = serializers.FloatField()
    end_date_passed = serializers.BooleanField()
    course_end_date = serializers.DateField(allow_null=True)
    is_completable = serializers.BooleanField()
