#!/usr/bin/env python3
"""Instructor views for viewing enrollments in their courses."""

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django_filters import rest_framework as filters
from django.db.models import Count, Q
from django.core.exceptions import ValidationError

from ..serializers.instructor_enrollment import (
    InstructorEnrollmentListSerializer,
    CourseEnrollmentStatsSerializer,
)
from ..models import Enrollment
from ..models.enrollment import EnrollmentStatus
from courses.models import Course


class IsInstructor(IsAuthenticated):
    """Permission class that only allows instructors"""

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.role == "instructor"


class InstructorEnrollmentFilter(filters.FilterSet):
    """Filter for instructor enrollment listing"""

    status = filters.ChoiceFilter(choices=EnrollmentStatus.choices)
    course_id = filters.CharFilter(method="filter_course_id")

    class Meta:
        model = Enrollment
        fields = ["status", "course_id"]

    def filter_course_id(self, queryset, name, value):
        if not value:
            return queryset
        try:
            return queryset.filter(course_id=int(value))
        except (ValueError, TypeError):
            return queryset.none()


def _get_instructor_course(course_id, instructor):
    """
    Helper to look up a Course by course_id.
    Returns (course, is_online).
    """
    try:
        course = Course.objects.get(id=int(course_id))
        return course, False
    except (Course.DoesNotExist, ValueError, TypeError):
        return None, False


class InstructorCourseEnrollmentListView(generics.ListAPIView):
    """
    GET /api/instructor/courses/{course_id}/enrollments/
    List enrollments in a specific course (instructor's own course only).
    """

    serializer_class = InstructorEnrollmentListSerializer
    permission_classes = [IsInstructor]

    def get_queryset(self):
        user = self.request.user
        course_id = self.kwargs.get("course_id")

        instructor = getattr(user, "instructor_profile", None)
        if not instructor:
            return Enrollment.objects.none()

        course_obj, is_online = _get_instructor_course(course_id, instructor)
        if not course_obj or course_obj.instructor_id != instructor.id:
            return Enrollment.objects.none()

        return (
            Enrollment.objects.filter(course=course_obj)
            .select_related(
                "course",
                "child",
                "child__primary_parent",
                "child__primary_parent__user",
                "student",
                "student__user",
            )
            .prefetch_related("course__lectures")
            .order_by("-enrolled_at")
        )


class InstructorAllEnrollmentsListView(generics.ListAPIView):
    """
    GET /api/instructor/enrollments/
    List all enrollments across instructor's courses.
    """

    serializer_class = InstructorEnrollmentListSerializer
    permission_classes = [IsInstructor]
    filterset_class = InstructorEnrollmentFilter

    def get_queryset(self):
        user = self.request.user

        instructor = getattr(user, "instructor_profile", None)
        if not instructor:
            return Enrollment.objects.none()

        # Get all courses taught by this instructor
        return (
            Enrollment.objects.filter(course__instructor=instructor)
            .select_related(
                "course",
                "child",
                "child__primary_parent",
                "child__primary_parent__user",
                "student",
                "student__user",
            )
            .prefetch_related("course__lectures")
            .order_by("-enrolled_at")
        )


class InstructorCourseEnrollmentStatsView(APIView):
    """
    GET /api/instructor/courses/{course_id}/enrollment-stats/
    Get enrollment statistics for a course (instructor's own course only).
    """

    permission_classes = [IsInstructor]

    def get(self, request, course_id):
        user = request.user

        instructor = getattr(user, "instructor_profile", None)
        if not instructor:
            return Response(
                {"detail": "ملف المدرس غير موجود."}, status=status.HTTP_403_FORBIDDEN
            )

        course_obj, is_online = _get_instructor_course(course_id, instructor)
        if not course_obj:
            return Response(
                {"detail": "الدورة غير موجودة."}, status=status.HTTP_404_NOT_FOUND
            )

        if course_obj.instructor_id != instructor.id:
            return Response(
                {"detail": "ليس لديك صلاحية لعرض إحصائيات هذه الدورة."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Calculate enrollment statistics
        enrollments = Enrollment.objects.filter(course=course_obj)
        capacity = course_obj.capacity

        status_counts = enrollments.values("status").annotate(count=Count("id"))
        status_dict = {item["status"]: item["count"] for item in status_counts}

        active_count = status_dict.get(EnrollmentStatus.ACTIVE, 0)
        suspended_count = status_dict.get(EnrollmentStatus.SUSPENDED, 0)
        completed_count = status_dict.get(EnrollmentStatus.COMPLETED, 0)
        dropped_count = status_dict.get(EnrollmentStatus.DROPPED, 0)
        refunded_count = status_dict.get(EnrollmentStatus.REFUNDED, 0)

        # enrolled_count typically means active + suspended (not dropped/refunded)
        enrolled_count = active_count + suspended_count
        available_spots = (
            max(0, capacity - enrolled_count) if capacity is not None else None
        )

        stats = {
            "course_id": str(course_obj.id),
            "course_name": course_obj.name,
            "capacity": capacity,
            "enrolled_count": enrolled_count,
            "available_spots": available_spots,
            "active_students": active_count,
            "suspended_students": suspended_count,
            "completed_students": completed_count,
            "dropped_students": dropped_count,
            "refunded_students": refunded_count,
        }

        serializer = CourseEnrollmentStatsSerializer(stats)
        return Response(serializer.data)
