#!/usr/bin/env python3
'''
Module for Student model that represents a student user
'''
from django.db import models
from django.core.validators import MinLengthValidator
from .user import CustomUser
import random
import string


class StudentUser(models.Model):
    '''
    Student model that represents a student user
    '''
    user = models.OneToOneField(
        CustomUser, on_delete=models.CASCADE, related_name='student_profile')
    unique_code = models.CharField(max_length=6, unique=True, editable=False)

    image = models.URLField(max_length=512, null=True, blank=True)

    def generate_unique_code(self):
        """Generate a unique code for the student."""
        gender_char = self.user.gender[0].upper() if self.user.gender else "U"
        digits = ''.join(random.choices(string.digits, k=5))
        return f"{gender_char}{digits}"

    def save(self, *args, **kwargs):
        """Override save method to set unique_code if not already set."""
        if not self.unique_code:
            code = self.generate_unique_code()
            while StudentUser.objects.filter(unique_code=code).exists():
                code = self.generate_unique_code()
            self.unique_code = code
        super().save(*args, **kwargs)

    def __str__(self):
        """String representation of the StudentUser."""
        return f"{self.user.first_name} ({self.unique_code})"

    class Meta:
        """Meta options for the StudentUser model."""
        verbose_name = "Student"
        verbose_name_plural = "Students"
        indexes = [
            models.Index(fields=['unique_code']),
        ]
