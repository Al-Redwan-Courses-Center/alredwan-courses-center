#!/usr/bin/env python3
"""URL patterns for Course app"""
from django.urls import path
from .views import (
    CourseListView, 
    CourseDetailView,
    CourseUpdateView,
    LectureUpdateView,
    LandingPageCourseListView,
    LectureListCreateView,
    LectureNumberCheckView,
)

app_name = 'courses'

urlpatterns = [
    path('', CourseListView.as_view(), name='course-list'),
    path('landingpagecourses/', LandingPageCourseListView.as_view(), name='landing-course-list'),
    path('<str:pk>/', CourseDetailView.as_view(), name='course-detail'),
    path('<int:pk>/edit/', CourseUpdateView.as_view(), name='course-edit'),
    path('lectures/<int:pk>/edit/', LectureUpdateView.as_view(), name='lecture-edit'),
    
    # Lecture endpoints
    path('<str:course_id>/lectures/', LectureListCreateView.as_view(), name='lecture-list-create'),
    path('<str:course_id>/lectures/check-datetime/', LectureNumberCheckView.as_view(), name='lecture-check-datetime'),
]
