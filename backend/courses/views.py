#!/usr/bin/env python3
"""Views for Course app"""
from django.shortcuts import render
from rest_framework import generics, filters
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from .models import Course, LandingPageCourse
from users.models import LandingPageInstructor
from .serializers import (
    CourseListSerializer, 
    CourseDetailSerializer,
    LandingPageCourseSerializer,
)
from users.serializers import LandingPageInstructorSerializer


class CourseListView(generics.ListAPIView):
    """
    API endpoint for listing all courses
    GET /api/courses/
    """
    queryset = Course.objects.select_related('instructor', 'season').prefetch_related('tags', 'schedules')
    serializer_class = CourseListSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'season', 'instructor', 'for_adults']
    search_fields = ['name', 'description']
    ordering_fields = ['start_date', 'price', 'created_at', 'name']
    ordering = ['-start_date']


class CourseDetailView(generics.RetrieveAPIView):
    """
    API endpoint for retrieving a single course by ID or slug
    GET /api/courses/{id}/
    GET /api/courses/{slug}/
    """
    queryset = Course.objects.select_related('instructor', 'season').prefetch_related('tags', 'schedules')
    serializer_class = CourseDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = 'pk'
    
    def get_object(self):
        """Override to allow lookup by both ID and slug"""
        lookup_value = self.kwargs.get(self.lookup_field)
        
        # Try to get by ID first
        if lookup_value.isdigit():
            return generics.get_object_or_404(self.queryset, pk=lookup_value)
        
        # Otherwise try to get by slug
        return generics.get_object_or_404(self.queryset, slug=lookup_value)


class LandingPageCourseListView(generics.ListAPIView):
    """
    API endpoint for listing featured courses on landing page
    GET /api/courses/landingpagecourses/
    Returns courses ordered by their display order
    """
    queryset = LandingPageCourse.objects.select_related(
        'course__instructor', 
        'course__season'
    ).prefetch_related(
        'course__tags', 
        'course__schedules'
    ).filter(course__is_active=True)
    serializer_class = LandingPageCourseSerializer
    permission_classes = [AllowAny]


class LandingPageInstructorListView(generics.ListAPIView):
    """
    API endpoint for listing featured instructors on landing page
    GET /api/landingpageinstructors/
    Returns instructors ordered by their display order
    """
    queryset = LandingPageInstructor.objects.select_related(
        'instructor__user'
    )
    serializer_class = LandingPageInstructorSerializer
    permission_classes = [AllowAny]
