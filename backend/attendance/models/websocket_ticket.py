#!/usr/bin/env python3
"""
WebSocket Authentication Ticket Model

This module provides a secure ticket-based authentication system for WebSocket connections.
Instead of passing JWT tokens in the URL query string (which is less secure due to logging
and referrer header exposure), clients obtain a short-lived, single-use ticket via an
authenticated REST endpoint and use that ticket to establish the WebSocket connection.

Security Features:
- Tickets are single-use (invalidated after connection)
- Short expiration time (default: 30 seconds)
- Tied to specific user
- Cryptographically secure random token
"""

import secrets
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


def generate_ticket_token():
    """Generate a cryptographically secure random token for the ticket."""
    return secrets.token_urlsafe(32)


def get_default_expiry():
    """Return the default expiration time for a ticket (30 seconds from now)."""
    return timezone.now() + timedelta(seconds=30)


class WebSocketTicket(models.Model):
    """
    A short-lived, single-use ticket for WebSocket authentication.
    
    Flow:
    1. Client calls POST /api/attendance/ws-ticket/ with valid JWT
    2. Server creates a WebSocketTicket with a random token
    3. Client connects to WebSocket: ws://host/ws/attendance/?ticket=<token>
    4. Server validates ticket (exists, not expired, not used)
    5. Server marks ticket as used and allows connection
    
    This approach is more secure than JWT in query string because:
    - Tickets are single-use (replay attacks impossible)
    - Very short lifespan (30 seconds)
    - Token is random, not decodable (no JWT claims exposed)
    - Server logs will only show a meaningless token
    """
    
    token = models.CharField(
        _('Ticket Token'),
        max_length=64,
        unique=True,
        default=generate_ticket_token,
        db_index=True,
        help_text=_('Cryptographically secure random token')
    )
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='websocket_tickets',
        verbose_name=_('User'),
        help_text=_('The user this ticket is issued for')
    )
    
    created_at = models.DateTimeField(
        _('Created At'),
        auto_now_add=True,
        help_text=_('When the ticket was created')
    )
    
    expires_at = models.DateTimeField(
        _('Expires At'),
        default=get_default_expiry,
        db_index=True,
        help_text=_('When the ticket expires (default: 30 seconds from creation)')
    )
    
    used_at = models.DateTimeField(
        _('Used At'),
        null=True,
        blank=True,
        help_text=_('When the ticket was used to establish a connection')
    )
    
    is_used = models.BooleanField(
        _('Is Used'),
        default=False,
        db_index=True,
        help_text=_('Whether this ticket has been used')
    )
    
    ip_address = models.GenericIPAddressField(
        _('IP Address'),
        null=True,
        blank=True,
        help_text=_('IP address that requested the ticket')
    )
    
    user_agent = models.CharField(
        _('User Agent'),
        max_length=500,
        blank=True,
        default='',
        help_text=_('Browser/client user agent')
    )

    class Meta:
        verbose_name = _('WebSocket Ticket')
        verbose_name_plural = _('WebSocket Tickets')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['token', 'is_used']),
            models.Index(fields=['user', 'created_at']),
        ]

    def __str__(self):
        status = 'used' if self.is_used else ('expired' if self.is_expired else 'valid')
        return f"Ticket {self.token[:8]}... for {self.user} ({status})"

    @property
    def is_expired(self):
        """Check if the ticket has expired."""
        return timezone.now() > self.expires_at

    @property
    def is_valid(self):
        """Check if the ticket is valid (not used and not expired)."""
        return not self.is_used and not self.is_expired

    def use(self):
        """
        Mark the ticket as used.
        
        Returns:
            bool: True if successfully marked as used, False if already used or expired.
        """
        if not self.is_valid:
            return False
        
        self.is_used = True
        self.used_at = timezone.now()
        self.save(update_fields=['is_used', 'used_at'])
        return True

    @classmethod
    def create_for_user(cls, user, ip_address=None, user_agent=''):
        """
        Create a new ticket for a user.
        
        Args:
            user: The user to create the ticket for
            ip_address: Optional IP address of the requester
            user_agent: Optional user agent string
            
        Returns:
            WebSocketTicket: The newly created ticket
        """
        return cls.objects.create(
            user=user,
            ip_address=ip_address,
            user_agent=user_agent[:500] if user_agent else ''
        )

    @classmethod
    def validate_and_use(cls, token):
        """
        Validate a ticket token and mark it as used if valid.
        
        Args:
            token: The ticket token to validate
            
        Returns:
            tuple: (user, error_message) - user if valid, None and error message if not
        """
        try:
            ticket = cls.objects.select_related('user').get(token=token)
        except cls.DoesNotExist:
            return None, 'Ticket not found'
        
        if ticket.is_used:
            return None, 'Ticket already used'
        
        if ticket.is_expired:
            return None, 'Ticket expired'
        
        # Mark as used
        ticket.use()
        
        return ticket.user, None

    @classmethod
    def cleanup_expired(cls, older_than_hours=24):
        """
        Delete expired tickets older than specified hours.
        
        This should be called periodically (e.g., via cron job) to prevent
        the table from growing indefinitely.
        
        Args:
            older_than_hours: Delete tickets expired more than this many hours ago
            
        Returns:
            int: Number of tickets deleted
        """
        cutoff = timezone.now() - timedelta(hours=older_than_hours)
        deleted_count, _ = cls.objects.filter(
            expires_at__lt=cutoff
        ).delete()
        return deleted_count
