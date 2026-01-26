#!/usr/bin/env python3
"""Views for Users app"""
from rest_framework import generics
from rest_framework.permissions import AllowAny
from .models import LandingPageInstructor
from .serializers import LandingPageInstructorSerializer
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
