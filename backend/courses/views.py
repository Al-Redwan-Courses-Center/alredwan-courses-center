#!/usr/bin/env python3
"""Views for Course app"""
from django.shortcuts import render
from rest_framework import generics, filters, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Course, LandingPageCourse, Lecture
from users.models import LandingPageInstructor
from .serializers import (
    CourseListSerializer, 
    CourseDetailSerializer,
    LandingPageCourseSerializer,
    CourseUpdateSerializer,
    LectureUpdateSerializer,
)
from users.serializers import LandingPageInstructorSerializer
from .permissions import IsAdminOrCourseInstructor


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


class CourseUpdateView(generics.UpdateAPIView):
    """
    API endpoint for updating course information
    PUT/PATCH /api/courses/{id}/edit/
    
    Authentication required: Admin or course instructor only
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


class LectureUpdateView(generics.UpdateAPIView):
    """
    API endpoint for updating lecture information
    PUT/PATCH /api/lectures/{id}/edit/
    
    Authentication required: Admin or course instructor only
    """
    queryset = Lecture.objects.select_related('course', 'instructor')
    serializer_class = LectureUpdateSerializer
    permission_classes = [IsAdminOrCourseInstructor]
    lookup_field = 'pk'
    
    def update(self, request, *args, **kwargs):
        """Override to add custom response with detailed info"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response({
            'id': instance.id,
            'title': instance.title,
            'course': instance.course.name,
            'course_id': instance.course.id,
            'day': instance.day,
            'start_time': instance.start_time,
            'end_time': instance.end_time,
            'lecture_number': instance.lecture_number,
            'status': instance.status,
            'attendance_taken': instance.attendance_taken,
            'updated_at': instance.updated_at,
        })


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
