from django.db import models
from django.db.models import Q
from django.core.validators import MinValueValidator, MaxValueValidator


class StudentInstructorRating(models.Model):
    """Model representing ratings given by students to instructors."""

    student = models.ForeignKey('users.StudentUser', on_delete=models.CASCADE,
                                related_name='instructor_ratings')
    instructor = models.ForeignKey('users.Instructor', on_delete=models.CASCADE,
                                   related_name='student_ratings')
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE,
                               related_name='student_instructor_ratings')
    rating = models.DecimalField(max_digits=4, decimal_places=2,
                                 validators=[
                                     MinValueValidator(1.00),
                                     MaxValueValidator(10.00)
                                 ])  # 1.00 to 10.00
    feedback = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Meta class for StudentInstructorRating model."""
        constraints = [
            # Ensure rating is between 1.00 and 10.00
            models.CheckConstraint(
                check=Q(rating__gte=1.00, rating__lte=10.00),
                name='student_instructor_rating_range'
            ),
            models.UniqueConstraint(
                fields=['student', 'instructor'],
                name='unique_student_instructor_rating'
            )
        ]
        indexes = [
            models.Index(fields=['student'], name='rating_student_index')
        ]

        verbose_name = 'تقييم طالب لمدرس'
        verbose_name_plural = 'تقييمات الطلاب للمدرسين'


class ParentInstructorRating(models.Model):
    """Model representing ratings given by parents to instructors."""

    parent = models.ForeignKey('parents.Parent', on_delete=models.CASCADE,
                               related_name='instructor_ratings')
    instructor = models.ForeignKey('users.Instructor', on_delete=models.CASCADE,
                                   related_name='parent_ratings')
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE,
                               related_name='parent_instructor_ratings')
    rating = models.DecimalField(max_digits=4, decimal_places=2,
                                 validators=[
                                     MinValueValidator(1.00),
                                     MaxValueValidator(10.00)
                                 ])  # 1.00 to 10.00
    feedback = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Meta class for ParentInstructorRating model."""
        constraints = [
            # Ensure rating is between 1.00 and 10.00
            models.CheckConstraint(
                check=Q(rating__gte=1.00, rating__lte=10.00),
                name='parent_instructor_rating_range'
            ),
            models.UniqueConstraint(
                fields=['parent', 'instructor'],
                name='unique_parent_instructor_rating'
            )
        ]
        indexes = [
            models.Index(fields=['parent'], name='rating_parent_index')
        ]

        verbose_name = 'تقييم ولي أمر لمدرس'
        verbose_name_plural = 'تقييمات أولياء الأمور للمدرسين'
