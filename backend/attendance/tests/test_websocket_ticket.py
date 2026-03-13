#!/usr/bin/env python3
"""
Tests for WebSocket ticket authentication system.

This module tests:
- WebSocketTicket model functionality
- Ticket creation endpoint
- Ticket validation and single-use behavior
- Ticket expiration
- WebSocket consumer authentication with tickets
"""

from datetime import timedelta
from unittest.mock import patch, MagicMock

from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from users.models import CustomUser, Instructor
from attendance.models import WebSocketTicket


class WebSocketTicketModelTest(TestCase):
    """Tests for the WebSocketTicket model"""

    @classmethod
    def setUpTestData(cls):
        """Set up test data"""
        cls.admin_user = CustomUser.objects.create_user(
            phone_number1='+201000000001',
            password='adminpass123',
            first_name='Admin',
            last_name='User',
            email='admin@test.com',
            dob='1985-01-01',
            gender='male',
            is_staff=True,
            is_superuser=True
        )

        cls.regular_user = CustomUser.objects.create_user(
            phone_number1='+201000000002',
            password='regularpass123',
            first_name='Regular',
            last_name='User',
            email='regular@test.com',
            dob='1990-01-01',
            gender='male'
        )

    def test_ticket_creation(self):
        """Test that tickets are created with correct defaults"""
        ticket = WebSocketTicket.create_for_user(self.admin_user)

        self.assertIsNotNone(ticket.token)
        self.assertEqual(len(ticket.token), 43)  # Base64 URL-safe encoding of 32 bytes
        self.assertEqual(ticket.user, self.admin_user)
        self.assertFalse(ticket.is_used)
        self.assertIsNone(ticket.used_at)
        self.assertIsNotNone(ticket.created_at)
        self.assertIsNotNone(ticket.expires_at)

    def test_ticket_is_valid_when_new(self):
        """Test that new tickets are valid"""
        ticket = WebSocketTicket.create_for_user(self.admin_user)
        
        self.assertTrue(ticket.is_valid)
        self.assertFalse(ticket.is_expired)
        self.assertFalse(ticket.is_used)

    def test_ticket_expires_after_30_seconds(self):
        """Test that tickets expire after 30 seconds"""
        ticket = WebSocketTicket.create_for_user(self.admin_user)
        
        # Should be valid now
        self.assertTrue(ticket.is_valid)
        
        # Manually set expires_at to the past
        ticket.expires_at = timezone.now() - timedelta(seconds=1)
        ticket.save()
        
        self.assertTrue(ticket.is_expired)
        self.assertFalse(ticket.is_valid)

    def test_ticket_single_use(self):
        """Test that tickets can only be used once"""
        ticket = WebSocketTicket.create_for_user(self.admin_user)
        
        # First use should succeed
        self.assertTrue(ticket.use())
        self.assertTrue(ticket.is_used)
        self.assertIsNotNone(ticket.used_at)
        
        # Second use should fail
        self.assertFalse(ticket.use())

    def test_ticket_validate_and_use_success(self):
        """Test validate_and_use with valid ticket"""
        ticket = WebSocketTicket.create_for_user(self.admin_user)
        
        user, error = WebSocketTicket.validate_and_use(ticket.token)
        
        self.assertEqual(user, self.admin_user)
        self.assertIsNone(error)
        
        # Ticket should now be used
        ticket.refresh_from_db()
        self.assertTrue(ticket.is_used)

    def test_ticket_validate_and_use_not_found(self):
        """Test validate_and_use with invalid token"""
        user, error = WebSocketTicket.validate_and_use('invalid_token_123')
        
        self.assertIsNone(user)
        self.assertEqual(error, 'Ticket not found')

    def test_ticket_validate_and_use_already_used(self):
        """Test validate_and_use with already used ticket"""
        ticket = WebSocketTicket.create_for_user(self.admin_user)
        ticket.use()  # First use
        
        user, error = WebSocketTicket.validate_and_use(ticket.token)
        
        self.assertIsNone(user)
        self.assertEqual(error, 'Ticket already used')

    def test_ticket_validate_and_use_expired(self):
        """Test validate_and_use with expired ticket"""
        ticket = WebSocketTicket.create_for_user(self.admin_user)
        ticket.expires_at = timezone.now() - timedelta(seconds=1)
        ticket.save()
        
        user, error = WebSocketTicket.validate_and_use(ticket.token)
        
        self.assertIsNone(user)
        self.assertEqual(error, 'Ticket expired')

    def test_ticket_with_ip_and_user_agent(self):
        """Test ticket creation with IP and user agent"""
        ticket = WebSocketTicket.create_for_user(
            self.admin_user,
            ip_address='192.168.1.1',
            user_agent='Mozilla/5.0 Test Browser'
        )
        
        self.assertEqual(ticket.ip_address, '192.168.1.1')
        self.assertEqual(ticket.user_agent, 'Mozilla/5.0 Test Browser')

    def test_cleanup_expired_tickets(self):
        """Test that expired tickets are cleaned up"""
        # Create some tickets
        ticket1 = WebSocketTicket.create_for_user(self.admin_user)
        ticket2 = WebSocketTicket.create_for_user(self.admin_user)
        ticket3 = WebSocketTicket.create_for_user(self.admin_user)
        
        # Make ticket1 and ticket2 expired (more than 24 hours ago)
        old_time = timezone.now() - timedelta(hours=25)
        ticket1.expires_at = old_time
        ticket1.save()
        ticket2.expires_at = old_time
        ticket2.save()
        
        # Keep ticket3 recent
        
        # Cleanup
        deleted_count = WebSocketTicket.cleanup_expired(older_than_hours=24)
        
        self.assertEqual(deleted_count, 2)
        self.assertFalse(WebSocketTicket.objects.filter(pk=ticket1.pk).exists())
        self.assertFalse(WebSocketTicket.objects.filter(pk=ticket2.pk).exists())
        self.assertTrue(WebSocketTicket.objects.filter(pk=ticket3.pk).exists())

    def test_ticket_unique_tokens(self):
        """Test that each ticket gets a unique token"""
        tickets = [WebSocketTicket.create_for_user(self.admin_user) for _ in range(10)]
        tokens = [t.token for t in tickets]
        
        # All tokens should be unique
        self.assertEqual(len(tokens), len(set(tokens)))


