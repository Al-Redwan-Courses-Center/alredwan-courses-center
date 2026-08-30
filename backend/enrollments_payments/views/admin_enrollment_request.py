#!/usr/bin/env python3
'''Admin views for handling enrollment requests'''

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django_filters import rest_framework as filters
from django.db import transaction
from django.db.models import Q

from ..serializers import (
    AdminEnrollmentRequestListSerializer,
    AdminEnrollmentRequestUpdateSerializer,
    EnrollmentRequestDetailSerializer,
    EnrollmentRequestApproveSerializer,
    EnrollmentRequestRejectSerializer,
    BulkApproveSerializer,
    BulkRejectSerializer
)
from ..models import EnrollmentRequest, EnrollmentRequestStatus


class IsAdminOrSupervisor(IsAuthenticated):
    """Permission class that only allows admins and supervisors"""
    
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.role in ['admin', 'supervisor']


class IsAdminOnly(IsAuthenticated):
    """Permission class that only allows admins"""
    
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.role == 'admin'


class AdminEnrollmentRequestFilter(filters.FilterSet):
    """Advanced filter for admin enrollment request listing"""
    status = filters.ChoiceFilter(choices=EnrollmentRequestStatus.choices)
    course_id = filters.NumberFilter(field_name='course__id')
    season_id = filters.NumberFilter(field_name='course__season__id')
    parent_id = filters.UUIDFilter(field_name='parent__id')
    student_id = filters.UUIDFilter(field_name='student__id')
    date_from = filters.DateFilter(field_name='created_at', lookup_expr='date__gte')
    date_to = filters.DateFilter(field_name='created_at', lookup_expr='date__lte')
    
    ordering = filters.OrderingFilter(
        fields=(
            ('created_at', 'created_at'),
            ('expires_at', 'expires_at'),
            ('price', 'price'),
        ),
        field_labels={
            'created_at': 'تاريخ الإنشاء',
            'expires_at': 'تاريخ الانتهاء',
        }
    )
    
    class Meta:
        model = EnrollmentRequest
        fields = ['status', 'course_id', 'season_id', 'parent_id', 'student_id']


class AdminEnrollmentRequestListView(generics.ListAPIView):
    """
    GET /api/admin/enrollment-requests/
    List all enrollment requests with advanced filtering.
    Roles: Admin, Supervisor
    """
    serializer_class = AdminEnrollmentRequestListSerializer
    permission_classes = [IsAdminOrSupervisor]
    filterset_class = AdminEnrollmentRequestFilter

    def get_queryset(self):
        return EnrollmentRequest.objects.select_related(
            'course', 'course__season', 'course__instructor', 
            'course__instructor__user',
            'parent', 'parent__user',
            'student', 'student__user',
            'child', 'processed_by'
        ).order_by('-created_at')


class AdminEnrollmentRequestDetailView(generics.RetrieveAPIView):
    """
    GET /api/admin/enrollment-requests/{id}/
    View detailed enrollment request.
    Roles: Admin, Supervisor
    """
    serializer_class = EnrollmentRequestDetailSerializer
    permission_classes = [IsAdminOrSupervisor]
    lookup_field = 'id'

    def get_queryset(self):
        return EnrollmentRequest.objects.select_related(
            'course', 'course__season', 'course__instructor',
            'course__instructor__user',
            'parent', 'parent__user',
            'student', 'student__user',
            'child', 'processed_by'
        )


