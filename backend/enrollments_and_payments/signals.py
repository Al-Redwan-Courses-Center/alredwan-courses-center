#!/usr/bin/env python3
''' Signals for Course app'''
from django.db.models.signals import post_save, pre_delete
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


@receiver(pre_delete, sender=Enrollment)
def delete_lecture_attendance_for_enrollment(sender, instance, **kwargs):
    ''' Delete lecture attendance records when an enrollment is deleted '''
    enrollment = instance
    lectures = enrollment.course.lectures.filter(day__gte=timezone.now())
    for lecture in lectures:
        LectureAttendance.objects.filter(
            lecture=lecture,
            child=enrollment.child if enrollment.child else None,
            student=enrollment.student if enrollment.student else None
        ).delete()
