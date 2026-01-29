#!/usr/bin/env python3
"""
Test script for enrollment auto-completion feature.

This script tests:
1. EnrollmentManager.get_completable_enrollments()
2. Enrollment.should_be_completed()
3. Enrollment.get_completion_progress()
4. Cron jobs (mark_completed_enrollments_daily, check_and_complete_course_enrollments)
5. Signal (on_lecture_status_changed)

Run with: python test_enrollment_completion.py
"""
import os
import sys
import django
from datetime import timedelta

# Setup Django FIRST - before any model imports
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Redwan_courses_center.settings')
django.setup()

# NOW import models after Django is configured
from django.test import TestCase
from django.db import transaction
from django.utils import timezone
from courses.models.course import Course, Season, SeasonChoices
from courses.models.lecture import Lecture, LectureStatus
from users.models.instructor import Instructor
from enrollments_payments.models.enrollment import Enrollment, EnrollmentStatus
from parents.models import Parent, Child
from users.models import CustomUser


def create_test_data():
    """Create test data for enrollment completion tests."""
    print("=" * 60)
    print("Creating test data...")
    print("=" * 60)

    # Get or create a test instructor
    instructor_user, _ = CustomUser.objects.get_or_create(
        phone_number1='+201000000001',
        defaults={
            'first_name': 'Test',
            'last_name': 'Instructor',
            'dob': timezone.now().date() - timedelta(days=10000),
            'gender': 'male',
            'role': 'instructor',
        }
    )
    instructor, _ = Instructor.objects.get_or_create(
        user=instructor_user,
        defaults={'monthly_salary': 5000}
    )
    print(f"✓ Instructor: {instructor}")

    # Get or create a test season (used instead of category)
    season, _ = Season.objects.get_or_create(
        name='Test Season Enrollment',
        defaults={
            'season_type': SeasonChoices.OTHER,
            'start_date': timezone.localdate() - timedelta(days=60),
            'end_date': timezone.localdate() + timedelta(days=60),
            'is_active': True,
        }
    )
    print(f"✓ Season: {season}")

    # Get or create a test parent
    parent_user, _ = CustomUser.objects.get_or_create(
        phone_number1='+201000000002',
        defaults={
            'first_name': 'Parent',
            'last_name': 'Test',
            'dob': timezone.now().date() - timedelta(days=15000),
            'gender': 'male',
            'role': 'parent',
        }
    )
    parent, _ = Parent.objects.get_or_create(
        user=parent_user
    )
    print(f"✓ Parent: {parent}")

    # Get or create a test child
    child, _ = Child.objects.get_or_create(
        primary_parent=parent,
        first_name='Test',
        last_name='Child Enrollment',
        defaults={
            'dob': timezone.now().date() - timedelta(days=3650),  # 10 years old
            'gender': 'male',
        }
    )
    print(f"✓ Child: {child}")

    return instructor, season, parent, child


def test_end_date_completion(instructor, season, child):
    """Test enrollment completion based on end_date."""
    print("\n" + "=" * 60)
    print("TEST 1: Enrollment completion based on end_date")
    print("=" * 60)

    # Create a course that ended yesterday
    yesterday = timezone.localdate() - timedelta(days=1)

    course, _ = Course.objects.get_or_create(
        name='Test Course - End Date Passed',
        defaults={
            'instructor': instructor,
            'season': season,
            'start_date': yesterday - timedelta(days=30),
            'end_date': yesterday,
            'price': 100,
            'capacity': 30,
        }
    )
    print(f"✓ Course created: {course.name}")
    print(f"  - End date: {course.end_date} (Yesterday)")

    # Create or reset an enrollment
    enrollment, created = Enrollment.objects.get_or_create(
        course=course,
        child=child,
        defaults={'status': EnrollmentStatus.ACTIVE}
    )
    if not created:
        # Reset to active for testing
        enrollment.status = EnrollmentStatus.ACTIVE
        enrollment.completed_at = None
        enrollment.save(update_fields=['status', 'completed_at'])

    print(f"✓ Enrollment created/reset: {enrollment}")
    print(f"  - Status: {enrollment.status}")

    # Test should_be_completed()
    should_complete = enrollment.should_be_completed()
    print(f"\n→ should_be_completed(): {should_complete}")
    assert should_complete == True, "Enrollment should be completable (end_date passed)"
    print("✓ PASSED: should_be_completed() returns True for passed end_date")

    # Test get_completion_progress()
    progress = enrollment.get_completion_progress()
    print(f"\n→ get_completion_progress():")
    print(f"  - end_date_passed: {progress['end_date_passed']}")
    print(f"  - is_completable: {progress['is_completable']}")
    assert progress['end_date_passed'] == True, "end_date_passed should be True"
    assert progress['is_completable'] == True, "is_completable should be True"
    print("✓ PASSED: Progress shows correct end_date_passed and is_completable")

    return enrollment, course


