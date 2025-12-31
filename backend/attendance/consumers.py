#!/usr/bin/env python3
''' WebSocket consumer for instructor attendance updates '''
from channels.generic.websocket import AsyncJsonWebsocketConsumer


class InstructorAttendanceConsumer(AsyncJsonWebsocketConsumer):
    """WebSocket consumer to send real-time attendance updates to instructors."""

    async def connect(self):
        """Handle WebSocket connection."""
        await self.channel_layer.group_add("attendance_live", self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        await self.channel_layer.group_discard("attendance_live", self.channel_name)

    async def attendance_update(self, event):
        """Receive attendance update from group and send to WebSocket."""
        await self.send_json(event["data"])
