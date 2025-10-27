from django.db import models
from .user import _
# Create your models here.
'''
Module for Instructor model that represents an instructor user profile
'''


class Instructor(models.Model):
    '''
    Instructor model that represents an instructor user
    '''
    type_choices = [
        ('supervisor', 'Supervisor'),
        ('external', 'External'),
    ]
    user = models.OneToOneField(
        'users.CustomUser', on_delete=models.CASCADE, related_name='instructor_profile')
    bio = models.TextField(null=True, blank=True)
    monthly_salary = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.URLField(max_length=512, null=True, blank=True)

    nid_number = models.CharField(_("National ID number"), max_length=15)
    avg_students_rating = models.DecimalField(
        max_digits=3, decimal_places=2, null=True, blank=True)
    avg_admins_rating = models.DecimalField(
        max_digits=3, decimal_places=2, null=True, blank=True)

    type = models.CharField(
        max_length=20,
        choices=type_choices,
        default='external',
    )

    def __str__(self):
        """String representation of the Instructor."""
        return f"{self.user.first_name} {self.user.last_name}"


# add ratings here, and figure out the rating system
