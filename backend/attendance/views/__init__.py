#!/usr/bin/env python3
"""Views package for the attendance app."""

from .lecture_attendance import (
    LectureAttendanceView,
    BulkLectureAttendanceView,
    LectureAttendanceDetailView,
)
from .instructor_attendance import (
    # Fingerprint Device Views
    DeviceAuthenticationMixin,
    FingerprintCheckInView,
    FingerprintCheckOutView,
    UnifiedFingerprintScanView,
    # Admin Dashboard Views
    TodayAttendanceListView,
    TodayAttendanceSummaryView,
    AttendanceDetailView,
    RateAttendanceView,
    AttendanceByDateView,
    InstructorAttendanceHistoryView,
    # Device Management Views
    AttendanceDeviceListView,
    AttendanceDeviceDetailView,
    # Schedule Management Views
    SupervisorScheduleListView,
    SupervisorScheduleDetailView,
    # Function-based Views
    manual_check_in,
    manual_check_out,
    mark_absent,
)

__all__ = [
    # Lecture Attendance
    'LectureAttendanceView',
    'BulkLectureAttendanceView',
    'LectureAttendanceDetailView',
    # Instructor Attendance - Fingerprint
    'DeviceAuthenticationMixin',
    'FingerprintCheckInView',
    'FingerprintCheckOutView',
    'UnifiedFingerprintScanView',
    # Instructor Attendance - Admin Dashboard
    'TodayAttendanceListView',
    'TodayAttendanceSummaryView',
    'AttendanceDetailView',
    'RateAttendanceView',
    'AttendanceByDateView',
    'InstructorAttendanceHistoryView',
    # Device Management
    'AttendanceDeviceListView',
    'AttendanceDeviceDetailView',
    # Schedule Management
    'SupervisorScheduleListView',
    'SupervisorScheduleDetailView',
    # Function-based Views
    'manual_check_in',
    'manual_check_out',
    'mark_absent',
]
