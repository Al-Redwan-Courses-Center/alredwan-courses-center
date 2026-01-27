#!/usr/bin/env python3
"""Views for Course model"""
from rest_framework import generics, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q

from courses.models import Course
from courses.serializers import CourseListSerializer, CourseDetailSerializer


class CourseListView(generics.ListAPIView):
    """
    API endpoint for listing all courses
    GET /api/courses/

    """
    serializer_class = CourseListSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'season', 'instructor', 'for_adults']
    search_fields = ['name', 'description']
    ordering_fields = ['start_date', 'price', 'created_at', 'name']
    ordering = ['-start_date']

    def get_queryset(self):
        """
        Return optimized queryset with annotated enrollment counts.
        This avoids N+1 queries when serializing enrolled_count, available_spots, is_full.
        """
        return Course.objects.select_related(
            'instructor__user',
            'season'
        ).prefetch_related(
            'tags',
            'schedules'
        ).annotate(
            _enrolled_count=Count(
                'enrollments',
                filter=Q(enrollments__status='active')
            )
        )


class CourseDetailView(generics.RetrieveAPIView):
    """
    API endpoint for retrieving a single course by ID or slug
    GET /api/courses/{id}/
    GET /api/courses/{slug}/
    """
    serializer_class = CourseDetailSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'pk'

    def get_queryset(self):
        """Return optimized queryset with annotated enrollment counts."""
        return Course.objects.select_related(
            'instructor__user',
            'season'
        ).prefetch_related(
            'tags',
            'schedules'
        ).annotate(
            _enrolled_count=Count(
                'enrollments',
                filter=Q(enrollments__status='active')
            )
        )

    def get_object(self):
        """Override to allow lookup by both ID and slug"""
        lookup_value = self.kwargs.get(self.lookup_field)
        queryset = self.get_queryset()

        # Try to get by ID first
        if lookup_value.isdigit():
            return generics.get_object_or_404(queryset, pk=lookup_value)

        # Otherwise try to get by slug
        return generics.get_object_or_404(queryset, slug=lookup_value)
