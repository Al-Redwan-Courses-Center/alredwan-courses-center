from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import transaction
from ..models import VideoLecture, VideoWatchProgress
from ..participants import resolve_participant
from ..serializers import VideoWatchProgressSerializer
from enrollments_payments.models import Enrollment

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
        lecture = get_object_or_404(VideoLecture, id=lecture_id, course_id=pk)

        student, child = resolve_participant(
            request.user, request.data.get('child'))
        if student is None and child is None:
            return Response(
                {"detail": "لم يتم تحديد الطالب أو الطفل صاحب المشاهدة."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Verify active enrollment
        if not Enrollment.objects.filter(
            online_course_id=pk, status='active', student=student, child=child
        ).exists():
            return Response(
                {"detail": "يجب أن تكون مسجلاً ونشطاً في هذه الدورة للوصول إلى محتواها."},
                status=status.HTTP_403_FORBIDDEN
            )

        with transaction.atomic():
            # get_or_create already retries the lookup if a concurrent
            # request wins the race and trips the unique constraint.
            progress, _ = VideoWatchProgress.objects.get_or_create(
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
