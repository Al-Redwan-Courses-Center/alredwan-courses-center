#!/usr/bin/env python3
"""Views for the attendance app - Fingerprint device integration and admin dashboard."""

from rest_framework import generics, status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.decorators import api_view, permission_classes
from django.utils import timezone
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError

from .models import (
    InstructorAttendance,
    AttendanceDevice,
    SupervisorSchedule,
    AttendanceStatus,
    AttendanceType,
    CheckInMethod,
)
from .serializers import (
    InstructorAttendanceSerializer,
    InstructorAttendanceListSerializer,
    FingerprintCheckInSerializer,
    FingerprintCheckOutSerializer,
    RateInstructorSerializer,
    AttendanceDeviceSerializer,
    SupervisorScheduleSerializer,
    TodayAttendanceSummarySerializer,
)
from users.models import Instructor


class DeviceAuthenticationMixin:
    """
    Mixin for device authentication.
    Devices authenticate using their device_id.
    """
    permission_classes = [
        AllowAny]  # Devices don't use JWT, they use device_id

    def get_device(self, device_id):
        """Get the device by device_id or raise 404."""
        return get_object_or_404(
            AttendanceDevice,
            device_id=device_id,
            is_active=True
        )


class FingerprintCheckInView(DeviceAuthenticationMixin, views.APIView):
    """
    API endpoint for fingerprint device check-in.

    POST /api/attendance/check-in/
    {
        "fingerprint_id": "FP123456",
        "device_id": "DEVICE001",
        "method": "fingerprint"
    }

    This endpoint:
    1. Validates the fingerprint_id maps to an instructor
    2. Validates the device is active
    3. Finds all attendance records for today for this instructor
    4. Marks them as checked in with appropriate status (PRESENT/LATE)
    """

    def post(self, request):
        serializer = FingerprintCheckInSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        fingerprint_id = serializer.validated_data['fingerprint_id']
        device_id = serializer.validated_data['device_id']
        method = serializer.validated_data.get(
            'method', CheckInMethod.FINGERPRINT)

        # Get instructor and device
        instructor = get_object_or_404(
            Instructor, fingerprint_id=fingerprint_id)
        device = self.get_device(device_id)

        today = timezone.localdate()

        # Find all attendance records for this instructor today
        attendance_records = InstructorAttendance.objects.filter(
            instructor=instructor,
            date=today,
            status__in=[AttendanceStatus.NOT_STARTED, AttendanceStatus.PENDING]
        )

        if not attendance_records.exists():
            return Response(
                {
                    "error": "No attendance records found for today",
                    "instructor": instructor.user.get_full_name(),
                    "date": str(today)
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if already checked in
        already_checked_in = InstructorAttendance.objects.filter(
            instructor=instructor,
            date=today,
            check_in_time__isnull=False
        ).first()

        if already_checked_in:
            return Response(
                {
                    "message": "Already checked in",
                    "instructor": instructor.user.get_full_name(),
                    "check_in_time": already_checked_in.check_in_time,
                },
                status=status.HTTP_200_OK
            )

        # Mark all records as checked in
        checked_in_records = []
        for record in attendance_records:
            record.mark_checked_in(device=device, method=method)
            checked_in_records.append({
                "id": record.id,
                "type": record.attendance_type,
                "status": record.status,
            })

        return Response(
            {
                "message": "Check-in successful",
                "instructor": instructor.user.get_full_name(),
                "check_in_time": timezone.now(),
                "records": checked_in_records,
            },
            status=status.HTTP_200_OK
        )


class FingerprintCheckOutView(DeviceAuthenticationMixin, views.APIView):
    """
    API endpoint for fingerprint device check-out.

    POST /api/attendance/check-out/
    {
        "fingerprint_id": "FP123456",
        "device_id": "DEVICE001",
        "method": "fingerprint"
    }
    """

    def post(self, request):
        serializer = FingerprintCheckOutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        fingerprint_id = serializer.validated_data['fingerprint_id']
        device_id = serializer.validated_data['device_id']
        method = serializer.validated_data.get(
            'method', CheckInMethod.FINGERPRINT)

        # Get instructor and device
        instructor = get_object_or_404(
            Instructor, fingerprint_id=fingerprint_id)
        device = self.get_device(device_id)

        today = timezone.localdate()

        # Find attendance records that are checked in but not checked out
        attendance_records = InstructorAttendance.objects.filter(
            instructor=instructor,
            date=today,
            check_in_time__isnull=False,
            check_out_time__isnull=True
        )

        if not attendance_records.exists():
            # Check if already checked out
            already_out = InstructorAttendance.objects.filter(
                instructor=instructor,
                date=today,
                check_out_time__isnull=False
            ).first()

            if already_out:
                return Response(
                    {
                        "message": "Already checked out",
                        "instructor": instructor.user.get_full_name(),
                        "check_out_time": already_out.check_out_time,
                    },
                    status=status.HTTP_200_OK
                )

            return Response(
                {
                    "error": "Must check in before checking out",
                    "instructor": instructor.user.get_full_name(),
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Mark all records as checked out
        checked_out_records = []
        for record in attendance_records:
            try:
                record.mark_checked_out(device=device, method=method)
                checked_out_records.append({
                    "id": record.id,
                    "type": record.attendance_type,
                    "check_out_time": record.check_out_time,
                })
            except ValidationError as e:
                return Response(
                    {"error": str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )

        return Response(
            {
                "message": "Check-out successful",
                "instructor": instructor.user.get_full_name(),
                "check_out_time": timezone.now(),
                "records": checked_out_records,
            },
            status=status.HTTP_200_OK
        )


class TodayAttendanceListView(generics.ListAPIView):
    """
    List all attendance records for today.
    Used by the admin dashboard for real-time monitoring.

    GET /api/attendance/today/
    """
    serializer_class = InstructorAttendanceListSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        today = timezone.localdate()
        return InstructorAttendance.objects.filter(
            date=today
        ).select_related(
            'instructor__user',
            'lecture',
            'schedule'
        ).order_by('-check_in_time', 'instructor__user__first_name')


class TodayAttendanceSummaryView(views.APIView):
    """
    Get summary statistics for today's attendance.

    GET /api/attendance/today/summary/
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        today = timezone.localdate()

        qs = InstructorAttendance.objects.filter(date=today)

        summary = {
            'date': today,
            'total_expected': qs.count(),
            'checked_in': qs.filter(check_in_time__isnull=False).count(),
            'checked_out': qs.filter(check_out_time__isnull=False).count(),
            'present': qs.filter(status=AttendanceStatus.PRESENT).count(),
            'late': qs.filter(status=AttendanceStatus.LATE).count(),
            'absent': qs.filter(status=AttendanceStatus.ABSENT).count(),
            'pending': qs.filter(status=AttendanceStatus.PENDING).count(),
            'not_started': qs.filter(status=AttendanceStatus.NOT_STARTED).count(),
            'lecture_attendance_count': qs.filter(
                attendance_type=AttendanceType.LECTURE
            ).count(),
            'supervision_attendance_count': qs.filter(
                attendance_type=AttendanceType.SUPERVISION
            ).count(),
        }

        serializer = TodayAttendanceSummarySerializer(summary)
        return Response(serializer.data)


class AttendanceDetailView(generics.RetrieveUpdateAPIView):
    """
    Retrieve or update a specific attendance record.

    GET /api/attendance/<id>/
    PATCH /api/attendance/<id>/
    """
    serializer_class = InstructorAttendanceSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    queryset = InstructorAttendance.objects.select_related(
        'instructor__user',
        'lecture',
        'schedule',
        'rated_by'
    )


class RateAttendanceView(views.APIView):
    """
    Rate an instructor's attendance record.

    POST /api/attendance/<id>/rate/
    {
        "rating": 8.5,
        "notes": "Great performance today"
    }
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        attendance = get_object_or_404(InstructorAttendance, pk=pk)

        serializer = RateInstructorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            attendance.add_rating(
                value=serializer.validated_data['rating'],
                admin_user=request.user,
                notes=serializer.validated_data.get('notes')
            )
        except ValidationError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            InstructorAttendanceSerializer(attendance).data,
            status=status.HTTP_200_OK
        )


class AttendanceByDateView(generics.ListAPIView):
    """
    List attendance records for a specific date.

    GET /api/attendance/date/<date>/
    """
    serializer_class = InstructorAttendanceListSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        date_str = self.kwargs.get('date')
        try:
            from datetime import datetime
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return InstructorAttendance.objects.none()

        return InstructorAttendance.objects.filter(
            date=date
        ).select_related(
            'instructor__user'
        ).order_by('instructor__user__first_name')


class InstructorAttendanceHistoryView(generics.ListAPIView):
    """
    Get attendance history for a specific instructor.

    GET /api/attendance/instructor/<instructor_id>/
    """
    serializer_class = InstructorAttendanceListSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        instructor_id = self.kwargs.get('instructor_id')
        return InstructorAttendance.objects.filter(
            instructor_id=instructor_id
        ).select_related(
            'instructor__user'
        ).order_by('-date')


class AttendanceDeviceListView(generics.ListCreateAPIView):
    """
    List or create attendance devices.

    GET /api/attendance/devices/
    POST /api/attendance/devices/
    """
    serializer_class = AttendanceDeviceSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    queryset = AttendanceDevice.objects.all()


class AttendanceDeviceDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete an attendance device.

    GET /api/attendance/devices/<id>/
    PATCH /api/attendance/devices/<id>/
    DELETE /api/attendance/devices/<id>/
    """
    serializer_class = AttendanceDeviceSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    queryset = AttendanceDevice.objects.all()


class SupervisorScheduleListView(generics.ListCreateAPIView):
    """
    List or create supervisor schedules.

    GET /api/attendance/schedules/
    POST /api/attendance/schedules/
    """
    serializer_class = SupervisorScheduleSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    queryset = SupervisorSchedule.objects.select_related('instructor__user')


class SupervisorScheduleDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a supervisor schedule.

    GET /api/attendance/schedules/<id>/
    PATCH /api/attendance/schedules/<id>/
    DELETE /api/attendance/schedules/<id>/
    """
    serializer_class = SupervisorScheduleSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    queryset = SupervisorSchedule.objects.select_related('instructor__user')


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def manual_check_in(request, pk):
    """
    Manually check in an instructor (by admin).

    POST /api/attendance/<id>/manual-check-in/
    """
    attendance = get_object_or_404(InstructorAttendance, pk=pk)

    if attendance.check_in_time:
        return Response(
            {"error": "Already checked in"},
            status=status.HTTP_400_BAD_REQUEST
        )

    attendance.mark_checked_in(device=None, method=CheckInMethod.MANUAL)

    return Response(
        InstructorAttendanceSerializer(attendance).data,
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def manual_check_out(request, pk):
    """
    Manually check out an instructor (by admin).

    POST /api/attendance/<id>/manual-check-out/
    """
    attendance = get_object_or_404(InstructorAttendance, pk=pk)

    try:
        attendance.mark_checked_out(device=None, method=CheckInMethod.MANUAL)
    except ValidationError as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )

    return Response(
        InstructorAttendanceSerializer(attendance).data,
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def mark_absent(request, pk):
    """
    Mark an instructor as absent (by admin).

    POST /api/attendance/<id>/mark-absent/
    """
    attendance = get_object_or_404(InstructorAttendance, pk=pk)
    attendance.mark_absent()

    return Response(
        InstructorAttendanceSerializer(attendance).data,
        status=status.HTTP_200_OK
    )
