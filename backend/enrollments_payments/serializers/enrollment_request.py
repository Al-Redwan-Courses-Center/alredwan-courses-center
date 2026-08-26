#!/usr/bin/env python3
"""Serializer for EnrollmentRequest model in enrollments_payments app.
Handles validation and serialization of enrollment request data.
"""

from rest_framework import serializers
from ..models.enrollment_request import (
    EnrollmentRequest,
    EnrollmentRequestStatus,
    PaymentMethod,
)
from ..models.enrollment import Enrollment, EnrollmentStatus


class EnrollmentRequestCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating EnrollmentRequest"""

    class Meta:
        model = EnrollmentRequest
        fields = ["course", "child", "price", "payment_method", "notes"]

    def validate_course(self, course):
        """Validate course is active and has capacity"""
        if not course.is_active:
            raise serializers.ValidationError("هذه الدورة غير متاحة حالياً.")
        if course.enrolled_count >= course.capacity:
            raise serializers.ValidationError(
                "لا يمكن الإنضمام، تم الوصول إلى الحد الأقصى للمشاركين."
            )
        return course

    def validate_child(self, child):
        """Validate child belongs to the requesting parent"""
        request = self.context.get("request")
        if child and request.user.role == "parent":
            parent = getattr(request.user, "parent_profile", None)
            if not parent:
                raise serializers.ValidationError("لم يتم العثور على ملف ولي الأمر.")
            # Check primary_parent OR extra_parents
            is_linked = (
                child.primary_parent_id == parent.id
                or child.extra_parents.filter(parent=parent).exists()
            )
            if not is_linked:
                raise serializers.ValidationError(
                    "الطفل المحدد لا ينتمي إلى هذا المستخدم."
                )
        return child

    def validate_price(self, price):
        """Validate price is positive if provided"""
        if price is not None and price < 0:
            raise serializers.ValidationError("السعر يجب أن يكون قيمة موجبة.")
        return price

    def validate(self, data):
        """Cross-field validation"""
        request = self.context.get("request")
        user = request.user
        course = data.get("course")
        child = data.get("child")
        price = data.get("price")

        # Role-based validation
        if user.role not in ["parent", "student"]:
            raise serializers.ValidationError(
                "فقط أولياء الأمور والطلاب يمكنهم تقديم طلبات إلتحاق."
            )

        if user.role == "parent":
            if not child:
                raise serializers.ValidationError(
                    {"child": "يجب تحديد الطفل عند تقديم طلب إلتحاق كولي أمر."}
                )
            # Eligibility check for child
            if not course.is_participant_eligible(child):
                raise serializers.ValidationError(
                    "الطفل غير مؤهل لهذه الدورة (تحقق من متطلبات العمر)."
                )

        if user.role == "student":
            if child:
                raise serializers.ValidationError(
                    {"child": "لا يمكن للطالب تقديم طلب إلتحاق لطفل."}
                )
            student = getattr(user, "student_profile", None)
            if not student:
                raise serializers.ValidationError("لم يتم العثور على ملف الطالب.")
            if not course.is_participant_eligible(student):
                raise serializers.ValidationError(
                    "أنت غير مؤهل لهذه الدورة (تحقق من متطلبات العمر)."
                )

        # Price validation against course price
        if price and course and price > course.price:
            raise serializers.ValidationError(
                {"price": "السعر المدخل لا يمكن أن يكون أكبر من سعر الدورة."}
            )

        # Check for duplicate pending/processing requests
        self._check_duplicate_request(user, course, child)

        # Check for existing active enrollment
        self._check_existing_enrollment(user, course, child)

        return data

    def _check_duplicate_request(self, user, course, child):
        """Check for existing pending/processing requests"""
        active_statuses = [
            EnrollmentRequestStatus.PENDING,
            EnrollmentRequestStatus.PROCESSING,
        ]

        if user.role == "student":
            exists = EnrollmentRequest.objects.filter(
                course=course, student=user.student_profile, status__in=active_statuses
            ).exists()
        else:
            exists = EnrollmentRequest.objects.filter(
                course=course, child=child, status__in=active_statuses
            ).exists()

        if exists:
            raise serializers.ValidationError(
                "يوجد طلب إلتحاق معلق لهذه الدورة بالفعل."
            )

    def _check_existing_enrollment(self, user, course, child):
        """Check for existing active enrollment"""
        active_statuses = [EnrollmentStatus.ACTIVE, EnrollmentStatus.SUSPENDED]

        if user.role == "student":
            exists = Enrollment.objects.filter(
                course=course, student=user.student_profile, status__in=active_statuses
            ).exists()
        else:
            exists = Enrollment.objects.filter(
                course=course, child=child, status__in=active_statuses
            ).exists()

        if exists:
            raise serializers.ValidationError("هذا المشترك مسجل بالفعل في هذه الدورة.")

    def create(self, validated_data):
        """Create EnrollmentRequest with proper parent/student assignment"""
        user = self.context.get("request").user

        if user.role == "student":
            validated_data["student"] = user.student_profile
            validated_data["parent"] = None
            validated_data["child"] = None
        elif user.role == "parent":
            validated_data["parent"] = user.parent_profile
            # child is already in validated_data

        return EnrollmentRequest.objects.create(**validated_data)


class EnrollmentRequestListSerializer(serializers.ModelSerializer):
    """Serializer for listing EnrollmentRequests with minimal course info"""

    course_name = serializers.SerializerMethodField()
    course_price = serializers.SerializerMethodField()
    child_id = serializers.UUIDField(source="child.id", read_only=True, default=None)
    participant_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = EnrollmentRequest
        fields = [
            "id",
            "course",
            "online_course",
            "course_name",
            "course_price",
            "child_id",
            "participant_name",
            "price",
            "status",
            "status_display",
            "payment_method",
            "created_at",
            "expires_at",
            "notes",
        ]
        read_only_fields = fields

    def get_course_name(self, obj):
        target = obj.course_instance
        return target.name if target else None

    def get_course_price(self, obj):
        target = obj.course_instance
        return target.price if (target and target.price is not None) else None

    def get_participant_name(self, obj):
        """Get the name of the participant (child or student)"""
        if obj.child:
            return f"{obj.child.first_name} {obj.child.last_name}"
        elif obj.student:
            return obj.student.user.get_full_name()
        return None


class EnrollmentRequestDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed view of EnrollmentRequest"""

    course_name = serializers.SerializerMethodField()
    course_description = serializers.SerializerMethodField()
    course_price = serializers.SerializerMethodField()
    course_start_date = serializers.SerializerMethodField()
    course_instructor = serializers.SerializerMethodField()

    participant_name = serializers.SerializerMethodField()
    participant_type = serializers.SerializerMethodField()

    status_display = serializers.CharField(source="get_status_display", read_only=True)
    payment_method_display = serializers.CharField(
        source="get_payment_method_display", read_only=True
    )

    processed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = EnrollmentRequest
        fields = [
            "id",
            "course",
            "online_course",
            "course_name",
            "course_description",
            "course_price",
            "course_start_date",
            "course_instructor",
            "participant_name",
            "participant_type",
            "price",
            "status",
            "status_display",
            "payment_method",
            "payment_method_display",
            "created_at",
            "processed_at",
            "expires_at",
            "notes",
            "processed_by_name",
        ]
        read_only_fields = fields

    def get_course_name(self, obj):
        target = obj.course_instance
        return target.name if target else None

    def get_course_description(self, obj):
        target = obj.course_instance
        return target.description if target else None

    def get_course_price(self, obj):
        target = obj.course_instance
        return target.price if (target and target.price is not None) else None

    def get_course_start_date(self, obj):
        if obj.course:
            return obj.course.start_date
        return None

    def get_course_instructor(self, obj):
        """Get the instructor name for the course"""
        target = obj.course_instance
        if target and target.instructor and target.instructor.user:
            return target.instructor.user.get_full_name()
        return None

    def get_participant_name(self, obj):
        """Get the name of the participant"""
        if obj.child:
            return f"{obj.child.first_name} {obj.child.last_name}"
        elif obj.student:
            return obj.student.user.get_full_name()
        return None

    def get_participant_type(self, obj):
        """Get the type of participant"""
        if obj.child:
            return "child"
        elif obj.student:
            return "student"
        return None

    def get_processed_by_name(self, obj):
        """Get the name of the admin who processed the request"""
        if obj.processed_by:
            return obj.processed_by.get_full_name()
        return None


