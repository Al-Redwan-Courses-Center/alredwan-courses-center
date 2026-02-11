#!/usr/bin/env python3
"""Serializers for Parents app"""
from rest_framework import serializers
from .models.parent import Child, Parent
from django.utils.translation import gettext_lazy as _


class ChildCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a child.
    The primary_parent field is automatically set from the authenticated user.
    """
    
    class Meta:
        model = Child
        fields = [
            'id',
            'first_name',
            'last_name',
            'phone',
            'dob',
            'gender',
            'image',
            'unique_code',
            'created_at',
        ]
        read_only_fields = ['id', 'unique_code', 'created_at']
    
    def create(self, validated_data):
        """
        Create a child and automatically set the primary_parent from the request user.
        """
        # Get the parent from the request context
        request = self.context.get('request')
        if not request or not hasattr(request.user, 'parent_profile'):
            raise serializers.ValidationError({
                'error': _("You must be a parent to create a child.")
            })
        
        # Set the primary_parent to the authenticated user's parent profile
        validated_data['primary_parent'] = request.user.parent_profile
        
        # Create and return the child
        child = Child.objects.create(**validated_data)
        return child


class ChildDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for viewing child information.
    """
    primary_parent_name = serializers.CharField(
        source='primary_parent.user.get_full_name',
        read_only=True
    )
    age = serializers.SerializerMethodField()
    
    class Meta:
        model = Child
        fields = [
            'id',
            'first_name',
            'last_name',
            'phone',
            'dob',
            'age',
            'gender',
            'image',
            'unique_code',
            'primary_parent_name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'unique_code', 'created_at', 'updated_at']
    
    def get_age(self, obj):
        """Calculate the current age of the child."""
        return obj.get_age_on_date()


class ChildUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating child information.
    The primary_parent cannot be changed through this serializer.
    """
    
    class Meta:
        model = Child
        fields = [
            'first_name',
            'last_name',
            'phone',
            'dob',
            'gender',
            'image',
        ]
