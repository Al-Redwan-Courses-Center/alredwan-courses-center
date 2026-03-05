#!/usr/bin/env python3
"""
Utility functions for loading Arabic-compatible fonts in production.
This ensures consistent font handling across ID card generation.
"""
import os
import glob
from PIL import ImageFont
import logging

logger = logging.getLogger(__name__)


def get_arabic_font_path():
    """
    Find and return the path to an Arabic-compatible font.
    Returns None if no suitable font is found.
    """
    # Try fonts in order of preference
    arabic_fonts = [
        # Linux/Docker - DejaVu Sans (best Arabic support, installed via apt)
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        # Noto fonts (excellent Arabic support)
        "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
        "/usr/share/fonts/truetype/noto/NotoSansArabic-Regular.ttf",
        # Alternative Linux paths
        "/usr/share/fonts/TTF/DejaVuSans.ttf",
        "/usr/share/fonts/dejavu/DejaVuSans.ttf",
        # Windows - good Arabic support
        "C:\\Windows\\Fonts\\arial.ttf",
        "C:\\Windows\\Fonts\\tahoma.ttf",
        "C:\\Windows\\Fonts\\tahomabd.ttf",
        # macOS
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial.ttf",
    ]
    
    # First try exact paths
    for font_path in arabic_fonts:
        if os.path.exists(font_path):
            logger.info(f"Found Arabic font at: {font_path}")
            return font_path
    
    # If no exact match, search recursively
    search_patterns = [
        "/usr/share/fonts/**/DejaVuSans*.ttf",
        "/usr/share/fonts/**/dejavu*.ttf",
        "/usr/share/fonts/**/Noto*.ttf",
        "/usr/share/fonts/**/*Arab*.ttf",
    ]
    
    for pattern in search_patterns:
        matches = glob.glob(pattern, recursive=True)
        if matches:
            logger.info(f"Found Arabic font via glob search: {matches[0]}")
            return matches[0]
    
    logger.error("No Arabic-compatible font found! Arabic text will not render properly.")
    return None


def load_arabic_fonts(title_size=32, normal_size=22, small_size=16):
    """
    Load Arabic-compatible fonts at different sizes.
    Falls back to default fonts if no Arabic fonts are available.
    
    Returns:
        tuple: (title_font, normal_font, small_font)
    """
    font_path = get_arabic_font_path()
    
    if not font_path:
        logger.warning("Using default PIL fonts - Arabic text may appear as boxes/question marks")
        return (
            ImageFont.load_default(),
            ImageFont.load_default(),
            ImageFont.load_default()
        )
    
    try:
        title_font = ImageFont.truetype(font_path, title_size)
        normal_font = ImageFont.truetype(font_path, normal_size)
        small_font = ImageFont.truetype(font_path, small_size)
        logger.info(f"Successfully loaded Arabic fonts from: {font_path}")
        return (title_font, normal_font, small_font)
    except Exception as e:
        logger.error(f"Failed to load font from {font_path}: {e}")
        logger.warning("Falling back to default fonts")
        return (
            ImageFont.load_default(),
            ImageFont.load_default(),
            ImageFont.load_default()
        )


def verify_font_installation():
    """
    Verify that Arabic fonts are properly installed.
    Call this on application startup to diagnose font issues.
    
    Returns:
        dict: Status information about font installation
    """
    font_path = get_arabic_font_path()
    
    status = {
        'font_found': font_path is not None,
        'font_path': font_path,
        'can_render_arabic': False,
    }
    
    if font_path:
        try:
            # Try to load a font and render Arabic text
            test_font = ImageFont.truetype(font_path, 20)
            from arabic_reshaper import reshape
            from bidi.algorithm import get_display
            test_text = get_display(reshape("اختبار"))
            status['can_render_arabic'] = True
            logger.info("✅ Arabic font installation verified successfully")
        except Exception as e:
            logger.error(f"❌ Arabic font verification failed: {e}")
            status['error'] = str(e)
    else:
        logger.error("❌ No Arabic font found - cards will not display Arabic text properly")
    
    return status
