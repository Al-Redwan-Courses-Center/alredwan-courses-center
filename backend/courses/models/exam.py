#!/usr/bin/env python3
''' Models for Course Exams'''
from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.utils import timezone


class ExamChoices(models.TextChoices):
    """Enumeration for exam_type status choices."""
    QUIZ = 'quiz', _('امتحان صغير')
    MIDTERM = 'midterm', _('امتحان نصفي')
    FINAL = 'final', _('امتحان نهائي')
    ASSIGNMENT = 'assignment', _('واجب')
    OTHER = 'other', _('أخرى')


class Exam(models.Model):
    """
    Exam model
    """

    name = models.CharField(max_length=100)
    scheduled_at = models.DateTimeField()
    total_marks = models.DecimalField(max_digits=5, decimal_places=2)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    exam_type = models.CharField(
        max_length=16, choices=ExamChoices.choices, default=ExamChoices.OTHER
    )

    course = models.ForeignKey(
        'courses.Course', on_delete=models.CASCADE, related_name="exams")
    instructor = models.ForeignKey('users.Instructor', on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name="exams")

    class Meta:
        indexes = [
            models.Index(fields=['course'], name='exam_course_idx'),
            models.Index(fields=['scheduled_at'],
                         name='exam_scheduled_at_idx'),
        ]
        ordering = ['-scheduled_at']
        verbose_name = _("امتحان")
        verbose_name_plural = _("الامتحانات")

    def clean(self):
        '''Validate the exam before saving'''
        # if the course has a bounded date window, keep exam inside it
        if self.course:
            if self.course.start_date and self.scheduled_at.date() < self.course.start_date:
                raise ValidationError(
                    _("Exam cannot be scheduled before the course start date."))
            if self.course.end_date and self.scheduled_at.date() > self.course.end_date:
                raise ValidationError(
                    _("Exam cannot be scheduled after the course end date."))

    def __str__(self):
        return f"{self.name} ({self.get_exam_type_display()})"


class ExamResult(models.Model):
    """
    Exam result model
    """

    marks_obtained = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True)
    percentage = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True)
    passed = models.BooleanField(default=True)
    notes = models.TextField(null=True, blank=True)
    entered_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # If we keep both child and student, enforce XOR (exactly one is set).
    exam = models.ForeignKey(
        'courses.Exam', on_delete=models.CASCADE, related_name="results")
    student = models.ForeignKey('users.StudentUser', on_delete=models.CASCADE, null=True, blank=True,
                                related_name="exam_results")
    child = models.ForeignKey('parents.Child', on_delete=models.CASCADE, null=True, blank=True,
                              related_name="exam_results")
    entered_by = models.ForeignKey('users.CustomUser', on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name='entered_exam_results')

    class Meta:
        constraints = [
            # Allow at most one result per exam per student
            models.UniqueConstraint(
                fields=['exam', 'student'], name='unique_exam_student'),
            # And at most one per exam per child
            models.UniqueConstraint(
                fields=['exam', 'child'], name='unique_exam_child'),
        ]
        indexes = [
            models.Index(fields=['exam'], name='exam_result_exam_idx'),
            models.Index(fields=['student'], name='exam_result_student_idx'),
            models.Index(fields=['child'], name='exam_result_child_idx'),
        ]
        ordering = ['-entered_at']
        verbose_name = _("نتيجة امتحان")
        verbose_name_plural = _("نتائج الامتحانات")

    def clean(self):
        '''Validate the exam result before saving'''
        has_student = bool(self.student)
        has_child = bool(self.child)
        if has_student == has_child:
            raise ValidationError(
                _("Provide exactly one of 'student' or 'child'."))

        if self.marks_obtained is not None and self.exam and self.exam.total_marks:
            try:
                pct = (self.marks_obtained / self.exam.total_marks) * 100
                if pct < 0 or pct > 100:
                    raise ValidationError(
                        _("Computed percentage is out of range 0–100."))
            except Exception as e:
                raise ValidationError(
                    _("Invalid marks or exam total: %(err)s"), params={'err': str(e)})

    def save(self, *args, **kwargs):
        '''Override save to compute percentage and pass/fail status'''
        if self.marks_obtained is not None and self.exam and self.exam.total_marks:
            self.percentage = (self.marks_obtained /
                               self.exam.total_marks) * 100
            # maybe move pass rule to a setting or per-exam threshold if needed
            self.passed = self.percentage >= 50
        super().save(*args, **kwargs)

    def __str__(self):
        target = self.student or self.child
        return f"Result for {target} on {self.exam}"
