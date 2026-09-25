#!/usr/bin/env python3
"""Views for CourseSchedule management and batch retrieval."""

from rest_framework import generics
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404

from courses.models import Course, CourseSchedule
from courses.serializers import CourseScheduleSerializer


def _require_schedule_admin(user):
    """Raise PermissionDenied if user is not an admin or supervisor."""
    if not (
        user.is_staff
        or user.is_superuser
        or (hasattr(user, 'role') and user.role in ['admin', 'supervisor'])
    ):
        raise PermissionDenied(
            "Only admins and supervisors can modify course schedules.")


class BatchCourseScheduleListView(generics.ListAPIView):
    """
    GET /api/courses/schedules/
    Batch endpoint to retrieve schedules across all courses or for specific course IDs.
    Query params: ?course_ids=1,2,3 or ?course_id=1
    """
    serializer_class = CourseScheduleSerializer
    permission_classes = [AllowAny]
    pagination_class = None

    def get_queryset(self):
        qs = CourseSchedule.objects.all().select_related('course').order_by('course_id', 'weekday', 'start_time')
        course_ids = self.request.query_params.get('course_ids') or self.request.query_params.get('ids')
        if course_ids:
            parsed_ids = []
            for cid in str(course_ids).split(','):
                cid = cid.strip()
                if cid.isdigit():
                    parsed_ids.append(int(cid))
            qs = qs.filter(course_id__in=parsed_ids)
        elif self.request.query_params.get('course_id'):
            cid = self.request.query_params.get('course_id').strip()
            if cid.isdigit():
                qs = qs.filter(course_id=int(cid))
        return qs


class CourseScheduleListView(generics.ListCreateAPIView):
    """
    List or create schedules for a specific course.

    GET  /api/courses/<course_id>/schedules/  — any authenticated user
    POST /api/courses/<course_id>/schedules/  — admin/supervisor only
    """
    serializer_class = CourseScheduleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        course = get_object_or_404(Course, pk=self.kwargs['course_id'])
        return CourseSchedule.objects.filter(course=course).order_by('weekday', 'start_time')

    def perform_create(self, serializer):
        _require_schedule_admin(self.request.user)
        course = get_object_or_404(Course, pk=self.kwargs['course_id'])
        serializer.save(course=course)


class CourseScheduleDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a course schedule.

    GET    /api/courses/<course_id>/schedules/<pk>/  — any authenticated user
    PATCH  /api/courses/<course_id>/schedules/<pk>/  — admin/supervisor only
    DELETE /api/courses/<course_id>/schedules/<pk>/  — admin/supervisor only
    """
    serializer_class = CourseScheduleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        course = get_object_or_404(Course, pk=self.kwargs['course_id'])
        return CourseSchedule.objects.filter(course=course)

    def update(self, request, *args, **kwargs):
        _require_schedule_admin(request.user)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        _require_schedule_admin(request.user)
        return super().destroy(request, *args, **kwargs)
