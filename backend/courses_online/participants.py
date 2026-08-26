import uuid

from django.db.models import Q


def resolve_participant(user, child_id=None):
    """Resolve who an online-course request is acting for.

    Students act for themselves. Parents act for one of their children and
    must say which one, so ``child_id`` is required for them.

    Returns a ``(student, child)`` tuple with at most one side set, matching
    how Enrollment and VideoWatchProgress store their participant. Returns
    ``(None, None)`` when the user has no participant we can act for.
    """
    from parents.models import Child

    student = getattr(user, 'student_profile', None)
    if student is not None:
        return student, None

    parent = getattr(user, 'parent_profile', None)
    if parent is None or not child_id:
        return None, None

    try:
        child_uuid = uuid.UUID(str(child_id))
    except (ValueError, AttributeError, TypeError):
        return None, None

    extra_child_ids = parent.extra_children.values_list('child_id', flat=True)
    child = Child.objects.filter(
        Q(primary_parent=parent) | Q(id__in=extra_child_ids),
        id=child_uuid,
    ).first()

    return (None, child) if child else (None, None)


def user_has_online_course_access(user, course, child_id=None):
    """Check if the user has permission to view video URLs and materials for an online course."""
    if not user or not user.is_authenticated or not course:
        return False

    if user.is_staff or user.is_superuser or getattr(user, 'role', None) in ('admin', 'supervisor'):
        return True

    # Check if user is the assigned instructor of the course
    instructor = getattr(user, 'instructor_profile', None) or getattr(user, 'instructor', None)
    if instructor and course.instructor_id == instructor.id:
        return True
    if course.instructor and getattr(course.instructor, 'user_id', None) == user.id:
        return True

    from parents.models import Child

    # Check student enrollment
    student = getattr(user, 'student_profile', None)
    if student:
        return course.online_enrollments.filter(student=student, status='active').exists()

    # Check parent enrollment
    parent = getattr(user, 'parent_profile', None)
    if parent:
        extra_child_ids = parent.extra_children.values_list('child_id', flat=True)
        children_qs = Child.objects.filter(
            Q(primary_parent=parent) | Q(id__in=extra_child_ids)
        )
        if child_id:
            try:
                child_uuid = uuid.UUID(str(child_id))
                children_qs = children_qs.filter(id=child_uuid)
            except (ValueError, AttributeError, TypeError):
                return False
        return course.online_enrollments.filter(child__in=children_qs, status='active').exists()

    return False

