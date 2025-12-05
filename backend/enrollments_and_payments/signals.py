#!/usr/bin/env python3
''' Signals for Course app'''
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models.enrollment import Enrollment
from attendance.models.lecture_attendance import LectureAttendance
from datetime import timezone


@receiver(post_save, sender=Enrollment)
def create_lecture_attendance_for_enrollment(sender, instance, created, **kwargs):
    ''' Create lecture attendance records when a new enrollment is created '''
    if created:
        enrollment = instance
        lectures = enrollment.course.lectures.filter(day__gte=timezone.now())
        attendance_records = []
        for lecture in lectures:
            attendance = LectureAttendance(
                lecture=lecture,
                child=enrollment.child if enrollment.child else None,
                student=enrollment.student if enrollment.student else None,
                present=None  # Not marked yet
            )
            attendance_records.append(attendance)
        LectureAttendance.objects.bulk_create(attendance_records)
