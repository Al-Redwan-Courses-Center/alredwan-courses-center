import uuid
from django.db.models import Count, Sum, Prefetch, Q
from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import OnlineCourse, VideoWatchProgress
from ..serializers import OnlineCourseListSerializer, OnlineCourseDetailSerializer
from .progress import VideoProgressUpdateView
from ..participants import resolve_participant

class OnlineCourseViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        qs = OnlineCourse.objects.filter(is_active=True, is_published=True).select_related('instructor', 'instructor__user').prefetch_related('tags')
        
        request = self.request
        if request and request.user.is_authenticated:
            student, child = resolve_participant(request.user, request.query_params.get('child'))
            if student or child:
                watch_progress_qs = VideoWatchProgress.objects.filter(student=student, child=child)
                qs = qs.prefetch_related(
                    Prefetch('video_lectures__watch_records', queryset=watch_progress_qs, to_attr='prefetched_watch_progress')
                )

        qs = qs.prefetch_related('video_lectures', 'video_lectures__materials')
        qs = qs.annotate(
            annotated_video_count=Count('video_lectures', distinct=True),
            annotated_total_duration=Sum('video_lectures__duration_seconds'),
            annotated_enrolled_count=Count('online_enrollments', filter=Q(online_enrollments__status='active'), distinct=True)
        )
        return qs

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return OnlineCourseDetailSerializer
        return OnlineCourseListSerializer

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
