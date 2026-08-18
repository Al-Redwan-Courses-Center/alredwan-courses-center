#!/usr/bin/env python3
"""Views for Course model"""
from rest_framework import generics, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend, FilterSet
from django.db.models import Count, Q, Avg, Sum, Value, FloatField
from django.db.models.functions import Coalesce
from courses.models import Course
from courses.serializers import CourseListSerializer, CourseDetailSerializer
from courses.filters import CoursePriceFilter


class CourseListView(generics.ListAPIView):
    """
    API endpoint for listing all courses
    GET /api/courses/

    """
    serializer_class = CourseListSerializer
    permission_classes = [IsAuthenticated]
    filterset_class = CoursePriceFilter
    ordering_fields = ['start_date', 'price',
                       'created_at', 'name', 'average_rating']
    ordering = ['-start_date']

    def get_queryset(self):
        """
        Return optimized queryset with annotated enrollment counts and ratings.
        This avoids N+1 queries when serializing enrolled_count, available_spots, 
        is_full, and average_rating.
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
            ),
            # Annotate rating statistics to avoid N+1 queries
            _student_rating_sum=Coalesce(
                Sum('student_ratings__rating'), Value(0)),
            _student_rating_count=Count('student_ratings'),
            _parent_rating_sum=Coalesce(
                Sum('parent_ratings__rating'), Value(0)),
            _parent_rating_count=Count('parent_ratings'),
        ).annotate(
            # Calculate combined average rating
            _rating_count=Count('student_ratings') + Count('parent_ratings'),
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
