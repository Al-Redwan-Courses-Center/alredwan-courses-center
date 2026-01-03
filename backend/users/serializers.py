#!/usr/bin/env python3
"""
Custom serializers for user registration and management.
These serializers ensure security by controlling which fields can be set via API.
"""
from djoser.serializers import UserCreateSerializer, UserSerializer
from rest_framework import serializers
from .models import CustomUser


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
        """Ensure phone number is in E.164 format."""
        if not value.startswith('+20') or not value[1:].isdigit():
            raise serializers.ValidationError(
                "Phone number must be in E.164 format (e.g., +201234567890)"
            )
        return value


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
