#!/usr/bin/env python3
'''
Module for Student model that represents a student user
'''
from django.db import models
from core.utils.image_utils import validate_image_size, ImageOptimizationMixin
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from .user import CustomUser
import random
import string
from cloudinary.models import CloudinaryField
from cloudinary import uploader


def student_upload_path(instance, filename):
    return f"students/{instance.id}/{filename}"


class StudentUser(ImageOptimizationMixin, models.Model):
    '''
    Student model that represents a student user
    '''
    user = models.OneToOneField(
        CustomUser, on_delete=models.CASCADE, related_name='student_profile', verbose_name=_("المستخدم"))
    unique_code = models.CharField(
        max_length=6, unique=True, editable=False, verbose_name=_("كود الطالب"))
    card_image = CloudinaryField(
        null=True, blank=True, verbose_name=_("صورة البطاقة"))

    image = models.ImageField(
        upload_to=student_upload_path,
        validators=[validate_image_size],
        null=True,
        blank=True,
        verbose_name=_("الصورة الشخصية")
    )

    def generate_unique_code(self):
        """Generate a unique code for the student."""
        gender_char = self.user.gender[0].upper() if self.user.gender else "U"
        digits = ''.join(random.choices(string.digits, k=5))
        return f"{gender_char}{digits}"

    def generate_card_image(self):
        """Generate the full card image for the student."""
        from PIL import Image, ImageDraw, ImageFont
        import qrcode
        import io
        import requests

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

        # Left side: photo and text
        photo_size = 150
        if self.image:
            try:
                # Download photo
                response = requests.get(self.image.url)
                photo = Image.open(io.BytesIO(response.content))
                photo = photo.resize((photo_size, photo_size))
                card.paste(photo, (20, 20))
            except:
                # Placeholder
                draw.rectangle([20, 20, 20+photo_size, 20+photo_size], fill='gray')
                draw.text((20 + photo_size//2 - 30, 20 + photo_size//2 - 10), "Photo", fill='white', font=font)

        # Text next to photo
        text_x = 20 + photo_size + 20
        draw.text((text_x, 20), f"Name: {self.user.first_name} {self.user.last_name}", fill='black', font=font)
        draw.text((text_x, 50), f"DOB: {self.user.dob.strftime('%d/%m/%Y') if self.user.dob else 'N/A'}", fill='black', font=font)
        draw.text((text_x, 80), f"Code: {self.unique_code}", fill='black', font=font)

        # Right side: QR code
        qr_size = 150
        data = {
            "code": self.unique_code,
            "name": f"{self.user.first_name} {self.user.last_name}",
            "dob": self.user.dob.isoformat() if self.user.dob else None
        }
        import json
        qr_data = json.dumps(data, ensure_ascii=False)

        qr = qrcode.QRCode(version=1, box_size=5, border=2)
        qr.add_data(qr_data)
        qr.make(fit=True)
        qr_img = qr.make_image(fill='black', back_color='white')
        qr_img = qr_img.resize((qr_size, qr_size))
        card.paste(qr_img, (width - qr_size - 20, height - qr_size - 20))

        # Save to buffer
        buffer = io.BytesIO()
        card.save(buffer, format="PNG")
        buffer.seek(0)

        # Upload to Cloudinary
        result = uploader.upload(buffer, folder="student_cards")
        self.card_image = result['public_id']

    def save(self, *args, **kwargs):
        """Override save method to set unique_code if not already set."""
        if not self.unique_code:
            code = self.generate_unique_code()
            while StudentUser.objects.filter(unique_code=code).exists():
                code = self.generate_unique_code()
            self.unique_code = code
        super().save(*args, **kwargs)
        # Generate card after save to ensure image is uploaded
        if not self.card_image or self._state.adding:
            self.generate_card_image()
            self.save(update_fields=['card_image'])

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
