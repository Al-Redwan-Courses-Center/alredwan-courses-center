#!/usr/bin/env python3
"""Views for handling enrollments in enrollments_payments app"""

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters import rest_framework as filters

from ..serializers.enrollment import (
    EnrollmentListSerializer,
    EnrollmentDetailSerializer,
    EnrollmentProgressSerializer,
)
from ..models import Enrollment
from ..models.enrollment import EnrollmentStatus


class IsParentOrStudent(IsAuthenticated):
    """Permission class that only allows parents and students"""

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.role in ["parent", "student"]


class IsOwnerOrAdminOrSupervisorOrInstructor(IsAuthenticated):
    """Permission class for viewing enrollment details"""

    def has_object_permission(self, request, view, obj):
        user = request.user

        # Admin and Supervisor can access all
        if user.role in ["admin", "supervisor"]:
            return True

        # Course instructor can view enrollments in their courses
        if user.role == "instructor":
            instructor = getattr(user, "instructor_profile", None)
            target = obj.course
            if instructor and target and target.instructor_id == instructor.id:
                return True

        # Check if user is the owner (parent of child or the student)
        if user.role == "parent":
            parent = getattr(user, "parent_profile", None)
            if parent and obj.child:
                # Check if parent is linked to the child
                is_linked = (
                    obj.child.primary_parent_id == parent.id
                    or obj.child.extra_parents.filter(parent=parent).exists()
                )
                return is_linked

        if user.role == "student":
            student = getattr(user, "student_profile", None)
            return student and obj.student_id == student.id

        return False


class EnrollmentFilter(filters.FilterSet):
    """Filter for enrollment listing"""

    status = filters.ChoiceFilter(choices=EnrollmentStatus.choices)
    child = filters.UUIDFilter(field_name="child_id")

    class Meta:
        model = Enrollment
        fields = ["status", "child"]


class EnrollmentListView(generics.ListAPIView):
    """
    GET /api/enrollments/my-enrollments/
    List user's enrollments.
    Parents see enrollments for their children, students see their own.
    """

    serializer_class = EnrollmentListSerializer
    permission_classes = [IsParentOrStudent]
    filterset_class = EnrollmentFilter

    def get_queryset(self):
        """Filter enrollments based on user role"""
        user = self.request.user
        queryset = (
            Enrollment.objects.select_related(
                "course",
                "course__instructor",
                "course__instructor__user",
                "child",
                "student",
                "student__user",
            )
            .prefetch_related("payments", "course__lectures")
            .order_by("-enrolled_at")
        )

        if user.role == "parent":
            parent = getattr(user, "parent_profile", None)
            if parent:
                # Get all children linked to this parent
                from parents.models import Child

                child_ids = list(
                    Child.objects.filter(primary_parent=parent).values_list(
                        "id", flat=True
                    )
                )
                # Also include children where parent is an extra parent
                # extra_children is the related_name on ChildParents model
                extra_child_ids = list(
                    parent.extra_children.values_list("child_id", flat=True)
                )
                all_child_ids = set(child_ids + extra_child_ids)
                return queryset.filter(child_id__in=all_child_ids)
            return queryset.none()

        elif user.role == "student":
            student = getattr(user, "student_profile", None)
            if student:
                return queryset.filter(student=student)
            return queryset.none()

        return queryset.none()


class EnrollmentDetailView(generics.RetrieveAPIView):
    """
    GET /api/enrollments/{id}/
    View enrollment details.
    Owners, Admins, Supervisors, and Course Instructors can view.
    """

    serializer_class = EnrollmentDetailSerializer
    permission_classes = [IsOwnerOrAdminOrSupervisorOrInstructor]
    lookup_field = "id"

    def get_queryset(self):
        """Get queryset with related objects"""
        return Enrollment.objects.select_related(
            "course",
            "course__instructor",
            "course__instructor__user",
            "course__season",
            "child",
            "child__primary_parent",
            "child__primary_parent__user",
            "student",
            "student__user",
            "created_by",
        ).prefetch_related("payments", "payments__processed_by", "course__lectures")


class EnrollmentProgressView(APIView):
    """
    GET /api/enrollments/{id}/progress/
    Get enrollment completion progress.
    Owners, Admins, Supervisors, and Course Instructors can view.
    """

    permission_classes = [IsOwnerOrAdminOrSupervisorOrInstructor]

    def get_object(self, id):
        from django.core.exceptions import ValidationError

        try:
            return (
                Enrollment.objects.select_related(
                    "course", "child", "child__primary_parent", "student"
                )
                .prefetch_related("course__lectures")
                .get(id=id)
            )
        except (Enrollment.DoesNotExist, ValidationError, ValueError):
            return None

    def check_object_permissions(self, request, obj):
        """Check object-level permissions"""
        user = request.user

        # Admin and Supervisor can access all
        if user.role in ["admin", "supervisor"]:
            return True

        # Course instructor can view
        if user.role == "instructor":
            instructor = getattr(user, "instructor_profile", None)
            target = obj.course
            if instructor and target and target.instructor_id == instructor.id:
                return True

        # Check if user is the owner
        if user.role == "parent":
            parent = getattr(user, "parent_profile", None)
            if parent and obj.child:
                is_linked = (
                    obj.child.primary_parent_id == parent.id
                    or obj.child.extra_parents.filter(parent=parent).exists()
                )
                if is_linked:
                    return True

        if user.role == "student":
            student = getattr(user, "student_profile", None)
            if student and obj.student_id == student.id:
                return True

        return False

    def get(self, request, id):
        enrollment = self.get_object(id)
        if not enrollment:
            return Response(
                {"detail": "الإلتحاق غير موجود."}, status=status.HTTP_404_NOT_FOUND
            )

        if not self.check_object_permissions(request, enrollment):
            return Response(
                {"detail": "ليس لديك صلاحية لعرض هذا الإلتحاق."},
                status=status.HTTP_403_FORBIDDEN,
            )

        progress = enrollment.get_completion_progress()
        serializer = EnrollmentProgressSerializer(progress)
        return Response(serializer.data)
