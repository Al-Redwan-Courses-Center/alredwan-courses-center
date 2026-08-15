from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from ..models import VideoLecture, VideoWatchProgress
from ..serializers import VideoWatchProgressSerializer

class VideoProgressUpdateView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, lecture_id):
        lecture = get_object_or_404(VideoLecture, id=lecture_id, course_id=pk)
        
        user = request.user
        if not hasattr(user, 'student_profile'):
            return Response({"detail": "User is not a student."}, status=status.HTTP_403_FORBIDDEN)
            
        student = user.student_profile
        
        progress, created = VideoWatchProgress.objects.get_or_create(
            lecture=lecture,
            student=student,
            defaults={
                'watched_seconds': request.data.get('watched_seconds', 0),
                'total_seconds': request.data.get('total_seconds', 0),
                'last_position_seconds': request.data.get('last_position_seconds', 0),
            }
        )
        
        if not created:
            progress.watched_seconds = request.data.get('watched_seconds', progress.watched_seconds)
            progress.total_seconds = request.data.get('total_seconds', progress.total_seconds)
            progress.last_position_seconds = request.data.get('last_position_seconds', progress.last_position_seconds)
            progress.watch_count += 1
            progress.save()

        # Update is_completed if watched >= 90% of total
        try:
            watched = float(progress.watched_seconds)
            total = float(progress.total_seconds)
            if total > 0:
                progress.completion_percentage = (watched / total) * 100
                if progress.completion_percentage >= 90:
                    progress.is_completed = True
            elif total == 0 and watched > 0:
                # For photo/pdf lectures where duration is 0 but watched > 0
                progress.completion_percentage = 100
                progress.is_completed = True
        except (ValueError, TypeError):
            pass

        progress.save()
        
        serializer = VideoWatchProgressSerializer(progress)
        return Response(serializer.data, status=status.HTTP_200_OK)
