#!/usr/bin/env python3
'''Views for handling enrollment requests in enrollments_payments app'''

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from django_filters import rest_framework as filters

from ..serializers import (
    EnrollmentRequestCreateSerializer,
    EnrollmentRequestListSerializer,
    EnrollmentRequestDetailSerializer
)
from ..models import EnrollmentRequest, EnrollmentRequestStatus


class IsParentOrStudent(IsAuthenticated):
    """Permission class that only allows parents and students"""

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.role in ['parent', 'student']


class IsOwnerOrAdminOrSupervisor(IsAuthenticated):
    """Permission class for viewing/modifying enrollment requests"""

    def has_object_permission(self, request, view, obj):
        user = request.user
        # Admin and Supervisor can access all
        if user.role in ['admin', 'supervisor']:
            return True
        # Check if user is the owner
        if user.role == 'parent':
            parent = getattr(user, 'parent_profile', None)
            return parent and obj.parent_id == parent.id
        if user.role == 'student':
            student = getattr(user, 'student_profile', None)
            return student and obj.student_id == student.id
        return False


class EnrollmentRequestFilter(filters.FilterSet):
    """Filter for enrollment requests"""
    status = filters.ChoiceFilter(choices=EnrollmentRequestStatus.choices)
    child = filters.UUIDFilter(field_name='child_id')

    class Meta:
        model = EnrollmentRequest
        fields = ['status', 'child']


class EnrollmentRequestCreateView(generics.CreateAPIView):
    """
    POST /api/enrollment-requests/
    Create a new enrollment request.
    Only parents and students can create requests.
    """
    serializer_class = EnrollmentRequestCreateSerializer
    permission_classes = [IsParentOrStudent]
    queryset = EnrollmentRequest.objects.all()

    def get_serializer_context(self):
        """Add request context to serializer"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class EnrollmentRequestListView(generics.ListAPIView):
    """
    GET /api/enrollment-requests/my-requests/
    List user's own enrollment requests.
    Parents see requests for their children, students see their own.
    """
    serializer_class = EnrollmentRequestListSerializer
    permission_classes = [IsParentOrStudent]
    filterset_class = EnrollmentRequestFilter

    def get_queryset(self):
        """Filter requests based on user role"""
        user = self.request.user
        queryset = EnrollmentRequest.objects.select_related(
            'course', 'course__instructor', 'course__instructor__user',
            'child', 'student', 'student__user'
        ).order_by('-created_at')

        if user.role == 'parent':
            parent = getattr(user, 'parent_profile', None)
            if parent:
                return queryset.filter(parent=parent)
            return queryset.none()

        elif user.role == 'student':
            student = getattr(user, 'student_profile', None)
            if student:
                return queryset.filter(student=student)
            return queryset.none()

        return queryset.none()


class EnrollmentRequestDetailView(generics.RetrieveAPIView):
    """
    GET /api/enrollment-requests/{id}/
    View single enrollment request details.
    Owners, Admins, and Supervisors can view.
    """
    serializer_class = EnrollmentRequestDetailSerializer
    permission_classes = [IsOwnerOrAdminOrSupervisor]
    lookup_field = 'id'

    def get_queryset(self):
        """Get queryset with related objects"""
        return EnrollmentRequest.objects.select_related(
            'course', 'course__instructor', 'course__instructor__user',
            'child', 'student', 'student__user',
            'parent', 'parent__user', 'processed_by'
        )


class EnrollmentRequestCancelView(generics.DestroyAPIView):
    """
    DELETE /api/enrollment-requests/{id}/
    Cancel/withdraw an enrollment request.
    Only owners can cancel, and only if status is pending.
    """
    permission_classes = [IsOwnerOrAdminOrSupervisor]
    lookup_field = 'id'

    def get_queryset(self):
        """Get queryset for the request"""
        return EnrollmentRequest.objects.select_related(
            'parent', 'student'
        )

    def destroy(self, request, *args, **kwargs):
        """Override destroy to add business logic validation"""
        instance = self.get_object()
        user = request.user

        # Only allow owners to cancel (not admins via this endpoint)
        if user.role == 'parent':
            parent = getattr(user, 'parent_profile', None)
            if not parent or instance.parent_id != parent.id:
                raise PermissionDenied("لا يمكنك إلغاء هذا الطلب.")
        elif user.role == 'student':
            student = getattr(user, 'student_profile', None)
            if not student or instance.student_id != student.id:
                raise PermissionDenied("لا يمكنك إلغاء هذا الطلب.")
        else:
            # Admin/Supervisor should use a different endpoint for rejection
            raise PermissionDenied(
                "استخدم نقطة نهاية الرفض للمسؤولين.")

        # Only pending requests can be cancelled
        if instance.status != EnrollmentRequestStatus.PENDING:
            raise ValidationError({
                "detail": "يمكن إلغاء الطلبات المعلقة فقط. حالة الطلب الحالية: "
                          f"{instance.get_status_display()}"
            })

        # Perform the deletion
        self.perform_destroy(instance)
        return Response(
            {"detail": "تم إلغاء طلب الإلتحاق بنجاح."},
            status=status.HTTP_200_OK
        )
