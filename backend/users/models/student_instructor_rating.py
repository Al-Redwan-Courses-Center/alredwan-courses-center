from django.db import models
from django.db.models import Q
from django.core.validators import MinValueValidator, MaxValueValidator


class StudentInstructorRating(models.Model):
    """Model representing ratings given by students to instructors."""

    student = models.ForeignKey('users.StudentUser', on_delete=models.CASCADE,
                                related_name='instructor_ratings')
    instructor = models.ForeignKey('users.Instructor', on_delete=models.CASCADE,
                                   related_name='student_ratings', verbose_name="المعلم")
    course = models.ForeignKey('courses.Course', verbose_name="الدورة", on_delete=models.CASCADE,
                               related_name='student_instructor_ratings')
    rating = models.PositiveSmallIntegerField(
        verbose_name="التقييم",
        validators=[MinValueValidator(1), MaxValueValidator(10)],
    )
    feedback = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(
        auto_now_add=True, verbose_name=("تاريخ الإنشاء"))
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
                                   related_name='parent_ratings', verbose_name="المعلم")
    course = models.ForeignKey('courses.Course', verbose_name="الدورة", on_delete=models.CASCADE,
                               related_name='parent_instructor_ratings')
    rating = models.PositiveSmallIntegerField(
        verbose_name="التقييم",
        validators=[MinValueValidator(1), MaxValueValidator(10)],
    )
    feedback = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(
        auto_now_add=True, verbose_name=("تاريخ الإنشاء"))
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


class StudentCourseRating(models.Model):
    """Model representing ratings given by students to courses."""

    student = models.ForeignKey('users.StudentUser', on_delete=models.CASCADE,
                                related_name='course_ratings')
    course = models.ForeignKey('courses.Course', verbose_name="الدورة", on_delete=models.CASCADE,
                               related_name='student_ratings')
    rating = models.PositiveSmallIntegerField(
        verbose_name="التقييم",
        validators=[MinValueValidator(1), MaxValueValidator(10)],
    )
    feedback = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(
        auto_now_add=True, verbose_name=("تاريخ الإنشاء"))
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Meta class for StudentCourseRating model."""
        constraints = [
            # Ensure rating is between 1.00 and 10.00
            models.CheckConstraint(
                check=Q(rating__gte=1.00, rating__lte=10.00),
                name='student_course_rating_range'
            ),
            models.UniqueConstraint(
                fields=['student', 'course'],
                name='unique_student_course_rating'
            )
        ]
        indexes = [
            models.Index(fields=['student'],
                         name='course_rating_student_index'),
            models.Index(fields=['course'], name='student_course_rating_index')
        ]

        verbose_name = 'تقييم طالب لكورس'
        verbose_name_plural = 'تقييمات الطلاب للكورسات'


class ParentCourseRating(models.Model):
    """Model representing ratings given by parents to courses."""

    parent = models.ForeignKey('parents.Parent', on_delete=models.CASCADE,
                               related_name='course_ratings')
    course = models.ForeignKey('courses.Course', verbose_name="الدورة", on_delete=models.CASCADE,
                               related_name='parent_ratings')
    rating = models.PositiveSmallIntegerField(
        verbose_name="التقييم",
        validators=[MinValueValidator(1), MaxValueValidator(10)],
    )
    feedback = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(
        auto_now_add=True, verbose_name=("تاريخ الإنشاء"))
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Meta class for ParentCourseRating model."""
        constraints = [
            # Ensure rating is between 1.00 and 10.00
            models.CheckConstraint(
                check=Q(rating__gte=1.00, rating__lte=10.00),
                name='parent_course_rating_range'
            ),
            models.UniqueConstraint(
                fields=['parent', 'course'],
                name='unique_parent_course_rating'
            )
        ]
        indexes = [
            models.Index(fields=['parent'], name='course_rating_parent_index'),
            models.Index(fields=['course'], name='parent_course_rating_index')
        ]

        verbose_name = 'تقييم ولي أمر لكورس'
        verbose_name_plural = 'تقييمات أولياء الأمور للكورسات'
