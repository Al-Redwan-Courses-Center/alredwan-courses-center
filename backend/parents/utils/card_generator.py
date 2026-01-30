#!/usr/bin/env python3
"""
Child ID Card Generator Utility

Generates ID card images for children with their data and QR codes.
Can export single cards or bulk PDF documents.
"""
import io
import os
from typing import List, Optional
from django.conf import settings

# Image generation
from PIL import Image, ImageDraw, ImageFont

# QR Code generation
import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer

# PDF generation
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader


# Card dimensions (in pixels) - Credit card size ratio (85.6mm × 53.98mm)
CARD_WIDTH = 856
CARD_HEIGHT = 540

# Colors
COLORS = {
    'primary': '#2c3e50',
    'secondary': '#3498db',
    'accent': '#e74c3c',
    'text_dark': '#2c3e50',
    'text_light': '#7f8c8d',
    'background': '#ffffff',
    'boy_color': '#3498db',
    'girl_color': '#e91e63',
}


def get_arabic_font(size: int = 24, bold: bool = False) -> ImageFont.FreeTypeFont:
    """
    Get an Arabic-supporting font.
    Falls back to default if custom font not available.
    """
    # Try to find Arabic fonts in common locations
    font_paths = [
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/usr/share/fonts/truetype/freefont/FreeSans.ttf',
        '/usr/share/fonts/TTF/DejaVuSans.ttf',
        '/usr/share/fonts/dejavu/DejaVuSans.ttf',
        # Add path for Arabic font if available
        os.path.join(settings.BASE_DIR, 'static', 'fonts',
                     'NotoSansArabic-Regular.ttf'),
        os.path.join(settings.BASE_DIR, 'static',
                     'fonts', 'Cairo-Regular.ttf'),
    ]

    if bold:
        font_paths = [
            '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
            '/usr/share/fonts/truetype/freefont/FreeSansBold.ttf',
            '/usr/share/fonts/TTF/DejaVuSans-Bold.ttf',
            os.path.join(settings.BASE_DIR, 'static',
                         'fonts', 'NotoSansArabic-Bold.ttf'),
            os.path.join(settings.BASE_DIR, 'static',
                         'fonts', 'Cairo-Bold.ttf'),
        ] + font_paths

    for font_path in font_paths:
        if os.path.exists(font_path):
            try:
                return ImageFont.truetype(font_path, size)
            except Exception:
                continue

    # Fallback to default
    return ImageFont.load_default()


