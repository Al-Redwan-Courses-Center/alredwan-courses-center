#!/usr/bin/env python3
"""
Django management command to verify Arabic font installation.
Run this after deploying to check if fonts are properly configured.
"""
from django.core.management.base import BaseCommand
from core.utils.font_utils import verify_font_installation
import json


class Command(BaseCommand):
    help = 'Verify that Arabic fonts are properly installed for ID card generation'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Checking Arabic font installation...'))
        self.stdout.write('')
        
        status = verify_font_installation()
        
        if status['font_found']:
            self.stdout.write(self.style.SUCCESS(f'✅ Font found: {status["font_path"]}'))
        else:
            self.stdout.write(self.style.ERROR('❌ No Arabic font found!'))
            self.stdout.write(self.style.WARNING('Arabic text on ID cards will not render properly.'))
            self.stdout.write('')
            self.stdout.write('To fix this, ensure fonts are installed in your Dockerfile:')
            self.stdout.write('  RUN apt-get install -y fonts-dejavu fonts-dejavu-core fonts-noto')
            
        if status['can_render_arabic']:
            self.stdout.write(self.style.SUCCESS('✅ Arabic rendering verified successfully'))
        else:
            self.stdout.write(self.style.ERROR('❌ Arabic rendering test failed'))
            if 'error' in status:
                self.stdout.write(f'   Error: {status["error"]}')
        
        self.stdout.write('')
        self.stdout.write('Full status:')
        self.stdout.write(json.dumps(status, indent=2, ensure_ascii=False))
