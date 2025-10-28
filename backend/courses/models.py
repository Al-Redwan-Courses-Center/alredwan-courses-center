from django.db import models

# Create your models here.

# Model Seasons
class Tags(models.Model):
    seasons_choices = [
        ("su", "summer_camp"),
        ("sch", "school")
    ]
    name = models.CharField(max_length=255)
    season_type = models.CharField(max_leagth=1, choices=seasons_choices)
    start_date = models.DateField()
    end_date = models.DateField()
    description = models.TextField()
    is_active = models.IntegerField()
    create_at = models.DateTimeField(auto_now_add=True)
    update_at = models.DateTimeField(auto_now=True)

# Model Tag
class Tags(models.Model):
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

# Model Courses
class Courses(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    start_date = models.dateField()
    end_date = models.dateField()
    num_lectures = models.IntegerField()
    capacity = models.IntegerField()
    price = models.IntegerField()
    enrolled_count = models.IntegerField()
    is_active = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # relationships

    # relationship with season table
    # season_id =
    # relationship with instructor table
    # instructor_id =

# Model courses schedule
class CourseSchedule(models.Model):
    start_time = models.DateField()
    end_time = models.DateField()

    # Relationship
    # Link to courses via ForeignKey

# Model Exam
class Exams(models.Model):
    name = models.CharField(max_length=255)
    scheduled_at = models.DateField()
    total_marks = models.IntegerField()
    description = models.TextField()
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # exam_type = models.CharField(max_length=1, choices=<>)

    # Relationship
    # Link to courses

# Model Exam results
class ExamResults(models.Model):
    marks_obtained = models.CharField(max_length=255)
    percentage = models.IntegerField()
    notes = models.TextField()
    entered_at = models.DateField()
    # Relationship
    # entered_by =