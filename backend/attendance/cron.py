#!/usr/bin/env python3

"""Cron jobs for Attendances"""
from django.utils import timezone
from datetime import timedelta
from .models.instructor_attendance import InstructorAttendance, AttendanceStatus
from .models.attendance_cron_log import AttendanceCronLog


def generate_instructor_attendance_weekly():
    """
    Cron job to generate attendance records one week ahead.
    
    Runs every Sunday at 00:05 AM.
    Creates attendance records for the upcoming week based on:
    - Supervisor schedules
    - Lectures scheduled for that week
    """
    today = timezone.localdate()
    start = today
    end = today + timedelta(days=7)

    created_count = InstructorAttendance.generate_for_date_range(start, end)

    AttendanceCronLog.objects.create(
        job_name="generate_attendance_weekly",
        details=f"Created {created_count} attendance records from {start} to {end}"
    )


def mark_absent_daily():
    """
    Cron job to mark instructors as absent at end of day.
    
    Runs at 23:59 every day.
    Marks all PENDING or NOT_STARTED records for TODAY as ABSENT.
    
    This catches instructors who:
    - Never checked in for their scheduled duties
    - Had attendance records created but never showed up
    """
    today = timezone.localdate()

    # All PENDING or NOT_STARTED should become ABSENT
    qs = InstructorAttendance.objects.filter(
        date=today,
        status__in=[AttendanceStatus.PENDING, AttendanceStatus.NOT_STARTED]
    )

    # Use individual saves to trigger rating nullification in save()
    updated_count = 0
    for attendance in qs:
        attendance.mark_absent()
        updated_count += 1

    AttendanceCronLog.objects.create(
        job_name="mark_absent_daily",
        details=f"Marked {updated_count} instructors as ABSENT for {today}"
    )


def mark_absent_for_yesterday():
    """
    Cron job to mark instructors as absent for yesterday (fallback).
    
    Runs at 00:01 AM to catch any records that weren't marked
    the previous day (e.g., if the 23:59 job failed).
    """
    yesterday = timezone.localdate() - timedelta(days=1)

    qs = InstructorAttendance.objects.filter(
        date=yesterday,
        status__in=[AttendanceStatus.PENDING, AttendanceStatus.NOT_STARTED]
    )

    updated_count = 0
    for attendance in qs:
        attendance.mark_absent()
        updated_count += 1

    if updated_count > 0:
        AttendanceCronLog.objects.create(
            job_name="mark_absent_for_yesterday",
            details=f"Marked {updated_count} instructors as ABSENT for {yesterday} (fallback job)"
        )


def update_pending_to_not_started():
    """
    Cron job to update PENDING status to NOT_STARTED at the beginning of day.
    
    Runs at 06:00 AM to mark today's attendance as awaiting check-in.
    This is useful for dashboards to show which instructors are expected today.
    """
    today = timezone.localdate()

    qs = InstructorAttendance.objects.filter(
        date=today,
        status=AttendanceStatus.NOT_STARTED
    )
    
    # Log the count
    count = qs.count()
    
    if count > 0:
        AttendanceCronLog.objects.create(
            job_name="update_pending_to_not_started",
            details=f"{count} attendance records ready for today {today}"
        )

