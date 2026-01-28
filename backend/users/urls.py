#!/usr/bin/env python3
"""URL patterns for Users app"""
from django.urls import path
from .views import InstructorListView, InstructorDetailView, LandingPageInstructorListView

app_name = 'users'

urlpatterns = [
    path('instructors/', InstructorListView.as_view(), name='instructor-list'),
    path('instructor/<int:pk>/', InstructorDetailView.as_view(), name='instructor-detail'),
    path('landingpageinstructors/', LandingPageInstructorListView.as_view(), name='landing-instructor-list'),
]
