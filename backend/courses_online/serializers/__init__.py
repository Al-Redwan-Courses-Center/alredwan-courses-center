from rest_framework import serializers
from ..models import OnlineCourse, VideoLecture, OnlineLectureMaterial, VideoWatchProgress

class OnlineLectureMaterialSerializer(serializers.ModelSerializer):
    file = serializers.SerializerMethodField()

    class Meta:
        model = OnlineLectureMaterial
        fields = ['id', 'title', 'file', 'external_url', 'file_type', 'order']

    def get_file(self, obj):
        if obj.file:
            name = str(obj.file.name)
            if name.startswith('raw/upload/') or name.startswith('image/upload/'):
                from django.conf import settings
                cloud_name = settings.CLOUDINARY_STORAGE.get('CLOUD_NAME')
                if cloud_name:
                    return f"https://res.cloudinary.com/{cloud_name}/{name}"
            
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
        if request and request.user.is_authenticated:
            user = request.user
            progress = None
            if hasattr(user, 'student_profile'):
                progress = VideoWatchProgress.objects.filter(lecture=obj, student=user.student_profile).first()
            if progress:
                return VideoWatchProgressSerializer(progress).data
        return None

class OnlineCourseListSerializer(serializers.ModelSerializer):
    instructor = serializers.SerializerMethodField()
    thumbnail = serializers.SerializerMethodField()
    video_count = serializers.SerializerMethodField()
    total_duration_seconds = serializers.SerializerMethodField()

    class Meta:
        model = OnlineCourse
        fields = ['id', 'name', 'description', 'thumbnail', 'instructor', 'price', 'allow_replay', 'access_validity_days', 'is_published', 'is_active', 'enrolled_count', 'video_count', 'total_duration_seconds', 'created_at', 'updated_at']

    def get_instructor(self, obj):
        if obj.instructor:
            return {'id': obj.instructor.id, 'name': obj.instructor.user.get_full_name()}
        return None

    def get_thumbnail(self, obj):
        if obj.image:
            return obj.image.url
        return None

    def get_video_count(self, obj):
        return obj.video_lectures.count()

    def get_total_duration_seconds(self, obj):
        from django.db.models import Sum
        total = obj.video_lectures.aggregate(Sum('duration_seconds'))['duration_seconds__sum']
        return total or 0

class OnlineCourseDetailSerializer(OnlineCourseListSerializer):
    video_lectures = VideoLectureSerializer(many=True, read_only=True)

    class Meta(OnlineCourseListSerializer.Meta):
        fields = OnlineCourseListSerializer.Meta.fields + ['video_lectures']
