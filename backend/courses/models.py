from django.db import models

# Create your models here.


class Seasons(models.Model):
    """
    Seasons model
    """

    seasons_choices = [
        ("su", "summer_camp"),
        ("sch", "school"),
        ("ramd", "ramadan"),
        ("eid", "eid"),
        ("oth", "other"),
    ]
    name = models.CharField(max_length=50)
    season_type = models.CharField(max_leagth=1, choices=seasons_choices)
    start_date = models.DateField()
    end_date = models.DateField()
    description = models.TextField()
    is_active = models.BooleanField(default=True)
    create_at = models.DateTimeField(auto_now_add=True)
    update_at = models.DateTimeField(auto_now=True)

# Model Tag
class Tags(models.Model):
    """
    Tags model
    """

    name = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

# Model Courses
class Courses(models.Model):
    """
    Courses model
    """

    name = models.CharField(max_length=50)
    description = models.TextField()
    start_date = models.dateField()
    end_date = models.dateField()
    num_lectures = models.IntegerField()
    capacity = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    enrolled_count = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # relationships

    # relationship with season table
    season_id = models.ForeignKey(Seasons, null=True)
    # relationship with instructor table
    instructor_id = models.ForeignKey(Instructor)

# Model courses schedule
class CourseSchedule(models.Model):
    """
    Course Schedule mode
    """
    MONDAY = 0
    TUESDAY = 1
    WEDNESDAY = 2
    THURSDAY = 3
    FRIDAY = 4
    SATURDAY = 5
    SUNDAY = 6

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
    courses_id = models.ForeignKey(Courses)

class CourseTag(models.Model):
    """
    Course tage model for handling ManyToMany relationship between Tag and Courses models.
    """

    course = models.ForeignKey(Courses, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tags, on_delete=models.CASCADE)

    class Meta:
        """ Unique key"""

        unique_key = ('course', 'tag')


class InstructorTag(models.Model):
    """
    Instructor tage model for handling ManyToMany relationship between Tag and Instructor models.
    """

    instructor = models.ForeignKey(Instructor, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tags, on_delete=models.CASCADE)

    class Meta:
        """ Unique key"""

        unique_key = ('instructor', 'tag')

# Model Exam
class Exams(models.Model):
    """
    Exam model
    """
    exam_choices = [
        ('qz', 'quiz'),
        ('mt', 'midterm'),
        ('f', 'final'),
        ('assi', 'assignment'),
        ('oth', 'other')
    ]

    name = models.CharField(max_length=100)
    scheduled_at = models.DateField()
    total_marks = models.DecimalField(max_digit=5, decimal_places=2)
    description = models.TextField(null=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    exam_type = models.CharField(max_length=1,
                                 choices=exam_choices,
                                 default='oth')

    # Relationship
    # Link to courses
    course_id = models.ForeignKey('courses', on_delete=models.CASCADE)
    created_by = models.ForeignKey('Instructor', on_delete=models.CASCADE)

# Model Exam results
class ExamResults(models.Model):
    """
    Exam results model
    """

    marks_obtained = models.DecimalField(max_digits=5, decimal_places=2)
    percentage = models.DecimalField(max_digits=5, decimal_places=2)
    notes = models.TextField(null=True)
    entered_at = models.DateField()
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Relationship
    entered_by = models.ForeignKey('users')
    exam_id = models.ForeignKey('exams')
    child_id = models.ForeignKey('children')
    student_id = models.ForeignKey('student')
