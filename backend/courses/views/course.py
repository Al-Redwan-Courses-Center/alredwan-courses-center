#!/usr/bin/env python3
"""Views for Course model"""
from rest_framework import generics, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q, Sum, Value
from django.db.models.functions import Coalesce

from courses.models import Course
from courses.serializers import CourseListSerializer, CourseDetailSerializer, CourseUpdateSerializer
from courses.permissions import IsAdminOrCourseInstructor
from core.utils.pagination import CustomPageNumberPagination


class CourseListView(generics.ListAPIView):
    """
    API endpoint for listing all courses
    GET /api/courses/
    
    Supports comprehensive filtering, searching, and ordering capabilities.
    Pagination: ?page=1&page_size=10 (default: 10, max: 100)
    
    Available Filters:
    - is_active, season, instructor, for_adults, tags
    - price__gte, price__lte
    - start_date__gte, start_date__lte
    - end_date__gte, end_date__lte
    - capacity__gte, capacity__lte
    - min_age__lte, max_age__gte
    - num_lectures__gte, num_lectures__lte
    - season__season_type, season__is_active
    - instructor__type
    
    Search: name, description, instructor name
    Ordering: start_date, end_date, price, created_at, name, capacity, num_lectures
    """
    serializer_class = CourseListSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = CustomPageNumberPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    # Define filters directly in the view
    filterset_fields = {
        'is_active': ['exact'],
        'season': ['exact'],
        'instructor': ['exact'],
        'for_adults': ['exact'],
        'tags': ['exact'],
        'price': ['gte', 'lte'],
        'start_date': ['gte', 'lte'],
        'end_date': ['gte', 'lte'],
        'capacity': ['gte', 'lte'],
        'min_age': ['lte'],
        'max_age': ['gte'],
        'num_lectures': ['gte', 'lte'],
        'season__season_type': ['exact'],
        'season__is_active': ['exact'],
        'instructor__type': ['exact'],
    }
    
    search_fields = ['name', 'description', 'instructor__user__first_name', 'instructor__user__last_name']
    ordering_fields = ['start_date', 'end_date', 'price', 'created_at', 'name', 'capacity', 'num_lectures']
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
                filter=Q(enrollments__status='active'))
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


class CourseUpdateView(generics.UpdateAPIView):
    """
    API endpoint for updating course information
    PUT/PATCH /api/courses/{id}/edit/
    
    Permissions:
    - Admins: Full access to all courses
    - Supervisors: Full access to all courses
    - Instructors: Only access to courses they are assigned to teach
    """
    queryset = Course.objects.select_related('instructor', 'season').prefetch_related('tags', 'schedules')
    serializer_class = CourseUpdateSerializer
    permission_classes = [IsAdminOrCourseInstructor]
    lookup_field = 'pk'
    
    def update(self, request, *args, **kwargs):
        """Override to return detailed course info after update"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Return detailed course information
        output_serializer = CourseDetailSerializer(instance)
        return Response(output_serializer.data)
