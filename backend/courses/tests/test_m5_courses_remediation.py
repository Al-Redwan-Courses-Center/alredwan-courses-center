import uuid
from decimal import Decimal
from datetime import date, time, timedelta
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from users.models import CustomUser, Instructor
from parents.models import Parent, Child, ChildParents
from courses.models import Course, Season, CourseSchedule, Lecture
from courses.models.lecture import LectureStatus
from users.models.student_instructor_rating import (
    StudentCourseRating,
    ParentCourseRating,
)
from enrollments_payments.models import Enrollment, EnrollmentStatus
from attendance.models import LectureAttendance


class Milestone5CoursesRemediationTests(TestCase):
    """
    Comprehensive Milestone 5 verification for physical courses:
    - Batch schedules endpoint
    - Public ratings access with pagination
    - Secondary parent lecture & attendance access
    - Student age eligibility boundaries
    """

    def setUp(self):
        self.client = APIClient()
        self.today = timezone.localdate()

        self.season = Season.objects.create(
            name="Spring 2026 Season",
            season_type="winter",
            start_date=self.today,
            end_date=self.today + timedelta(days=90),
            is_active=True,
        )

        # Admin
        self.admin_user = CustomUser.objects.create_user(
            phone_number1="+201077770001",
            password="Password123!",
            first_name="Admin",
            last_name="Staff",
            role="admin",
            is_staff=True,
            dob="1980-01-01",
            gender="male",
        )

        # Instructor
        self.instructor_user = CustomUser.objects.create_user(
            phone_number1="+201077770002",
            password="Password123!",
            first_name="Dr",
            last_name="Karim",
            role="instructor",
            dob="1982-01-01",
            gender="male",
        )
        self.instructor = Instructor.objects.create(
            user=self.instructor_user, monthly_salary=4500
        )

        # Student
        self.student_user = CustomUser.objects.create_user(
            phone_number1="+201077770003",
            password="Password123!",
            first_name="Ziad",
            last_name="Student",
            role="student",
            dob="2006-01-01",
            gender="male",
        )
        self.student = self.student_user.student_profile

        # Primary Parent, Secondary Parent & Child
        self.primary_parent_user = CustomUser.objects.create_user(
            phone_number1="+201077770004",
            password="Password123!",
            first_name="Sameh",
            last_name="Parent",
            role="parent",
            dob="1975-01-01",
            gender="male",
        )
        self.primary_parent = self.primary_parent_user.parent_profile

        self.secondary_parent_user = CustomUser.objects.create_user(
            phone_number1="+201077770005",
            password="Password123!",
            first_name="Noha",
            last_name="Parent",
            role="parent",
            dob="1978-01-01",
            gender="female",
        )
        self.secondary_parent = self.secondary_parent_user.parent_profile

        self.unrelated_parent_user = CustomUser.objects.create_user(
            phone_number1="+201077770006",
            password="Password123!",
            first_name="Farouk",
            last_name="Parent",
            role="parent",
            dob="1980-01-01",
            gender="male",
        )

        self.child = Child.objects.create(
            first_name="Yassin",
            last_name="Sameh",
            primary_parent=self.primary_parent,
            dob="2015-01-01",
            gender="boy",
        )
        ChildParents.objects.create(child=self.child, parent=self.secondary_parent)

        # Courses
        self.course_1 = Course.objects.create(
            name="Physics Mechanics",
            description="Mechanics course",
            instructor=self.instructor,
            season=self.season,
            price=600.00,
            capacity=20,
            num_lectures=4,
            start_date=self.today,
            end_date=self.today + timedelta(days=90),
            is_active=True,
        )

        self.course_2 = Course.objects.create(
            name="Physics Electromagnetism",
            description="Electromagnetism course",
            instructor=self.instructor,
            season=self.season,
            price=700.00,
            capacity=20,
            num_lectures=4,
            start_date=self.today,
            end_date=self.today + timedelta(days=90),
            is_active=True,
        )

        # Schedules
        self.sched_1 = CourseSchedule.objects.create(
            course=self.course_1,
            weekday=0,
            start_time=time(10, 0),
            end_time=time(12, 0),
        )
        self.sched_2 = CourseSchedule.objects.create(
            course=self.course_2,
            weekday=2,
            start_time=time(14, 0),
            end_time=time(16, 0),
        )

    def test_batch_schedules_retrieval(self):
        """Batch schedules query returns schedules for specified course IDs or all schedules."""
        # Unfiltered returns all
        resp_all = self.client.get("/api/courses/schedules/")
        self.assertEqual(resp_all.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(resp_all.json()), 2)

        # Filtered single course
        resp_single = self.client.get(
            f"/api/courses/schedules/?course_ids={self.course_1.id}"
        )
        self.assertEqual(resp_single.status_code, status.HTTP_200_OK)
        single_ids = {s["course"] for s in resp_single.json()}
        self.assertEqual(single_ids, {self.course_1.id})

        # Filtered multiple courses
        resp_multi = self.client.get(
            f"/api/courses/schedules/?course_ids={self.course_1.id},{self.course_2.id}"
        )
        self.assertEqual(resp_multi.status_code, status.HTTP_200_OK)
        multi_ids = {s["course"] for s in resp_multi.json()}
        self.assertEqual(multi_ids, {self.course_1.id, self.course_2.id})

    def test_public_ratings_access_unauthenticated(self):
        """Public visitors can view course ratings without authentication."""
        StudentCourseRating.objects.create(
            student=self.student,
            course=self.course_1,
            rating=9,
            feedback="Excellent lectures!",
        )

        response = self.client.get(f"/api/courses/{self.course_1.id}/ratings/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["statistics"]["total_ratings"], 1)
        self.assertEqual(data["statistics"]["average_rating"], 9.0)
        self.assertIn("student_ratings", data["ratings"])
        self.assertIn("results", data["ratings"]["student_ratings"])

    def test_secondary_parent_lecture_and_attendance_access(self):
        """Secondary parent can access enrolled child's lectures and attendance history."""
        lecture = Lecture.objects.filter(course=self.course_1).first()
        if not lecture:
            lecture = Lecture.objects.create(
                course=self.course_1,
                lecture_number=1,
                title="Kinematics 101",
                day=self.today,
                start_time=time(10, 0),
                end_time=time(12, 0),
                status=LectureStatus.COMPLETED,
                is_accepted=True,
            )
        else:
            lecture.status = LectureStatus.COMPLETED
            lecture.is_accepted = True
            lecture.save()

        Enrollment.objects.create(
            course=self.course_1, child=self.child, status=EnrollmentStatus.ACTIVE
        )

        LectureAttendance.objects.update_or_create(
            lecture=lecture,
            child=self.child,
            defaults={
                "present": True,
                "rating": 10,
                "notes": "Active participation",
                "marked_by": self.admin_user,
                "marked_at": timezone.now(),
            },
        )

        # Secondary parent requests child lectures
        self.client.force_authenticate(user=self.secondary_parent_user)
        response = self.client.get(
            f"/api/courses/{self.course_1.id}/parent/{self.child.id}/lectures/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        lectures = response.json()
        self.assertGreaterEqual(len(lectures), 1)
        matched = [l for l in lectures if l["id"] == lecture.id][0]
        self.assertIsNotNone(matched["attendance_info"])
        self.assertTrue(matched["attendance_info"]["present"])
        self.assertEqual(matched["attendance_info"]["rating"], 10)

        # Unrelated parent gets empty list
        self.client.force_authenticate(user=self.unrelated_parent_user)
        unrelated_resp = self.client.get(
            f"/api/courses/{self.course_1.id}/parent/{self.child.id}/lectures/"
        )
        self.assertEqual(unrelated_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(unrelated_resp.json()), 0)

    def test_age_eligibility_for_youth_and_adults(self):
        """Course eligibility correctly evaluates student age boundaries."""
        # 16-year old student
        user_16 = CustomUser.objects.create_user(
            phone_number1="+201077770016",
            password="Password123!",
            first_name="Youth",
            role="student",
            dob=self.today - timedelta(days=365 * 16 + 10),
            gender="male",
        )
        student_16 = user_16.student_profile

        # Standard general course (for_adults=False, min_age=14, max_age=18)
        self.course_1.for_adults = False
        self.course_1.min_age = 14
        self.course_1.max_age = 18
        self.course_1.save()

        self.assertTrue(self.course_1.is_participant_eligible(student_16))

        # Adult course (for_adults=True, min_age=18)
        self.course_2.for_adults = True
        self.course_2.min_age = 18
        self.course_2.max_age = None
        self.course_2.save()

        self.assertFalse(self.course_2.is_participant_eligible(student_16))
