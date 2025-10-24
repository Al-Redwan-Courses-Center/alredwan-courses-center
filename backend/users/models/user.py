#!/usr/bin/env python3
'''
Module for CustomUser and all the User models that inherit from the Base CustomUser class
'''
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _
from datetime import timezone
import phonenumbers
import uuid
# Create your models here.


class CustomUserManager(BaseUserManager):
    """
    Custom manager for CustomUser, using phone as the unique identifier.
    """

    def normalize_phone(self, phone_number1):
        """
        Validates and normalizes the phone number to E.164 international format.
        Raises ValidationError if invalid.
        """
        try:
            parsed = phonenumbers.parse(phone_number1, None)
            if not phonenumbers.is_valid_number(parsed):
                raise ValidationError(_("Invalid phone number"))
            return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
        except phonenumbers.NumberParseException:
            raise ValidationError(_("Invalid phone number format"))

    def create_user(self, phone_number1, password=None, **extra_fields):
        """
        Create and save a regular user with the given phone and password.
        """
        if not phone_number1:
            raise ValueError(_("The phone number must be set"))
        phone_number1 = self.normalize_phone(phone_number1)

        user = self.model(phone=phone_number1, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, password=None, **extra_fields):
        """
        Create and save a superuser with the given phone and password.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_("Superuser must have is_staff=True."))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_("Superuser must have is_superuser=True."))

        return self.create_user(phone, password, **extra_fields)


class CustomUser(AbstractUser):
    """the base class that all the users inherit from"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # primary identifier and should have a Whatsapp account
    phone_number1 = models.CharField(
        _("Whatsapp phone number"), max_length=12, unique=True)

    phone_number2 = models.CharField(_("alternative phone number"),
                                     max_length=12, unique=False, null=True, blank=True)

    email = models.EmailField(unique=True, null=True, blank=True)

    first_name = models.CharField(max_length=128)  # first and second name
    last_name = models.CharField(max_length=128)  # third and fourth name
    USERNAME_FIELD = "phone_number1"
    username = None
    REQUIRED_FIELDS = []

    date_joined = models.DateTimeField(
        _("date joined"), default=timezone.now, auto_now_add=True)

    dob = models.DateField(_("date of birth"))

    nid_number = models.CharField(
        _("National id number"), max_length=15, null=True, blank=True)

    gender = models.CharField(
        max_length=10,
        choices=[("male", "Male"), ("female", "Female")],
    )

    address = models.TextField(null=True, blank=True)

    location = models.URLField(max_length=512, null=True, blank=True)

    objects = CustomUserManager()

    def __str__(self):
        return f"{self.get_full_name()}"

    class Meta:
        indexes = [
            models.Index(fields=['phone_number1']),
        ]
