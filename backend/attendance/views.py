#!/usr/bin/env python3
"""Views for the attendance app - Lecture attendance and instructor fingerprint integration."""

from rest_framework import generics, status, views
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.decorators import api_view, permission_classes
from django.utils import timezone
from django.db.models import Count, Q
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError

from .models import (
    InstructorAttendance,
    AttendanceDevice,
    SupervisorSchedule,
    AttendanceStatus,
    AttendanceType,
    CheckInMethod,
    FingerprintScanLog,
    ScanAction,
)
from .models.lecture_attendance import LectureAttendance
from .permissions import IsAdminOrCourseInstructor
from .serializers import (
    # Lecture attendance serializers
    MarkAttendanceSerializer,
    LectureAttendanceSerializer,
    LectureAttendanceDetailSerializer,
    BulkMarkAttendanceSerializer,
    # Instructor attendance serializers
    InstructorAttendanceSerializer,
    InstructorAttendanceListSerializer,
    FingerprintCheckInSerializer,
    FingerprintCheckOutSerializer,
    FingerprintScanSerializer,
    RateInstructorSerializer,
    AttendanceDeviceSerializer,
    SupervisorScheduleSerializer,
    TodayAttendanceSummarySerializer,
)
from users.models import Instructor
from courses.models import Season


# =============================================================================
# Lecture Attendance Views (for students/children)
# =============================================================================

