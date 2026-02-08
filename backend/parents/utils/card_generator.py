def generate_children_pdf(children):
    """Generate PDF with cards for multiple children."""
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

    for i, child in enumerate(children):
        if i % cards_per_page == 0 and i > 0:
            c.showPage()
            y_position = height

        # Generate card image on the fly
        try:
            card_buffer = child.generate_card_image_buffer()
            img = ImageReader(card_buffer)
            img_width, img_height = img.getSize()
            target_width = width - 100
            target_height = card_height - 100
            scale = min(target_width / img_width, target_height / img_height)
            new_width = img_width * scale
            new_height = img_height * scale
            x = 50 + (target_width - new_width) / 2
            y = y_position - card_height + 50 + (target_height - new_height) / 2
            # Draw card
            c.drawImage(img, x, y, new_width, new_height)
            y_position -= card_height
        except Exception as e:
            # If generation fails, skip this child
            print(f"Failed to generate card for child {child.unique_code}: {e}")
            continue

    c.save()
    buffer.seek(0)
    return buffer