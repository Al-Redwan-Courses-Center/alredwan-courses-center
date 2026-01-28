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


class CustomUserCreateSerializer(UserCreateSerializer):
    """
    Serializer for user registration.

    Security: Only allows safe fields to be set during registration.
    Dangerous fields (is_staff, is_superuser, is_active, role) are excluded
    to prevent privilege escalation attacks.
    """

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


class CustomUserSerializer(UserSerializer):
    """
    Serializer for retrieving and updating user profile.

    Security: Prevents users from modifying sensitive fields.
    """

    class Meta(UserSerializer.Meta):
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
        )
        read_only_fields = (
            'id',
            'phone_number1',  # Cannot change primary phone after registration
            'role',           # Only admins can change role
            'is_verified',    # Only admins can verify users
            'date_joined',
        )

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
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Instructor
        fields = ['id', 'name', 'email', 'phone', 'bio', 'type', 'type_display', 'image_url', 'joined_date']
    
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
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    image_url = serializers.SerializerMethodField()
    tags = serializers.SerializerMethodField()
    
    class Meta:
        model = Instructor
        fields = ['id', 'name', 'bio', 'type', 'type_display', 'image_url', 'joined_date', 'tags']
    
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
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    image_url = serializers.SerializerMethodField()
    tags = serializers.SerializerMethodField()
    
    class Meta:
        model = Instructor
        fields = ['id', 'name', 'email', 'phone', 'bio', 'type', 'type_display', 'image_url', 'joined_date', 'tags']
    
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

