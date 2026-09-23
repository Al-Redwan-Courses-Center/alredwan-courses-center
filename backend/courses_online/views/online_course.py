import uuid
from django.db.models import Count, Sum, Prefetch, Q, Subquery, OuterRef, IntegerField
from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import OnlineCourse, VideoWatchProgress, VideoLecture
from ..serializers import OnlineCourseListSerializer, OnlineCourseDetailSerializer
from ..participants import resolve_participant, user_has_online_course_access


class OnlineCourseViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]

    def _child_param(self):
        return self.request.query_params.get('child')

    def _participant(self):
        """Resolve (student, child) once per request; used by queryset and serializers."""
        if not hasattr(self, '_resolved_participant'):
            request = self.request
            if request and request.user.is_authenticated:
                self._resolved_participant = resolve_participant(request.user, self._child_param())
            else:
                self._resolved_participant = (None, None)
        return self._resolved_participant

    def get_queryset(self):
        qs = OnlineCourse.objects.filter(is_active=True, is_published=True).select_related('instructor', 'instructor__user').prefetch_related('tags')

        student, child = self._participant()
        if student or child:
            watch_progress_qs = VideoWatchProgress.objects.filter(student=student, child=child)
            qs = qs.prefetch_related(
                Prefetch('video_lectures__watch_records', queryset=watch_progress_qs, to_attr='prefetched_watch_progress')
            )

        duration_sq = VideoLecture.objects.filter(
            course=OuterRef('pk')
        ).values('course').annotate(s=Sum('duration_seconds')).values('s')

        qs = qs.prefetch_related('video_lectures', 'video_lectures__materials')
        qs = qs.annotate(
            annotated_video_count=Count('video_lectures', distinct=True),
            annotated_enrolled_count=Count('online_enrollments', filter=Q(online_enrollments__status='active'), distinct=True),
            annotated_total_duration=Subquery(duration_sq, output_field=IntegerField())
        )
        return qs

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return OnlineCourseDetailSerializer
        return OnlineCourseListSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['participant'] = self._participant()
        return context

    def retrieve(self, request, *args, **kwargs):
        course = self.get_object()
        # Paywall access is a per-course decision; compute it once here rather
        # than once per lecture inside VideoLectureSerializer.
        context = self.get_serializer_context()
        context['has_access'] = user_has_online_course_access(
            request.user, course, self._child_param())
        serializer = self.get_serializer(course, context=context)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def batch(self, request):
        ids = request.query_params.get('ids', '')
        if not ids:
            return Response([])
        id_list = []
        for raw_id in ids.split(','):
            raw_id = raw_id.strip()
            if not raw_id:
                continue
            try:
                id_list.append(uuid.UUID(raw_id))
            except (ValueError, AttributeError, TypeError):
                continue
        if not id_list:
            return Response([])
        qs = self.get_queryset().filter(id__in=id_list)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)
