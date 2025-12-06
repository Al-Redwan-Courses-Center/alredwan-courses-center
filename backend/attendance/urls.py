#!/usr/bin/env python3
''' URL routing for attendance app WebSocket consumers '''

from django.urls import path
from .consumers import InstructorAttendanceConsumer

websocket_urlpatterns = [
    path("ws/attendance/", InstructorAttendanceConsumer.as_asgi()),
]
