#!/usr/bin/env python3
"""Custom permissions for attendance app."""

from rest_framework import permissions


class IsAdminOrCourseInstructor(permissions.BasePermission):
    """
    Permission to only allow admins, supervisors, or the specific course instructor.
    
    - Admins have full access to any lecture/course
    - Supervisors have full access to any lecture/course
    - Regular instructors can only access their own courses
    
    For views that work with a specific course or lecture,
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
        # Check for course_id in URL kwargs (for course-specific views)
        course_id = view.kwargs.get('course_id')
        if course_id:
            from courses.models import Course
            try:
                course = Course.objects.get(pk=course_id)
                return course.instructor == instructor_profile
            except Course.DoesNotExist:
                return False
        
        # Check for lecture_id in URL kwargs (for lecture-specific views like attendance)
        lecture_id = view.kwargs.get('lecture_id') or view.kwargs.get('pk')
        if lecture_id:
            from courses.models import Lecture
            try:
                lecture = Lecture.objects.select_related('course').get(pk=lecture_id)
                return lecture.course.instructor == instructor_profile
            except Lecture.DoesNotExist:
                return False
        
        # If no course_id or lecture_id in URL, allow (backward compatibility)
        return True
    
    def has_object_permission(self, request, view, obj):
        """
        Check if user can access this specific object.
        obj is expected to be a Lecture, Course, or StudentAttendance instance.
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
        # Handle Lecture, Course, and StudentAttendance objects
        if hasattr(obj, 'course'):
            # obj is a Lecture or StudentAttendance (with lecture.course)
            if hasattr(obj.course, 'instructor'):
                return obj.course.instructor == instructor_profile
            # If obj.course is an ID, fetch the course
            from courses.models import Course
            course = Course.objects.get(pk=obj.course)
            return course.instructor == instructor_profile
        elif hasattr(obj, 'instructor'):
            # obj is a Course
            return obj.instructor == instructor_profile
        elif hasattr(obj, 'lecture'):
            # obj might be StudentAttendance with a lecture field
            return obj.lecture.course.instructor == instructor_profile
        
        return False
