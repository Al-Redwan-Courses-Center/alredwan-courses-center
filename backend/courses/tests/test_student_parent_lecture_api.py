#!/usr/bin/env python3
"""
Tests for Student and Parent Lecture APIs
"""
from datetime import time, timedelta
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from users.models import CustomUser, StudentUser
from parents.models import Child, Parent
from courses.models import Course, Season, Lecture
from courses.models.lecture import LectureStatus
from enrollments_payments.models import Enrollment, EnrollmentStatus
from attendance.models import LectureAttendance


class StudentParentLectureAPITestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.today = timezone.localdate()
        
        # Admin
        cls.admin_user = CustomUser.objects.create_user(
            phone_number1='+201000000001', password='pass',
            first_name='Admin', is_staff=True, is_superuser=True,
            dob='1990-01-01', gender='male'
        )
        
        # Student
        cls.student_user = CustomUser.objects.create_user(
            phone_number1='+201000000002', password='pass',
            first_name='Student', role='student',
            dob='2010-01-01', gender='male'
        )
        cls.student = cls.student_user.student_profile
        
        # Parent & Child
        cls.parent_user = CustomUser.objects.create_user(
            phone_number1='+201000000003', password='pass',
            first_name='Parent', role='parent',
            dob='1980-01-01', gender='female'
        )
        cls.parent = cls.parent_user.parent_profile
        cls.child = Child.objects.create(
            first_name='Child', primary_parent=cls.parent,
            dob='2015-01-01', gender='male'
        )
        
        # Non-enrolled Student
        cls.other_student_user = CustomUser.objects.create_user(
            phone_number1='+201000000004', password='pass',
            first_name='Other', role='student',
            dob='2010-01-01', gender='male'
        )
        cls.other_student = cls.other_student_user.student_profile
        
        # Course & Lecture
        cls.season = Season.objects.create(
            name="Winter 2026", start_date=cls.today, end_date=cls.today + timedelta(days=90)
        )
        cls.course = Course.objects.create(
            name="Test Course", season=cls.season, capacity=10,
            start_date=cls.today, end_date=cls.today + timedelta(days=90),
            price=100.00
        )
        cls.lecture = Lecture.objects.create(
            course=cls.course,
            lecture_number=1,
            title="Lecture 1",
            day=cls.today,
            start_time=time(9, 0),
            end_time=time(11, 0),
            status=LectureStatus.COMPLETED,
            is_accepted=True
        )
        
        # Enrollments
        Enrollment.objects.create(
            course=cls.course, student=cls.student,
            status=EnrollmentStatus.ACTIVE
        )
        Enrollment.objects.create(
            course=cls.course, child=cls.child,
            status=EnrollmentStatus.ACTIVE
        )
        
        # Attendance (Update the auto-generated ones or create if missing)
        cls.student_attendance, _ = LectureAttendance.objects.get_or_create(
            lecture=cls.lecture, student=cls.student,
            defaults={'marked_by': cls.admin_user}
        )
        cls.student_attendance.present = True
        cls.student_attendance.rating = 9
        cls.student_attendance.notes = "Great job"
        cls.student_attendance.marked_by = cls.admin_user
        cls.student_attendance.marked_at = timezone.now()
        cls.student_attendance.save()
        
        cls.child_attendance, _ = LectureAttendance.objects.get_or_create(
            lecture=cls.lecture, child=cls.child,
            defaults={'marked_by': cls.admin_user}
        )
        cls.child_attendance.present = True
        cls.child_attendance.rating = 8
        cls.child_attendance.notes = "Good"
        cls.child_attendance.marked_by = cls.admin_user
        cls.child_attendance.marked_at = timezone.now()
        cls.child_attendance.save()

    def setUp(self):
        self.client = APIClient()

    def test_student_get_lectures(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(f'/api/courses/{self.course.id}/student/lectures/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['id'], self.lecture.id)
        
        # Check personal attendance info
        att_info = data[0]['attendance_info']
        self.assertIsNotNone(att_info)
        self.assertTrue(att_info['present'])
        self.assertEqual(att_info['rating'], 9)
        self.assertEqual(att_info['notes'], "Great job")

    def test_unauthorized_student_get_lectures(self):
        self.client.force_authenticate(user=self.other_student_user)
        response = self.client.get(f'/api/courses/{self.course.id}/student/lectures/')
        # Should return empty or 200 with empty list, since they aren't enrolled
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 0)

    def test_parent_get_child_lectures(self):
        self.client.force_authenticate(user=self.parent_user)
        response = self.client.get(f'/api/courses/{self.course.id}/parent/{self.child.id}/lectures/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['id'], self.lecture.id)
        
        # Check personal attendance info
        att_info = data[0]['attendance_info']
        self.assertIsNotNone(att_info)
        self.assertTrue(att_info['present'])
        self.assertEqual(att_info['rating'], 8)
        self.assertEqual(att_info['notes'], "Good")

    def test_parent_get_invalid_child_lectures(self):
        import uuid
        self.client.force_authenticate(user=self.parent_user)
        # Try to fetch another non-existent child ID
        random_uuid = uuid.uuid4()
        response = self.client.get(f'/api/courses/{self.course.id}/parent/{random_uuid}/lectures/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 0)

    def test_secondary_parent_get_child_lectures(self):
        from parents.models import ChildParents
        sec_parent_user = CustomUser.objects.create_user(
            phone_number1='+201000000005', password='pass',
            first_name='SecParent', role='parent',
            dob='1982-01-01', gender='male'
        )
        sec_parent = sec_parent_user.parent_profile
        ChildParents.objects.create(child=self.child, parent=sec_parent)

        self.client.force_authenticate(user=sec_parent_user)
        response = self.client.get(f'/api/courses/{self.course.id}/parent/{self.child.id}/lectures/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['id'], self.lecture.id)

    def test_age_16_eligible_for_general_course(self):
        # Student born 16 years before course start date
        sixteen_user = CustomUser.objects.create_user(
            phone_number1='+201000000006', password='pass',
            first_name='Teen', role='student',
            dob=self.course.start_date - timedelta(days=365 * 16 + 5),
            gender='male'
        )
        sixteen_user.refresh_from_db()
        teen_student = sixteen_user.student_profile
        # Course is for_adults=False, min_age=14, max_age=18
        self.course.for_adults = False
        self.course.min_age = 14
        self.course.max_age = 18
        self.course.save()
        self.assertTrue(self.course.is_participant_eligible(teen_student))
