#!/usr/bin/env python3
from django.db import models
from django.forms import ValidationError
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

from users.models.user import CustomUser
from core.utils.image_utils import ImageOptimizationMixin, validate_image_size
from cloudinary.models import CloudinaryField

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
        CustomUser, on_delete=models.CASCADE, related_name='parent_profile', verbose_name=_("المستخدم"))
    image = models.ImageField(
        upload_to=parent_upload_path,
        validators=[validate_image_size],
        null=True,
        blank=True
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
        Parent, on_delete=models.PROTECT, related_name='primary_children', verbose_name=_("الولي الأساسي"))
    first_name = models.CharField(
        max_length=128, verbose_name=_("الاسم الأول والثاني"))
    last_name = models.CharField(
        max_length=128, verbose_name=_("الاسم الثالث والرابع"))

    phone = models.CharField(
        _("رقم الهاتف"), max_length=13, null=True, blank=True)
    dob = models.DateField(_("تاريخ الميلاد"))
    unique_code = models.CharField(
        max_length=6, unique=True, editable=False, verbose_name=_("كود الطفل"))
    card_image = CloudinaryField(
        null=True, blank=True, verbose_name=_("صورة البطاقة"))
    image = models.ImageField(
        upload_to=child_upload_path,
        validators=[validate_image_size],
        null=True, blank=True, verbose_name=_("الصورة الشخصية")
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

    def generate_card_image(self):
        """Generate the full card image for the child."""
        from PIL import Image, ImageDraw, ImageFont
        import qrcode
        import io
        import requests
        from arabic_reshaper import reshape
        from bidi.algorithm import get_display

        # Card size: 600x300
        width, height = 600, 300
        card = Image.new('RGB', (width, height), 'white')
        draw = ImageDraw.Draw(card)

        # Try to load font, else default
        try:
            font = ImageFont.truetype("arial.ttf", 20)
            small_font = ImageFont.truetype("arial.ttf", 14)
        except:
            font = ImageFont.load_default()
            small_font = ImageFont.load_default()

        # Left side: QR code
        qr_size = 150
        data = {
            "code": self.unique_code,
            "name": f"{self.first_name} {self.last_name}",
            "dob": self.dob.isoformat() if self.dob else None
        }
        import json
        qr_data = json.dumps(data, ensure_ascii=False)

        qr = qrcode.QRCode(version=1, box_size=5, border=2)
        qr.add_data(qr_data)
        qr.make(fit=True)
        qr_img = qr.make_image(fill='black', back_color='white')
        qr_img = qr_img.resize((qr_size, qr_size))
        card.paste(qr_img, (20, height - qr_size - 20))

        # Photo next to QR
        photo_x = 20 + qr_size + 10  # 180
        photo_size = 150
        if self.image:
            try:
                # Download photo
                response = requests.get(self.image.url)
                photo = Image.open(io.BytesIO(response.content))
                photo = photo.resize((photo_size, photo_size))
                card.paste(photo, (photo_x, 20))
            except:
                # Placeholder
                placeholder_text = get_display(reshape("صورة"))
                draw.rectangle([photo_x, 20, photo_x + photo_size, 20 + photo_size], fill='gray')
                draw.text((photo_x + photo_size//2 - 30, 20 + photo_size//2 - 10), placeholder_text, fill='white', font=font)

        # Text to the right of photo, aligned to the right edge
        margin_right = 20
        name_text = get_display(reshape(f"الاسم: {self.first_name} {self.last_name}"))
        dob_text = get_display(reshape(f"تاريخ الميلاد: {self.dob.strftime('%d/%m/%Y') if self.dob else 'غير محدد'}"))
        code_text = get_display(reshape(f"الكود: {self.unique_code}"))
        
        # Calculate positions for right alignment
        name_bbox = draw.textbbox((0, 0), name_text, font=font)
        name_width = name_bbox[2] - name_bbox[0]
        name_x = width - margin_right - name_width
        
        dob_bbox = draw.textbbox((0, 0), dob_text, font=font)
        dob_width = dob_bbox[2] - dob_bbox[0]
        dob_x = width - margin_right - dob_width
        
        code_bbox = draw.textbbox((0, 0), code_text, font=font)
        code_width = code_bbox[2] - code_bbox[0]
        code_x = width - margin_right - code_width
        
        draw.text((name_x, 20), name_text, fill='black', font=font)
        draw.text((dob_x, 50), dob_text, fill='black', font=font)
        draw.text((code_x, 80), code_text, fill='black', font=font)

        # Save to buffer
        buffer = io.BytesIO()
        card.save(buffer, format="PNG")
        buffer.seek(0)

        # Upload to Cloudinary
        from cloudinary import uploader
        result = uploader.upload(buffer, folder="child_cards")
        self.card_image = result['public_id']

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
        # Generate card after save to ensure image is uploaded
        if not self.card_image or self._state.adding:
            self.generate_card_image()
            self.save(update_fields=['card_image'])

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
