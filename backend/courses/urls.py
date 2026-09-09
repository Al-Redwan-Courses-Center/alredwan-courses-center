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
    BatchCourseScheduleListView,
    CourseRateView,
    StudentCourseLecturesView,
    ParentCourseLecturesView,
)

app_name = 'courses'

urlpatterns = [
    path('', CourseListView.as_view(), name='course-list'),
    path('landingpagecourses/', LandingPageCourseListView.as_view(),
         name='landing-course-list'),
    path('schedules/', BatchCourseScheduleListView.as_view(),
         name='course-schedules-batch'),
    path('<str:pk>/ratings/', CourseRatingsView.as_view(), name='course-ratings'),
    path('<str:pk>/rate/', CourseRateView.as_view(), name='course-rate'),
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
         
    # Student and Parent endpoints
    path('<str:course_id>/student/lectures/',
         StudentCourseLecturesView.as_view(), name='student-course-lectures'),
    path('<str:course_id>/parent/<str:child_id>/lectures/',
         ParentCourseLecturesView.as_view(), name='parent-course-lectures'),
]
