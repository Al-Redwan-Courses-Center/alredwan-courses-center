from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import transaction
from ..models import VideoLecture, VideoWatchProgress
from ..participants import resolve_participant, active_online_enrollments
from ..locking import is_lecture_locked
from ..serializers import VideoWatchProgressSerializer

COMPLETION_THRESHOLD = 90.0


def _seconds(value, fallback):
    """Read a non-negative seconds value from the payload."""
    if value is None:
        return fallback
    try:
        return max(0, int(float(value)))
    except (ValueError, TypeError):
        return fallback


class VideoProgressUpdateView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, lecture_id):
        # Same visibility rule as OnlineCourseViewSet: unpublished or inactive
        # courses do not exist as far as the API is concerned.
        lecture = get_object_or_404(
            VideoLecture.objects.select_related('course'),
            id=lecture_id, course_id=pk,
            course__is_active=True, course__is_published=True,
        )

        student, child = resolve_participant(
            request.user, request.data.get('child'))
        if student is None and child is None:
            return Response(
                {"detail": "لم يتم تحديد الطالب أو الطفل صاحب المشاهدة."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Verify an active, unexpired enrollment
        if not active_online_enrollments(
            lecture.course, student=student, child=child
        ).exists():
            return Response(
                {"detail": "يجب أن تكون مسجلاً ونشطاً في هذه الدورة للوصول إلى محتواها."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Lectures unlock in order: no progress may be recorded on a lecture
        # while an earlier one is still incomplete.
        if is_lecture_locked(lecture, student, child):
            return Response(
                {"detail": "أكمل المحاضرة السابقة أولاً لفتح هذه المحاضرة."},
                status=status.HTTP_403_FORBIDDEN
            )

        with transaction.atomic():
            # get_or_create already retries the lookup if a concurrent
            # request wins the race and trips the unique constraint.
            VideoWatchProgress.objects.get_or_create(
                lecture=lecture, student=student, child=child)
            # Lock the row so concurrent progress pings serialise on the
            # high-water mark instead of overwriting each other.
            progress = VideoWatchProgress.objects.select_for_update().get(
                lecture=lecture, student=student, child=child)

            incoming_watched = _seconds(
                request.data.get('watched_seconds'), progress.watched_seconds)
            incoming_total = _seconds(
                request.data.get('total_seconds'), progress.total_seconds)
            incoming_last_pos = _seconds(
                request.data.get('last_position_seconds'), progress.last_position_seconds)

            progress.total_seconds = incoming_total
            progress.last_position_seconds = incoming_last_pos

            # Detect replay / restart when video was completed and user restarts from beginning
            if progress.is_completed and incoming_last_pos < 15 and incoming_watched < 15:
                progress.is_completed = False
                progress.watched_seconds = incoming_watched
            else:
                progress.watched_seconds = max(progress.watched_seconds, incoming_watched)

            if progress.total_seconds > 0:
                progress.completion_percentage = min(
                    100.0, progress.watched_seconds / progress.total_seconds * 100)
            elif progress.watched_seconds > 0:
                # Material-only lectures carry no duration to measure against.
                progress.completion_percentage = 100.0

            if progress.completion_percentage >= COMPLETION_THRESHOLD and not progress.is_completed:
                progress.is_completed = True
                # watch_count tracks finished viewings, not progress pings.
                progress.watch_count += 1

            progress.save()

        return Response(VideoWatchProgressSerializer(progress).data,
                        status=status.HTTP_200_OK)
