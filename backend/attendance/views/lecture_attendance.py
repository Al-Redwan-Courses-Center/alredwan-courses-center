#!/usr/bin/env python3
"""Views for lecture attendance (students/children)."""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction

from attendance.models.lecture_attendance import LectureAttendance
from attendance.permissions import IsAdminOrCourseInstructor
from attendance.serializers import (
    MarkAttendanceSerializer,
    LectureAttendanceSerializer,
    LectureAttendanceDetailSerializer,
    BulkMarkAttendanceSerializer,
)


class LectureAttendanceView(APIView):
    """
    API endpoint to mark attendance for a student or child.

    Only admins and the course instructor can mark attendance.

    Time restrictions:
    - Instructors: Can only mark within 24 hours after lecture start time
    - Admins/Supervisors: No time restriction (can mark past lectures any time)
    - Future lectures: Only superusers can mark attendance for future lectures

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

    def _is_admin_or_supervisor(self, user):
        """
        Check if user is admin or supervisor (no time restrictions for past lectures).
        Checks: is_superuser, is_staff, role field, and instructor_profile.type
        """
        if user.is_superuser:
            return True
        if user.is_staff:
            return True
        # Check role field for admin or supervisor
        if hasattr(user, 'role') and user.role in ('admin', 'supervisor'):
            return True
        # Check instructor profile type
        if hasattr(user, 'instructor_profile') and user.instructor_profile and user.instructor_profile.type == 'supervisor':
            return True
        return False

    def _is_superuser(self, user):
        """
        Check if user is a superuser (can mark future lectures).
        Only is_superuser=True grants this privilege.
        """
        return user.is_superuser

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

        # Check if lecture is in the future (only superusers can mark future lectures)
        lecture_start_dt = lecture.get_start_datetime()
        now = timezone.now()
        is_future_lecture = lecture_start_dt > now

        if is_future_lecture and not self._is_superuser(request.user):
            return Response(
                {
                    'error': 'Cannot mark attendance for future lectures.',
                    'details': 'Only super administrators can mark attendance for lectures that have not started yet.',
                    'lecture_start': lecture_start_dt.isoformat(),
                    'current_time': now.isoformat(),
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # Check time restriction for non-admin users (24h window after lecture)
        if not self._is_admin_or_supervisor(request.user):
            if not LectureAttendance.can_mark_now(lecture):
                start_dt, end_dt = LectureAttendance.allowed_marking_window(
                    lecture)
                return Response(
                    {
                        'error': 'Attendance marking window has expired.',
                        'details': 'Attendance can only be marked within 24 hours after the lecture.',
                        'lecture_start': start_dt.isoformat(),
                        'window_end': end_dt.isoformat(),
                    },
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

    Time restrictions:
    - Instructors: Can only mark within 24 hours after lecture start time
    - Admins/Supervisors: No time restriction (can mark past lectures any time)
    - Future lectures: Only superusers can mark attendance for future lectures

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

    def _is_admin_or_supervisor(self, user):
        """
        Check if user is admin or supervisor (no time restrictions for past lectures).
        Checks: is_superuser, is_staff, role field, and instructor_profile.type
        """
        if user.is_superuser:
            return True
        if user.is_staff:
            return True
        # Check role field for admin or supervisor
        if hasattr(user, 'role') and user.role in ('admin', 'supervisor'):
            return True
        # Check instructor profile type
        if hasattr(user, 'instructor_profile') and user.instructor_profile and user.instructor_profile.type == 'supervisor':
            return True
        return False

    def _is_superuser(self, user):
        """
        Check if user is a superuser (can mark future lectures).
        Only is_superuser=True grants this privilege.
        """
        return user.is_superuser

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

        # Check if lecture is in the future (only superusers can mark future lectures)
        lecture_start_dt = lecture.get_start_datetime()
        now = timezone.now()
        is_future_lecture = lecture_start_dt > now

        if is_future_lecture and not self._is_superuser(request.user):
            return Response(
                {
                    'error': 'Cannot mark attendance for future lectures.',
                    'details': 'Only super administrators can mark attendance for lectures that have not started yet.',
                    'lecture_start': lecture_start_dt.isoformat(),
                    'current_time': now.isoformat(),
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # Check time restriction for non-admin users (24h window after lecture)
        if not self._is_admin_or_supervisor(request.user):
            if not LectureAttendance.can_mark_now(lecture):
                start_dt, end_dt = LectureAttendance.allowed_marking_window(
                    lecture)
                return Response(
                    {
                        'error': 'Attendance marking window has expired.',
                        'details': 'Attendance can only be marked within 24 hours after the lecture.',
                        'lecture_start': start_dt.isoformat(),
                        'window_end': end_dt.isoformat(),
                    },
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
        "lecture_date": "2026-02-20",
        "lecture_start_time": "09:00:00",
        "is_attendance_submittable": true,
        "is_editable": true,
        "submission_deadline": "2026-02-21T09:00:00+02:00",
        "total_enrolled": 15,
        "present_count": 12,
        "absent_count": 3,
        "not_marked_count": 0,
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

    def _is_admin_or_supervisor(self, user):
        """
        Check if user is admin or supervisor (no time restrictions for past lectures).
        Checks: is_superuser, is_staff, role field, and instructor_profile.type
        """
        if user.is_superuser:
            return True
        if user.is_staff:
            return True
        # Check role field for admin or supervisor
        if hasattr(user, 'role') and user.role in ('admin', 'supervisor'):
            return True
        # Check instructor profile type
        if hasattr(user, 'instructor_profile') and user.instructor_profile and user.instructor_profile.type == 'supervisor':
            return True
        return False

    def _is_superuser(self, user):
        """
        Check if user is a superuser (can mark future lectures).
        Only is_superuser=True grants this privilege.
        """
        return user.is_superuser

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
        absent_count = attendances.filter(present=False).count()
        not_marked_count = attendances.filter(present__isnull=True).count()
        attendance_rate = (present_count / total_enrolled *
                           100) if total_enrolled > 0 else 0

        # Check if attendance can be submitted/edited
        is_admin_or_supervisor = self._is_admin_or_supervisor(request.user)
        is_superuser = self._is_superuser(request.user)
        can_mark_within_window = LectureAttendance.can_mark_now(lecture)
        start_dt, end_dt = LectureAttendance.allowed_marking_window(lecture)

        # Check if lecture is in the future
        now = timezone.now()
        is_future_lecture = start_dt > now

        # Future lectures: only superusers can submit/edit
        # Past lectures: admins/supervisors can always, instructors only within window
        if is_future_lecture:
            is_attendance_submittable = is_superuser
            is_editable = is_superuser
        else:
            is_attendance_submittable = is_admin_or_supervisor or can_mark_within_window
            is_editable = is_admin_or_supervisor or can_mark_within_window

        # Serialize the attendance records
        serializer = LectureAttendanceDetailSerializer(attendances, many=True)

        return Response({
            'lecture_id': lecture.id,
            'lecture_title': lecture.title,
            'course_name': lecture.course.name if lecture.course else None,
            'lecture_date': str(lecture.day),
            'lecture_start_time': str(lecture.start_time) if lecture.start_time else None,
            'is_future_lecture': is_future_lecture,
            'is_attendance_submittable': is_attendance_submittable,
            'is_editable': is_editable,
            'submission_deadline': end_dt.isoformat() if not is_admin_or_supervisor and not is_future_lecture else None,
            'user_can_bypass_deadline': is_admin_or_supervisor,
            'user_can_mark_future_lectures': is_superuser,
            'total_enrolled': total_enrolled,
            'present_count': present_count,
            'absent_count': absent_count,
            'not_marked_count': not_marked_count,
            'attendance_rate': round(attendance_rate, 1),
            'attendances': serializer.data
        }, status=status.HTTP_200_OK)
