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
        """
        message_type = content.get('type')

        if message_type == 'ping':
            # Health check
            await self.send_json({"type": "pong"})

        elif message_type == 'request_summary':
            # Client requests current summary
            summary = await self.get_today_summary()
            await self.send_json({
                "type": "summary_response",
                "data": summary
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

    @database_sync_to_async
    def get_today_summary(self):
        """Get today's attendance summary."""
        from django.utils import timezone
        from .models import InstructorAttendance, AttendanceStatus, AttendanceType

        today = timezone.localdate()
        qs = InstructorAttendance.objects.filter(date=today)

        return {
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
