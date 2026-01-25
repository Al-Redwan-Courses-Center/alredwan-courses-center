#!/usr/bin/env python3
from django.db import models
from django.forms import ValidationError
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

from users.models.user import CustomUser
from core.utils.image_utils import ImageOptimizationMixin, validate_image_size

from phonenumbers import parse, is_valid_number, format_number, PhoneNumberFormat
import random
import string
import uuid
'''
Module for Parent model that represents a parent user
'''


def parent_upload_path(instance, filename):
    return f"parents/{instance.id}/{filename}"


def child_upload_path(instance, filename):
    return f"children/{instance.id}/{filename}"


class Parent(ImageOptimizationMixin, models.Model):
    '''
    Parent model that represents a parent user
    '''

    user = models.OneToOneField(
        CustomUser, on_delete=models.CASCADE, related_name='parent_profile')
    image = models.ImageField(
        upload_to=parent_upload_path,
        validators=[validate_image_size],
        null=True,
    )

    class Meta:
        """Meta options for the Parent model."""
        verbose_name = _("ولي أمر")
        verbose_name_plural = _("أولياء الأمور")

    def __str__(self):
        return self.user.get_full_name()

class Child(ImageOptimizationMixin, models.Model):
    '''
    Child model that represents a child user associated with a parent
    '''
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    primary_parent = models.ForeignKey(
        Parent, on_delete=models.PROTECT, related_name='primary_children')
    first_name = models.CharField(max_length=128)
    last_name = models.CharField(max_length=128)

    phone = models.CharField(
        _("phone number"), max_length=13, null=True, blank=True)
    dob = models.DateField(_("date of birth"))
    unique_code = models.CharField(max_length=6, unique=True, editable=False)
    image = models.ImageField(
        upload_to=child_upload_path,
        validators=[validate_image_size],
        null=True, blank=True
    )

    gender = models.CharField(
        max_length=10,
        choices=[("boy", "ولد"), ("girl", "بنت")],
       verbose_name=_("الجنس")
    )
    """nid_number = models.CharField(
        _("National ID number"), max_length=15, unique=True) """
    created_at = models.DateTimeField(
        auto_now_add=True, verbose_name=("تاريخ الإنشاء"))
    updated_at = models.DateTimeField(auto_now=True)

    def generate_unique_code(self):
        """Generate a unique code for the child."""
        gender_char = self.gender[0].upper() if self.gender else "U"
        digits = ''.join(random.choices(string.digits, k=5))
        return f"{gender_char}{digits}"

    def get_age_on_date(self, date=timezone.now().date()):
        """Calculate age of the user on a given date."""
        if not self.dob:
            return None
        born = self.dob
        age = date.year - born.year - \
            ((date.month, date.day) < (born.month, born.day))
        return age

    def save(self, *args, **kwargs):
        """Override save method to set unique_code if not already set."""
        self.clean()
        if not self.unique_code:
            code = self.generate_unique_code()
            while Child.objects.filter(unique_code=code).exists():
                code = self.generate_unique_code()
            self.unique_code = code
        super().save(*args, **kwargs)

    def __str__(self):
        """String representation of the Child."""
        return f"{self.first_name} {self.last_name} ({self.unique_code})"

    def clean(self):
        if self.extra_parents.count() >= 2:
            raise ValidationError(
                _("A child cannot have more than two parents."))
        if self.phone:
            try:
                parsed = parse(self.phone, None)
                if not is_valid_number(parsed):
                    raise ValidationError(_("Invalid phone number"))
                self.phone = format_number(parsed, PhoneNumberFormat.E164)
            except Exception:
                raise ValidationError(_("Invalid phone number format"))
        if self.unique_code:
            raise ValidationError(
                _("Unique code is auto-generated and cannot be set manually."))

    class Meta:
        """Meta options for the Child model."""
        verbose_name = _("طفل")
        verbose_name_plural = _("الأطفال")

        indexes = [
            models.Index(fields=['unique_code']),
        ]


class ChildParents(models.Model):
    '''
    Intermediate model to associate children with multiple parents
    '''

    child = models.ForeignKey(
        Child, on_delete=models.CASCADE, related_name='extra_parents')
    parent = models.ForeignKey(
        Parent, on_delete=models.CASCADE, related_name='extra_children')

    def clean(self):
        if ChildParents.objects.filter(child=self.child).count() >= 2:
            raise ValidationError(
                _("A child cannot have more than two parents."))

        if self.child.primary_parent == self.parent:
            raise ValidationError(
                _("The primary parent cannot be added as a secondary parent."))

    class Meta:
        """Meta options for the ChildParents model."""
        verbose_name = _("رابط طفل بولي أمر")
        verbose_name_plural = _("روابط الأطفال بأولياء الأمور")
        unique_together = ('child', 'parent')

    def save(self, *args, **kwargs):
        self.full_clean()  # triggers .clean() validations
        super().save(*args, **kwargs)

    '''
    This naming makes relationships explicit:

    child.primary_parent → main parent

    child.extra_parents.all() → other parents

    parent.primary_children.all() → main children

    parent.extra_children.all() → other children
        
    '''


class ParentLinkRequest(models.Model):
    """
    Represents a request by a parent to link themselves to an existing child.
    """
    child = models.ForeignKey(
        'Child', on_delete=models.CASCADE, related_name='link_requests')
    requester = models.ForeignKey(
        'Parent', on_delete=models.CASCADE, related_name='sent_link_requests')
    primary_parent = models.ForeignKey(
        'Parent', on_delete=models.CASCADE, related_name='received_link_requests')

    status_choices = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    status = models.CharField(
        max_length=10, choices=status_choices, default='pending')

    created_at = models.DateTimeField(
        auto_now_add=True, verbose_name=("تاريخ الإنشاء"))
    updated_at = models.DateTimeField(auto_now=True)

    def approve(self):
        """Approve the request and create the ChildParents link."""
        if ChildParents.objects.filter(child=self.child).count() >= 2:
            raise ValidationError(_("This child already has two parents."))
        ChildParents.objects.get_or_create(
            child=self.child, parent=self.requester)
        self.status = 'approved'
        self.save()

    def reject(self):
        """Reject the request."""
        self.status = 'rejected'
        self.save()

    def __str__(self):
        return f"Link request from {self.requester} to {self.child} ({self.status})"

    class Meta:
        unique_together = ('child', 'requester', 'primary_parent')
        verbose_name = _("طلب ربط ولي أمر بطفل")
        verbose_name_plural = _("طلبات ربط أولياء أمور ثانويين بأطفال")
    '''
    🧠 Workflow Example

        Step 1: The new parent inputs child’s nid or the unique_code in a frontend form.

        Step 2: Backend looks up that child.

        Step 3: Create a ParentLinkRequest with status='pending'.

        Step 4: Notify child.primary_parent (email, WhatsApp, or in-app).

        Step 5: The primary parent can approve/reject via an endpoint (e.g. /api/parents/requests/{id}/approve/).

        Step 6: If approved → auto-create ChildParents record.
            
    '''
