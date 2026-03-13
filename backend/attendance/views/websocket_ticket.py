#!/usr/bin/env python3
"""
Views for WebSocket authentication ticket management.

This module provides an endpoint for obtaining short-lived, single-use tickets
for WebSocket authentication, which is more secure than passing JWT tokens
in the URL query string.
"""

from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import WebSocketTicket


class ObtainWebSocketTicketView(APIView):
    """
    API endpoint to obtain a WebSocket authentication ticket.
    
    POST /api/attendance/ws-ticket/
    
    Requires authentication via JWT in the Authorization header.
    Returns a short-lived, single-use ticket for WebSocket connection.
    
    Only admin/staff users can obtain tickets (WebSocket is for admin dashboard).
    
    Response:
    {
        "ticket": "abc123...",
        "expires_in_seconds": 30
    }
    
    Usage:
    1. Call this endpoint with valid JWT auth
    2. Connect to WebSocket: ws://host/ws/attendance/?ticket=<ticket>
    3. Ticket expires after 30 seconds or single use
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        """Create and return a new WebSocket ticket."""
        # Get client info for audit purposes
        ip_address = self.get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        # Create ticket
        ticket = WebSocketTicket.create_for_user(
            user=request.user,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        # Calculate seconds until expiry
        from django.utils import timezone
        expires_in = (ticket.expires_at - timezone.now()).total_seconds()
        
        return Response({
            'ticket': ticket.token,
            'expires_in_seconds': int(expires_in),
            'message': 'Use this ticket to connect to WebSocket within 30 seconds. Single use only.'
        }, status=status.HTTP_201_CREATED)

    def get_client_ip(self, request):
        """Extract client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class CleanupExpiredTicketsView(APIView):
    """
    Admin endpoint to manually trigger cleanup of expired tickets.
    
    POST /api/attendance/ws-ticket/cleanup/
    
    This is primarily for manual cleanup; in production, use a cron job.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        """Clean up expired tickets."""
        hours = request.data.get('older_than_hours', 24)
        
        try:
            hours = int(hours)
        except (TypeError, ValueError):
            hours = 24
        
        deleted_count = WebSocketTicket.cleanup_expired(older_than_hours=hours)
        
        return Response({
            'deleted_count': deleted_count,
            'message': f'Cleaned up {deleted_count} expired tickets older than {hours} hours'
        })
