#!/usr/bin/env python3
"""URL patterns for Course app"""
from django.urls import path
from .views import (
    CourseListView,
    CourseDetailView,
    CourseUpdateView,
    LectureUpdateView,
    LectureDetailView,
    LandingPageCourseListView,
    LectureListCreateView,
    LectureNumberCheckView,
    InstructorTodayLecturesView,
    CourseRatingsView,
    CourseScheduleListView,
    CourseScheduleDetailView,
)

app_name = 'courses'

urlpatterns = [
    path('', CourseListView.as_view(), name='course-list'),
    path('landingpagecourses/', LandingPageCourseListView.as_view(),
         name='landing-course-list'),
    path('<str:pk>/ratings/', CourseRatingsView.as_view(), name='course-ratings'),
    path('<str:pk>/', CourseDetailView.as_view(), name='course-detail'),
    path('<int:pk>/edit/', CourseUpdateView.as_view(), name='course-edit'),
    path('lectures/<int:pk>/edit/',
         LectureUpdateView.as_view(), name='lecture-edit'),
    path('lectures/<int:pk>/', LectureDetailView.as_view(), name='lecture-detail'),
    path('lectures/today/', InstructorTodayLecturesView.as_view(),
         name='instructor-today-lectures'),

    # Lecture endpoints
    path('<str:course_id>/lectures/',
         LectureListCreateView.as_view(), name='lecture-list-create'),
    path('<str:course_id>/lectures/check-datetime/',
         LectureNumberCheckView.as_view(), name='lecture-check-datetime'),

    # Course schedule endpoints (admin CRUD)
    path('<int:course_id>/schedules/',
         CourseScheduleListView.as_view(), name='course-schedule-list'),
    path('<int:course_id>/schedules/<int:pk>/',
         CourseScheduleDetailView.as_view(), name='course-schedule-detail'),
]
