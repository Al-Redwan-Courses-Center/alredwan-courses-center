#!/usr/bin/env python3
''' URL routing for attendance app WebSocket consumers '''

from django.urls import path
from .consumers import InstructorAttendanceConsumer
from .views import LectureAttendanceView

# REST API URL patterns
urlpatterns = [
    path('lecture/<int:lecture_id>/mark/', LectureAttendanceView.as_view(), name='mark-attendance'),
]

# WebSocket URL patterns
websocket_urlpatterns = [
    path("ws/attendance/", InstructorAttendanceConsumer.as_asgi()),
]