def generate_qr_code(data: str, size: int = 150) -> Image.Image:
    """
    Generate a QR code image for the given data.

    Args:
        data: The data to encode in the QR code
        size: The size of the QR code in pixels

    Returns:
        PIL Image of the QR code
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=2,
    )
    qr.add_data(data)
    qr.make(fit=True)

    # Create styled QR code
    qr_image = qr.make_image(
        image_factory=StyledPilImage,
        module_drawer=RoundedModuleDrawer(),
        fill_color=COLORS['primary'],
        back_color='white'
    )

    # Resize to desired size
    qr_image = qr_image.resize((size, size), Image.Resampling.LANCZOS)

    return qr_image


def generate_child_card(child, include_logo: bool = True) -> Image.Image:
    """
    Generate an ID card image for a child.

    Args:
        child: Child model instance
        include_logo: Whether to include organization logo

    Returns:
        PIL Image of the ID card
    """
    # Create card canvas
    card = Image.new('RGB', (CARD_WIDTH, CARD_HEIGHT), COLORS['background'])
    draw = ImageDraw.Draw(card)

    # Determine accent color based on gender
    accent_color = COLORS['boy_color'] if child.gender == 'boy' else COLORS['girl_color']

    # Draw header bar
    draw.rectangle([(0, 0), (CARD_WIDTH, 80)], fill=accent_color)

    # Draw organization name in header
    header_font = get_arabic_font(32, bold=True)
    header_text = "مركز الرضوان للدورات"
    # Get text bounding box for centering
    bbox = draw.textbbox((0, 0), header_text, font=header_font)
    text_width = bbox[2] - bbox[0]
    draw.text(
        ((CARD_WIDTH - text_width) // 2, 20),
        header_text,
        font=header_font,
        fill='white'
    )

    # Draw "بطاقة طالب" subtitle
    subtitle_font = get_arabic_font(20)
    subtitle_text = "بطاقة طالب"
    bbox = draw.textbbox((0, 0), subtitle_text, font=subtitle_font)
    text_width = bbox[2] - bbox[0]
    draw.text(
        ((CARD_WIDTH - text_width) // 2, 55),
        subtitle_text,
        font=subtitle_font,
        fill=(255, 255, 255, 230)  # White with slight transparency
    )

    # Generate and place QR code
    qr_code = generate_qr_code(child.unique_code, size=160)
    qr_x = CARD_WIDTH - 180
    qr_y = 100
    card.paste(qr_code, (qr_x, qr_y))

    # Draw QR label
    qr_label_font = get_arabic_font(14)
    qr_label = f"الكود: {child.unique_code}"
    bbox = draw.textbbox((0, 0), qr_label, font=qr_label_font)
    text_width = bbox[2] - bbox[0]
    draw.text(
        (qr_x + (160 - text_width) // 2, qr_y + 165),
        qr_label,
        font=qr_label_font,
        fill=COLORS['text_dark']
    )

    # Draw child information
    info_x = 40
    info_y = 110
    line_height = 50

    label_font = get_arabic_font(16)
    value_font = get_arabic_font(22, bold=True)

    # Information fields
    fields = [
        ("الاسم", f"{child.first_name} {child.last_name}"),
        ("النوع", "ولد 👦" if child.gender == 'boy' else "بنت 👧"),
        ("تاريخ الميلاد", child.dob.strftime("%Y-%m-%d") if child.dob else "-"),
        ("العمر",
         f"{child.get_age_on_date()} سنة" if child.get_age_on_date() else "-"),
    ]

    # Add phone if available
    if child.phone:
        fields.append(("الهاتف", child.phone))

    # Add parent name
    if child.primary_parent:
        fields.append(("ولي الأمر", str(child.primary_parent)))

    for label, value in fields:
        # Draw label
        draw.text(
            (info_x, info_y),
            f"{label}:",
            font=label_font,
            fill=COLORS['text_light']
        )

        # Draw value (right-aligned for Arabic)
        draw.text(
            (info_x, info_y + 18),
            str(value),
            font=value_font,
            fill=COLORS['text_dark']
        )

        info_y += line_height

    # Draw bottom accent bar
    draw.rectangle(
        [(0, CARD_HEIGHT - 30), (CARD_WIDTH, CARD_HEIGHT)],
        fill=accent_color
    )

    # Draw decorative elements
    # Side stripe
    draw.rectangle([(0, 80), (8, CARD_HEIGHT - 30)], fill=accent_color)

    # Corner decoration
    draw.ellipse(
        [(CARD_WIDTH - 60, CARD_HEIGHT - 90),
         (CARD_WIDTH - 10, CARD_HEIGHT - 40)],
        fill=accent_color,
        outline=None
    )

    return card


def generate_children_pdf(children: List, output: Optional[io.BytesIO] = None) -> io.BytesIO:
    """
    Generate a PDF document with ID cards for multiple children.

    Args:
        children: List of Child model instances
        output: Optional BytesIO object to write to

    Returns:
        BytesIO object containing the PDF
    """
    if output is None:
        output = io.BytesIO()

    # Create PDF with A4 page size
    pdf = canvas.Canvas(output, pagesize=A4)
    page_width, page_height = A4

    # Card dimensions in PDF (scaled to fit 2 cards per page)
    card_pdf_width = 180 * mm
    card_pdf_height = 113 * mm  # Maintain aspect ratio

    # Margins and spacing
    margin_x = (page_width - card_pdf_width) / 2
    margin_y = 20 * mm
    spacing_y = 10 * mm

    # Cards per page
    cards_per_page = 2

    for i, child in enumerate(children):
        # Calculate position on page
        position_on_page = i % cards_per_page

        # Start new page if needed (except for first card)
        if i > 0 and position_on_page == 0:
            pdf.showPage()

        # Generate card image
        card_image = generate_child_card(child)

        # Convert to bytes for PDF
        img_buffer = io.BytesIO()
        card_image.save(img_buffer, format='PNG', quality=95)
        img_buffer.seek(0)

        # Calculate Y position (top to bottom)
        y_position = page_height - margin_y - card_pdf_height
        if position_on_page == 1:
            y_position = page_height - margin_y - \
                (2 * card_pdf_height) - spacing_y

        # Draw card on PDF
        pdf.drawImage(
            ImageReader(img_buffer),
            margin_x,
            y_position,
            width=card_pdf_width,
            height=card_pdf_height,
            preserveAspectRatio=True
        )

        # Add page number at bottom
        if position_on_page == cards_per_page - 1 or i == len(children) - 1:
            page_num = (i // cards_per_page) + 1
            total_pages = (len(children) + cards_per_page -
                           1) // cards_per_page
            pdf.setFont("Helvetica", 10)
            pdf.drawCentredString(
                page_width / 2,
                10 * mm,
                f"Page {page_num} of {total_pages}"
            )

    pdf.save()
    output.seek(0)

    return output


def generate_single_card_pdf(child) -> io.BytesIO:
    """
    Generate a PDF with a single child's ID card.

    Args:
        child: Child model instance

    Returns:
        BytesIO object containing the PDF
    """
    return generate_children_pdf([child])


def generate_card_image_bytes(child, format: str = 'PNG') -> io.BytesIO:
    """
    Generate card image and return as bytes.

    Args:
        child: Child model instance
        format: Image format (PNG, JPEG, etc.)

    Returns:
        BytesIO object containing the image
    """
    card = generate_child_card(child)
    buffer = io.BytesIO()
    card.save(buffer, format=format, quality=95)
    buffer.seek(0)
    return buffer
