#!/usr/bin/env python3
"""Views for Users app"""
from rest_framework import generics, filters
from rest_framework.permissions import AllowAny, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Instructor, LandingPageInstructor
from .serializers import InstructorListSerializer, InstructorDetailSerializer, LandingPageInstructorSerializer
from django.shortcuts import render

# Create your views here.


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
    """
    serializer_class = InstructorListSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['type', 'tags']
    search_fields = ['user__first_name', 'user__last_name', 'bio']
    ordering_fields = ['joined_date', 'user__first_name', 'user__last_name']
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
