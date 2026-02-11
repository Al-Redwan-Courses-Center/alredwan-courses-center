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
