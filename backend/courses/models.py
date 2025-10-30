from django.db import models

# Create your models here.

class SeasonChoices(models.TextChoices):
    """Enumeration for season_type status choices."""

    SUMMER_CAMP = 'summer_camp', 'Summer camp'
    SCHOOL = 'school', 'School'
    RAMADAN = 'ramadan', 'Ramadan'
    EID = 'eid', 'Eid'
    OTHER = 'other', 'Other'

class ExamChoices(models.TextChoices):
    """Enumeration for exam_type status choices."""

    QUIZ = 'quiz', 'Quiz'
    MIDTERM = 'midterm', 'Midterm'
    FINAL = 'final', 'Final'
    ASSIGNMENT = 'assignment', 'Assignment'
    OTHER = 'other', 'Other'

class Season(models.Model):
    """
    Season model
    """

    name = models.CharField(max_length=128)
    season_type = models.CharField(max_leagth=1, choices=SeasonChoices)
    start_date = models.DateField()
    end_date = models.DateField()
    description = models.TextField()
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Meta class for Season model."""

        indexes = [
            models.Index(fields=['start_date'], name='start_date_index'),
            models.Index(fields=['end_date'], name='end_date_index'),
        ]

# Model Tag
class Tag(models.Model):
    """
    Tags model
    """

    name = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

# Model Course
class Course(models.Model):
    """
    Course model
    """

    name = models.CharField(max_length=50)
    description = models.TextField()
    start_date = models.DateField()
    end_date = models.DateField()
    num_lectures = models.IntegerField()
    capacity = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    enrolled_count = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # relationships

    season = models.ForeignKey(Season, null=True)     # relationship with season table
    instructor = models.ForeignKey(Instructor)     # relationship with instructor table
    tags = models.ManyToManyField(Tag, related_name="course")

    class Meta:
        """Meta class for Course model."""

        indexes = [
            models.Index(fields=['instructor'], name='instructor_index'),
            models.Index(fields=['season'], name='season_index'),
            models.Index(fields=['start_date'], name='start_date_index'),
        ]

# Model courses schedule
class CourseSchedule(models.Model):
    """
    Course Schedule mode
    """
    SATURDAY = 0
    SUNDAY = 1
    MONDAY = 2
    TUESDAY = 3
    WEDNESDAY = 4
    THURSDAY = 5
    FRIDAY = 6


    WEEKDAYS = [
        (MONDAY, 'Monday'),
        (TUESDAY, 'Tuesday'),
        (WEDNESDAY, 'Wednesday'),
        (THURSDAY, 'Thursday'),
        (FRIDAY, 'Friday'),
        (SATURDAY, 'Saturday'),
        (SUNDAY, 'Sunday'),
    ]

    weekday = models.IntegerField(choices=WEEKDAYS)
    start_time = models.DateField()
    end_time = models.DateField()

    # Relationship
    # Link to courses via ForeignKey
    course = models.ForeignKey(Course)

# Model Exam
class Exam(models.Model):
    """
    Exam model
    """

    name = models.CharField(max_length=100)
    scheduled_at = models.DateField(auto_now=True)
    total_marks = models.DecimalField(max_digit=5, decimal_places=2)
    description = models.TextField(null=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    exam_type = models.CharField(max_length=1,
                                 choices=ExamChoices,
                                 default='other')

    # Relationship
    # Link to courses
    course = models.ForeignKey('courses', on_delete=models.CASCADE)
    instructor = models.ForeignKey('Instructor', on_delete=models.CASCADE)

    class Meta:
        """Meta class for Exam model."""

        indexes = [
            models.Index(fields=['course'], name='course_id_index'),
            models.Index(fields=['scheduled_at'], name='scheduled_at_index'),
        ]

# Model Exam result
class ExamResult(models.Model):
    """
    Exam result model
    """

    marks_obtained = models.DecimalField(max_digits=5, decimal_places=2)
    percentage = models.DecimalField(max_digits=5, decimal_places=2)
    notes = models.TextField(null=True)
    entered_at = models.DateField()
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Relationship
    user = models.ForeignKey('users')
    exam = models.ForeignKey('exams')
    child = models.ForeignKey('children')
    student = models.ForeignKey('student')

    class Meta:
        """Meta class for Exam result model."""

        indexes = [
            models.Index(fields=['exam'], name='exam_id_index'),
            models.Index(fields=['child'], name='child_id_index'),
            models.Index(fields=['student'], name='student_id_index'),
            models.Index(fields=['exam', 'child'], name='exam_child_index'),
            models.Index(fields=['exam', 'student'], name='exam_student_index'),
        ]
