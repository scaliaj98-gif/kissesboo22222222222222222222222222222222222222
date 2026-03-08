#!/usr/bin/env python3
"""
Screen Master Backend API Testing Suite
Tests all API endpoints for the Chrome extension backend
"""

import requests
import sys
import json
import uuid
from datetime import datetime
from typing import Dict, Any

class ScreenMasterAPITester:
    def __init__(self, base_url: str = "https://determined-lewin-4.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = None
        self.user_id = None
        self.test_media_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
    def log_test(self, name: str, success: bool, details: str = "", status_code: int = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            
        result = {
            "test": name,
            "success": success,
            "details": details,
            "status_code": status_code,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status_icon = "✅" if success else "❌"
        status_text = f" (HTTP {status_code})" if status_code else ""
        print(f"{status_icon} {name}{status_text}")
        if details:
            print(f"   {details}")

    def make_request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}{endpoint}"
        headers = kwargs.get('headers', {})
        
        # Add session token if available
        if self.session_token:
            headers['Authorization'] = f'Bearer {self.session_token}'
        
        # Only set Content-Type for requests with body
        if method.upper() in ['POST', 'PUT', 'PATCH'] and 'json' in kwargs:
            headers.setdefault('Content-Type', 'application/json')
            
        if headers:  # Only set headers if we have any
            kwargs['headers'] = headers
        kwargs.setdefault('timeout', 30)  # Add timeout
        
        try:
            # print(f"Making {method} request to {url}")  # Commented out debug
            # if headers:
            #     print(f"Headers: {headers}")  # Commented out debug
            response = getattr(requests, method.lower())(url, **kwargs)
            # print(f"Response: {response.status_code}")  # Commented out debug
            return response
        except Exception as e:
            print(f"Request failed for {method} {url}: {e}")
            # Create a mock response object for failed requests
            class MockResponse:
                def __init__(self, error_msg):
                    self.status_code = None
                    self.text = error_msg
                def json(self):
                    return {"error": error_msg}
            return MockResponse(str(e))

    def test_health_check(self):
        """Test /api/health endpoint"""
        print("\n🔍 Testing Health Check...")
        
        response = self.make_request('GET', '/api/health')
        
        if not response:
            self.log_test("Health Check", False, "Request failed")
            return False
            
        success = response.status_code == 200
        
        if success:
            try:
                data = response.json()
                expected_keys = ['status', 'timestamp', 'service']
                has_keys = all(key in data for key in expected_keys)
                is_healthy = data.get('status') == 'healthy'
                
                if has_keys and is_healthy:
                    self.log_test("Health Check", True, f"Service healthy: {data.get('service')}", response.status_code)
                else:
                    self.log_test("Health Check", False, f"Invalid response format: {data}", response.status_code)
                    return False
            except Exception as e:
                self.log_test("Health Check", False, f"JSON parsing failed: {e}", response.status_code)
                return False
        else:
            self.log_test("Health Check", False, f"Unexpected status code", response.status_code)
            
        return success

    def test_auth_unauthenticated(self):
        """Test /api/auth/me without authentication (should return 401)"""
        print("\n🔍 Testing Unauthenticated Access...")
        
        # Temporarily clear session token
        temp_token = self.session_token
        self.session_token = None
        
        response = self.make_request('GET', '/api/auth/me')
        
        # Restore token
        self.session_token = temp_token
        
        if not hasattr(response, 'status_code') or response.status_code is None:
            self.log_test("Unauthenticated Access", False, f"Network/Connection failed: {response.text if hasattr(response, 'text') else 'No response'}")
            return False
            
        success = response.status_code == 401
        
        if success:
            self.log_test("Unauthenticated Access", True, "Correctly returns 401", response.status_code)
        else:
            self.log_test("Unauthenticated Access", False, f"Expected 401, got {response.status_code}", response.status_code)
            
        return success

    def setup_test_auth(self):
        """Setup test authentication using MongoDB directly"""
        print("\n🔍 Setting up Test Authentication...")
        
        try:
            # Create test user and session directly in MongoDB
            import pymongo
            from datetime import timedelta
            
            client = pymongo.MongoClient("mongodb://localhost:27017")
            db = client.screenmaster  # Use the correct database name from backend/.env
            
            # Generate test credentials
            self.user_id = f"test_user_{uuid.uuid4().hex[:12]}"
            self.session_token = f"test_session_{uuid.uuid4().hex[:16]}"
            test_email = f"test.{uuid.uuid4().hex[:8]}@snaprecord.com"
            
            # Create test user
            user_doc = {
                "user_id": self.user_id,
                "email": test_email,
                "name": "Test User",
                "picture": "https://via.placeholder.com/150",
                "created_at": datetime.now()
            }
            db.users.insert_one(user_doc)
            
            # Create test session
            session_doc = {
                "user_id": self.user_id,
                "session_token": self.session_token,
                "expires_at": datetime.now() + timedelta(days=1),
                "created_at": datetime.now()
            }
            db.user_sessions.insert_one(session_doc)
            
            self.log_test("Test Auth Setup", True, f"Created user: {self.user_id}")
            return True
            
        except Exception as e:
            self.log_test("Test Auth Setup", False, f"Failed to setup auth: {e}")
            return False

    def test_auth_me(self):
        """Test /api/auth/me with authentication"""
        print("\n🔍 Testing Authenticated User Access...")
        
        response = self.make_request('GET', '/api/auth/me')
        
        if not response:
            self.log_test("Authenticated User Access", False, "Request failed")
            return False
            
        success = response.status_code == 200
        
        if success:
            try:
                data = response.json()
                required_fields = ['user_id', 'email', 'name']
                has_fields = all(field in data for field in required_fields)
                
                if has_fields:
                    self.log_test("Authenticated User Access", True, f"User: {data.get('name')} ({data.get('email')})", response.status_code)
                else:
                    self.log_test("Authenticated User Access", False, f"Missing required fields: {data}", response.status_code)
                    return False
            except Exception as e:
                self.log_test("Authenticated User Access", False, f"JSON parsing failed: {e}", response.status_code)
                return False
        else:
            self.log_test("Authenticated User Access", False, f"Authentication failed", response.status_code)
            
        return success

    def test_media_endpoints(self):
        """Test media CRUD operations"""
        print("\n🔍 Testing Media Endpoints...")
        
        # Test GET empty media list
        response = self.make_request('GET', '/api/media')
        if response and response.status_code == 200:
            self.log_test("Get Media List", True, "Successfully retrieved media list", response.status_code)
        else:
            self.log_test("Get Media List", False, "Failed to get media list", response.status_code if response else None)
            return False
            
        # Test POST new media item
        test_media = {
            "type": "screenshot",
            "title": f"Test Screenshot {datetime.now().strftime('%H:%M:%S')}",
            "description": "Test screenshot for API testing",
            "tags": ["test", "api", "screenshot"],
            "file_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
            "format": "png",
            "width": 1,
            "height": 1
        }
        
        response = self.make_request('POST', '/api/media', json=test_media)
        if response and response.status_code == 200:
            try:
                data = response.json()
                self.test_media_id = data.get('media_id')
                self.log_test("Create Media", True, f"Created media: {self.test_media_id}", response.status_code)
            except Exception as e:
                self.log_test("Create Media", False, f"JSON parsing failed: {e}", response.status_code)
                return False
        else:
            self.log_test("Create Media", False, "Failed to create media", response.status_code if response else None)
            return False
            
        # Test GET specific media item
        if self.test_media_id:
            response = self.make_request('GET', f'/api/media/{self.test_media_id}')
            if response and response.status_code == 200:
                self.log_test("Get Media Item", True, f"Retrieved media: {self.test_media_id}", response.status_code)
            else:
                self.log_test("Get Media Item", False, f"Failed to get media item", response.status_code if response else None)
                
        return True

    def test_stats_endpoint(self):
        """Test /api/stats endpoint"""
        print("\n🔍 Testing Stats Endpoint...")
        
        response = self.make_request('GET', '/api/stats')
        
        if not response:
            self.log_test("Stats Endpoint", False, "Request failed")
            return False
            
        success = response.status_code == 200
        
        if success:
            try:
                data = response.json()
                required_keys = ['total_screenshots', 'total_recordings', 'total_storage_bytes', 'total_storage_mb']
                has_keys = all(key in data for key in required_keys)
                
                if has_keys:
                    self.log_test("Stats Endpoint", True, f"Screenshots: {data['total_screenshots']}, Recordings: {data['total_recordings']}", response.status_code)
                else:
                    self.log_test("Stats Endpoint", False, f"Missing required keys: {data}", response.status_code)
                    return False
            except Exception as e:
                self.log_test("Stats Endpoint", False, f"JSON parsing failed: {e}", response.status_code)
                return False
        else:
            self.log_test("Stats Endpoint", False, "Failed to get stats", response.status_code)
            
        return success

    def test_ai_endpoints(self):
        """Test AI-powered endpoints"""
        print("\n🔍 Testing AI Endpoints...")
        
        # Test AI tag generation
        tag_request = {
            "image_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        }
        
        response = self.make_request('POST', '/api/ai/generate-tags', json=tag_request)
        if response and response.status_code == 200:
            try:
                data = response.json()
                if 'tags' in data and isinstance(data['tags'], list):
                    self.log_test("AI Generate Tags", True, f"Generated {len(data['tags'])} tags", response.status_code)
                else:
                    self.log_test("AI Generate Tags", False, f"Invalid response format: {data}", response.status_code)
            except Exception as e:
                self.log_test("AI Generate Tags", False, f"JSON parsing failed: {e}", response.status_code)
        else:
            self.log_test("AI Generate Tags", False, "Failed to generate tags", response.status_code if response else None)
            
        # Test AI title generation
        title_request = {"context": "screenshot"}
        
        response = self.make_request('POST', '/api/ai/generate-title', json=title_request)
        if response and response.status_code == 200:
            try:
                data = response.json()
                if 'title' in data and data['title']:
                    self.log_test("AI Generate Title", True, f"Generated title: {data['title']}", response.status_code)
                else:
                    self.log_test("AI Generate Title", False, f"Invalid response: {data}", response.status_code)
            except Exception as e:
                self.log_test("AI Generate Title", False, f"JSON parsing failed: {e}", response.status_code)
        else:
            self.log_test("AI Generate Title", False, "Failed to generate title", response.status_code if response else None)

    def test_folders_unauthenticated(self):
        """Test folders endpoints without authentication (should return 401 or empty)"""
        print("\n🔍 Testing Folders Endpoints - Unauthenticated...")
        
        # Temporarily clear session token
        temp_token = self.session_token
        self.session_token = None
        
        # Test GET /api/folders without auth
        response = self.make_request('GET', '/api/folders')
        if response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    if data.get('folders') == []:
                        self.log_test("GET Folders (No Auth)", True, "Returns empty list as expected", response.status_code)
                    else:
                        self.log_test("GET Folders (No Auth)", False, f"Should return empty list, got: {data}", response.status_code)
                except Exception as e:
                    self.log_test("GET Folders (No Auth)", False, f"JSON parsing failed: {e}", response.status_code)
            elif response.status_code == 401:
                self.log_test("GET Folders (No Auth)", True, "Correctly returns 401", response.status_code)
            else:
                self.log_test("GET Folders (No Auth)", False, f"Unexpected status code", response.status_code)
        else:
            self.log_test("GET Folders (No Auth)", False, "Request failed")
            
        # Test POST /api/folders without auth (should return 401)
        folder_data = {"name": "Test Folder", "color": "#6366F1"}
        response = self.make_request('POST', '/api/folders', json=folder_data)
        if hasattr(response, 'status_code') and response.status_code is not None:
            if response.status_code == 401:
                self.log_test("POST Folders (No Auth)", True, "Correctly returns 401", response.status_code)
            else:
                self.log_test("POST Folders (No Auth)", False, f"Expected 401, got {response.status_code}", response.status_code)
        else:
            self.log_test("POST Folders (No Auth)", False, f"Request failed: {response.text if response else 'No response'}")
        
        # Restore token
        self.session_token = temp_token

    def test_media_unauthenticated(self):
        """Test media endpoints without authentication (should return 401)"""
        print("\n🔍 Testing Media Endpoints - Unauthenticated...")
        
        # Temporarily clear session token
        temp_token = self.session_token
        self.session_token = None
        
        # Test GET /api/media without auth
        response = self.make_request('GET', '/api/media')
        if hasattr(response, 'status_code') and response.status_code is not None:
            success = response.status_code == 401
            if success:
                self.log_test("GET Media (No Auth)", True, "Correctly returns 401", response.status_code)
            else:
                self.log_test("GET Media (No Auth)", False, f"Expected 401, got {response.status_code}", response.status_code)
        else:
            self.log_test("GET Media (No Auth)", False, f"Request failed: {response.text if response else 'No response'}")
            
        # Test PATCH /api/media/test123 without auth
        update_data = {"title": "Updated Title"}
        response = self.make_request('PATCH', '/api/media/test123', json=update_data)
        if hasattr(response, 'status_code') and response.status_code is not None:
            success = response.status_code == 401
            if success:
                self.log_test("PATCH Media (No Auth)", True, "Correctly returns 401", response.status_code)
            else:
                self.log_test("PATCH Media (No Auth)", False, f"Expected 401, got {response.status_code}", response.status_code)
        else:
            self.log_test("PATCH Media (No Auth)", False, f"Request failed: {response.text if response else 'No response'}")
        
        # Restore token
        self.session_token = temp_token

    def test_stats_unauthenticated(self):
        """Test stats endpoint without authentication (should return 401)"""
        print("\n🔍 Testing Stats Endpoint - Unauthenticated...")
        
        # Temporarily clear session token
        temp_token = self.session_token
        self.session_token = None
        
        response = self.make_request('GET', '/api/stats')
        if hasattr(response, 'status_code') and response.status_code is not None:
            success = response.status_code == 401
            if success:
                self.log_test("GET Stats (No Auth)", True, "Correctly returns 401", response.status_code)
            else:
                self.log_test("GET Stats (No Auth)", False, f"Expected 401, got {response.status_code}", response.status_code)
        else:
            self.log_test("GET Stats (No Auth)", False, f"Request failed: {response.text if response else 'No response'}")
        
        # Restore token
        self.session_token = temp_token

    def test_auth_session_endpoint(self):
        """Test /api/auth/session endpoint without session_id (should return 400)"""
        print("\n🔍 Testing Auth Session Endpoint...")
        
        # Test without session_id (should return 400)
        response = self.make_request('POST', '/api/auth/session', json={})
        if hasattr(response, 'status_code') and response.status_code is not None:
            success = response.status_code == 400
            if success:
                self.log_test("POST Auth Session (No session_id)", True, "Correctly returns 400", response.status_code)
            else:
                self.log_test("POST Auth Session (No session_id)", False, f"Expected 400, got {response.status_code}", response.status_code)
        else:
            self.log_test("POST Auth Session (No session_id)", False, f"Request failed: {response.text if response else 'No response'}")

    def test_folders_authenticated(self):
        """Test folders endpoints with authentication"""
        print("\n🔍 Testing Folders Endpoints - Authenticated...")
        
        # Test GET /api/folders with auth
        response = self.make_request('GET', '/api/folders')
        if response and response.status_code == 200:
            try:
                data = response.json()
                if 'folders' in data and isinstance(data['folders'], list):
                    self.log_test("GET Folders (Authenticated)", True, f"Retrieved {len(data['folders'])} folders", response.status_code)
                else:
                    self.log_test("GET Folders (Authenticated)", False, f"Invalid response format: {data}", response.status_code)
            except Exception as e:
                self.log_test("GET Folders (Authenticated)", False, f"JSON parsing failed: {e}", response.status_code)
        else:
            self.log_test("GET Folders (Authenticated)", False, "Failed to get folders", response.status_code if response else None)
            
        # Test POST /api/folders with auth
        folder_data = {
            "name": f"Test Folder {datetime.now().strftime('%H:%M:%S')}",
            "color": "#6366F1"
        }
        
        response = self.make_request('POST', '/api/folders', json=folder_data)
        if response and response.status_code == 200:
            try:
                data = response.json()
                if 'folder_id' in data and data.get('name') == folder_data['name']:
                    self.log_test("POST Folders (Authenticated)", True, f"Created folder: {data.get('folder_id')}", response.status_code)
                    
                    # Test DELETE folder
                    folder_id = data.get('folder_id')
                    delete_response = self.make_request('DELETE', f'/api/folders/{folder_id}')
                    if delete_response and delete_response.status_code == 200:
                        self.log_test("DELETE Folder", True, f"Deleted folder: {folder_id}", delete_response.status_code)
                    else:
                        self.log_test("DELETE Folder", False, "Failed to delete folder", delete_response.status_code if delete_response else None)
                else:
                    self.log_test("POST Folders (Authenticated)", False, f"Invalid response format: {data}", response.status_code)
            except Exception as e:
                self.log_test("POST Folders (Authenticated)", False, f"JSON parsing failed: {e}", response.status_code)
        else:
            self.log_test("POST Folders (Authenticated)", False, "Failed to create folder", response.status_code if response else None)

    def test_media_patch_authenticated(self):
        """Test PATCH media endpoint with authentication"""
        print("\n🔍 Testing PATCH Media Endpoint - Authenticated...")
        
        # First create a media item to test PATCH on
        test_media = {
            "type": "screenshot",
            "title": f"Test Screenshot for PATCH {datetime.now().strftime('%H:%M:%S')}",
            "description": "Test screenshot for PATCH testing",
            "tags": ["test", "patch"],
            "file_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
            "format": "png",
            "width": 1,
            "height": 1
        }
        
        create_response = self.make_request('POST', '/api/media', json=test_media)
        if create_response and create_response.status_code == 200:
            try:
                created_media = create_response.json()
                media_id = created_media.get('media_id')
                
                # Test PATCH with various updates
                update_data = {
                    "title": "Updated Test Screenshot",
                    "description": "Updated description",
                    "tags": ["updated", "test"],
                    "is_public": True,
                    "expiration_date": "2024-12-31T23:59:59Z"
                }
                
                patch_response = self.make_request('PATCH', f'/api/media/{media_id}', json=update_data)
                if patch_response and patch_response.status_code == 200:
                    try:
                        updated_media = patch_response.json()
                        if updated_media.get('title') == update_data['title']:
                            self.log_test("PATCH Media (Authenticated)", True, f"Successfully updated media: {media_id}", patch_response.status_code)
                        else:
                            self.log_test("PATCH Media (Authenticated)", False, f"Update not applied correctly: {updated_media}", patch_response.status_code)
                    except Exception as e:
                        self.log_test("PATCH Media (Authenticated)", False, f"JSON parsing failed: {e}", patch_response.status_code)
                else:
                    self.log_test("PATCH Media (Authenticated)", False, f"PATCH request failed", patch_response.status_code if patch_response else None)
                    
            except Exception as e:
                self.log_test("PATCH Media Setup", False, f"Failed to parse create response: {e}", create_response.status_code)
        else:
            self.log_test("PATCH Media Setup", False, "Failed to create test media for PATCH", create_response.status_code if create_response else None)

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        try:
            import pymongo
            
            client = pymongo.MongoClient("mongodb://localhost:27017")
            db = client.screenmaster  # Use the correct database name
            
            # Delete test user and session
            if self.user_id:
                db.users.delete_one({"user_id": self.user_id})
                db.user_sessions.delete_one({"user_id": self.user_id})
                
            # Delete test media
            if self.test_media_id:
                db.media.delete_one({"media_id": self.test_media_id})
                
            self.log_test("Cleanup", True, "Test data cleaned up")
            
        except Exception as e:
            self.log_test("Cleanup", False, f"Cleanup failed: {e}")

    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting SnapRecord Pro Backend API Testing...")
        print(f"Base URL: {self.base_url}")
        
        # Test basic endpoints first
        self.test_health_check()
        
        # Test unauthenticated access to protected endpoints
        self.test_auth_unauthenticated()
        self.test_folders_unauthenticated()
        self.test_media_unauthenticated()
        self.test_stats_unauthenticated()
        self.test_auth_session_endpoint()
        
        # Setup authentication and test protected endpoints
        if self.setup_test_auth():
            self.test_auth_me()
            self.test_media_endpoints()
            self.test_media_patch_authenticated()
            self.test_folders_authenticated()
            self.test_stats_endpoint()
            self.test_ai_endpoints()
            self.cleanup_test_data()
        
        # Print summary
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"\n📊 Test Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Success rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("🎉 API testing completed successfully!")
            return 0
        else:
            print("⚠️  Some tests failed. Check the results above.")
            return 1

if __name__ == "__main__":
    tester = ScreenMasterAPITester()
    sys.exit(tester.run_all_tests())