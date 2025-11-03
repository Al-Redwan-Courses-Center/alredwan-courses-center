from django.db import models
from django.core.exceptions import ValidationError

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

class Weekday(models.IntegerChoices):
    SATURDAY = 0, _("Saturday")
    SUNDAY = 1, _("Sunday")
    MONDAY = 2, _("Monday")
    TUESDAY = 3, _("Tuesday")
    WEDNESDAY = 4, _("Wednesday")
    THURSDAY = 5, _("Thursday")
    FRIDAY = 6, _("Friday")

class Season(models.Model):
    """
    Season model
    """

    name = models.CharField(max_length=128)
    season_type = models.CharField(max_leagth=1, choices=SeasonChoices.choices)
    start_date = models.DateField()
    end_date = models.DateField(null=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Meta class for Season model."""

        indexes = [
            models.Index(fields=['start_date'], name='season_start_date_index'),
            models.Index(fields=['end_date'], name='season_end_date_index'),
        ]

    def clean(self):
        # Ensure that end_date after start_date
        if self.end_date > self.start_date:
            raise ValidationError("End date must be after start date.")

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
    end_date = models.DateField(null=True)
    num_lectures = models.IntegerField(null=True)
    capacity = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    enrolled_count = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # relationships

    season = models.ForeignKey(Season, on_delete=models.CASCADE, null=True, related_name="link_course_season")     # relationship with season table
    instructor = models.ForeignKey(Instructor, on_delete=models.CASCADE, related_name="link_course_instructor")     # relationship with instructor table
    tags = models.ManyToManyField(Tag, on_delete=models.CASCADE, related_name="ManyToMany_course_tags")

    class Meta:
        """Meta class for Course model."""

        indexes = [
            models.Index(fields=['instructor'], name='instructor_index'),
            models.Index(fields=['season'], name='season_index'),
            models.Index(fields=['start_date'], name='course_start_date_index'),
        ]

    def clean(self):
        # Ensure that end_date after start_date
        if self.end_date > self.start_date:
            raise ValidationError("End date must be after start date.")

# Model courses schedule
class CourseSchedule(models.Model):
    """
    Course Schedule mode
    """

    weekday = models.PositiveSmallIntegerField(choices=Weekday.choices)
    start_time = models.DateField()
    end_time = models.DateField()

    # Relationship
    # Link to courses via ForeignKey
    course = models.ForeignKey(Course)

    def clean(self):
        # Ensure that end_date after start_date
        if self.end_date > self.start_date:
            raise ValidationError("End date must be after start date.")

# Model Exam
class Exam(models.Model):
    """
    Exam model
    """

    name = models.CharField(max_length=100)
    scheduled_at = models.DateTimeField(auto_now=True)
    total_marks = models.DecimalField(max_digit=5, decimal_places=2)
    description = models.TextField(blank=True, null=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    exam_type = models.CharField(max_length=1,
                                 choices=ExamChoices.choices,
                                 default='other')

    # Relationship
    # Link to courses
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="link_exam_course")
    instructor = models.ForeignKey(Instructor, on_delete=models.CASCADE, related_name="link_exam_instructor")

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

    marks_obtained = models.DecimalField(max_digits=5, decimal_places=2, null=True)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True)
    passed = models.BooleanField()
    notes = models.TextField(null=True)
    entered_at = models.DateField()
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Relationship
    user = models.ForeignKey(Users, on_delete=models.CASCADE, related_name="link_examResults_users")
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name="link_examResults_exam")
    child = models.ForeignKey(Children, on_delete=models.CASCADE, related_name="link_examResults_child")
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="link_examResults_student")

    class Meta:
        """Meta class for Exam result model."""

        # Constraints
        constraints = [
            models.UniqueConstraint(fields=['exam', 'child'], name='unique_exam_child'),
            models.UniqueConstraint(fields=['exam', 'student'], name='unique_exam_student')
        ]
        # Indexes
        indexes = [
            models.Index(fields=['exam'], name='exam_id_index'),
            models.Index(fields=['child'], name='child_id_index'),
            models.Index(fields=['student'], name='student_id_index'),
            models.Index(fields=['exam', 'child'], name='exam_child_index'),
        ]

        def clean(self):
            if not self.student and not self.child:
                raise ValidationError("Either student or child must be provided.")
