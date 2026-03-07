#!/usr/bin/env python3
"""Views package for the attendance app."""

from .lecture_attendance import (
    LectureAttendanceView,
    BulkLectureAttendanceView,
    LectureAttendanceDetailView,
)
from .instructor_attendance import (
    # Permission Classes
    IsAdminOrSupervisorRole,
    IsAdminRoleOnly,
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
    AdminAllAttendanceListView,
    AdminEditAttendanceView,
    GenerateAttendanceView,
    # Device Management Views
    AttendanceDeviceListView,
    AttendanceDeviceDetailView,
    # Schedule Management Views
    SupervisorScheduleListView,
    SupervisorScheduleDetailView,
    MyScheduleView,
    # Function-based Views
    manual_check_in,
    manual_check_out,
    mark_absent,
)
from .websocket_ticket import (
    ObtainWebSocketTicketView,
    CleanupExpiredTicketsView,
)

__all__ = [
    # Permission Classes
    'IsAdminOrSupervisorRole',
    'IsAdminRoleOnly',
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
    'AdminAllAttendanceListView',
    'AdminEditAttendanceView',
    'GenerateAttendanceView',
    # Device Management
    'AttendanceDeviceListView',
    'AttendanceDeviceDetailView',
    # Schedule Management
    'SupervisorScheduleListView',
    'SupervisorScheduleDetailView',
    'MyScheduleView',
    # Function-based Views
    'manual_check_in',
    'manual_check_out',
    'mark_absent',
    # WebSocket Ticket
    'ObtainWebSocketTicketView',
    'CleanupExpiredTicketsView',
]
