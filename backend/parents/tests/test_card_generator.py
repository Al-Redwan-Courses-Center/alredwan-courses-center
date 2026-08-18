#!/usr/bin/env python3
"""
Test script for Child ID Card Generator
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Redwan_courses_center.settings')
django.setup()

from django.utils import timezone
from parents.models import Parent, Child
from parents.utils.card_generator import generate_child_card, generate_children_pdf, generate_card_image_bytes
from users.models.user import CustomUser


def test_card_generator():
    """Test the card generator with a sample child."""
    print("=" * 60)
    print("TESTING CHILD ID CARD GENERATOR")
    print("=" * 60)
    
    # Check if we have any children in the database
    child = Child.objects.select_related('primary_parent', 'primary_parent__user').first()
    
    if not child:
        print("\n⚠ No children found in database. Creating test data...")
        
        # Create test user for parent
        user = CustomUser.objects.create(
            phone_number1='+201234567890',
            first_name='أحمد',
            last_name='محمد',
            dob=timezone.localdate().replace(year=1985),
            gender='male'
        )
        
        # Create parent
        parent = Parent.objects.create(user=user)
        
        # Create child
        child = Child.objects.create(
            primary_parent=parent,
            first_name='محمد',
            last_name='أحمد',
            gender='boy',
            dob=timezone.localdate().replace(year=2015),
            phone='+201234567891'
        )
        print(f"✓ Created test child: {child}")
    else:
        print(f"\n✓ Found existing child: {child}")
    
    print(f"\n📋 Child Details:")
    print(f"   - Name: {child.first_name} {child.last_name}")
    print(f"   - Code: {child.unique_code}")
    print(f"   - Gender: {child.gender}")
    print(f"   - DOB: {child.dob}")
    print(f"   - Age: {child.get_age_on_date()} years")
    print(f"   - Phone: {child.phone}")
    print(f"   - Parent: {child.primary_parent}")
    
    # Test 1: Generate single card image
    print("\n" + "-" * 40)
    print("TEST 1: Generate card image")
    try:
        card_image = generate_child_card(child)
        print(f"✓ Generated card image: {card_image.size[0]}x{card_image.size[1]} pixels")
        
        # Save for inspection
        output_path = '/app/test_card.png'
        card_image.save(output_path)
        print(f"✓ Saved to: {output_path}")
    except Exception as e:
        print(f"✗ FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Test 2: Generate card as bytes
    print("\n" + "-" * 40)
    print("TEST 2: Generate card as bytes")
    try:
        img_bytes = generate_card_image_bytes(child, format='PNG')
        print(f"✓ Generated image bytes: {len(img_bytes.getvalue())} bytes")
    except Exception as e:
        print(f"✗ FAILED: {e}")
        return False
    
    # Test 3: Generate PDF with single child
    print("\n" + "-" * 40)
    print("TEST 3: Generate PDF (single child)")
    try:
        pdf_buffer = generate_children_pdf([child])
        print(f"✓ Generated PDF: {len(pdf_buffer.getvalue())} bytes")
        
        # Save for inspection
        output_path = '/app/test_card.pdf'
        with open(output_path, 'wb') as f:
            f.write(pdf_buffer.getvalue())
        print(f"✓ Saved to: {output_path}")
    except Exception as e:
        print(f"✗ FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Test 4: Generate PDF with multiple children
    print("\n" + "-" * 40)
    print("TEST 4: Generate PDF (multiple children)")
    try:
        # Get up to 5 children
        children = list(Child.objects.select_related('primary_parent', 'primary_parent__user')[:5])
        
        if len(children) >= 2:
            pdf_buffer = generate_children_pdf(children)
            print(f"✓ Generated PDF with {len(children)} children: {len(pdf_buffer.getvalue())} bytes")
            
            output_path = '/app/test_cards_multi.pdf'
            with open(output_path, 'wb') as f:
                f.write(pdf_buffer.getvalue())
            print(f"✓ Saved to: {output_path}")
        else:
            print(f"⚠ Only {len(children)} child in database, skipping multi-child test")
    except Exception as e:
        print(f"✗ FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    print("\n" + "=" * 60)
    print("ALL TESTS PASSED! ✓")
    print("=" * 60)
    print("\nGenerated files:")
    print("  - /app/test_card.png")
    print("  - /app/test_card.pdf")
    if len(Child.objects.all()) >= 2:
        print("  - /app/test_cards_multi.pdf")
    
    return True


if __name__ == '__main__':
    success = test_card_generator()
    sys.exit(0 if success else 1)
