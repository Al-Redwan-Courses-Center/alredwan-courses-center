#!/usr/bin/env python3
"""
Django management command to clean up expired staff password files
Deletes password files older than 24 hours for security
"""

from django.core.management.base import BaseCommand
from django.conf import settings
from pathlib import Path
import os
import time


class Command(BaseCommand):
    help = 'Clean up expired staff password files (older than 24 hours)'

    def handle(self, *args, **options):
        """Delete password files older than 24 hours"""
        
        files_dir = Path(settings.MEDIA_ROOT) / 'temp' / 'staff_imports'
        
        if not files_dir.exists():
            self.stdout.write(self.style.WARNING('No temp directory found. Nothing to clean.'))
            return
        
        current_time = time.time()
        deleted_count = 0
        kept_count = 0
        
        self.stdout.write(self.style.SUCCESS(f'\n🔍 Checking for expired files in: {files_dir}'))
        self.stdout.write('=' * 80)
        
        for file_path in files_dir.glob('staff_passwords_*.xlsx'):
            file_age = current_time - os.path.getmtime(file_path)
            hours_old = file_age / 3600
            
            if file_age > 86400:  # 24 hours in seconds
                try:
                    file_name = file_path.name
                    os.remove(file_path)
                    deleted_count += 1
                    self.stdout.write(
                        self.style.WARNING(f'🗑️  Deleted: {file_name} (Age: {hours_old:.1f} hours)')
                    )
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'❌ Error deleting {file_path.name}: {str(e)}')
                    )
            else:
                kept_count += 1
                hours_remaining = (86400 - file_age) / 3600
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Kept: {file_path.name} (Expires in: {hours_remaining:.1f} hours)')
                )
        
        self.stdout.write('=' * 80)
        
        if deleted_count > 0:
            self.stdout.write(
                self.style.SUCCESS(f'\n✅ Cleanup complete: {deleted_count} file(s) deleted, {kept_count} file(s) kept')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'\n✅ Cleanup complete: No expired files found ({kept_count} active file(s))')
            )
