#!usr/bin/env python3
'''signals for Users app'''
from django.dispatch import receiver
from django.db.models.signals import post_save, post_delete
from django.db import transaction


from .models import CustomUser
from .models.instructor import Instructor
from .models import StudentUser
from parents.models import Parent


@receiver(post_save, sender=CustomUser)
def create_user_profile(sender, instance, created, **kwargs):
    """Create associated profile when a CustomUser is created."""
    if created:
        if instance.role == "student":
            new_student = StudentUser.objects.create(user=instance)
            new_student.save()
        elif instance.role == "parent":
            new_parent = Parent.objects.create(user=instance)
            new_parent.save()
