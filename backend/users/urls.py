#!/usr/bin/env python3
"""URL patterns for Users app"""
from django.urls import path
from .views import (
    InstructorListView,
    InstructorDetailView,
    LandingPageInstructorListView,
    InstructorRatingsView,
    InstructorRateView
)

app_name = 'users'

urlpatterns = [
    path('instructors/', InstructorListView.as_view(), name='instructor-list'),
    path('instructors/<int:pk>/', InstructorDetailView.as_view(), name='instructor-detail'),
    path('instructors/<int:pk>/ratings/', InstructorRatingsView.as_view(), name='instructor-ratings'),
    path('instructors/<int:pk>/rate/', InstructorRateView.as_view(), name='instructor-rate'),
    path('landingpageinstructors/', LandingPageInstructorListView.as_view(), name='landing-instructor-list'),
]
