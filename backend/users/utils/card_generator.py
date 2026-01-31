def generate_students_pdf(students):
    """Generate PDF with cards for multiple students."""
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.utils import ImageReader
    import io

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

        # Use existing card image
        if student.card_image:
            img = ImageReader(student.card_image.url)
            # Draw card
            c.drawImage(img, 50, y_position - card_height + 50, width - 100, card_height - 100)
            y_position -= card_height

    c.save()
    buffer.seek(0)
    return buffer