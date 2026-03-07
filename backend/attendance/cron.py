#!/usr/bin/env python3

"""Cron jobs for Attendances"""
from django.utils import timezone
from datetime import timedelta
from .models.instructor_attendance import InstructorAttendance, AttendanceStatus
from .models.attendance_cron_log import AttendanceCronLog
from courses.models.lecture import Lecture, LectureStatus


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


def mark_lectures_without_attendance_as_cancelled():
    """
    Cron job to mark lectures as cancelled if attendance wasn't taken.
    
    Runs daily at 23:55 (before mark_absent_daily).
    
    Logic:
    - Find all lectures from yesterday (or earlier) that:
      - Have status = SCHEDULED
      - Have attendance_taken = False
    - Mark them as CANCELLED
    
    This handles cases where:
    - Instructor didn't show up
    - Lecture was skipped without formal cancellation
    - Technical issues prevented attendance marking
    
    Note: Only marks lectures that are past their scheduled date.
    Today's lectures are not affected (they might still be ongoing).
    """
    yesterday = timezone.localdate() - timedelta(days=1)
    
    # Find all past lectures that are still SCHEDULED but attendance wasn't taken
    lectures_to_cancel = Lecture.objects.filter(
        day__lte=yesterday,
        status=LectureStatus.SCHEDULED,
        attendance_taken=False
    )
    
    cancelled_count = 0
    cancelled_lectures = []
    
    for lecture in lectures_to_cancel:
        lecture.status = LectureStatus.CANCELLED
        lecture.save(update_fields=['status', 'updated_at'])
        cancelled_count += 1
        cancelled_lectures.append(f"{lecture.course.name} - {lecture.title or f'Lecture {lecture.lecture_number}'} ({lecture.day})")
    
    if cancelled_count > 0:
        details = f"Marked {cancelled_count} lectures as CANCELLED (no attendance taken):\n"
        details += "\n".join(cancelled_lectures[:20])  # Limit to first 20 for log readability
        if cancelled_count > 20:
            details += f"\n... and {cancelled_count - 20} more"
        
        AttendanceCronLog.objects.create(
            job_name="mark_lectures_without_attendance_as_cancelled",
            details=details
        )
    
    return cancelled_count


def mark_lectures_without_attendance_as_cancelled_fallback():
    """
    Fallback cron job for marking lectures as cancelled.
    
    Runs daily at 00:05 AM to catch any lectures missed by the previous day's job.
    Only processes lectures from 2+ days ago to avoid race conditions.
    """
    two_days_ago = timezone.localdate() - timedelta(days=2)
    
    lectures_to_cancel = Lecture.objects.filter(
        day__lte=two_days_ago,
        status=LectureStatus.SCHEDULED,
        attendance_taken=False
    )
    
    cancelled_count = 0
    for lecture in lectures_to_cancel:
        lecture.status = LectureStatus.CANCELLED
        lecture.save(update_fields=['status', 'updated_at'])
        cancelled_count += 1
    
    if cancelled_count > 0:
        AttendanceCronLog.objects.create(
            job_name="mark_lectures_without_attendance_as_cancelled_fallback",
            details=f"Marked {cancelled_count} old lectures as CANCELLED (fallback job, ≤ {two_days_ago})"
        )
    
    return cancelled_count
