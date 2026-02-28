#!/usr/bin/env python3
"""WebSocket consumer for instructor attendance updates with authentication."""

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from urllib.parse import parse_qs


User = get_user_model()


class InstructorAttendanceConsumer(AsyncJsonWebsocketConsumer):
    """
    WebSocket consumer to send real-time attendance updates to authenticated admins.

    Connection URL: ws://host/ws/attendance/?token=<jwt_token>

    Only authenticated admin users can connect to receive updates.
    """

    async def connect(self):
        """Handle WebSocket connection with JWT authentication."""
        # Extract token from query string
        query_string = self.scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]

        if not token:
            # No token provided - reject connection
            await self.close(code=4001)
            return

        # Validate token and get user
        user = await self.get_user_from_token(token)

        if user is None or isinstance(user, AnonymousUser):
            # Invalid token - reject connection
            await self.close(code=4002)
            return

        # Check if user is staff/admin
        if not user.is_staff:
            # Not authorized - reject connection
            await self.close(code=4003)
            return

        # Store user in scope
        self.scope['user'] = user

        # Add to attendance updates group
        await self.channel_layer.group_add("attendance_live", self.channel_name)
        await self.accept()

        # Send welcome message
        await self.send_json({
            "type": "connection_established",
            "message": f"Connected as {user.get_full_name()}",
            "user_id": str(user.id),
        })

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        await self.channel_layer.group_discard("attendance_live", self.channel_name)

    async def receive_json(self, content):
        """
        Handle incoming messages from clients.

        Clients can request specific data or subscribe to specific instructors.
        
        Supported message types:
        - ping: Health check, returns pong
        - request_summary: Get today's attendance summary with optional filters
          Supports: gender (male/female), instructor_type (normal/supervisor),
                    attendance_type (lecture/supervision)
        - request_filtered_list: Get filtered list of today's attendance records
          Supports all filters above plus: status, checked_in, checked_out
        """
        message_type = content.get('type')

        if message_type == 'ping':
            # Health check
            await self.send_json({"type": "pong"})

        elif message_type == 'request_summary':
            # Client requests current summary with optional filters
            filters = content.get('filters', {})
            summary = await self.get_today_summary(filters)
            await self.send_json({
                "type": "summary_response",
                "data": summary,
                "filters_applied": filters
            })

        elif message_type == 'request_filtered_list':
            # Client requests filtered attendance list
            filters = content.get('filters', {})
            data = await self.get_filtered_attendance_list(filters)
            await self.send_json({
                "type": "filtered_list_response",
                "data": data,
                "filters_applied": filters
            })

    async def attendance_update(self, event):
        """Receive attendance update from group and send to WebSocket."""
        await self.send_json({
            "type": "attendance_update",
            "data": event["data"]
        })

    async def attendance_check_out(self, event):
        """Receive check-out event and send to WebSocket."""
        await self.send_json({
            "type": "attendance_check_out",
            "data": event["data"]
        })

    async def attendance_rated(self, event):
        """Receive rating event and send to WebSocket."""
        await self.send_json({
            "type": "attendance_rated",
            "data": event["data"]
        })

    @database_sync_to_async
    def get_user_from_token(self, token):
        """Validate JWT token and return user."""
        try:
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            return User.objects.get(id=user_id)
        except (InvalidToken, TokenError, User.DoesNotExist):
            return None

    def _apply_filters(self, qs, filters):
        """
        Apply filters to a queryset.
        
        Supported filters:
        - gender: male/female (filters by instructor__user__gender)
        - instructor_type: normal/supervisor (filters by instructor__type)
        - attendance_type: lecture/supervision
        - status: present/absent/late/pending/not_started
        - checked_in: true/false
        - checked_out: true/false
        """
        if not filters:
            return qs

        # Gender filter
        gender = filters.get('gender')
        if gender and gender in ('male', 'female'):
            qs = qs.filter(instructor__user__gender=gender)

        # Instructor type filter
        instructor_type = filters.get('instructor_type')
        if instructor_type and instructor_type in ('normal', 'supervisor'):
            qs = qs.filter(instructor__type=instructor_type)

        # Attendance type filter
        attendance_type = filters.get('attendance_type')
        if attendance_type and attendance_type in ('lecture', 'supervision'):
            qs = qs.filter(attendance_type=attendance_type)

        # Status filter
        status = filters.get('status')
        if status:
            qs = qs.filter(status=status)

        # Checked in filter
        checked_in = filters.get('checked_in')
        if checked_in is not None:
            if checked_in in (True, 'true', '1'):
                qs = qs.filter(check_in_time__isnull=False)
            elif checked_in in (False, 'false', '0'):
                qs = qs.filter(check_in_time__isnull=True)

        # Checked out filter
        checked_out = filters.get('checked_out')
        if checked_out is not None:
            if checked_out in (True, 'true', '1'):
                qs = qs.filter(check_out_time__isnull=False)
            elif checked_out in (False, 'false', '0'):
                qs = qs.filter(check_out_time__isnull=True)

        return qs

    @database_sync_to_async
    def get_today_summary(self, filters=None):
        """
        Get today's attendance summary with optional filters.
        
        Filters:
        - gender: male/female
        - instructor_type: normal/supervisor
        - attendance_type: lecture/supervision
        """
        from django.utils import timezone
        from .models import InstructorAttendance, AttendanceStatus, AttendanceType

        today = timezone.localdate()
        qs = InstructorAttendance.objects.filter(date=today)
        
        # Apply filters
        qs = self._apply_filters(qs, filters)

        # Build summary with gender breakdown if not filtered by gender
        summary = {
            'date': str(today),
            'total_expected': qs.count(),
            'checked_in': qs.filter(check_in_time__isnull=False).count(),
            'checked_out': qs.filter(check_out_time__isnull=False).count(),
            'present': qs.filter(status=AttendanceStatus.PRESENT).count(),
            'late': qs.filter(status=AttendanceStatus.LATE).count(),
            'absent': qs.filter(status=AttendanceStatus.ABSENT).count(),
            'pending': qs.filter(status=AttendanceStatus.PENDING).count(),
            'not_started': qs.filter(status=AttendanceStatus.NOT_STARTED).count(),
        }

        # Add gender breakdown if not already filtered by gender
        if not filters or 'gender' not in filters:
            summary['by_gender'] = {
                'male': {
                    'total': qs.filter(instructor__user__gender='male').count(),
                    'present': qs.filter(instructor__user__gender='male', status=AttendanceStatus.PRESENT).count(),
                    'late': qs.filter(instructor__user__gender='male', status=AttendanceStatus.LATE).count(),
                    'absent': qs.filter(instructor__user__gender='male', status=AttendanceStatus.ABSENT).count(),
                },
                'female': {
                    'total': qs.filter(instructor__user__gender='female').count(),
                    'present': qs.filter(instructor__user__gender='female', status=AttendanceStatus.PRESENT).count(),
                    'late': qs.filter(instructor__user__gender='female', status=AttendanceStatus.LATE).count(),
                    'absent': qs.filter(instructor__user__gender='female', status=AttendanceStatus.ABSENT).count(),
                },
            }

        # Add type breakdown if not already filtered by type
        if not filters or 'attendance_type' not in filters:
            summary['by_type'] = {
                'lecture': qs.filter(attendance_type=AttendanceType.LECTURE).count(),
                'supervision': qs.filter(attendance_type=AttendanceType.SUPERVISION).count(),
            }

        return summary

    @database_sync_to_async
    def get_filtered_attendance_list(self, filters=None):
        """
        Get filtered list of today's attendance records.
        
        Returns a list of attendance records with instructor details.
        """
        from django.utils import timezone
        from .models import InstructorAttendance

        today = timezone.localdate()
        qs = InstructorAttendance.objects.filter(date=today).select_related(
            'instructor__user', 'lecture', 'schedule'
        )
        
        # Apply filters
        qs = self._apply_filters(qs, filters)
        
        # Order by check-in time, then name
        qs = qs.order_by('-check_in_time', 'instructor__user__first_name')

        records = []
        for att in qs[:100]:  # Limit to 100 records for WebSocket
            records.append({
                'id': att.id,
                'instructor_id': att.instructor_id,
                'instructor_name': att.instructor.user.get_full_name() if att.instructor else None,
                'instructor_gender': att.instructor.user.gender if att.instructor else None,
                'instructor_type': att.instructor.type if att.instructor else None,
                'date': str(att.date),
                'status': att.status,
                'attendance_type': att.attendance_type,
                'check_in_time': att.check_in_time.isoformat() if att.check_in_time else None,
                'check_out_time': att.check_out_time.isoformat() if att.check_out_time else None,
                'rating': float(att.rating) if att.rating else None,
            })

        return {
            'count': len(records),
            'records': records,
        }
