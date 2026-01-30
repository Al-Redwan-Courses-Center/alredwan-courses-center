#!/usr/bin/env python3
"""
Cron jobs for Enrollments and Payments.

These jobs should be scheduled to run periodically (e.g., daily) using
django-crontab, Celery Beat, or system cron.

Example django-crontab configuration in settings.py:
    CRONJOBS = [
        ('0 1 * * *', 'enrollments_payments.cron.mark_completed_enrollments_daily'),
        ('0 2 * * *', 'enrollments_payments.cron.expire_pending_enrollment_requests'),
    ]
"""
from django.utils import timezone
from django.db import transaction


def mark_completed_enrollments_daily():
    """
    Cron job to automatically mark enrollments as completed.

    This job checks all active enrollments and marks them as completed if:
    1. The course end_date has passed, OR
    2. All lectures in the course have been completed

    Should be run daily, preferably during off-peak hours (e.g., 1 AM).
    """
    from .models.enrollment import Enrollment, EnrollmentStatus

    # Get all completable enrollments
    completable = Enrollment.objects.get_completable_enrollments()

    completed_count = 0
    errors = []

    for enrollment in completable:
        try:
            with transaction.atomic():
                enrollment.update_status(EnrollmentStatus.COMPLETED)
                completed_count += 1
        except Exception as e:
            errors.append(f"{enrollment.id}: {str(e)}")

    # Log the results
    log_message = f"[{timezone.now()}] mark_completed_enrollments_daily: Completed {completed_count} enrollments."
    if errors:
        log_message += f" Errors: {len(errors)} - {errors[:5]}"

    print(log_message)

    # Optionally create a log record (similar to AttendanceCronLog)
    try:
        from attendance.models.attendance_cron_log import AttendanceCronLog
        AttendanceCronLog.objects.create(
            job_name="mark_completed_enrollments_daily",
            details=f"Completed {completed_count} enrollments. Errors: {len(errors)}"
        )
    except Exception:
        pass  # Log model may not exist

    return completed_count


def expire_pending_enrollment_requests():
    """
    Cron job to expire enrollment requests that have passed their expiry date.

    This job finds all PENDING enrollment requests where expires_at < now
    and marks them as EXPIRED.

    Should be run daily.
    """
    from .models.enrollment_request import EnrollmentRequest, EnrollmentRequestStatus

    now = timezone.now()

    # Find expired pending requests
    expired_requests = EnrollmentRequest.objects.filter(
        status=EnrollmentRequestStatus.PENDING,
        expires_at__lt=now
    )

    count = expired_requests.update(status=EnrollmentRequestStatus.EXPIRED)

    # Log the results
    log_message = f"[{timezone.now()}] expire_pending_enrollment_requests: Expired {count} requests."
    print(log_message)

    try:
        from attendance.models.attendance_cron_log import AttendanceCronLog
        AttendanceCronLog.objects.create(
            job_name="expire_pending_enrollment_requests",
            details=f"Expired {count} enrollment requests."
        )
    except Exception:
        pass

    return count


def check_and_complete_course_enrollments(course_id):
    """
    Check and complete enrollments for a specific course.

    This can be called manually or triggered when a lecture is marked as completed.

    Args:
        course_id: The ID of the course to check

    Returns:
        int: Number of enrollments marked as completed
    """
    from .models.enrollment import Enrollment, EnrollmentStatus

    enrollments = Enrollment.objects.filter(
        course_id=course_id,
        status=EnrollmentStatus.ACTIVE
    ).select_related('course').prefetch_related('course__lectures')

    completed_count = 0

    for enrollment in enrollments:
        if enrollment.should_be_completed():
            try:
                enrollment.update_status(EnrollmentStatus.COMPLETED)
                completed_count += 1
            except Exception:
                pass

    return completed_count