class ObtainWebSocketTicketAPITest(TestCase):
    """Tests for the ticket creation API endpoint"""

    @classmethod
    def setUpTestData(cls):
        """Set up test data"""
        cls.admin_user = CustomUser.objects.create_user(
            phone_number1='+201000000001',
            password='adminpass123',
            first_name='Admin',
            last_name='User',
            email='admin@test.com',
            dob='1985-01-01',
            gender='male',
            is_staff=True,
            is_superuser=True
        )

        cls.regular_user = CustomUser.objects.create_user(
            phone_number1='+201000000002',
            password='regularpass123',
            first_name='Regular',
            last_name='User',
            email='regular@test.com',
            dob='1990-01-01',
            gender='male'
        )

        cls.staff_user = CustomUser.objects.create_user(
            phone_number1='+201000000003',
            password='staffpass123',
            first_name='Staff',
            last_name='User',
            email='staff@test.com',
            dob='1988-01-01',
            gender='male',
            is_staff=True
        )

    def setUp(self):
        """Set up for each test"""
        self.client = APIClient()

    def test_obtain_ticket_requires_authentication(self):
        """Test that obtaining a ticket requires authentication"""
        response = self.client.post('/api/attendance/ws-ticket/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_obtain_ticket_requires_staff_permission(self):
        """Test that only staff users can obtain tickets"""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post('/api/attendance/ws-ticket/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_obtain_ticket_as_admin(self):
        """Test that admin can obtain a ticket"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post('/api/attendance/ws-ticket/')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('ticket', response.data)
        self.assertIn('expires_in_seconds', response.data)
        self.assertLessEqual(response.data['expires_in_seconds'], 30)

        # Verify ticket exists in database
        ticket = WebSocketTicket.objects.get(token=response.data['ticket'])
        self.assertEqual(ticket.user, self.admin_user)
        self.assertFalse(ticket.is_used)

    def test_obtain_ticket_as_staff(self):
        """Test that staff user can obtain a ticket"""
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.post('/api/attendance/ws-ticket/')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('ticket', response.data)

    def test_obtain_multiple_tickets(self):
        """Test that multiple tickets can be obtained"""
        self.client.force_authenticate(user=self.admin_user)
        
        response1 = self.client.post('/api/attendance/ws-ticket/')
        response2 = self.client.post('/api/attendance/ws-ticket/')

        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)
        
        # Tokens should be different
        self.assertNotEqual(response1.data['ticket'], response2.data['ticket'])


class CleanupExpiredTicketsAPITest(TestCase):
    """Tests for the cleanup API endpoint"""

    @classmethod
    def setUpTestData(cls):
        """Set up test data"""
        cls.admin_user = CustomUser.objects.create_user(
            phone_number1='+201000000001',
            password='adminpass123',
            first_name='Admin',
            last_name='User',
            email='admin@test.com',
            dob='1985-01-01',
            gender='male',
            is_staff=True,
            is_superuser=True
        )

        cls.regular_user = CustomUser.objects.create_user(
            phone_number1='+201000000002',
            password='regularpass123',
            first_name='Regular',
            last_name='User',
            email='regular@test.com',
            dob='1990-01-01',
            gender='male'
        )

    def setUp(self):
        """Set up for each test"""
        self.client = APIClient()
        WebSocketTicket.objects.all().delete()

    def test_cleanup_requires_authentication(self):
        """Test that cleanup requires authentication"""
        response = self.client.post('/api/attendance/ws-ticket/cleanup/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_cleanup_requires_staff_permission(self):
        """Test that only staff users can run cleanup"""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post('/api/attendance/ws-ticket/cleanup/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_cleanup_as_admin(self):
        """Test that admin can run cleanup"""
        # Create some expired tickets
        old_time = timezone.now() - timedelta(hours=25)
        for _ in range(3):
            ticket = WebSocketTicket.create_for_user(self.admin_user)
            ticket.expires_at = old_time
            ticket.save()

        # Create a fresh ticket
        WebSocketTicket.create_for_user(self.admin_user)

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post('/api/attendance/ws-ticket/cleanup/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['deleted_count'], 3)
        
        # Only fresh ticket should remain
        self.assertEqual(WebSocketTicket.objects.count(), 1)

    def test_cleanup_with_custom_hours(self):
        """Test cleanup with custom hours parameter"""
        # Create a ticket expired 2 hours ago
        ticket = WebSocketTicket.create_for_user(self.admin_user)
        ticket.expires_at = timezone.now() - timedelta(hours=2)
        ticket.save()

        self.client.force_authenticate(user=self.admin_user)
        
        # Cleanup with 24 hours - should not delete
        response = self.client.post(
            '/api/attendance/ws-ticket/cleanup/',
            {'older_than_hours': 24}
        )
        self.assertEqual(response.data['deleted_count'], 0)

        # Cleanup with 1 hour - should delete
        response = self.client.post(
            '/api/attendance/ws-ticket/cleanup/',
            {'older_than_hours': 1}
        )
        self.assertEqual(response.data['deleted_count'], 1)


class WebSocketConsumerTicketAuthTest(TestCase):
    """Tests for WebSocket consumer ticket authentication"""

    @classmethod
    def setUpTestData(cls):
        """Set up test data"""
        cls.admin_user = CustomUser.objects.create_user(
            phone_number1='+201000000001',
            password='adminpass123',
            first_name='Admin',
            last_name='User',
            email='admin@test.com',
            dob='1985-01-01',
            gender='male',
            is_staff=True,
            is_superuser=True
        )

        cls.regular_user = CustomUser.objects.create_user(
            phone_number1='+201000000002',
            password='regularpass123',
            first_name='Regular',
            last_name='User',
            email='regular@test.com',
            dob='1990-01-01',
            gender='male'
        )

    def test_ticket_marked_as_used_after_validation(self):
        """Test that ticket is marked as used after validation"""
        ticket = WebSocketTicket.create_for_user(self.admin_user)
        
        self.assertFalse(ticket.is_used)
        
        # Simulate what the consumer does
        user, error = WebSocketTicket.validate_and_use(ticket.token)
        
        self.assertEqual(user, self.admin_user)
        self.assertIsNone(error)
        
        # Refresh and check
        ticket.refresh_from_db()
        self.assertTrue(ticket.is_used)
        self.assertIsNotNone(ticket.used_at)

    def test_ticket_cannot_be_reused(self):
        """Test that ticket cannot be reused for second connection"""
        ticket = WebSocketTicket.create_for_user(self.admin_user)
        
        # First connection
        user1, error1 = WebSocketTicket.validate_and_use(ticket.token)
        self.assertEqual(user1, self.admin_user)
        self.assertIsNone(error1)
        
        # Second connection attempt
        user2, error2 = WebSocketTicket.validate_and_use(ticket.token)
        self.assertIsNone(user2)
        self.assertEqual(error2, 'Ticket already used')

    def test_ticket_for_non_staff_user_validation(self):
        """Test that ticket validation works for any user but consumer checks staff"""
        ticket = WebSocketTicket.create_for_user(self.regular_user)
        
        # Ticket validation should work (gives user)
        user, error = WebSocketTicket.validate_and_use(ticket.token)
        
        self.assertEqual(user, self.regular_user)
        self.assertIsNone(error)
        
        # But consumer would reject since user.is_staff is False
        self.assertFalse(user.is_staff)


class WebSocketTicketIntegrationTest(TestCase):
    """Integration tests for the full ticket flow"""

    @classmethod
    def setUpTestData(cls):
        """Set up test data"""
        cls.admin_user = CustomUser.objects.create_user(
            phone_number1='+201000000001',
            password='adminpass123',
            first_name='Admin',
            last_name='User',
            email='admin@test.com',
            dob='1985-01-01',
            gender='male',
            is_staff=True,
            is_superuser=True
        )

    def setUp(self):
        """Set up for each test"""
        self.client = APIClient()
        WebSocketTicket.objects.all().delete()

    def test_full_ticket_flow(self):
        """Test the complete flow: obtain ticket -> use for connection -> cannot reuse"""
        # Step 1: Obtain ticket via API
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post('/api/attendance/ws-ticket/')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        ticket_token = response.data['ticket']
        
        # Verify ticket is valid
        ticket = WebSocketTicket.objects.get(token=ticket_token)
        self.assertTrue(ticket.is_valid)
        self.assertFalse(ticket.is_used)
        
        # Step 2: Simulate WebSocket connection validation
        user, error = WebSocketTicket.validate_and_use(ticket_token)
        
        self.assertEqual(user, self.admin_user)
        self.assertIsNone(error)
        
        # Step 3: Verify ticket is now used
        ticket.refresh_from_db()
        self.assertTrue(ticket.is_used)
        self.assertFalse(ticket.is_valid)
        
        # Step 4: Attempt to reuse should fail
        user2, error2 = WebSocketTicket.validate_and_use(ticket_token)
        self.assertIsNone(user2)
        self.assertEqual(error2, 'Ticket already used')

    def test_ticket_expiry_timing(self):
        """Test that ticket expires at the right time"""
        self.client.force_authenticate(user=self.admin_user)
        
        before = timezone.now()
        response = self.client.post('/api/attendance/ws-ticket/')
        after = timezone.now()
        
        ticket = WebSocketTicket.objects.get(token=response.data['ticket'])
        
        # Ticket should expire approximately 30 seconds from now
        expected_expiry_min = before + timedelta(seconds=29)
        expected_expiry_max = after + timedelta(seconds=31)
        
        self.assertGreaterEqual(ticket.expires_at, expected_expiry_min)
        self.assertLessEqual(ticket.expires_at, expected_expiry_max)