# ============== Admin Serializers ==============


class AdminEnrollmentRequestListSerializer(serializers.ModelSerializer):
    """Serializer for admin listing of EnrollmentRequests with full info"""

    course_name = serializers.SerializerMethodField()
    course_price = serializers.SerializerMethodField()
    season_name = serializers.SerializerMethodField()
    participant_name = serializers.SerializerMethodField()
    participant_type = serializers.SerializerMethodField()
    parent_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    payment_method_display = serializers.CharField(
        source="get_payment_method_display", read_only=True
    )

    class Meta:
        model = EnrollmentRequest
        fields = [
            "id",
            "course",
            "online_course",
            "course_name",
            "course_price",
            "season_name",
            "parent",
            "parent_name",
            "student",
            "child",
            "participant_name",
            "participant_type",
            "price",
            "status",
            "status_display",
            "payment_method",
            "payment_method_display",
            "created_at",
            "processed_at",
            "expires_at",
            "notes",
        ]
        read_only_fields = fields

    def get_course_name(self, obj):
        target = obj.course_instance
        return target.name if target else None

    def get_course_price(self, obj):
        target = obj.course_instance
        return target.price if (target and target.price is not None) else None

    def get_season_name(self, obj):
        if obj.course and obj.course.season:
            return obj.course.season.name
        return None

    def get_participant_name(self, obj):
        if obj.child:
            return f"{obj.child.first_name} {obj.child.last_name}"
        elif obj.student:
            return obj.student.user.get_full_name()
        return None

    def get_participant_type(self, obj):
        return "child" if obj.child else "student" if obj.student else None

    def get_parent_name(self, obj):
        if obj.parent:
            return obj.parent.user.get_full_name()
        return None


