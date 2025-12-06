#!/usr/bin/env python3
"""
Custom User model and manager using phone number as primary login field.
Supports global phone numbers via `phonenumbers`.
"""
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
import phonenumbers
import uuid


class CustomUserManager(BaseUserManager):
    """
    Custom manager for CustomUser, using phone_number1 as the unique identifier.
    """

    def normalize_phone(self, phone_number):
        """
        Validate and normalize a phone number to E.164 international format.
        """
        try:
            parsed = phonenumbers.parse(phone_number, None)
            if not phonenumbers.is_valid_number(parsed):
                raise ValidationError(_("Invalid phone number"))
            return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
        except phonenumbers.NumberParseException:
            raise ValidationError(_("Invalid phone number format"))

    def create_user(self, phone_number1, password=None, **extra_fields):
        """
        Create and save a regular user with the given phone number and password.
        """
        if not phone_number1:
            raise ValueError(_("The phone number must be set"))
        phone_number1 = self.normalize_phone(phone_number1)

        user = self.model(phone_number1=phone_number1, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone_number1, password=None, **extra_fields):
        """
        Create and save a superuser with the given phone number and password.
        """
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("role", "admin")

        if not extra_fields.get("is_staff"):
            raise ValueError(_("Superuser must have is_staff=True."))
        if not extra_fields.get("is_superuser"):
            raise ValueError(_("Superuser must have is_superuser=True."))

        return self.create_user(phone_number1, password, **extra_fields)


class CustomUser(AbstractUser):
    """
    Base custom user model with global phone number authentication.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    phone_number1 = models.CharField(
        _("WhatsApp phone number"), max_length=15, unique=True
    )
    phone_number2 = models.CharField(
        _("Alternative phone number"), max_length=15, null=True, blank=True
    )

    email = models.EmailField(unique=True, null=True, blank=True)
    first_name = models.CharField(max_length=128)  # 1st and 2nd names
    last_name = models.CharField(max_length=128)  # 3rd and 4th names

    date_joined = models.DateTimeField(default=timezone.now)
    dob = models.DateField(_("date of birth"))

    # Phone and admin verification status
    is_verified = models.BooleanField(default=False)
    identity_number = models.CharField(
        _("Government ID / Passport"), max_length=30)
    identity_type = models.CharField(
        max_length=20,
        choices=[("nid", "National ID"), ("passport",
                                          "Passport"), ("other", "Other")],
        default="nid"
    )
    gender = models.CharField(
        max_length=10,
        choices=[("male", "Male"), ("female", "Female")],
    )

    address = models.TextField(null=True, blank=True)
    location = models.URLField(max_length=512, null=True, blank=True)
    role = models.CharField(
        max_length=20,
        choices=[
            ("student", "Student"),
            ("instructor", "Instructor"),
            ("parent", "Parent"),
            ("admin", "Admin"),
        ],
        default="student",
    )

    # Authentication settings
    username = None
    USERNAME_FIELD = "phone_number1"
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    def __str__(self):
        return self.get_full_name() or self.phone_number1

    def clean(self):
        """Custom validation for phone numbers."""
        if self.phone_number1 == self.phone_number2:
            raise ValidationError(
                _("Primary and alternative phone numbers must be different.")
            )

    class Meta:
        indexes = [
            models.Index(fields=["phone_number1"]),
        ]
        verbose_name = _("User")
        verbose_name_plural = _("Users")
