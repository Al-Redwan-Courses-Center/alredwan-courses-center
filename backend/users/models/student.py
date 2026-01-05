#!/usr/bin/env python3
'''
Module for Student model that represents a student user
'''
from django.db import models
from core.utils.image_utils import validate_image_size, ImageOptimizationMixin
from django.utils.translation import gettext_lazy as _
from .user import CustomUser
import random
import string


def student_upload_path(instance, filename):
    return f"students/{instance.id}/{filename}"


class StudentUser(ImageOptimizationMixin, models.Model):
    '''
    Student model that represents a student user
    '''
    user = models.OneToOneField(
        CustomUser, on_delete=models.CASCADE, related_name='student_profile',  verbose_name=_("User"))
    unique_code = models.CharField(max_length=6, unique=True, editable=False,  verbose_name=_("Unique code"))

    image = models.ImageField(
        upload_to=student_upload_path,
        validators=[validate_image_size],
        verbose_name=_("Image")
    )

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
        verbose_name = _("طالب")
        verbose_name_plural = _("الطلاب")
        indexes = [
            models.Index(fields=['unique_code']),
        ]