class AdminEnrollmentRequestUpdateSerializer(serializers.ModelSerializer):
    """Serializer for admin updates to EnrollmentRequest"""

    class Meta:
        model = EnrollmentRequest
        fields = ["status", "price", "payment_method", "notes", "expires_at"]

    def validate_status(self, value):
        """Only allow transitioning to 'processing' via this endpoint"""
        instance = self.instance
        if instance and value != EnrollmentRequestStatus.PROCESSING:
            if value in [
                EnrollmentRequestStatus.ACCEPTED,
                EnrollmentRequestStatus.REJECTED,
            ]:
                raise serializers.ValidationError(
                    "استخدم نقاط النهاية المخصصة للموافقة أو الرفض."
                )
        return value

    def validate_price(self, value):
        """Validate price is positive and not greater than course price"""
        if value is not None:
            if value < 0:
                raise serializers.ValidationError("السعر يجب أن يكون قيمة موجبة.")
            target = self.instance.course_instance if self.instance else None
            if target and target.price is not None and value > target.price:
                raise serializers.ValidationError(
                    "السعر لا يمكن أن يكون أكبر من سعر الدورة."
                )
        return value

    def validate_expires_at(self, value):
        """Validate expires_at is in the future"""
        from django.utils import timezone

        if value and value <= timezone.now():
            raise serializers.ValidationError("تاريخ الانتهاء يجب أن يكون في المستقبل.")
        return value

    def validate(self, data):
        """Validate the request can be updated"""
        instance = self.instance
        if instance.status in [
            EnrollmentRequestStatus.ACCEPTED,
            EnrollmentRequestStatus.REJECTED,
            EnrollmentRequestStatus.EXPIRED,
        ]:
            raise serializers.ValidationError(
                "لا يمكن تعديل طلب تم قبوله أو رفضه أو انتهت صلاحيته."
            )
        return data

    def update(self, instance, validated_data):
        """Update the enrollment request"""
        request = self.context.get("request")
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class EnrollmentRequestApproveSerializer(serializers.Serializer):
    """Serializer for approving an enrollment request"""

    paid_amount = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, allow_null=True
    )
    payment_method = serializers.ChoiceField(
        choices=PaymentMethod.values, required=False
    )
    payment_notes = serializers.CharField(required=False, allow_blank=True)

    def validate_paid_amount(self, value):
        """Validate paid amount is positive"""
        if value is not None and value < 0:
            raise serializers.ValidationError("المبلغ المدفوع يجب أن يكون قيمة موجبة.")
        return value

    def validate(self, data):
        """Validate the request can be approved"""
        instance = self.context.get("enrollment_request")
        if not instance:
            raise serializers.ValidationError("طلب الإلتحاق غير موجود.")

        if instance.status not in [
            EnrollmentRequestStatus.PENDING,
            EnrollmentRequestStatus.PROCESSING,
        ]:
            raise serializers.ValidationError(
                f"لا يمكن الموافقة على طلب بحالة: {instance.get_status_display()}"
            )

        # Check course capacity
        if instance.course.enrolled_count >= instance.course.capacity:
            raise serializers.ValidationError(
                "لا يمكن الموافقة - تم الوصول إلى الحد الأقصى للمشاركين في الدورة."
            )

        return data


