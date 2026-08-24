from rest_framework import serializers
from ..models import OnlineCourse, VideoLecture, OnlineLectureMaterial, VideoWatchProgress
from ..participants import resolve_participant

class OnlineLectureMaterialSerializer(serializers.ModelSerializer):
    file = serializers.SerializerMethodField()

    class Meta:
        model = OnlineLectureMaterial
        fields = ['id', 'title', 'file', 'external_url', 'file_type', 'order']

    def get_file(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

class VideoWatchProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoWatchProgress
        fields = ['id', 'watched_seconds', 'total_seconds', 'completion_percentage', 'is_completed', 'last_position_seconds', 'watch_count', 'last_watched_at']

class VideoLectureSerializer(serializers.ModelSerializer):
    materials = OnlineLectureMaterialSerializer(many=True, read_only=True)
    watch_progress = serializers.SerializerMethodField()

    class Meta:
        model = VideoLecture
        fields = ['id', 'order', 'title', 'description', 'video_url', 'video_platform', 'duration_seconds', 'is_live_stream', 'live_stream_time', 'materials', 'watch_progress']

    def get_watch_progress(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None

        if hasattr(obj, 'prefetched_watch_progress'):
            progress = obj.prefetched_watch_progress[0] if obj.prefetched_watch_progress else None
            return VideoWatchProgressSerializer(progress).data if progress else None

        student, child = resolve_participant(
            request.user, request.query_params.get('child'))
        if student is None and child is None:
            return None

        progress = VideoWatchProgress.objects.filter(
            lecture=obj, student=student, child=child).first()
        return VideoWatchProgressSerializer(progress).data if progress else None

class OnlineCourseListSerializer(serializers.ModelSerializer):
    instructor = serializers.SerializerMethodField()
    thumbnail = serializers.SerializerMethodField()
    video_count = serializers.SerializerMethodField()
    total_duration_seconds = serializers.SerializerMethodField()

    class Meta:
        model = OnlineCourse
        fields = ['id', 'name', 'description', 'thumbnail', 'instructor', 'price', 'allow_replay', 'access_validity_days', 'enrolled_count', 'video_count', 'total_duration_seconds', 'created_at', 'updated_at']

    def get_instructor(self, obj):
        if not obj.instructor:
            return None
        return {
            'id': obj.instructor.id,
            'name': obj.instructor.user.get_full_name(),
            'image_url': obj.instructor.image.url if obj.instructor.image else None,
        }

    def get_thumbnail(self, obj):
        if obj.image:
            return obj.image.url
        return None

    def get_video_count(self, obj):
        return getattr(obj, 'annotated_video_count', len(obj.video_lectures.all()))

    def get_total_duration_seconds(self, obj):
        if hasattr(obj, 'annotated_total_duration'):
            return getattr(obj, 'annotated_total_duration') or 0
        return sum((lecture.duration_seconds or 0) for lecture in obj.video_lectures.all())

class OnlineCourseDetailSerializer(OnlineCourseListSerializer):
    video_lectures = VideoLectureSerializer(many=True, read_only=True)

    class Meta(OnlineCourseListSerializer.Meta):
        fields = OnlineCourseListSerializer.Meta.fields + ['video_lectures']
