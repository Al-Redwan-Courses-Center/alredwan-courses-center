#!/usr/bin/env python3
"""Custom permissions for Parents app"""
from rest_framework import permissions


class IsParent(permissions.BasePermission):
    """
    Permission to only allow authenticated parents.
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated and has a parent profile."""
        # User must be authenticated
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if user has parent profile
        if hasattr(request.user, 'parent_profile'):
            return True
        
        return False


class IsChildPrimaryParent(permissions.BasePermission):
    """
    Permission to only allow the primary parent of a child to access/modify it.
    """
    
    def has_object_permission(self, request, view, obj):
        """Check if the user is the primary parent of the child."""
        # User must be authenticated
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if user has parent profile
        if not hasattr(request.user, 'parent_profile'):
            return False
        
        # Check if the parent is the primary parent of this child
        return obj.primary_parent == request.user.parent_profile


class IsAdmin(permissions.BasePermission):
    """
    Permission to only allow admin users (staff or superuser).
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated and is an admin."""
        # User must be authenticated
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if user is staff or superuser
        return request.user.is_staff or request.user.is_superuser


class IsInstructorOrSupervisor(permissions.BasePermission):
    """
    Permission to only allow instructors or supervisors.
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated and is an instructor or supervisor."""
        # User must be authenticated
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if user has instructor profile
        if hasattr(request.user, 'instructor_profile'):
            return True
        
        # Check if user role is supervisor
        if request.user.role == 'supervisor':
            return True
        
        return False


class IsAdminOrInstructorOrSupervisor(permissions.BasePermission):
    """
    Permission to allow admins, instructors, or supervisors.
    Combines IsAdmin and IsInstructorOrSupervisor permissions.
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated and is admin, instructor, or supervisor."""
        # User must be authenticated
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if user is admin (staff or superuser)
        if request.user.is_staff or request.user.is_superuser:
            return True
        
        # Check if user has instructor profile
        if hasattr(request.user, 'instructor_profile'):
            return True
        
        # Check if user role is supervisor
        if request.user.role == 'supervisor':
            return True
        
        return False


class IsParentOrAdmin(permissions.BasePermission):
    """
    Permission to allow parents or admins.
    Useful for endpoints where both parents and admins should have access.
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated and is a parent or admin."""
        # User must be authenticated
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if user is admin
        if request.user.is_staff or request.user.is_superuser:
            return True
        
        # Check if user has parent profile
        if hasattr(request.user, 'parent_profile'):
            return True
        
        return False


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object or admins to access it.
    Assumes the object has a 'user' or 'primary_parent.user' attribute.
    """
    
    def has_object_permission(self, request, view, obj):
        """Check if the user owns the object or is an admin."""
        # Admins have full access
        if request.user.is_staff or request.user.is_superuser:
            return True
        
        # Check if object has 'user' attribute (direct ownership)
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        # Check if object has 'primary_parent' attribute (for Child model)
        if hasattr(obj, 'primary_parent'):
            if hasattr(request.user, 'parent_profile'):
                return obj.primary_parent == request.user.parent_profile
        
        return False
