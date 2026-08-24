from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from ..models import OnlineCourse
from ..serializers import OnlineCourseListSerializer, OnlineCourseDetailSerializer
from .progress import VideoProgressUpdateView

class OnlineCourseViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    queryset = OnlineCourse.objects.filter(is_active=True, is_published=True)

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return OnlineCourseDetailSerializer
        return OnlineCourseListSerializer
