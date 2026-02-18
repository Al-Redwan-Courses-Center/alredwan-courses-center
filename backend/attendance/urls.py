#!/usr/bin/env python3
''' URL routing for attendance app REST API and WebSocket consumers '''

from django.urls import path, include
from .consumers import InstructorAttendanceConsumer
from .views import LectureAttendanceView, BulkLectureAttendanceView, LectureAttendanceDetailView

# Include API urls from api_urls.py
from .api_urls import urlpatterns as api_urlpatterns

# REST API URL patterns
urlpatterns = [
    # Lecture attendance endpoints
    path('lecture/<int:lecture_id>/mark/',
         LectureAttendanceView.as_view(), name='mark-attendance'),
    path('lecture/<int:lecture_id>/mark-bulk/',
         BulkLectureAttendanceView.as_view(), name='mark-bulk-attendance'),
    path('lecture/<int:lecture_id>/details/',
         LectureAttendanceDetailView.as_view(), name='lecture-attendance-details'),
] + api_urlpatterns

# WebSocket URL patterns
websocket_urlpatterns = [
    path("ws/attendance/", InstructorAttendanceConsumer.as_asgi()),
]