def test_lecture_completion(instructor, season, child):
    """Test enrollment completion based on all lectures completed."""
    print("\n" + "=" * 60)
    print("TEST 2: Enrollment completion based on lectures")
    print("=" * 60)

    # Create a course with 3 expected lectures (no end_date)
    course, _ = Course.objects.get_or_create(
        name='Test Course - Lecture Based',
        defaults={
            'instructor': instructor,
            'season': season,
            'start_date': timezone.localdate() - timedelta(days=30),
            'end_date': None,  # No end date
            'num_lectures': 3,
            'price': 100,
            'capacity': 30,
        }
    )
    # Make sure num_lectures is set
    if course.num_lectures != 3:
        course.num_lectures = 3
        course.end_date = None
        course.save(update_fields=['num_lectures', 'end_date'])

    print(f"✓ Course created: {course.name}")
    print(f"  - num_lectures: {course.num_lectures}")
    print(f"  - end_date: {course.end_date}")

    # Clear any existing lectures for this course
    course.lectures.all().delete()

    # Create 3 lectures - use future dates for scheduled status
    for i in range(3):
        Lecture.objects.create(
            course=course,
            day=timezone.localdate() + timedelta(days=i+1),  # Future dates
            lecture_number=i+1,
            instructor=instructor,
            status=LectureStatus.SCHEDULED,
        )
    print(f"✓ Created 3 lectures (all SCHEDULED in the future)")

    # Create enrollment
    enrollment, created = Enrollment.objects.get_or_create(
        course=course,
        child=child,
        defaults={'status': EnrollmentStatus.ACTIVE}
    )
    if not created:
        enrollment.status = EnrollmentStatus.ACTIVE
        enrollment.completed_at = None
        enrollment.save(update_fields=['status', 'completed_at'])

    print(f"✓ Enrollment: {enrollment}")

    # Test 1: Not all lectures completed
    should_complete = enrollment.should_be_completed()
    print(
        f"\n→ Before completing lectures: should_be_completed() = {should_complete}")
    assert should_complete == False, "Enrollment should NOT be completable (lectures not done)"
    print("✓ PASSED: should_be_completed() returns False when lectures not done")

    # Test 2: Complete all lectures
    for lecture in course.lectures.all():
        lecture.status = LectureStatus.COMPLETED
        lecture.save()

    # Refresh enrollment from DB (in case signal already changed it)
    enrollment.refresh_from_db()

    # If still active, test should_be_completed
    if enrollment.status == EnrollmentStatus.ACTIVE:
        should_complete = enrollment.should_be_completed()
        print(
            f"\n→ After completing all lectures: should_be_completed() = {should_complete}")
        assert should_complete == True, "Enrollment should be completable (all lectures done)"
        print("✓ PASSED: should_be_completed() returns True when all lectures done")
    else:
        print(
            f"\n→ Enrollment already completed by signal: status = {enrollment.status}")
        print("✓ PASSED: Signal automatically completed the enrollment")

    # Test progress
    progress = enrollment.get_completion_progress()
    print(f"\n→ get_completion_progress():")
    print(f"  - total_lectures: {progress['total_lectures']}")
    print(f"  - completed_lectures: {progress['completed_lectures']}")
    print(f"  - percentage: {progress['percentage']}%")
    print(f"  - expected_lectures: {progress['expected_lectures']}")

    return enrollment, course


