#!/usr/bin/env python3
from django.db import models
from .user import CustomUser
'''
Module for Parent model that represents a parent user
'''


class Parent(models.Model):
    '''
    Parent model that represents a parent user
    '''

    user = models.OneToOneField(
        CustomUser, on_delete=models.CASCADE, related_name='parent_profile')
    image = models.URLField(max_length=512, null=True, blank=True)

    class Meta:
        """Meta options for the Parent model."""
        verbose_name = "Parent"
        verbose_name_plural = "Parents"