class LectureAttendanceView(APIView):
    """
    API endpoint to mark attendance for a student or child.

    Only admins and the course instructor can mark attendance.

    POST /api/attendance/lecture/<lecture_id>/mark/

    Request body:
    {
        "code": "M64793",
        "participant_type": "student",
        "rating": 8,
        "notes": "Optional notes"
    }
    """
    permission_classes = [IsAdminOrCourseInstructor]

    def post(self, request, lecture_id):
        """Mark attendance for a student or child using their code."""
        from courses.models.lecture import Lecture

        # Get the lecture and check permissions
        try:
            lecture = Lecture.objects.select_related(
                'course', 'course__instructor').get(id=lecture_id)
        except Lecture.DoesNotExist:
            return Response(
                {'error': 'Lecture not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check object-level permission (admin or course instructor)
        if not self.permission_classes[0]().has_object_permission(request, self, lecture):
            return Response(
                {'error': 'You do not have permission to mark attendance for this lecture.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Add lecture_id to the request data
        data = request.data.copy()
        data['lecture_id'] = lecture_id

        serializer = MarkAttendanceSerializer(
            data=data,
            context={'request': request}
        )

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get the validated data and attendance record
        validated_data = serializer.validated_data
        attendance = serializer.context['attendance']

        try:
            with transaction.atomic():
                # Set rating and notes before marking
                attendance.rating = validated_data['rating']
                attendance.notes = validated_data.get('notes', '')

                # Use the model's mark() method to mark as present (attended)
                attendance.mark(
                    present=True,
                    marked_by_user=request.user
                )

            # Return the updated attendance record
            response_serializer = LectureAttendanceSerializer(attendance)
            return Response(
                {
                    'message': 'Attendance marked successfully',
                    'lecture_id': validated_data['lecture_id'],
                    'attendance': response_serializer.data
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {'error': f'Failed to mark attendance: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BulkLectureAttendanceView(APIView):
    """
    API endpoint to mark attendance for multiple students/children in bulk.

    Only admins and the course instructor can mark attendance.

    POST /api/attendance/lecture/<lecture_id>/mark-bulk/

    Request body:
    {
        "marked_via": "manual",  // or "qr_scan"
        "attendances": [
            {
                "code": "M64793",
                "participant_type": "student",
                "rating": 8,
                "notes": "Good performance",
                "present": true
            },
            {
                "code": "C12345",
                "participant_type": "child",
                "rating": 9,
                "notes": "Excellent",
                "present": true
            }
        ]
    }

    Response:
    {
        "message": "Bulk attendance marking completed",
        "lecture_id": 123,
        "summary": {
            "total_received": 10,
            "successful": 8,
            "failed": 2,
            "marked_by": "John Doe",
            "marked_via": "manual",
            "marked_at": "2026-02-10T10:30:00Z"
        },
        "successful_records": [...],
        "failed_records": [...]
    }
    """
    permission_classes = [IsAdminOrCourseInstructor]

    def post(self, request, lecture_id):
        """Mark attendance for multiple students/children in bulk."""
        from courses.models.lecture import Lecture

        # Get the lecture and check permissions
        try:
            lecture = Lecture.objects.select_related(
                'course', 'course__instructor').get(id=lecture_id)
        except Lecture.DoesNotExist:
            return Response(
                {'error': f'Lecture with id {lecture_id} not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check object-level permission (admin or course instructor)
        if not self.permission_classes[0]().has_object_permission(request, self, lecture):
            return Response(
                {'error': 'You do not have permission to mark attendance for this lecture.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Validate the request data
        serializer = BulkMarkAttendanceSerializer(
            data=request.data,
            context={'request': request, 'lecture': lecture}
        )

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        validated_data = serializer.validated_data
        validated_items = serializer.context.get('validated_items', [])
        validation_errors = serializer.context.get('validation_errors', [])

        marked_via = validated_data.get('marked_via', 'manual')
        marked_at = timezone.now()

        # Process all validated attendance records
        successful_records = []
        failed_records = []

        try:
            with transaction.atomic():
                for item in validated_items:
                    attendance = item['attendance']
                    participant = item['participant']
                    data = item['data']

                    try:
                        # Set rating and notes
                        attendance.rating = data['rating']
                        attendance.notes = data.get('notes', '')

                        # Mark attendance
                        attendance.mark(
                            present=data.get('present', True),
                            marked_by_user=request.user,
                            marked_via=marked_via
                        )

                        # Add to successful records
                        successful_records.append({
                            'code': data['code'],
                            'participant_type': data['participant_type'],
                            'participant_name': (
                                participant.first_name if hasattr(participant, 'first_name')
                                else participant.user.get_full_name() if hasattr(participant, 'user')
                                else 'Unknown'
                            ),
                            'rating': data['rating'],
                            'present': data.get('present', True),
                            'attendance_id': attendance.id
                        })

                    except Exception as e:
                        failed_records.append({
                            'code': data['code'],
                            'participant_type': data['participant_type'],
                            'error': f'Failed to mark attendance: {str(e)}'
                        })

                # Add validation errors to failed records
                failed_records.extend(validation_errors)

        except Exception as e:
            return Response(
                {'error': f'Transaction failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Prepare summary
        total_received = len(validated_data.get('attendances', []))
        summary = {
            'total_received': total_received,
            'successful': len(successful_records),
            'failed': len(failed_records),
            'marked_by': request.user.get_full_name() or request.user.username,
            'marked_via': marked_via,
            'marked_at': marked_at.isoformat()
        }

        response_status = status.HTTP_200_OK if len(
            successful_records) > 0 else status.HTTP_400_BAD_REQUEST

        if len(failed_records) > 0 and len(successful_records) > 0:
            response_status = status.HTTP_207_MULTI_STATUS

        return Response(
            {
                'message': 'Bulk attendance marking completed',
                'lecture_id': lecture_id,
                'summary': summary,
                'successful_records': successful_records,
                'failed_records': failed_records
            },
            status=response_status
        )


class LectureAttendanceDetailView(APIView):
    """
    API endpoint to get detailed attendance for a specific lecture.

    Returns all attendance records for the lecture with full participant details
    including name, image, age, gender, rating, notes, and attendance status.

    Only admins and the course instructor can view this data.

    GET /api/attendance/lecture/<lecture_id>/details/

    Response:
    {
        "lecture_id": 123,
        "lecture_title": "Lecture 1 - Introduction",
        "course_name": "Quran Memorization",
        "total_enrolled": 15,
        "present_count": 12,
        "absent_count": 3,
        "attendance_rate": 80.0,
        "attendances": [
            {
                "id": 1,
                "participant_name": "أحمد",
                "participant_full_name": "أحمد محمد",
                "participant_type": "child",
                "participant_code": "M12345",
                "participant_image": "https://res.cloudinary.com/.../image.jpg",
                "participant_age": 12,
                "participant_gender": "boy",
                "present": true,
                "rating": 8,
                "notes": "ممتاز",
                "marked_at": "2025-01-15T10:30:00Z"
            },
            ...
        ]
    }
    """
    permission_classes = [IsAdminOrCourseInstructor]

    def get(self, request, lecture_id):
        """Get detailed attendance records for a lecture."""
        from courses.models.lecture import Lecture

        # Get the lecture with related data
        try:
            lecture = Lecture.objects.select_related(
                'course', 'course__instructor'
            ).get(id=lecture_id)
        except Lecture.DoesNotExist:
            return Response(
                {'error': 'Lecture not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check object-level permission (admin or course instructor)
        if not self.permission_classes[0]().has_object_permission(request, self, lecture):
            return Response(
                {'error': 'You do not have permission to view attendance for this lecture.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get all attendance records for this lecture with related data
        attendances = LectureAttendance.objects.filter(
            lecture=lecture
        ).select_related(
            'child', 'student', 'student__user', 'marked_by'
        ).order_by('-present', 'child__first_name', 'student__user__first_name')

        # Calculate statistics
        total_enrolled = attendances.count()
        present_count = attendances.filter(present=True).count()
        absent_count = total_enrolled - present_count
        attendance_rate = (present_count / total_enrolled *
                           100) if total_enrolled > 0 else 0

        # Serialize the attendance records
        serializer = LectureAttendanceDetailSerializer(attendances, many=True)

        return Response({
            'lecture_id': lecture.id,
            'lecture_title': lecture.title,
            'course_name': lecture.course.name if lecture.course else None,
            'total_enrolled': total_enrolled,
            'present_count': present_count,
            'absent_count': absent_count,
            'attendance_rate': round(attendance_rate, 1),
            'attendances': serializer.data
        }, status=status.HTTP_200_OK)


# =============================================================================
# Instructor Attendance Views (for fingerprint devices and admin dashboard)
# =============================================================================

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

        # Check if already checked in first
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

        # Find all attendance records for this instructor today that need check-in
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


class UnifiedFingerprintScanView(DeviceAuthenticationMixin, views.APIView):
    """
    Unified endpoint for fingerprint device scans.

    POST /api/attendance/scan/
    {
        "fingerprint_id": "FP123456",
        "device_id": "DEVICE001",
        "timestamp": "2026-02-14T08:30:00+02:00"  // Optional, for offline sync
    }

    This is the RECOMMENDED endpoint for fingerprint devices that don't distinguish
    between check-in and check-out actions.

    Logic:
    1. No attendance record for today → Auto-create based on schedule/lecture and check-in
    2. Has record but not checked-in → Check-in
    3. Checked-in but not out → Check-out
    4. Already checked out → Re-entry (clears check-out, logs as re-entry)
    5. Rapid scans (< 2 min) → Ignored as duplicates

    All scans are logged to FingerprintScanLog for audit trail.
    """

    # Minimum time between scans (in seconds) to prevent rapid duplicates
    MIN_SCAN_INTERVAL_SECONDS = 120  # 2 minutes

    def post(self, request):
        serializer = FingerprintScanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        fingerprint_id = serializer.validated_data['fingerprint_id']
        device_id = serializer.validated_data['device_id']
        scan_time = serializer.validated_data.get('timestamp', timezone.now())

        # Get instructor and device from serializer context
        instructor = serializer.context.get('instructor')
        if not instructor:
            instructor = get_object_or_404(
                Instructor, fingerprint_id=fingerprint_id)

        device = serializer.context.get('device')
        if not device:
            device = self.get_device(device_id)

        today = timezone.localdate()

        # Check for rapid duplicate scans
        recent_scans = FingerprintScanLog.objects.filter(
            instructor=instructor,
            scan_time__gte=timezone.now() - timezone.timedelta(seconds=self.MIN_SCAN_INTERVAL_SECONDS)
        ).exclude(action=ScanAction.IGNORED)

        if recent_scans.exists():
            last_scan = recent_scans.first()
            # Log as ignored
            FingerprintScanLog.objects.create(
                instructor=instructor,
                attendance=last_scan.attendance,
                scan_time=scan_time,
                device=device,
                action=ScanAction.IGNORED,
                is_processed=False,
                notes=f"تم تجاهل البصمة - تكرار خلال {self.MIN_SCAN_INTERVAL_SECONDS} ثانية"
            )
            return Response(
                {
                    "message": "Scan ignored - too soon after last scan",
                    "instructor": instructor.user.get_full_name(),
                    "last_scan": last_scan.scan_time,
                    "min_interval_seconds": self.MIN_SCAN_INTERVAL_SECONDS,
                },
                status=status.HTTP_200_OK
            )

        # Get or create attendance records for today
        attendance_records = InstructorAttendance.objects.filter(
            instructor=instructor,
            date=today
        )

        action_taken = None
        response_data = {
            "instructor": instructor.user.get_full_name(),
            "scan_time": scan_time,
            "records": [],
        }

        # CASE 1: No attendance records exist - auto-create based on schedules/lectures
        if not attendance_records.exists():
            created_records = self._auto_create_attendance(
                instructor, today, device)
            if created_records:
                action_taken = ScanAction.AUTO_CREATED
                for record in created_records:
                    record.mark_checked_in(
                        device=device, method=CheckInMethod.FINGERPRINT)
                    response_data["records"].append({
                        "id": record.id,
                        "type": record.attendance_type,
                        "status": record.status,
                        "auto_created": True,
                    })
                response_data["message"] = "Auto-created attendance and checked in"
                response_data["action"] = "auto_create_check_in"

                # Log the scan
                for record in created_records:
                    FingerprintScanLog.objects.create(
                        instructor=instructor,
                        attendance=record,
                        scan_time=scan_time,
                        device=device,
                        action=ScanAction.AUTO_CREATED,
                        is_processed=True,
                        notes="تم إنشاء سجل الحضور تلقائياً وتسجيل الدخول"
                    )

                return Response(response_data, status=status.HTTP_201_CREATED)
            else:
                # No schedules or lectures found - create a general attendance record
                season = Season.objects.filter(is_active=True).first()
                if not season:
                    return Response(
                        {
                            "error": "No active season found",
                            "instructor": instructor.user.get_full_name(),
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                record = InstructorAttendance.objects.create(
                    instructor=instructor,
                    date=today,
                    attendance_type=AttendanceType.SUPERVISION,
                    status=AttendanceStatus.NOT_STARTED,
                    season=season
                )
                record.mark_checked_in(
                    device=device, method=CheckInMethod.FINGERPRINT)

                FingerprintScanLog.objects.create(
                    instructor=instructor,
                    attendance=record,
                    scan_time=scan_time,
                    device=device,
                    action=ScanAction.AUTO_CREATED,
                    is_processed=True,
                    notes="تم إنشاء سجل حضور عام (بدون جدول)"
                )

                response_data["message"] = "Auto-created general attendance and checked in"
                response_data["action"] = "auto_create_check_in"
                response_data["records"] = [{
                    "id": record.id,
                    "type": record.attendance_type,
                    "status": record.status,
                    "auto_created": True,
                }]
                return Response(response_data, status=status.HTTP_201_CREATED)

        # Check current state of attendance records
        not_checked_in = attendance_records.filter(check_in_time__isnull=True)
        checked_in_not_out = attendance_records.filter(
            check_in_time__isnull=False,
            check_out_time__isnull=True
        )
        checked_out = attendance_records.filter(check_out_time__isnull=False)

        # CASE 2: Has records not checked in → Check-in
        if not_checked_in.exists():
            for record in not_checked_in:
                record.mark_checked_in(
                    device=device, method=CheckInMethod.FINGERPRINT)
                response_data["records"].append({
                    "id": record.id,
                    "type": record.attendance_type,
                    "status": record.status,
                })
                FingerprintScanLog.objects.create(
                    instructor=instructor,
                    attendance=record,
                    scan_time=scan_time,
                    device=device,
                    action=ScanAction.CHECK_IN,
                    is_processed=True
                )
            response_data["message"] = "Check-in successful"
            response_data["action"] = "check_in"
            response_data["check_in_time"] = scan_time
            return Response(response_data, status=status.HTTP_200_OK)

        # CASE 3: Checked in but not out → Check-out
        if checked_in_not_out.exists():
            for record in checked_in_not_out:
                try:
                    record.mark_checked_out(
                        device=device, method=CheckInMethod.FINGERPRINT)
                    response_data["records"].append({
                        "id": record.id,
                        "type": record.attendance_type,
                        "check_out_time": record.check_out_time,
                    })
                    FingerprintScanLog.objects.create(
                        instructor=instructor,
                        attendance=record,
                        scan_time=scan_time,
                        device=device,
                        action=ScanAction.CHECK_OUT,
                        is_processed=True
                    )
                except ValidationError as e:
                    return Response(
                        {"error": str(e)},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            response_data["message"] = "Check-out successful"
            response_data["action"] = "check_out"
            response_data["check_out_time"] = scan_time
            return Response(response_data, status=status.HTTP_200_OK)

        # CASE 4: Already checked out → Re-entry (clear check-out)
        if checked_out.exists():
            for record in checked_out:
                record.check_out_time = None
                record.check_out_device = None
                record.check_out_method = None
                record.save()
                record.broadcast_update()
                response_data["records"].append({
                    "id": record.id,
                    "type": record.attendance_type,
                    "status": record.status,
                    "re_entry": True,
                })
                FingerprintScanLog.objects.create(
                    instructor=instructor,
                    attendance=record,
                    scan_time=scan_time,
                    device=device,
                    action=ScanAction.RE_ENTRY,
                    is_processed=True,
                    notes="إعادة دخول - تم مسح وقت الخروج السابق"
                )
            response_data["message"] = "Re-entry recorded - check-out cleared"
            response_data["action"] = "re_entry"
            return Response(response_data, status=status.HTTP_200_OK)

        # Fallback - should not reach here
        return Response(
            {"error": "Unexpected state"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    def _auto_create_attendance(self, instructor, date, device):
        """
        Auto-create attendance records based on instructor's schedules and lectures.

        Returns list of created InstructorAttendance records.
        """
        from courses.models import Lecture

        season = Season.objects.filter(is_active=True).first()
        if not season:
            return []

        created_records = []
        weekday = date.weekday()

        # Check supervisor schedules for today
        schedules = SupervisorSchedule.objects.filter(
            instructor=instructor,
            day_of_week=weekday
        )

        for schedule in schedules:
            record, created = InstructorAttendance.objects.get_or_create(
                instructor=instructor,
                schedule=schedule,
                date=date,
                defaults={
                    "attendance_type": AttendanceType.SUPERVISION,
                    "status": AttendanceStatus.NOT_STARTED,
                    "season": season
                }
            )
            if created:
                created_records.append(record)

        # Check lectures for today
        lectures = Lecture.objects.filter(
            instructor=instructor,
            day=date
        )

        for lecture in lectures:
            record, created = InstructorAttendance.objects.get_or_create(
                instructor=instructor,
                lecture=lecture,
                defaults={
                    "date": date,
                    "attendance_type": AttendanceType.LECTURE,
                    "status": AttendanceStatus.NOT_STARTED,
                    "season": season
                }
            )
            if created:
                created_records.append(record)

        return created_records


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
