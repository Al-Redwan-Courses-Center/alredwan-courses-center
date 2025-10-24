#!/usr/bin/env python3
from django.db import models
from .user import CustomUser
import uuid
'''
Module for Parent model inheriting from CustomUser
'''
# Create your models here.


class Parent(CustomUser):
    '''
    Parent model inheriting from CustomUser
    '''

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        CustomUser, on_delete=models.CASCADE, related_name='parent_profile')

    class Meta:
        verbose_name = "Parent"
        verbose_name_plural = "Parents"
