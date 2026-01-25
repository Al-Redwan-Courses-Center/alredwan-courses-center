#!/usr/bin/env python3
"""URL patterns for Users app"""
from django.urls import path
from .views import LandingPageInstructorListView

app_name = 'users'

urlpatterns = [
    path('instructors/landing/', LandingPageInstructorListView.as_view(), name='landing-instructor-list'),
]