class EnrollmentRequestRejectSerializer(serializers.Serializer):
    """Serializer for rejecting an enrollment request"""

    reason = serializers.CharField(required=True, min_length=5)

    def validate(self, data):
        """Validate the request can be rejected"""
        instance = self.context.get("enrollment_request")
        if not instance:
            raise serializers.ValidationError("طلب الإلتحاق غير موجود.")

        if instance.status not in [
            EnrollmentRequestStatus.PENDING,
            EnrollmentRequestStatus.PROCESSING,
        ]:
            raise serializers.ValidationError(
                f"لا يمكن رفض طلب بحالة: {instance.get_status_display()}"
            )

        return data


class BulkApproveSerializer(serializers.Serializer):
    """Serializer for bulk approving enrollment requests"""

    request_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1,
        max_length=50,  # Limit to prevent performance issues
    )
    payment_method = serializers.ChoiceField(
        choices=PaymentMethod.values, default=PaymentMethod.CASH
    )

    def validate_request_ids(self, value):
        """Validate all request IDs exist and are in valid status"""
        existing = EnrollmentRequest.objects.filter(id__in=value).values_list(
            "id", flat=True
        )
        existing_set = set(str(id) for id in existing)
        provided_set = set(str(id) for id in value)

        missing = provided_set - existing_set
        if missing:
            raise serializers.ValidationError(f"طلبات غير موجودة: {', '.join(missing)}")

        return value


class BulkRejectSerializer(serializers.Serializer):
    """Serializer for bulk rejecting enrollment requests"""

    request_ids = serializers.ListField(
        child=serializers.UUIDField(), min_length=1, max_length=50
    )
    reason = serializers.CharField(required=True, min_length=5)

    def validate_request_ids(self, value):
        """Validate all request IDs exist"""
        existing = EnrollmentRequest.objects.filter(id__in=value).values_list(
            "id", flat=True
        )
        existing_set = set(str(id) for id in existing)
        provided_set = set(str(id) for id in value)

        missing = provided_set - existing_set
        if missing:
            raise serializers.ValidationError(f"طلبات غير موجودة: {', '.join(missing)}")

        return value
