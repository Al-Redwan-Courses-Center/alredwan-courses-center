#!/usr/bin/env python3
"""Custom permissions for Course app"""
from rest_framework import permissions


class IsAdminOrCourseInstructor(permissions.BasePermission):
    """
    Permission to only allow admins, supervisors, or the specific course instructor.
    
    - Admins have full access to any course
    - Supervisors have full access to any course
    - Regular instructors can only access their own courses
    
    For views that work with a specific course (e.g., via course_id in URL kwargs),
    this permission validates that the instructor is actually assigned to that course.
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated and has appropriate role with course-level validation."""
        # User must be authenticated
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admins have full access
        if request.user.is_staff or request.user.is_superuser:
            return True
        
        # Check if user has an instructor profile
        if not hasattr(request.user, 'instructor_profile'):
            return False
        
        instructor_profile = request.user.instructor_profile
        
        # Supervisors have full access to all courses
        if instructor_profile.type == 'supervisor':
            return True
        
        # For regular instructors, validate they are assigned to the specific course
        course_id = view.kwargs.get('course_id')
        if course_id:
            # Check if this instructor is assigned to the course
            from courses.models import Course
            try:
                course = Course.objects.get(pk=course_id)
                # Only allow access if the instructor is assigned to this course
                return course.instructor == instructor_profile
            except Course.DoesNotExist:
                return False
        
        # If no course_id in URL (shouldn't happen for course-specific views), allow
        # This case is for backward compatibility with views that don't use course_id
        return True
    
    def has_object_permission(self, request, view, obj):
        """
        Check if user can access this specific object.
        obj is expected to be a Lecture or Course instance.
        """
        # Admins have full access
        if request.user.is_staff or request.user.is_superuser:
            return True
        
        # Check if user has an instructor profile
        if not hasattr(request.user, 'instructor_profile'):
            return False
        
        instructor_profile = request.user.instructor_profile
        
        # Supervisors have full access
        if instructor_profile.type == 'supervisor':
            return True
        
        # For regular instructors, check if they teach this course
        # Handle both Lecture and Course objects
        if hasattr(obj, 'course'):
            # obj is a Lecture
            return obj.course.instructor == instructor_profile
        elif hasattr(obj, 'instructor'):
            # obj is a Course
            return obj.instructor == instructor_profile
        
        return False
