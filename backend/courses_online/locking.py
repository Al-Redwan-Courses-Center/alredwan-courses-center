"""Sequential unlocking of online-course lectures.

Learners work through a course in order: a lecture stays locked while any
earlier lecture (by ``order``) has not been completed by the same participant.
Locked lectures keep their title and duration visible so the learner can see
what is coming, but their video, materials and description are withheld.

Privileged viewers (staff, admins, supervisors and the course instructor) are
never locked out; anonymous or non-enrolled viewers are already paywalled, so
locking does not apply to them either.
"""


def _lecture_sort_key(lecture):
    return (lecture.order, lecture.created_at, str(lecture.id))


def get_locked_lecture_ids(lectures, completed_lecture_ids):
    """Return the ids of lectures that come after the first incomplete one.

    ``lectures`` is any iterable of ``VideoLecture`` rows for a single course
    and ``completed_lecture_ids`` the set of lecture ids the participant has
    finished. The first incomplete lecture stays open; everything after it is
    locked.
    """
    locked = set()
    blocked = False
    for lecture in sorted(lectures, key=_lecture_sort_key):
        if blocked:
            locked.add(lecture.id)
        elif lecture.id not in completed_lecture_ids:
            blocked = True
    return locked


def completed_lecture_ids_for(course, student, child):
    """Ids of ``course`` lectures the participant has completed."""
    from .models import VideoWatchProgress

    if student is None and child is None:
        return set()
    return set(
        VideoWatchProgress.objects.filter(
            lecture__course=course, student=student, child=child, is_completed=True,
        ).values_list('lecture_id', flat=True)
    )


def locked_lecture_ids_for(course, student, child):
    """Locked lecture ids of ``course`` for one participant (two queries)."""
    if student is None and child is None:
        return set()
    completed = completed_lecture_ids_for(course, student, child)
    return get_locked_lecture_ids(course.video_lectures.all(), completed)


def is_lecture_locked(lecture, student, child):
    """Whether ``lecture`` is still locked for the participant."""
    return lecture.id in locked_lecture_ids_for(lecture.course, student, child)