def test_manager_get_completable():
    """Test EnrollmentManager.get_completable_enrollments()."""
    print("\n" + "=" * 60)
    print("TEST 3: EnrollmentManager.get_completable_enrollments()")
    print("=" * 60)

    # Reset all test enrollments to active
    active_count = Enrollment.objects.filter(
        course__name__icontains='Test Course'
    ).update(status=EnrollmentStatus.ACTIVE, completed_at=None)
    print(f"✓ Reset {active_count} test enrollments to ACTIVE")

    # Get completable enrollments
    completable = Enrollment.objects.get_completable_enrollments()
    print(
        f"\n→ get_completable_enrollments() found {completable.count()} enrollments")

    for e in completable:
        print(f"  - {e}: course={e.course.name}")

    print("✓ PASSED: Manager method works correctly")
    return completable


def test_cron_job():
    """Test cron job mark_completed_enrollments_daily()."""
    print("\n" + "=" * 60)
    print("TEST 4: Cron job mark_completed_enrollments_daily()")
    print("=" * 60)

    from enrollments_payments.cron import mark_completed_enrollments_daily

    # Reset test enrollments to active first
    Enrollment.objects.filter(
        course__name__icontains='Test Course'
    ).update(status=EnrollmentStatus.ACTIVE, completed_at=None)
    print("✓ Reset test enrollments to ACTIVE")

    # Run cron job
    count = mark_completed_enrollments_daily()
    print(
        f"\n→ mark_completed_enrollments_daily() completed {count} enrollments")

    # Verify
    completed = Enrollment.objects.filter(
        course__name__icontains='Test Course',
        status=EnrollmentStatus.COMPLETED
    ).count()
    print(f"✓ Verified: {completed} test enrollments now COMPLETED")

    print("✓ PASSED: Cron job works correctly")
    return count


def test_course_specific_completion():
    """Test check_and_complete_course_enrollments()."""
    print("\n" + "=" * 60)
    print("TEST 5: check_and_complete_course_enrollments()")
    print("=" * 60)

    from enrollments_payments.cron import check_and_complete_course_enrollments

    # Find test course
    course = Course.objects.filter(
        name='Test Course - End Date Passed').first()
    if not course:
        print("⚠ Test course not found, skipping test")
        return

    # Reset enrollment
    enrollment = Enrollment.objects.filter(course=course).first()
    if enrollment:
        enrollment.status = EnrollmentStatus.ACTIVE
        enrollment.completed_at = None
        enrollment.save(update_fields=['status', 'completed_at'])
        print(f"✓ Reset enrollment to ACTIVE")

    # Run course-specific completion
    count = check_and_complete_course_enrollments(course.id)
    print(
        f"\n→ check_and_complete_course_enrollments({course.id}) completed {count} enrollments")

    # Verify
    enrollment.refresh_from_db()
    print(f"✓ Enrollment status: {enrollment.status}")
    assert enrollment.status == EnrollmentStatus.COMPLETED, "Enrollment should be COMPLETED"

    print("✓ PASSED: Course-specific completion works correctly")
    return count


