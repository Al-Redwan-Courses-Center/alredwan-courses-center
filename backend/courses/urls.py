#!/usr/bin/env python3
"""URL patterns for Course app"""
from django.urls import path
from .views import (
    CourseListView, 
    CourseDetailView,
    LandingPageCourseListView,
)

app_name = 'courses'

urlpatterns = [
    path('', CourseListView.as_view(), name='course-list'),
    path('landing/', LandingPageCourseListView.as_view(), name='landing-course-list'),
    path('<str:pk>/', CourseDetailView.as_view(), name='course-detail'),
]
