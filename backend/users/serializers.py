#!/usr/bin/env python3
"""
Custom serializers for user registration and management.
These serializers ensure security by controlling which fields can be set via API.
"""
import phonenumbers
from django.utils.translation import gettext_lazy as _
from djoser.serializers import UserCreateSerializer, UserSerializer
from rest_framework import serializers
from .models import CustomUser, Instructor, LandingPageInstructor
from .models.student_instructor_rating import StudentInstructorRating, ParentInstructorRating, StudentCourseRating, ParentCourseRating


class CustomUserCreateSerializer(UserCreateSerializer):
    """
    Serializer for user registration.

    Security: Only allows safe fields to be set during registration.
    Dangerous fields (is_staff, is_superuser, is_active, role) are excluded
    to prevent privilege escalation attacks.
    """
    # Explicitly declare fields that aren't in REQUIRED_FIELDS to ensure they're writable
    gender = serializers.ChoiceField(
        choices=[("male", "ذكر"), ("female", "أنثى")])
    role = serializers.CharField(max_length=20)
    email = serializers.EmailField(required=False, allow_null=True, allow_blank=True)
    address = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    class Meta(UserCreateSerializer.Meta):
        model = CustomUser
        fields = (
            'id',
            'phone_number1',
            'phone_number2',
            'email',
            'first_name',
            'last_name',
            'password',
            're_password',  # Required when USER_CREATE_PASSWORD_RETYPE=True
            'dob',
            'gender',
            'identity_number',
            'identity_type',
            'address',
            'location',
            'role',  # Added: allows student/parent role during registration
        )
        # These fields cannot be set by the user during registration
        read_only_fields = ('id',)

    def validate_phone_number1(self, value):
        """
        Validate and normalize a phone number to E.164 international format.
        """
        try:
            parsed = phonenumbers.parse(value, None)
            if not phonenumbers.is_valid_number(parsed):
                raise serializers.ValidationError(_("Invalid phone number"))
            return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
        except phonenumbers.NumberParseException:
            raise serializers.ValidationError(_("Invalid phone number format"))

    def validate_role(self, value):
        """
        Prevent setting role via registration.
        """
        if not value in ['student', 'parent']:
            raise serializers.ValidationError(
                _("Cannot assign admin or instructor role via registration"))
        return value


class CustomUserSerializer(serializers.ModelSerializer):
    """
    Serializer for retrieving and updating user profile.

    Security: Prevents users from modifying sensitive fields.
    """
    instructor_id = serializers.SerializerMethodField()
    profile_image = serializers.SerializerMethodField()
    image = serializers.ImageField(write_only=True, required=False, allow_null=True)

    def get_profile_image(self, obj):
        if obj.image:
            return obj.image.url
        return None

    class Meta:
        model = CustomUser
        fields = (
            'id',
            'phone_number1',
            'phone_number2',
            'email',
            'first_name',
            'last_name',
            'dob',
            'gender',
            'identity_number',
            'identity_type',
            'address',
            'location',
            'role',
            'is_verified',
            'date_joined',
            'profile_image',
            'image',
            'instructor_id',
        )
        read_only_fields = (
            'id',
            'phone_number1',
            'role',
            'is_verified',
            'date_joined',
            'instructor_id',
        )

    def get_instructor_id(self, obj):
        """Return instructor ID if user has an instructor profile, otherwise None"""
        if hasattr(obj, 'instructor_profile') and obj.instructor_profile:
            return obj.instructor_profile.id
        return None


class InstructorSerializer(serializers.ModelSerializer):
    """Serializer for Instructor model"""
    name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = Instructor
        fields = ['id', 'name']


class LandingPageInstructorDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed instructor info on landing page"""
    name = serializers.CharField(source='user.get_full_name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    phone = serializers.CharField(source='user.phone_number1', read_only=True)
    type_display = serializers.CharField(
        source='get_type_display', read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Instructor
        fields = ['id', 'name', 'email', 'phone', 'bio',
                  'type', 'type_display', 'image_url', 'joined_date']

    def get_image_url(self, obj):
        """Get the full URL for the instructor's image"""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class LandingPageInstructorSerializer(serializers.ModelSerializer):
    """Serializer for landing page featured instructors"""
    instructor = LandingPageInstructorDetailSerializer(read_only=True)

    class Meta:
        model = LandingPageInstructor
        fields = ['id', 'instructor', 'order', 'created_at']


class InstructorListSerializer(serializers.ModelSerializer):
    """Serializer for listing instructors"""
    name = serializers.CharField(source='user.get_full_name', read_only=True)
    type_display = serializers.CharField(
        source='get_type_display', read_only=True)
    image_url = serializers.SerializerMethodField()
    tags = serializers.SerializerMethodField()

    class Meta:
        model = Instructor
        fields = ['id', 'name', 'bio', 'type', 'type_display',
                  'image_url', 'joined_date', 'tags', 'average_rating', 'rating_count']

    def get_image_url(self, obj):
        """Get the full URL for the instructor's image"""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

    def get_tags(self, obj):
        """Get tags for the instructor"""
        from courses.serializers import TagSerializer
        return TagSerializer(obj.tags.all(), many=True).data


class InstructorDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed instructor view"""
    name = serializers.CharField(source='user.get_full_name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    phone = serializers.CharField(source='user.phone_number1', read_only=True)
    type_display = serializers.CharField(
        source='get_type_display', read_only=True)
    image_url = serializers.SerializerMethodField()
    tags = serializers.SerializerMethodField()

    class Meta:
        model = Instructor
        fields = ['id', 'name', 'email', 'phone', 'bio', 'type',
                  'type_display', 'image_url', 'joined_date', 'tags', 'average_rating', 'rating_count']

    def get_image_url(self, obj):
        """Get the full URL for the instructor's image"""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

    def get_tags(self, obj):
        """Get tags for the instructor"""
        from courses.serializers import TagSerializer
        return TagSerializer(obj.tags.all(), many=True).data


class InstructorRatingSerializer(serializers.Serializer):
    """Serializer for individual instructor ratings (both student and parent)"""
    id = serializers.IntegerField(read_only=True)
    rating = serializers.IntegerField(read_only=True)
    feedback = serializers.CharField(read_only=True, allow_null=True)
    created_at = serializers.DateTimeField(read_only=True)
    course_name = serializers.SerializerMethodField()
    rater_name = serializers.SerializerMethodField()
    rater_type = serializers.SerializerMethodField()

    def get_course_name(self, obj):
        """Get the course name for this rating"""
        return obj.course.name if obj.course else None

    def get_rater_name(self, obj):
        """Get the name of the person who gave the rating"""
        if hasattr(obj, 'student'):
            return obj.student.user.get_full_name()
        elif hasattr(obj, 'parent'):
            return obj.parent.user.get_full_name()
        return None

    def get_rater_type(self, obj):
        """Return whether the rater is a student or parent"""
        if hasattr(obj, 'student'):
            return 'student'
        elif hasattr(obj, 'parent'):
            return 'parent'
        return None


class InstructorRatingDetailSerializer(serializers.Serializer):
    """Serializer for instructor rating statistics and details"""
    instructor_id = serializers.IntegerField(read_only=True)
    instructor_name = serializers.CharField(read_only=True)
    statistics = serializers.DictField(read_only=True)
    ratings = serializers.DictField(read_only=True)


class StudentInstructorRateSerializer(serializers.ModelSerializer):
    """Serializer for students to rate instructors"""
    class Meta:
        model = StudentInstructorRating
        fields = ['course', 'rating', 'feedback']

    def validate(self, data):
        user = self.context['request'].user
        if user.role != 'student':
            raise serializers.ValidationError("هذا الحساب ليس حساب طالب.")
            
        student = getattr(user, 'student_profile', None)
        if not student:
            raise serializers.ValidationError("لم يتم العثور على ملف تعريف طالب.")
            
        instructor = self.context['instructor']
        course = data['course']
        
        # Check if student is enrolled in the course taught by this instructor
        from enrollments_payments.models import Enrollment
        if not Enrollment.objects.filter(student=student, course=course, course__instructor=instructor).exists():
            raise serializers.ValidationError("يجب أن تكون مشتركاً في دورة يقدمها هذا المعلم لتتمكن من تقييمه.")
            
        return data

class ParentInstructorRateSerializer(serializers.ModelSerializer):
    """Serializer for parents to rate instructors"""
    class Meta:
        model = ParentInstructorRating
        fields = ['course', 'rating', 'feedback']

    def validate(self, data):
        user = self.context['request'].user
        if user.role != 'parent':
            raise serializers.ValidationError("هذا الحساب ليس حساب ولي أمر.")
            
        parent = getattr(user, 'parent_profile', None)
        if not parent:
            raise serializers.ValidationError("لم يتم العثور على ملف تعريف ولي أمر.")
            
        instructor = self.context['instructor']
        course = data['course']
        
        # Check if parent has a child enrolled in the course taught by this instructor
        from enrollments_payments.models import Enrollment
        from parents.models import Child
        
        # Get parent's children
        child_ids = list(Child.objects.filter(primary_parent=parent).values_list('id', flat=True))
        extra_child_ids = list(parent.extra_children.values_list('child_id', flat=True))
        all_child_ids = set(child_ids + extra_child_ids)
        
        if not Enrollment.objects.filter(child_id__in=all_child_ids, course=course, course__instructor=instructor).exists():
            raise serializers.ValidationError("يجب أن يكون أحد أبنائك مشتركاً في دورة يقدمها هذا المعلم لتتمكن من تقييمه.")
            
        return data