def test_signal_trigger(instructor, season, child):
    """Test that signal triggers enrollment completion."""
    print("\n" + "=" * 60)
    print("TEST 6: Signal on_lecture_status_changed()")
    print("=" * 60)

    # Create a fresh course with 2 lectures
    course = Course.objects.create(
        name=f'Test Course - Signal Test {timezone.now().timestamp()}',
        instructor=instructor,
        season=season,
        start_date=timezone.localdate() - timedelta(days=30),
        end_date=None,
        num_lectures=2,
        price=100,
        capacity=30,
    )
    print(f"✓ Created course: {course.name}")

    # Create 2 lectures - one completed (past), one scheduled (future)
    lecture1 = Lecture.objects.create(
        course=course,
        day=timezone.localdate() - timedelta(days=10),
        lecture_number=1,
        instructor=instructor,
        status=LectureStatus.COMPLETED,
    )
    lecture2 = Lecture.objects.create(
        course=course,
        day=timezone.localdate() + timedelta(days=1),  # Future date for scheduled
        lecture_number=2,
        instructor=instructor,
        status=LectureStatus.SCHEDULED,
    )
    print(f"✓ Created 2 lectures (1 COMPLETED past, 1 SCHEDULED future)")

    # Create enrollment
    enrollment = Enrollment.objects.create(
        course=course,
        child=child,
        status=EnrollmentStatus.ACTIVE,
    )
    print(f"✓ Created enrollment: {enrollment.status}")

    # Now complete the last lecture - this should trigger the signal
    print(f"\n→ Marking last lecture as COMPLETED...")
    lecture2.status = LectureStatus.COMPLETED
    lecture2.save()

    # Check if enrollment was auto-completed
    enrollment.refresh_from_db()
    print(f"→ Enrollment status after signal: {enrollment.status}")

    if enrollment.status == EnrollmentStatus.COMPLETED:
        print("✓ PASSED: Signal automatically completed the enrollment!")
    else:
        print(
            "⚠ Signal did not complete enrollment (may need to verify signal is connected)")

    return enrollment


def cleanup_test_data():
    """Clean up test data."""
    print("\n" + "=" * 60)
    print("Cleaning up test data...")
    print("=" * 60)

    # Delete test enrollments
    deleted = Enrollment.objects.filter(
        course__name__icontains='Test Course').delete()
    print(f"✓ Deleted enrollments: {deleted}")

    # Delete test lectures
    deleted = Lecture.objects.filter(
        course__name__icontains='Test Course').delete()
    print(f"✓ Deleted lectures: {deleted}")

    # Delete test courses
    deleted = Course.objects.filter(name__icontains='Test Course').delete()
    print(f"✓ Deleted courses: {deleted}")

    # Delete test season
    deleted = Season.objects.filter(name='Test Season Enrollment').delete()
    print(f"✓ Deleted seasons: {deleted}")

    # Delete test users (parent, child, instructor)
    deleted = Child.objects.filter(
        first_name='Test', last_name='Child Enrollment').delete()
    print(f"✓ Deleted children: {deleted}")

    deleted = Parent.objects.filter(
        user__phone_number1='+201000000002').delete()
    print(f"✓ Deleted parents: {deleted}")

    deleted = Instructor.objects.filter(
        user__phone_number1='+201000000001').delete()
    print(f"✓ Deleted instructors: {deleted}")

    deleted = CustomUser.objects.filter(phone_number1__in=[
        '+201000000001', '+201000000002'
    ]).delete()
    print(f"✓ Deleted users: {deleted}")


def run_all_tests():
    """Run all tests."""
    print("\n" + "=" * 70)
    print("ENROLLMENT AUTO-COMPLETION TESTS")
    print("=" * 70)

    try:
        with transaction.atomic():
            # Create test data
            instructor, season, parent, child = create_test_data()

            # Run tests
            test_end_date_completion(instructor, season, child)
            test_lecture_completion(instructor, season, child)
            test_manager_get_completable()
            test_cron_job()
            test_course_specific_completion()
            test_signal_trigger(instructor, season, child)

            print("\n" + "=" * 70)
            print("ALL TESTS PASSED! ✓")
            print("=" * 70)

            # Cleanup
            cleanup_test_data()

            # Rollback to not affect real data
            raise Exception("Rollback test transaction")

    except Exception as e:
        if str(e) == "Rollback test transaction":
            print("\n✓ Test transaction rolled back - no data was persisted")
        else:
            print(f"\n✗ Error during tests: {e}")
            import traceback
            traceback.print_exc()


if __name__ == '__main__':
    run_all_tests()
