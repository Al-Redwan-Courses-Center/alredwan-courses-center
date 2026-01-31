def generate_card_image_bytes(student, format='PNG'):
    """Generate card image bytes for a student."""
    from PIL import Image, ImageDraw, ImageFont
    import qrcode
    import io
    import requests

    # Use the same logic as in the model
    width, height = 600, 300
    card = Image.new('RGB', (width, height), 'white')
    draw = ImageDraw.Draw(card)

    try:
        font = ImageFont.truetype("arial.ttf", 20)
        small_font = ImageFont.truetype("arial.ttf", 14)
    except:
        font = ImageFont.load_default()
        small_font = ImageFont.load_default()

    # Left side: photo and text
    photo_size = 150
    if student.image:
        try:
            response = requests.get(student.image.url)
            photo = Image.open(io.BytesIO(response.content))
            photo = photo.resize((photo_size, photo_size))
            card.paste(photo, (20, 20))
        except:
            draw.rectangle([20, 20, 20+photo_size, 20+photo_size], fill='gray')
            draw.text((20 + photo_size//2 - 30, 20 + photo_size//2 - 10), "Photo", fill='white', font=font)

    # Text next to photo
    text_x = 20 + photo_size + 20
    draw.text((text_x, 20), f"Name: {student.user.first_name} {student.user.last_name}", fill='black', font=font)
    draw.text((text_x, 50), f"DOB: {student.user.date_of_birth.strftime('%d/%m/%Y') if student.user.date_of_birth else 'N/A'}", fill='black', font=font)
    draw.text((text_x, 80), f"Code: {student.unique_code}", fill='black', font=font)

    # Right side: QR code
    qr_size = 150
    data = {
        "code": student.unique_code,
        "name": f"{student.user.first_name} {student.user.last_name}",
        "dob": student.user.date_of_birth.isoformat() if student.user.date_of_birth else None
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
    card.save(buffer, format=format)
    buffer.seek(0)
    return buffer


def generate_students_pdf(students):
    """Generate PDF with cards for multiple students."""
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.utils import ImageReader

    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)

    width, height = letter
    cards_per_page = 2  # 2 cards per page
    card_height = height / cards_per_page
    y_position = height

    for i, student in enumerate(students):
        if i % cards_per_page == 0 and i > 0:
            c.showPage()
            y_position = height

        # Generate card image
        img_buffer = generate_card_image_bytes(student)
        img = ImageReader(img_buffer)

        # Draw card
        c.drawImage(img, 50, y_position - card_height + 50, width - 100, card_height - 100)
        y_position -= card_height

    c.save()
    buffer.seek(0)
    return buffer