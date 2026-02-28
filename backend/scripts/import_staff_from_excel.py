#!/usr/bin/env python
"""
Script to import Instructors and Supervisors from Excel file
This script can be run while the Django server is running.

Usage:
    python scripts/import_staff_from_excel.py path/to/excel_file.xlsx
"""

import os
import sys
import django
from pathlib import Path
from datetime import datetime
from decimal import Decimal

# Setup Django environment
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Redwan_courses_center.settings')
django.setup()

from django.db import transaction
from django.core.exceptions import ValidationError
from users.models import CustomUser, Instructor
import openpyxl
from openpyxl.utils.exceptions import InvalidFileException


class StaffImporter:
    """Import staff (instructors and supervisors) from Excel files"""
    
    def __init__(self, excel_file_path):
        self.excel_file_path = excel_file_path
        self.stats = {
            'total': 0,
            'success': 0,
            'skipped': 0,
            'errors': 0
        }
        self.error_messages = []
    
    def normalize_gender(self, value):
        """Normalize gender values (support Arabic and English)"""
        if not value:
            return None
        value = str(value).strip().lower()
        male_values = ['male', 'ذكر', 'm']
        female_values = ['female', 'أنثى', 'f']
        
        if value in male_values:
            return 'male'
        elif value in female_values:
            return 'female'
        return None
    
    def normalize_role(self, value):
        """Normalize role values (support Arabic and English)"""
        if not value:
            return None
        value = str(value).strip().lower()
        instructor_values = ['instructor', 'مدرس', 'teacher']
        supervisor_values = ['supervisor', 'مشرف']
        
        if value in instructor_values:
            return 'instructor'
        elif value in supervisor_values:
            return 'supervisor'
        return None
    
    def normalize_instructor_type(self, value):
        """Normalize instructor type values"""
        if not value:
            return 'normal'
        value = str(value).strip().lower()
        supervisor_values = ['supervisor', 'مشرف']
        normal_values = ['normal', 'عادي', 'external', 'خارجي']
        
        if value in supervisor_values:
            return 'supervisor'
        elif value in normal_values:
            return 'normal'
        return 'normal'
    
    def normalize_identity_type(self, value):
        """Normalize identity type values"""
        if not value:
            return 'nid'
        value = str(value).strip().lower()
        if value in ['nid', 'national', 'بطاقة', 'وطنية']:
            return 'nid'
        elif value in ['passport', 'جواز']:
            return 'passport'
        return 'other'
    
    def parse_date(self, value):
        """Parse date from various formats"""
        if isinstance(value, datetime):
            return value.date()
        
        if not value:
            return None
        
        value = str(value).strip()
        
        # Try different date formats
        formats = [
            '%Y-%m-%d',
            '%d/%m/%Y',
            '%d-%m-%Y',
            '%Y/%m/%d',
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(value, fmt).date()
            except ValueError:
                continue
        
        raise ValueError(f"Invalid date format: {value}")
    
    def get_cell_value(self, row, column_name):
        """Safely get cell value from row"""
        value = row.get(column_name)
        if value is None or str(value).strip() == '':
            return None
        return str(value).strip()
    
    def check_duplicate(self, phone_number1, email, identity_number, fingerprint_id):
        """Check if user already exists"""
        # Check phone number
        if CustomUser.objects.filter(phone_number1=phone_number1).exists():
            return f"Phone number {phone_number1} already exists"
        
        # Check email
        if email and CustomUser.objects.filter(email=email).exists():
            return f"Email {email} already exists"
        
        # Check identity number
        if identity_number and CustomUser.objects.filter(identity_number=identity_number).exists():
            return f"Identity number {identity_number} already exists"
        
        # Check fingerprint ID
        if fingerprint_id and Instructor.objects.filter(fingerprint_id=fingerprint_id).exists():
            return f"Fingerprint ID {fingerprint_id} already exists"
        
        return None
    
    def import_row(self, row_data, row_number):
        """Import a single row of data"""
        try:
            # Extract required fields
            phone_number1 = self.get_cell_value(row_data, 'phone_number1')
            first_name = self.get_cell_value(row_data, 'first_name')
            last_name = self.get_cell_value(row_data, 'last_name')
            dob_str = self.get_cell_value(row_data, 'dob')
            gender_str = self.get_cell_value(row_data, 'gender')
            role_str = self.get_cell_value(row_data, 'role')
            monthly_salary_str = self.get_cell_value(row_data, 'monthly_salary')
            type_str = self.get_cell_value(row_data, 'type')
            
            # Validate required fields
            if not all([phone_number1, first_name, last_name, dob_str, gender_str, role_str, monthly_salary_str, type_str]):
                raise ValueError("Missing required fields. Check: phone_number1, first_name, last_name, dob, gender, role, monthly_salary, type")
            
            # Normalize values
            gender = self.normalize_gender(gender_str)
            if not gender:
                raise ValueError(f"Invalid gender value: {gender_str}")
            
            role = self.normalize_role(role_str)
            if not role:
                raise ValueError(f"Invalid role value: {role_str}")
            
            if role not in ['instructor', 'supervisor']:
                raise ValueError(f"Role must be 'instructor' or 'supervisor', got: {role}")
            
            instructor_type = self.normalize_instructor_type(type_str)
            
            # Parse date
            dob = self.parse_date(dob_str)
            if not dob:
                raise ValueError(f"Invalid date of birth: {dob_str}")
            
            # Parse salary
            monthly_salary = Decimal(str(monthly_salary_str).replace(',', ''))
            
            # Optional fields
            phone_number2 = self.get_cell_value(row_data, 'phone_number2')
            email = self.get_cell_value(row_data, 'email')
            identity_number = self.get_cell_value(row_data, 'identity_number')
            identity_type = self.normalize_identity_type(self.get_cell_value(row_data, 'identity_type'))
            address = self.get_cell_value(row_data, 'address')
            location = self.get_cell_value(row_data, 'location')
            bio = self.get_cell_value(row_data, 'bio')
            fingerprint_id = self.get_cell_value(row_data, 'fingerprint_id')
            password = self.get_cell_value(row_data, 'password')
            
            # Check for duplicates
            duplicate_msg = self.check_duplicate(phone_number1, email, identity_number, fingerprint_id)
            if duplicate_msg:
                print(f"⚠️  Skipped: {duplicate_msg}")
                self.stats['skipped'] += 1
                return
            
            # Use transaction to ensure atomicity
            with transaction.atomic():
                # Create user
                user_data = {
                    'phone_number1': phone_number1,
                    'first_name': first_name,
                    'last_name': last_name,
                    'dob': dob,
                    'gender': gender,
                    'role': role,
                    'is_verified': False,
                    'is_staff': False,
                }
                
                if phone_number2:
                    user_data['phone_number2'] = phone_number2
                if email:
                    user_data['email'] = email
                if identity_number:
                    user_data['identity_number'] = identity_number
                if identity_type:
                    user_data['identity_type'] = identity_type
                if address:
                    user_data['address'] = address
                if location:
                    user_data['location'] = location
                
                # Create user with password
                user = CustomUser.objects.create_user(
                    phone_number1=phone_number1,
                    password=password if password else phone_number1,
                    **{k: v for k, v in user_data.items() if k != 'phone_number1'}
                )
                
                print(f"✅ Created user: {user.get_full_name()} ({phone_number1})")
                
                # Create instructor profile
                instructor_data = {
                    'user': user,
                    'monthly_salary': monthly_salary,
                    'type': instructor_type,
                }
                
                if bio:
                    instructor_data['bio'] = bio
                if fingerprint_id:
                    instructor_data['fingerprint_id'] = fingerprint_id
                
                instructor = Instructor.objects.create(**instructor_data)
                print(f"✅ Created instructor profile for: {user.get_full_name()}")
                
                self.stats['success'] += 1
                
        except Exception as e:
            error_msg = f"Row {row_number}: {str(e)}"
            print(f"❌ Error: {error_msg}")
            self.error_messages.append(error_msg)
            self.stats['errors'] += 1
    
    def import_from_excel(self):
        """Main import function"""
        try:
            # Load workbook
            print(f"\nStarting import from: {self.excel_file_path}")
            print("=" * 80)
            
            workbook = openpyxl.load_workbook(self.excel_file_path)
            sheet = workbook.active
            
            # Get header row
            headers = []
            for cell in sheet[1]:
                if cell.value:
                    headers.append(str(cell.value).strip())
            
            # Process each row
            for row_idx, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
                self.stats['total'] += 1
                
                # Convert row to dictionary
                row_data = {}
                for idx, value in enumerate(row):
                    if idx < len(headers):
                        row_data[headers[idx]] = value
                
                print(f"\nProcessing row {row_idx}...")
                self.import_row(row_data, row_idx)
            
            # Print summary
            self.print_summary()
            
        except InvalidFileException:
            print("❌ Error: Invalid Excel file format. Please provide a valid .xlsx or .xls file.")
            sys.exit(1)
        except FileNotFoundError:
            print(f"❌ Error: File not found: {self.excel_file_path}")
            sys.exit(1)
        except Exception as e:
            print(f"❌ Unexpected error: {str(e)}")
            import traceback
            traceback.print_exc()
            sys.exit(1)
    
    def print_summary(self):
        """Print import summary"""
        print("\n" + "=" * 80)
        print("📊 IMPORT SUMMARY")
        print("=" * 80)
        print(f"Total rows processed: {self.stats['total']}")
        print(f"✅ Successfully imported: {self.stats['success']}")
        print(f"⚠️  Skipped (duplicates): {self.stats['skipped']}")
        print(f"❌ Failed (errors): {self.stats['errors']}")
        print("=" * 80)
        
        if self.error_messages:
            print("\n❌ ERROR DETAILS:")
            for msg in self.error_messages:
                print(f"  - {msg}")


def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print("Usage: python scripts/import_staff_from_excel.py <excel_file_path>")
        print("\nExample:")
        print("  python scripts/import_staff_from_excel.py staff_data.xlsx")
        print("  python scripts/import_staff_from_excel.py C:/Users/Data/staff.xlsx")
        sys.exit(1)
    
    excel_file = sys.argv[1]
    
    # Check if file exists
    if not os.path.exists(excel_file):
        # Try relative to script directory
        script_dir = Path(__file__).resolve().parent
        excel_file = script_dir / excel_file
        
        if not os.path.exists(excel_file):
            print(f"❌ Error: File not found: {sys.argv[1]}")
            sys.exit(1)
    
    # Run import
    importer = StaffImporter(excel_file)
    importer.import_from_excel()


if __name__ == '__main__':
    main()
