#!/usr/bin/env python3
"""
Authentication API Test Script
Tests all Djoser JWT authentication endpoints.

Usage:
    python test_auth_endpoints.py

Requirements:
    pip install requests
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
AUTH_URL = f"{BASE_URL}/auth"

# Test user data - change these for your tests
TEST_USER = {
    "phone_number1": "+201234567890",
    "password": "TestPassword123!",
    "re_password": "TestPassword123!",
    "first_name": "أحمد يوسف",
    "last_name": "محمد علي",
    "dob": "1995-05-15",
    "gender": "male",
}

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'


def print_header(text):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}")
    print(f" {text}")
    print(f"{'='*60}{Colors.RESET}\n")


def print_success(text):
    print(f"{Colors.GREEN}✓ {text}{Colors.RESET}")


def print_error(text):
    print(f"{Colors.RED}✗ {text}{Colors.RESET}")


def print_info(text):
    print(f"{Colors.CYAN}ℹ {text}{Colors.RESET}")


def print_warning(text):
    print(f"{Colors.YELLOW}⚠ {text}{Colors.RESET}")


def print_response(response, show_body=True):
    status_color = Colors.GREEN if response.ok else Colors.RED
    print(f"  Status: {status_color}{response.status_code}{Colors.RESET}")
    if show_body:
        try:
            body = response.json()
            print(f"  Response: {json.dumps(body, indent=4, ensure_ascii=False)}")
        except:
            print(f"  Response: {response.text[:200]}")


class AuthTester:
    def __init__(self):
        self.access_token = None
        self.refresh_token = None
        self.user_id = None
        self.results = {"passed": 0, "failed": 0}

    def test_result(self, success, test_name):
        if success:
            self.results["passed"] += 1
            print_success(f"{test_name} - PASSED")
        else:
            self.results["failed"] += 1
            print_error(f"{test_name} - FAILED")

    # ─────────────────────────────────────────────────────────────
    # Test 1: Register User
    # ─────────────────────────────────────────────────────────────
    def test_register(self):
        print_header("Test 1: Register User (POST /auth/users/)")
        
        print_info(f"Registering user with phone: {TEST_USER['phone_number1']}")
        
        response = requests.post(
            f"{AUTH_URL}/users/",
            json=TEST_USER,
            headers={"Content-Type": "application/json"}
        )
        
        print_response(response)
        
        if response.status_code == 201:
            self.user_id = response.json().get("id")
            self.test_result(True, "User Registration")
            return True
        elif response.status_code == 400:
            # User might already exist
            if "phone_number1" in response.json():
                print_warning("User already exists - continuing with login test")
                self.test_result(True, "User Registration (user exists)")
                return True
        
        self.test_result(False, "User Registration")
        return False

    # ─────────────────────────────────────────────────────────────
    # Test 2: Login (Create JWT)
    # ─────────────────────────────────────────────────────────────
    def test_login(self):
        print_header("Test 2: Login - Create JWT (POST /auth/jwt/create/)")
        
        print_info(f"Logging in with phone: {TEST_USER['phone_number1']}")
        
        response = requests.post(
            f"{AUTH_URL}/jwt/create/",
            json={
                "phone_number1": TEST_USER["phone_number1"],
                "password": TEST_USER["password"]
            },
            headers={"Content-Type": "application/json"}
        )
        
        print_response(response)
        
        if response.status_code == 200:
            data = response.json()
            self.access_token = data.get("access")
            self.refresh_token = data.get("refresh")
            
            if self.access_token and self.refresh_token:
                print_success(f"Access token received (length: {len(self.access_token)})")
                print_success(f"Refresh token received (length: {len(self.refresh_token)})")
                self.test_result(True, "Login/JWT Create")
                return True
        
        self.test_result(False, "Login/JWT Create")
        return False

    # ─────────────────────────────────────────────────────────────
    # Test 3: Verify Token
    # ─────────────────────────────────────────────────────────────
    def test_verify_token(self):
        print_header("Test 3: Verify Token (POST /auth/jwt/verify/)")
        
        if not self.access_token:
            print_error("No access token available - skipping")
            self.test_result(False, "Token Verification")
            return False
        
        print_info("Verifying access token...")
        
        response = requests.post(
            f"{AUTH_URL}/jwt/verify/",
            json={"token": self.access_token},
            headers={"Content-Type": "application/json"}
        )
        
        print_response(response)
        
        success = response.status_code == 200
        self.test_result(success, "Token Verification")
        return success

    # ─────────────────────────────────────────────────────────────
    # Test 4: Refresh Token
    # ─────────────────────────────────────────────────────────────
    def test_refresh_token(self):
        print_header("Test 4: Refresh Token (POST /auth/jwt/refresh/)")
        
        if not self.refresh_token:
            print_error("No refresh token available - skipping")
            self.test_result(False, "Token Refresh")
            return False
        
        print_info("Refreshing access token...")
        
        response = requests.post(
            f"{AUTH_URL}/jwt/refresh/",
            json={"refresh": self.refresh_token},
            headers={"Content-Type": "application/json"}
        )
        
        print_response(response)
        
        if response.status_code == 200:
            new_access = response.json().get("access")
            if new_access:
                print_success(f"New access token received (length: {len(new_access)})")
                self.access_token = new_access  # Update token
                self.test_result(True, "Token Refresh")
                return True
        
        self.test_result(False, "Token Refresh")
        return False

    # ─────────────────────────────────────────────────────────────
    # Test 5: Get Current User
    # ─────────────────────────────────────────────────────────────
    def test_get_user(self):
        print_header("Test 5: Get Current User (GET /auth/users/me/)")
        
        if not self.access_token:
            print_error("No access token available - skipping")
            self.test_result(False, "Get User Profile")
            return False
        
        print_info("Fetching user profile...")
        
        response = requests.get(
            f"{AUTH_URL}/users/me/",
            headers={
                "Authorization": f"JWT {self.access_token}",
                "Content-Type": "application/json"
            }
        )
        
        print_response(response)
        
        if response.status_code == 200:
            user = response.json()
            self.user_id = user.get("id")
            print_success(f"User ID: {self.user_id}")
            print_success(f"Phone: {user.get('phone_number1')}")
            print_success(f"Name: {user.get('first_name')} {user.get('last_name')}")
            self.test_result(True, "Get User Profile")
            return True
        
        self.test_result(False, "Get User Profile")
        return False

    # ─────────────────────────────────────────────────────────────
    # Test 6: Update Current User
    # ─────────────────────────────────────────────────────────────
    def test_update_user(self):
        print_header("Test 6: Update Current User (PATCH /auth/users/me/)")
        
        if not self.access_token:
            print_error("No access token available - skipping")
            self.test_result(False, "Update User Profile")
            return False
        
        update_data = {
            "address": f"Test Address - Updated at {datetime.now().isoformat()}"
        }
        
        print_info(f"Updating user with: {update_data}")
        
        response = requests.patch(
            f"{AUTH_URL}/users/me/",
            json=update_data,
            headers={
                "Authorization": f"JWT {self.access_token}",
                "Content-Type": "application/json"
            }
        )
        
        print_response(response)
        
        success = response.status_code == 200
        self.test_result(success, "Update User Profile")
        return success

    # ─────────────────────────────────────────────────────────────
    # Test 7: Test Privilege Escalation (Security Test)
    # ─────────────────────────────────────────────────────────────
    def test_privilege_escalation(self):
        print_header("Test 7: Security - Privilege Escalation Attempt")
        
        print_info("Attempting to register with is_staff=True, is_superuser=True...")
        
        malicious_user = {
            "phone_number1": "+201111111111",
            "password": "MaliciousPass123!",
            "re_password": "MaliciousPass123!",
            "first_name": "Hacker",
            "last_name": "Test",
            "dob": "1990-01-01",
            "gender": "male",
            # Attempted privilege escalation
            "is_staff": True,
            "is_superuser": True,
            "role": "admin",
            "is_active": True,
        }
        
        response = requests.post(
            f"{AUTH_URL}/users/",
            json=malicious_user,
            headers={"Content-Type": "application/json"}
        )
        
        print_response(response)
        
        if response.status_code == 201:
            # Check if the dangerous fields were ignored
            # Login and check the user's actual permissions
            login_response = requests.post(
                f"{AUTH_URL}/jwt/create/",
                json={
                    "phone_number1": malicious_user["phone_number1"],
                    "password": malicious_user["password"]
                }
            )
            
            if login_response.status_code == 200:
                token = login_response.json().get("access")
                profile_response = requests.get(
                    f"{AUTH_URL}/users/me/",
                    headers={"Authorization": f"JWT {token}"}
                )
                
                if profile_response.status_code == 200:
                    user = profile_response.json()
                    role = user.get("role", "unknown")
                    
                    if role == "student":
                        print_success("Privilege escalation BLOCKED - user is 'student'")
                        self.test_result(True, "Privilege Escalation Prevention")
                        return True
                    else:
                        print_error(f"SECURITY ISSUE! User role is: {role}")
                        self.test_result(False, "Privilege Escalation Prevention")
                        return False
        elif response.status_code == 400:
            # Fields were rejected entirely - also secure
            print_success("Malicious fields rejected by serializer")
            self.test_result(True, "Privilege Escalation Prevention")
            return True
        
        print_warning("Could not verify privilege escalation prevention")
        self.test_result(False, "Privilege Escalation Prevention")
        return False

    # ─────────────────────────────────────────────────────────────
    # Test 8: Change Password
    # ─────────────────────────────────────────────────────────────
    def test_change_password(self):
        print_header("Test 8: Change Password (POST /auth/users/set_password/)")
        
        if not self.access_token:
            print_error("No access token available - skipping")
            self.test_result(False, "Change Password")
            return False
        
        new_password = "NewTestPassword456!"
        
        print_info("Changing password...")
        
        response = requests.post(
            f"{AUTH_URL}/users/set_password/",
            json={
                "current_password": TEST_USER["password"],
                "new_password": new_password,
                "re_new_password": new_password
            },
            headers={
                "Authorization": f"JWT {self.access_token}",
                "Content-Type": "application/json"
            }
        )
        
        print_response(response)
        
        if response.status_code == 204:
            print_success("Password changed successfully")
            
            # Verify by logging in with new password
            print_info("Verifying new password by logging in...")
            login_response = requests.post(
                f"{AUTH_URL}/jwt/create/",
                json={
                    "phone_number1": TEST_USER["phone_number1"],
                    "password": new_password
                }
            )
            
            if login_response.status_code == 200:
                print_success("Login with new password successful")
                self.access_token = login_response.json().get("access")
                self.refresh_token = login_response.json().get("refresh")
                
                # Change password back for future tests
                print_info("Reverting password to original...")
                revert_response = requests.post(
                    f"{AUTH_URL}/users/set_password/",
                    json={
                        "current_password": new_password,
                        "new_password": TEST_USER["password"],
                        "re_new_password": TEST_USER["password"]
                    },
                    headers={
                        "Authorization": f"JWT {self.access_token}",
                        "Content-Type": "application/json"
                    }
                )
                
                if revert_response.status_code == 204:
                    print_success("Password reverted to original")
                
                self.test_result(True, "Change Password")
                return True
        
        self.test_result(False, "Change Password")
        return False

    # ─────────────────────────────────────────────────────────────
    # Test 9: Unauthorized Access
    # ─────────────────────────────────────────────────────────────
    def test_unauthorized_access(self):
        print_header("Test 9: Unauthorized Access Test")
        
        print_info("Attempting to access /users/me/ without token...")
        
        response = requests.get(
            f"{AUTH_URL}/users/me/",
            headers={"Content-Type": "application/json"}
        )
        
        print_response(response)
        
        if response.status_code == 401:
            print_success("Correctly rejected - 401 Unauthorized")
            self.test_result(True, "Unauthorized Access Rejection")
            return True
        
        print_error("Should have returned 401!")
        self.test_result(False, "Unauthorized Access Rejection")
        return False

    # ─────────────────────────────────────────────────────────────
    # Test 10: Invalid Token
    # ─────────────────────────────────────────────────────────────
    def test_invalid_token(self):
        print_header("Test 10: Invalid Token Test")
        
        print_info("Attempting to access with invalid token...")
        
        response = requests.get(
            f"{AUTH_URL}/users/me/",
            headers={
                "Authorization": "JWT invalid.token.here",
                "Content-Type": "application/json"
            }
        )
        
        print_response(response)
        
        if response.status_code == 401:
            print_success("Correctly rejected invalid token - 401 Unauthorized")
            self.test_result(True, "Invalid Token Rejection")
            return True
        
        print_error("Should have returned 401!")
        self.test_result(False, "Invalid Token Rejection")
        return False

    # ─────────────────────────────────────────────────────────────
    # Run All Tests
    # ─────────────────────────────────────────────────────────────
    def run_all_tests(self):
        print(f"\n{Colors.BOLD}{Colors.CYAN}")
        print("╔══════════════════════════════════════════════════════════╗")
        print("║       Authentication API Test Suite                      ║")
        print("║       Redwan Courses Center                              ║")
        print("╚══════════════════════════════════════════════════════════╝")
        print(f"{Colors.RESET}")
        
        print_info(f"Base URL: {BASE_URL}")
        print_info(f"Test Phone: {TEST_USER['phone_number1']}")
        print_info(f"Started at: {datetime.now().isoformat()}")
        
        # Run tests in order
        self.test_register()
        self.test_login()
        self.test_verify_token()
        self.test_refresh_token()
        self.test_get_user()
        self.test_update_user()
        self.test_privilege_escalation()
        self.test_change_password()
        self.test_unauthorized_access()
        self.test_invalid_token()
        
        # Summary
        print_header("TEST SUMMARY")
        
        total = self.results["passed"] + self.results["failed"]
        print(f"  Total Tests: {total}")
        print(f"  {Colors.GREEN}Passed: {self.results['passed']}{Colors.RESET}")
        print(f"  {Colors.RED}Failed: {self.results['failed']}{Colors.RESET}")
        
        if self.results["failed"] == 0:
            print(f"\n{Colors.GREEN}{Colors.BOLD}✓ All tests passed!{Colors.RESET}\n")
            return 0
        else:
            print(f"\n{Colors.RED}{Colors.BOLD}✗ Some tests failed!{Colors.RESET}\n")
            return 1


def main():
    # Check if server is reachable
    print_info("Checking server connectivity...")
    try:
        response = requests.get(BASE_URL, timeout=5)
        print_success(f"Server is reachable at {BASE_URL}")
    except requests.exceptions.ConnectionError:
        print_error(f"Cannot connect to {BASE_URL}")
        print_info("Make sure the Django server is running:")
        print_info("  docker compose up")
        sys.exit(1)
    except Exception as e:
        print_warning(f"Server check: {e}")
    
    tester = AuthTester()
    exit_code = tester.run_all_tests()
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
