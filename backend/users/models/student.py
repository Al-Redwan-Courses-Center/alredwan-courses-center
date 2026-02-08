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

    def generate_card_image_buffer(self):
        """Generate a beautiful Islamic-themed card image for Quran students."""
        from PIL import Image, ImageDraw, ImageFont
        import qrcode
        import io
        import requests
        from arabic_reshaper import reshape
        from bidi.algorithm import get_display

        # Card size: 800x500 (slightly larger for better design)
        width, height = 800, 500
        
        # Create card with gradient background
        card = Image.new('RGB', (width, height), 'white')
        draw = ImageDraw.Draw(card)
        
        # Create Islamic green gradient background
        for i in range(height):
            # Gradient from dark green to light cream
            r = int(240 - (240 - 20) * (i / height))
            g = int(245 - (245 - 100) * (i / height))
            b = int(230 - (230 - 60) * (i / height))
            draw.rectangle([(0, i), (width, i+1)], fill=(r, g, b))
        
        # Add decorative border with Islamic pattern
        border_color = (184, 134, 11)  # Dark goldenrod
        border_width = 8
        # Outer border
        draw.rectangle([(10, 10), (width-10, height-10)], outline=border_color, width=border_width)
        # Inner border
        draw.rectangle([(20, 20), (width-20, height-20)], outline=(218, 165, 32), width=3)
        
        # Add decorative corners (Islamic geometric pattern)
        corner_size = 40
        for corner in [(30, 30), (width-70, 30), (30, height-70), (width-70, height-70)]:
            draw.ellipse([corner[0], corner[1], corner[0]+corner_size, corner[1]+corner_size], 
                        fill=(218, 165, 32), outline=border_color, width=2)
        
        # Load fonts
        try:
            title_font = ImageFont.truetype("arial.ttf", 32)
            font = ImageFont.truetype("arial.ttf", 22)
            small_font = ImageFont.truetype("arial.ttf", 16)
        except:
            title_font = ImageFont.load_default()
            font = ImageFont.load_default()
            small_font = ImageFont.load_default()
        
        # Header section with title
        header_text = get_display(reshape("بطاقة الطالب"))
        header_bbox = draw.textbbox((0, 0), header_text, font=title_font)
        header_width = header_bbox[2] - header_bbox[0]
        header_x = (width - header_width) // 2
        
        # Draw header background
        draw.rectangle([(60, 50), (width-60, 100)], fill=(20, 100, 60, 200))
        draw.text((header_x, 60), header_text, fill='white', font=title_font)
        
        # Student photo section (circular with border)
        photo_x = 80
        photo_y = 140
        photo_size = 180
        
        # Create circular mask for photo
        mask = Image.new('L', (photo_size, photo_size), 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.ellipse((0, 0, photo_size, photo_size), fill=255)
        
        if self.image:
            try:
                response = requests.get(self.image.url)
                photo = Image.open(io.BytesIO(response.content))
                # Resize and crop to square
                photo = photo.resize((photo_size, photo_size), Image.Resampling.LANCZOS)
                # Create circular photo
                output = Image.new('RGB', (photo_size, photo_size), (240, 245, 230))
                output.paste(photo, (0, 0))
                # Apply circular mask
                circular_photo = Image.new('RGB', (photo_size, photo_size), (240, 245, 230))
                circular_photo.paste(output, mask=mask)
                card.paste(circular_photo, (photo_x, photo_y))
            except:
                # Placeholder with Islamic symbol
                draw.ellipse([photo_x, photo_y, photo_x + photo_size, photo_y + photo_size], 
                            fill=(200, 200, 200), outline=border_color, width=5)
                placeholder_text = get_display(reshape("صورة الطالب"))
                placeholder_bbox = draw.textbbox((0, 0), placeholder_text, font=font)
                placeholder_width = placeholder_bbox[2] - placeholder_bbox[0]
                draw.text((photo_x + (photo_size - placeholder_width)//2, photo_y + photo_size//2 - 10), 
                        placeholder_text, fill='white', font=font)
        
        # Draw golden circle border around photo
        draw.ellipse([photo_x-5, photo_y-5, photo_x + photo_size+5, photo_y + photo_size+5], 
                    outline=border_color, width=6)
        
        # Student information section (right-aligned for Arabic)
        info_x = photo_x + photo_size + 60
        info_y = 140
        margin_right = 60
        line_spacing = 45
        
        # Prepare text with Islamic decorative elements
        name_text = get_display(reshape(f"الاسم: {self.user.first_name} {self.user.last_name}"))
        dob_text = get_display(reshape(f"تاريخ الميلاد: {self.user.dob.strftime('%d/%m/%Y') if self.user.dob else 'غير محدد'}"))
        code_text = get_display(reshape(f"رقم الطالب: {self.unique_code}"))
        
        # Draw info with background boxes
        info_items = [
            (name_text, info_y),
            (dob_text, info_y + line_spacing),
            (code_text, info_y + line_spacing * 2)
        ]
        
        for text, y_pos in info_items:
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_x = width - margin_right - text_width
            
            # Background box for each info line
            draw.rectangle([text_x - 20, y_pos - 5, width - margin_right + 10, y_pos + 35], 
                        fill=(255, 255, 255, 180), outline=(218, 165, 32), width=2)
            draw.text((text_x - 10, y_pos), text, fill=(20, 60, 40), font=font)
        
        # QR Code section (bottom right with decorative frame)
        qr_size = 140
        qr_x = width - qr_size - 80
        qr_y = height - qr_size - 60
        
        # Prepare QR data
        import json
        data = {
            "code": self.unique_code,
            "name": f"{self.user.first_name} {self.user.last_name}",
            "dob": self.user.dob.isoformat() if self.user.dob else None,
            "type": "student"
        }
        qr_data = json.dumps(data, ensure_ascii=False)
        
        # Generate QR code
        qr = qrcode.QRCode(version=1, box_size=6, border=2)
        qr.add_data(qr_data)
        qr.make(fit=True)
        qr_img = qr.make_image(fill=(20, 100, 60), back_color='white')
        qr_img = qr_img.resize((qr_size, qr_size))
        
        # Draw decorative frame around QR
        frame_padding = 15
        draw.rectangle([qr_x - frame_padding, qr_y - frame_padding, 
                    qr_x + qr_size + frame_padding, qr_y + qr_size + frame_padding],
                    fill='white', outline=border_color, width=4)
        
        card.paste(qr_img, (qr_x, qr_y))
        
        # QR label
        qr_label = get_display(reshape("كود التحقق"))
        qr_label_bbox = draw.textbbox((0, 0), qr_label, font=small_font)
        qr_label_width = qr_label_bbox[2] - qr_label_bbox[0]
        draw.text((qr_x + (qr_size - qr_label_width)//2, qr_y + qr_size + 20), 
                qr_label, fill=border_color, font=small_font)
        
        # Footer with Islamic decoration
        footer_text = get_display(reshape("﴿ وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا ﴾"))
        footer_bbox = draw.textbbox((0, 0), footer_text, font=small_font)
        footer_width = footer_bbox[2] - footer_bbox[0]
        footer_x = (width - footer_width) // 2
        draw.text((footer_x, height - 35), footer_text, fill=(20, 60, 40), font=small_font)
        
        # Save to buffer
        buffer = io.BytesIO()
        card.save(buffer, format="PNG")
        buffer.seek(0)
        return buffer

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
