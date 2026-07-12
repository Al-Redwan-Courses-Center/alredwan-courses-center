#!/usr/bin/env python3
from rest_framework import permissions
from django.utils import timezone
from datetime import timedelta

class IsSupervisor(permissions.BasePermission):
    """
    Allow supervisor instructors.
    """
    message = 'يجب أن تكون مشرف للقيام بهذا الإجراء.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.user_type == 'instructor':
            return (
                hasattr(request.user, 'instructor_profile') and
                request.user.instructor_profile.type == 'supervisor'
            )
        return False

class IsUploaderWithin24hOrAdmin(permissions.BasePermission):
    """
    Object-level permission:
    - Admin can edit/delete anytime
    - Supervisor who uploaded can edit/delete within 24 hours of creation
    """
    message = 'لا يمكنك تعديل هذه الذكرى بعد مرور 24 ساعة، أو لست من قام برفعها.'

    def has_object_permission(self, request, view, obj):
        if request.user.user_type == 'admin':
            return True

        if request.user.user_type == 'instructor':
            if hasattr(request.user, 'instructor_profile'):
                # Check if this instructor uploaded it
                if obj.uploaded_by == request.user.instructor_profile:
                    # Allow edit within 24 hours
                    time_diff = timezone.now() - obj.created_at
                    return time_diff <= timedelta(hours=24)
        return False
