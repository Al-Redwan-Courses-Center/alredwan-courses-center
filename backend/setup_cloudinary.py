#!/usr/bin/env python3
"""
Cloudinary Setup Verification Script
Run this script to verify your Cloudinary configuration is correct.
"""

import os
import sys
import django

# Setup Django environment
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Redwan_courses_center.settings')
django.setup()

import cloudinary
from django.conf import settings
from colorama import init, Fore, Style

init(autoreset=True)


def print_header(text):
    """Print a styled header."""
    print(f"\n{Fore.CYAN}{'=' * 60}")
    print(f"{Fore.CYAN}{text.center(60)}")
    print(f"{Fore.CYAN}{'=' * 60}\n")


def print_success(text):
    """Print success message."""
    print(f"{Fore.GREEN}✓ {text}")


def print_error(text):
    """Print error message."""
    print(f"{Fore.RED}✗ {text}")


def print_warning(text):
    """Print warning message."""
    print(f"{Fore.YELLOW}⚠ {text}")


def print_info(text):
    """Print info message."""
    print(f"{Fore.BLUE}ℹ {text}")


def check_environment_variables():
    """Check if Cloudinary environment variables are set."""
    print_header("Checking Environment Variables")
    
    required_vars = {
        'CLOUDINARY_CLOUD_NAME': settings.CLOUDINARY_STORAGE.get('CLOUD_NAME'),
        'CLOUDINARY_API_KEY': settings.CLOUDINARY_STORAGE.get('API_KEY'),
        'CLOUDINARY_API_SECRET': settings.CLOUDINARY_STORAGE.get('API_SECRET'),
    }
    
    all_set = True
    for var_name, var_value in required_vars.items():
        if var_value and var_value != f'your_{var_name.lower()}':
            print_success(f"{var_name} is set")
        else:
            print_error(f"{var_name} is NOT set or using default value")
            all_set = False
    
    return all_set


def check_image_settings():
    """Check image upload settings."""
    print_header("Image Upload Settings")
    
    print_info(f"Maximum Image Size: {settings.MAX_IMAGE_SIZE_MB} MB")
    print_info(f"Compression Quality: {settings.IMAGE_COMPRESSION_QUALITY}%")
    print_info(f"Max Width: {settings.IMAGE_MAX_WIDTH}px")
    print_info(f"Max Height: {settings.IMAGE_MAX_HEIGHT}px")


def test_cloudinary_connection():
    """Test connection to Cloudinary."""
    print_header("Testing Cloudinary Connection")
    
    try:
        # Configure cloudinary
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_STORAGE.get('CLOUD_NAME'),
            api_key=settings.CLOUDINARY_STORAGE.get('API_KEY'),
            api_secret=settings.CLOUDINARY_STORAGE.get('API_SECRET'),
            secure=True
        )
        
        # Try to get account details (this verifies credentials)
        result = cloudinary.api.ping()
        
        if result.get('status') == 'ok':
            print_success("Successfully connected to Cloudinary!")
            print_info(f"Cloud Name: {settings.CLOUDINARY_STORAGE.get('CLOUD_NAME')}")
            return True
        else:
            print_error("Failed to connect to Cloudinary")
            return False
            
    except Exception as e:
        print_error(f"Connection failed: {str(e)}")
        return False


def check_installed_apps():
    """Check if required apps are in INSTALLED_APPS."""
    print_header("Checking Installed Apps")
    
    required_apps = ['cloudinary_storage', 'cloudinary']
    all_installed = True
    
    for app in required_apps:
        if app in settings.INSTALLED_APPS:
            print_success(f"{app} is installed")
        else:
            print_error(f"{app} is NOT in INSTALLED_APPS")
            all_installed = False
    
    return all_installed


def check_storage_backend():
    """Check if Cloudinary storage backend is configured."""
    print_header("Checking Storage Backend")
    
    storage = settings.DEFAULT_FILE_STORAGE
    if 'cloudinary' in storage.lower():
        print_success(f"Storage backend is set to: {storage}")
        return True
    else:
        print_warning(f"Storage backend is: {storage}")
        print_warning("Consider setting DEFAULT_FILE_STORAGE to use Cloudinary")
        return False


def main():
    """Run all checks."""
    print_header("Cloudinary Setup Verification")
    print(f"{Fore.WHITE}This script will verify your Cloudinary integration setup.\n")
    
    checks = [
        ("Environment Variables", check_environment_variables),
        ("Installed Apps", check_installed_apps),
        ("Storage Backend", check_storage_backend),
    ]
    
    results = []
    for check_name, check_func in checks:
        try:
            result = check_func()
            results.append((check_name, result))
        except Exception as e:
            print_error(f"Error during {check_name} check: {str(e)}")
            results.append((check_name, False))
    
    # Show image settings (informational only)
    check_image_settings()
    
    # Test connection if other checks passed
    env_vars_ok = results[0][1]
    if env_vars_ok:
        connection_result = test_cloudinary_connection()
        results.append(("Cloudinary Connection", connection_result))
    else:
        print_header("Cloudinary Connection Test")
        print_warning("Skipping connection test - fix environment variables first")
    
    # Summary
    print_header("Summary")
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for check_name, result in results:
        status = f"{Fore.GREEN}PASSED" if result else f"{Fore.RED}FAILED"
        print(f"{check_name}: {status}")
    
    print(f"\n{Fore.WHITE}Total: {passed}/{total} checks passed")
    
    if passed == total:
        print(f"\n{Fore.GREEN}{'🎉 All checks passed! Your Cloudinary setup is ready! 🎉'.center(60)}\n")
    else:
        print(f"\n{Fore.YELLOW}{'⚠ Some checks failed. Please review the errors above. ⚠'.center(60)}\n")
        print(f"{Fore.WHITE}Next steps:")
        print("1. Add your Cloudinary credentials to your .env file")
        print("2. Get credentials from: https://cloudinary.com/console")
        print("3. See CLOUDINARY_SETUP.md for detailed instructions\n")


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}Setup check cancelled by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n{Fore.RED}Error: {str(e)}")
        sys.exit(1)
