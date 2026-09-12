from datetime import date, timedelta
from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from users.models import CustomUser, Instructor
from parents.models import Parent, Child
from courses.models import Course, Season, Lecture
from courses.models.lecture import LectureStatus
<<<<<<< ours
from courses_online.models import OnlineCourse
