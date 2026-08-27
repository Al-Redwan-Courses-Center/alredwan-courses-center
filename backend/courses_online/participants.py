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
