#!/usr/bin/env python3
"""Views for Landing Page featured content - Courses"""
from rest_framework import generics, filters
from rest_framework.permissions import AllowAny
from django.db.models import Count, Q
from django_filters.rest_framework import DjangoFilterBackend

from courses.models import LandingPageCourse
from courses.serializers import LandingPageCourseSerializer
from core.utils.pagination import CustomPageNumberPagination


class LandingPageCourseListView(generics.ListAPIView):
    """
    API endpoint for listing featured courses on landing page
    GET /api/courses/landingpagecourses/
    
    Returns courses ordered by their display order.
    Supports filtering by course attributes, searching, and custom ordering.
    Pagination: ?page=1&page_size=10 (default: 10, max: 100)
    """
    serializer_class = LandingPageCourseSerializer
    permission_classes = [AllowAny]
    pagination_class = CustomPageNumberPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    filterset_fields = {
        'course__is_active': ['exact'],
        'course__season': ['exact'],
        'course__instructor': ['exact'],
        'course__for_adults': ['exact'],
        'course__tags': ['exact'],
        'course__price': ['gte', 'lte'],
        'course__start_date': ['gte', 'lte'],
        'course__end_date': ['gte', 'lte'],
        'course__capacity': ['gte', 'lte'],
        'course__min_age': ['lte'],
        'course__max_age': ['gte'],
        'course__num_lectures': ['gte', 'lte'],
        'course__season__season_type': ['exact'],
        'course__season__is_active': ['exact'],
        'course__instructor__type': ['exact'],
        'order': ['exact', 'gte', 'lte'],
    }
    
    search_fields = ['course__name', 'course__description', 'course__instructor__user__first_name', 'course__instructor__user__last_name']
    ordering_fields = ['order', 'course__start_date', 'course__end_date', 'course__price', 'course__name', 'created_at', 'course__capacity', 'course__num_lectures']
    ordering = ['-order']

    def get_queryset(self):
        """
        Return optimized queryset with annotated enrollment counts.
        Only includes active courses that are featured on the landing page.
        """
        return LandingPageCourse.objects.select_related(
            'course__instructor__user',
            'course__season'
        ).prefetch_related(
            'course__tags',
            'course__schedules'
        ).filter(
            course__is_active=True
        ).annotate(
            # Annotate on the related course's enrollments
            _course_enrolled_count=Count(
                'course__enrollments',
                filter=Q(course__enrollments__status='active')
            )
        )
