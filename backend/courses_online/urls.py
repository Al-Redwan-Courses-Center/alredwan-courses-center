from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OnlineCourseViewSet
from .views.ratings import OnlineCourseRatingsView, OnlineCourseRateView
from .views import VideoProgressUpdateView

router = DefaultRouter()
router.register(r'courses', OnlineCourseViewSet, basename='online-course')

urlpatterns = [
    path('courses/<uuid:pk>/ratings/', OnlineCourseRatingsView.as_view(), name='online-course-ratings'),
    path('courses/<uuid:pk>/rate/', OnlineCourseRateView.as_view(), name='online-course-rate'),
    path('courses/<uuid:pk>/lectures/<uuid:lecture_id>/progress/', VideoProgressUpdateView.as_view(), name='video-progress-update'),
    path('', include(router.urls)),
]
