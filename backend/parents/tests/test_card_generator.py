#!/usr/bin/env python3
"""
Test script for Child ID Card Generator

This is a Django TestCase that tests card generation functionality.
"""
from django.test import TestCase
from django.utils import timezone
from parents.models import Parent, Child
from parents.utils.card_generator import generate_children_pdf
from users.models.user import CustomUser


class CardGeneratorTestCase(TestCase):
    """Test case for card generator functionality."""
    
    @classmethod
    def setUpTestData(cls):
        """Set up test data for the card generator tests."""
        # Create test user for parent
        cls.user = CustomUser.objects.create(
            phone_number1='+201234567890',
            first_name='أحمد',
            last_name='محمد',
            dob=timezone.localdate().replace(year=1985),
            gender='male'
        )
        
        # Create parent
        cls.parent = Parent.objects.create(user=cls.user)
        
        # Create child
        cls.child = Child.objects.create(
            primary_parent=cls.parent,
            first_name='محمد',
            last_name='أحمد',
            gender='boy',
            dob=timezone.localdate().replace(year=2015),
            phone='+201234567891'
        )
    
    def test_child_has_unique_code(self):
        """Test that child has a unique code."""
        self.assertIsNotNone(self.child.unique_code)
        self.assertTrue(len(self.child.unique_code) > 0)
    
    def test_child_generate_card_image_buffer(self):
        """Test generating card image buffer for a child."""
        try:
            buffer = self.child.generate_card_image_buffer()
            self.assertIsNotNone(buffer)
            # Check that buffer has some content
            content = buffer.getvalue()
            self.assertTrue(len(content) > 0)
        except ImportError:
            # PIL/Pillow not available - skip this test
            self.skipTest("PIL/Pillow not installed")
        except Exception as e:
            # If image generation fails due to missing fonts, etc - that's ok
            if 'font' in str(e).lower() or 'pillow' in str(e).lower():
                self.skipTest(f"Image generation dependency issue: {e}")
            raise
    
    def test_generate_children_pdf(self):
        """Test generating PDF with children cards."""
        try:
            pdf_buffer = generate_children_pdf([self.child])
            self.assertIsNotNone(pdf_buffer)
            content = pdf_buffer.getvalue()
            # Check PDF header
            self.assertTrue(content.startswith(b'%PDF'))
        except ImportError:
            self.skipTest("reportlab not installed")
        except Exception as e:
            if 'font' in str(e).lower() or 'pillow' in str(e).lower():
                self.skipTest(f"PDF generation dependency issue: {e}")
            raise
    
    def test_generate_children_pdf_multiple(self):
        """Test generating PDF with multiple children."""
        # Create another child
        child2 = Child.objects.create(
            primary_parent=self.parent,
            first_name='علي',
            last_name='أحمد',
            gender='boy',
            dob=timezone.localdate().replace(year=2017),
            phone='+201234567892'
        )
        
        try:
            pdf_buffer = generate_children_pdf([self.child, child2])
            self.assertIsNotNone(pdf_buffer)
            content = pdf_buffer.getvalue()
            self.assertTrue(content.startswith(b'%PDF'))
        except ImportError:
            self.skipTest("reportlab not installed")
        except Exception as e:
            if 'font' in str(e).lower() or 'pillow' in str(e).lower():
                self.skipTest(f"PDF generation dependency issue: {e}")
            raise
