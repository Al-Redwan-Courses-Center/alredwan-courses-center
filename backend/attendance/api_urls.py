#!/usr/bin/env python3
"""URL routing for attendance app API endpoints."""

from django.urls import path
from . import views

app_name = 'attendance'

urlpatterns = [
    # WebSocket ticket endpoints (for secure WebSocket authentication)
    path('ws-ticket/', views.ObtainWebSocketTicketView.as_view(),
         name='ws-ticket'),
    path('ws-ticket/cleanup/', views.CleanupExpiredTicketsView.as_view(),
         name='ws-ticket-cleanup'),

    # Fingerprint device endpoints (no auth required - device uses device_id)
    # RECOMMENDED: Use /scan/ for devices that don't distinguish check-in/out
    path('scan/', views.UnifiedFingerprintScanView.as_view(),
         name='fingerprint-scan'),
    # Legacy endpoints (still supported for devices that specify action)
    path('check-in/', views.FingerprintCheckInView.as_view(),
         name='fingerprint-check-in'),
    path('check-out/', views.FingerprintCheckOutView.as_view(),
         name='fingerprint-check-out'),

    # Admin dashboard endpoints
    path('all/', views.AdminAllAttendanceListView.as_view(),
         name='all-attendance'),
    path('all/<int:pk>/', views.AdminEditAttendanceView.as_view(),
         name='edit-attendance'),
    path('generate/', views.GenerateAttendanceView.as_view(),
         name='generate-attendance'),
    path('today/', views.TodayAttendanceListView.as_view(), name='today-attendance'),
    path('today/summary/', views.TodayAttendanceSummaryView.as_view(),
         name='today-summary'),
    path('date/<str:date>/', views.AttendanceByDateView.as_view(),
         name='attendance-by-date'),

    # Attendance record management
    path('<int:pk>/', views.AttendanceDetailView.as_view(),
         name='attendance-detail'),
    path('<int:pk>/rate/', views.RateAttendanceView.as_view(),
         name='rate-attendance'),
    path('<int:pk>/manual-check-in/',
         views.manual_check_in, name='manual-check-in'),
    path('<int:pk>/manual-check-out/',
         views.manual_check_out, name='manual-check-out'),
    path('<int:pk>/mark-absent/', views.mark_absent, name='mark-absent'),

    # Instructor attendance history
    path('instructor/<int:instructor_id>/',
         views.InstructorAttendanceHistoryView.as_view(), name='instructor-history'),

    # Device management
    path('devices/', views.AttendanceDeviceListView.as_view(), name='device-list'),
    path('devices/<int:pk>/', views.AttendanceDeviceDetailView.as_view(),
         name='device-detail'),

    # Supervisor schedule management
    path('schedules/', views.SupervisorScheduleListView.as_view(),
         name='schedule-list'),
    path('schedules/<int:pk>/',
         views.SupervisorScheduleDetailView.as_view(), name='schedule-detail'),
    path('my-schedule/', views.MyScheduleView.as_view(), name='my-schedule'),
    path('my-attendance/', views.MyAttendanceView.as_view(), name='my-attendance'),
]
