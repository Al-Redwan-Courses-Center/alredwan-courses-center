#!/usr/bin/env python3
"""Views for Instructor model"""
from rest_framework import generics, filters
from rest_framework.permissions import AllowAny, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from users.models import Instructor, LandingPageInstructor
from users.serializers import InstructorListSerializer, InstructorDetailSerializer, LandingPageInstructorSerializer
from core.utils.pagination import CustomPageNumberPagination


class LandingPageInstructorListView(generics.ListAPIView):
    """
    API endpoint for listing featured instructors on landing page
    GET /api/users/landingpageinstructors/
    Returns instructors ordered by their display order
    """
    queryset = LandingPageInstructor.objects.select_related(
        'instructor__user'
    )
    serializer_class = LandingPageInstructorSerializer
    permission_classes = [AllowAny]


class InstructorListView(generics.ListAPIView):
    """
    API endpoint for listing all instructors
    GET /api/users/instructors/
    
    Supports comprehensive filtering, searching, and ordering capabilities.
    Pagination: ?page=1&page_size=10 (default: 10, max: 100)
    
    Available Filters:
    - type (supervisor/normal), tags
    - joined_date__gte, joined_date__lte
    - user__first_name__icontains, user__last_name__icontains
    - user__phone_number1__icontains, user__email__icontains
    
    Search: first_name, last_name, bio, email, phone
    Ordering: joined_date, user__first_name, user__last_name, type
    """
    serializer_class = InstructorListSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = CustomPageNumberPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    # Define filters directly in the view
    filterset_fields = {
        'type': ['exact'],
        'tags': ['exact'],
        'joined_date': ['gte', 'lte'],
        'user__first_name': ['icontains'],
        'user__last_name': ['icontains'],
        'user__phone_number1': ['icontains'],
        'user__email': ['icontains'],
    }
    
    search_fields = ['user__first_name', 'user__last_name', 'bio', 'user__email', 'user__phone_number1']
    ordering_fields = ['joined_date', 'user__first_name', 'user__last_name', 'type']
    ordering = ['-joined_date']

    def get_queryset(self):
        """
        Return optimized queryset with related user data.
        """
        return Instructor.objects.select_related('user').prefetch_related('tags')


class InstructorDetailView(generics.RetrieveAPIView):
    """
    API endpoint for retrieving a single instructor by ID
    GET /api/users/instructor/{id}/
    """
    serializer_class = InstructorDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = 'pk'

    def get_queryset(self):
        """Return optimized queryset with related user data."""
        return Instructor.objects.select_related('user').prefetch_related('tags')
