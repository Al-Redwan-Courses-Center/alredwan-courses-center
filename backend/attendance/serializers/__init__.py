#!/usr/bin/env python3
"""Serializers package for the attendance app."""

from .lecture_attendance import (
    MarkAttendanceSerializer,
    LectureAttendanceSerializer,
    LectureAttendanceDetailSerializer,
    BulkAttendanceItemSerializer,
    BulkMarkAttendanceSerializer,
)
from .instructor_attendance import (
    AttendanceDeviceSerializer,
    FingerprintCheckInSerializer,
    FingerprintCheckOutSerializer,
    FingerprintScanSerializer,
    FingerprintScanLogSerializer,
    InstructorAttendanceSerializer,
    InstructorAttendanceListSerializer,
    RateInstructorSerializer,
    SupervisorScheduleSerializer,
    TodayAttendanceSummarySerializer,
)

__all__ = [
    # Lecture Attendance Serializers
    'MarkAttendanceSerializer',
    'LectureAttendanceSerializer',
    'LectureAttendanceDetailSerializer',
    'BulkAttendanceItemSerializer',
    'BulkMarkAttendanceSerializer',
    # Instructor Attendance Serializers
    'AttendanceDeviceSerializer',
    'FingerprintCheckInSerializer',
    'FingerprintCheckOutSerializer',
    'FingerprintScanSerializer',
    'FingerprintScanLogSerializer',
    'InstructorAttendanceSerializer',
    'InstructorAttendanceListSerializer',
    'RateInstructorSerializer',
    'SupervisorScheduleSerializer',
    'TodayAttendanceSummarySerializer',
]
