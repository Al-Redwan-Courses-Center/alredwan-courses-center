#!/usr/bin/env python3
"""Custom permissions for attendance app."""

from rest_framework import permissions


class IsAdminOrCourseInstructor(permissions.BasePermission):
    """
    Permission to only allow admins or the course instructor to mark attendance.
    
    - Admins can mark attendance for any lecture
    - Instructors can only mark attendance for their own courses
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated and is either admin or instructor."""
        # User must be authenticated
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admins have full access
        if request.user.is_staff or request.user.is_superuser:
            return True
        
        # Check if user is an instructor (correct related_name is 'instructor_profile')
        if hasattr(request.user, 'instructor_profile'):
            return True
        
        return False
    
    def has_object_permission(self, request, view, obj):
        """
        Check if user can access this specific lecture.
        obj is expected to be a Lecture instance.
        """
        # Admins have full access
        if request.user.is_staff or request.user.is_superuser:
            return True
        
        # Check if user is the course instructor (correct related_name is 'instructor_profile')
        if hasattr(request.user, 'instructor_profile'):
            # Check if this instructor teaches this course
            return obj.course.instructor == request.user.instructor_profile
        
        return False