class AdminEnrollmentRequestUpdateView(generics.UpdateAPIView):
    """
    PATCH /api/admin/enrollment-requests/{id}/
    Update enrollment request (status to processing, price, payment_method, notes, expires_at).
    Roles: Admin, Supervisor
    """
    serializer_class = AdminEnrollmentRequestUpdateSerializer
    permission_classes = [IsAdminOrSupervisor]
    lookup_field = 'id'
    http_method_names = ['patch']  # Only allow PATCH, not PUT

    def get_queryset(self):
        return EnrollmentRequest.objects.select_related('course')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class AdminEnrollmentRequestApproveView(APIView):
    """
    POST /api/admin/enrollment-requests/{id}/approve/
    Approve an enrollment request.
    Roles: Admin, Supervisor
    """
    permission_classes = [IsAdminOrSupervisor]

    def get_object(self, id):
        try:
            return EnrollmentRequest.objects.select_related(
                'course', 'parent', 'student', 'child'
            ).get(id=id)
        except EnrollmentRequest.DoesNotExist:
            return None

    def post(self, request, id):
        enrollment_request = self.get_object(id)
        if not enrollment_request:
            return Response(
                {"detail": "طلب الإلتحاق غير موجود."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = EnrollmentRequestApproveSerializer(
            data=request.data,
            context={'request': request, 'enrollment_request': enrollment_request}
        )
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        paid_amount = data.get('paid_amount')
        payment_method = data.get('payment_method')
        payment_notes = data.get('payment_notes')

        try:
            with transaction.atomic():
                enrollment = enrollment_request.approve(
                    processed_by_user=request.user,
                    paid_amount=paid_amount,
                    payment_method=payment_method,
                    payment_notes=payment_notes
                )

            return Response({
                "detail": "تمت الموافقة على طلب الإلتحاق بنجاح.",
                "enrollment_id": str(enrollment.id),
                "enrollment_status": enrollment.status,
                "request_status": enrollment_request.status
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"detail": f"حدث خطأ أثناء الموافقة: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )


class AdminEnrollmentRequestRejectView(APIView):
    """
    POST /api/admin/enrollment-requests/{id}/reject/
    Reject an enrollment request.
    Roles: Admin, Supervisor
    """
    permission_classes = [IsAdminOrSupervisor]

    def get_object(self, id):
        try:
            return EnrollmentRequest.objects.get(id=id)
        except EnrollmentRequest.DoesNotExist:
            return None

    def post(self, request, id):
        enrollment_request = self.get_object(id)
        if not enrollment_request:
            return Response(
                {"detail": "طلب الإلتحاق غير موجود."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = EnrollmentRequestRejectSerializer(
            data=request.data,
            context={'request': request, 'enrollment_request': enrollment_request}
        )
        serializer.is_valid(raise_exception=True)

        reason = serializer.validated_data.get('reason')

        try:
            enrollment_request.reject(
                processed_by_user=request.user,
                reason=reason
            )

            return Response({
                "detail": "تم رفض طلب الإلتحاق.",
                "request_id": str(enrollment_request.id),
                "status": enrollment_request.status
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"detail": f"حدث خطأ أثناء الرفض: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )


class AdminBulkApproveView(APIView):
    """
    POST /api/admin/enrollment-requests/bulk-approve/
    Bulk approve multiple enrollment requests.
    Roles: Admin only
    """
    permission_classes = [IsAdminOnly]

    def post(self, request):
        serializer = BulkApproveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        request_ids = serializer.validated_data['request_ids']
        payment_method = serializer.validated_data.get('payment_method', 'cash')

        results = {
            'approved': [],
            'failed': [],
            'skipped': []
        }

        enrollment_requests = EnrollmentRequest.objects.filter(
            id__in=request_ids
        ).select_related('course', 'parent', 'student', 'child')

        for er in enrollment_requests:
            # Skip if not in valid status
            if er.status not in [EnrollmentRequestStatus.PENDING, 
                                 EnrollmentRequestStatus.PROCESSING]:
                results['skipped'].append({
                    'id': str(er.id),
                    'reason': f"حالة غير صالحة: {er.get_status_display()}"
                })
                continue

            # Skip if course is full
            if er.course.enrolled_count >= er.course.capacity:
                results['skipped'].append({
                    'id': str(er.id),
                    'reason': "الدورة ممتلئة"
                })
                continue

            try:
                with transaction.atomic():
                    enrollment = er.approve(
                        processed_by_user=request.user,
                        payment_method=payment_method
                    )
                    results['approved'].append({
                        'id': str(er.id),
                        'enrollment_id': str(enrollment.id)
                    })
            except Exception as e:
                results['failed'].append({
                    'id': str(er.id),
                    'error': str(e)
                })

        return Response({
            'detail': f"تمت معالجة {len(request_ids)} طلب.",
            'approved_count': len(results['approved']),
            'failed_count': len(results['failed']),
            'skipped_count': len(results['skipped']),
            'results': results
        }, status=status.HTTP_200_OK)


class AdminBulkRejectView(APIView):
    """
    POST /api/admin/enrollment-requests/bulk-reject/
    Bulk reject multiple enrollment requests.
    Roles: Admin only
    """
    permission_classes = [IsAdminOnly]

    def post(self, request):
        serializer = BulkRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        request_ids = serializer.validated_data['request_ids']
        reason = serializer.validated_data['reason']

        results = {
            'rejected': [],
            'failed': [],
            'skipped': []
        }

        enrollment_requests = EnrollmentRequest.objects.filter(id__in=request_ids)

        for er in enrollment_requests:
            # Skip if not in valid status
            if er.status not in [EnrollmentRequestStatus.PENDING, 
                                 EnrollmentRequestStatus.PROCESSING]:
                results['skipped'].append({
                    'id': str(er.id),
                    'reason': f"حالة غير صالحة: {er.get_status_display()}"
                })
                continue

            try:
                er.reject(processed_by_user=request.user, reason=reason)
                results['rejected'].append({'id': str(er.id)})
            except Exception as e:
                results['failed'].append({
                    'id': str(er.id),
                    'error': str(e)
                })

        return Response({
            'detail': f"تمت معالجة {len(request_ids)} طلب.",
            'rejected_count': len(results['rejected']),
            'failed_count': len(results['failed']),
            'skipped_count': len(results['skipped']),
            'results': results
        }, status=status.HTTP_200_OK)
