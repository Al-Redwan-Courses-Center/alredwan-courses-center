#!/usr/bin/env python3

"""Cron jobs for Attendances"""
from django.utils import timezone
from users.models.instructor import InstructorAttendance
from .models.attendance_cron_log import AttendanceCronLog


def generate_instructor_attendance_weekly():
    """
    Cron job to generate attendance records one week ahead
    """
    today = timezone.localdate()
    start = today
    end = today + timezone.timedelta(days=7)

    created_count = InstructorAttendance.generate_for_date_range(start, end)

    AttendanceCronLog.objects.create(
        job_name="generate_attendance_weekly",
        details=f"Created {created_count} attendance records from {start} to {end}"
    )


def mark_absent_daily():
    today = timezone.localdate()

    # All PENDING or NOT_STARTED should become ABSENT
    qs = InstructorAttendance.objects.filter(
        date=today,
        status__in=["pending", "not_started"]
    )

    updated = qs.update(status="absent")

    AttendanceCronLog.objects.create(
        job_name="mark_absent_daily",
        details=f"Marked {updated} instructors as ABSENT for {today}"
    )
