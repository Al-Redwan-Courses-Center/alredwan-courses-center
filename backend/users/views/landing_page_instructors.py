#!/usr/bin/env python3
"""Views for Landing Page featured content - Instructors"""
from rest_framework import generics, filters
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend

from users.models import LandingPageInstructor
from users.serializers import LandingPageInstructorSerializer


class LandingPageInstructorListView(generics.ListAPIView):
    """
    API endpoint for listing featured instructors on landing page
    GET /api/users/landingpageinstructors/
    Returns instructors ordered by their display order.
    Supports filtering by instructor attributes, searching, and custom ordering.
    """
    serializer_class = LandingPageInstructorSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    filterset_fields = {
        'instructor__type': ['exact'],
        'instructor__tags': ['exact'],
        'instructor__joined_date': ['gte', 'lte'],
        'instructor__user__first_name': ['icontains'],
        'instructor__user__last_name': ['icontains'],
        'instructor__user__phone_number1': ['icontains'],
        'instructor__user__email': ['icontains'],
        'order': ['exact', 'gte', 'lte'],
    }
    
    search_fields = ['instructor__user__first_name', 'instructor__user__last_name', 'instructor__bio', 'instructor__user__email', 'instructor__user__phone_number1']
    ordering_fields = ['order', 'instructor__joined_date', 'created_at', 'instructor__type']
    ordering = ['-order']

    def get_queryset(self):
        """Return optimized queryset."""
        return LandingPageInstructor.objects.select_related(
            'instructor__user'
        ).prefetch_related(
            'instructor__tags'
        )
