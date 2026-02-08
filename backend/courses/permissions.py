#!/usr/bin/env python3
"""Custom permissions for Course app"""
from rest_framework import permissions


class IsAdminOrCourseInstructor(permissions.BasePermission):
    """
    Custom permission to allow:
    - Admin users (full access)
    - Instructor of the specific course only
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated"""
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """
        Check if user is admin or the instructor of the course
        obj can be either Course or Lecture
        """
        # Admin users have full access
        if request.user.is_staff or request.user.role == 'admin':
            return True
        
        # Check if user is an instructor
        if request.user.role != 'instructor':
            return False
        
        # Get the instructor profile
        try:
            instructor_profile = request.user.instructor_profile
        except AttributeError:
            return False
        
        # For Course objects
        if hasattr(obj, 'instructor'):
            return obj.instructor == instructor_profile
        
        # For Lecture objects, check the course's instructor
        if hasattr(obj, 'course') and hasattr(obj.course, 'instructor'):
            return obj.course.instructor == instructor_profile
        
        return False
