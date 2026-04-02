#!/usr/bin/env python3
"""
TILAWA Backend API Testing Suite
Tests all backend endpoints for the Islamic EdTech Quran learning platform
"""

import requests
import sys
import json
from datetime import datetime

class TilawaAPITester:
    def __init__(self, base_url="https://mushaf-hub.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        self.log(f"🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params or {}, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}")
                self.log(f"   Response: {response.text[:200]}")
                self.failed_tests.append({
                    "test": name,
                    "endpoint": endpoint,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })
                return False, {}

        except Exception as e:
            self.log(f"❌ {name} - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "endpoint": endpoint,
                "error": str(e)
            })
            return False, {}

    def test_root_endpoint(self):
        """Test API root endpoint"""
        return self.run_test("API Root", "GET", "/", 200)

    def test_surahs_endpoint(self):
        """Test surahs listing endpoint"""
        success, data = self.run_test("Get Surahs", "GET", "/surahs", 200)
        if success:
            surahs = data.get("surahs", [])
            total = data.get("total", 0)
            if len(surahs) == 114 and total == 114:
                self.log(f"✅ Surahs count correct: {total}")
                return True, data
            else:
                self.log(f"❌ Expected 114 surahs, got {len(surahs)}")
                return False, data
        return False, {}

    def test_single_surah(self, surah_id=1):
        """Test single surah endpoint"""
        return self.run_test(f"Get Surah {surah_id}", "GET", f"/surahs/{surah_id}", 200)

    def test_verses_endpoint(self, surah_id=1):
        """Test verses for a surah"""
        success, data = self.run_test(f"Get Verses for Surah {surah_id}", "GET", f"/surahs/{surah_id}/verses", 200)
        if success:
            verses = data.get("verses", [])
            if verses:
                # Check if verses have required fields
                first_verse = verses[0]
                required_fields = ["verse_key", "text_uthmani", "translation_en", "words"]
                missing_fields = [field for field in required_fields if field not in first_verse]
                if not missing_fields:
                    self.log(f"✅ Verses have required fields")
                    return True, data
                else:
                    self.log(f"❌ Missing fields in verses: {missing_fields}")
            else:
                self.log(f"❌ No verses returned for surah {surah_id}")
        return success, data

    def test_audio_timings(self, surah_id=1):
        """Test audio timings endpoint"""
        return self.run_test(f"Get Audio Timings for Surah {surah_id}", "GET", f"/audio-timings/{surah_id}", 200)

    def test_search_endpoint(self):
        """Test search functionality"""
        return self.run_test("Search Verses", "GET", "/search", 200, params={"q": "mercy"})

    def test_bookmarks_crud(self):
        """Test bookmark CRUD operations"""
        # Test GET bookmarks (empty initially)
        success, data = self.run_test("Get Bookmarks", "GET", "/bookmarks", 200)
        if not success:
            return False

        # Test CREATE bookmark
        bookmark_data = {
            "verse_key": "1:1",
            "note": "Test bookmark",
            "surah_name": "Al-Fatihah",
            "text_uthmani": "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
            "translation_en": "In the name of Allah, the Entirely Merciful, the Especially Merciful."
        }
        success, created = self.run_test("Create Bookmark", "POST", "/bookmarks", 200, data=bookmark_data)
        if not success:
            return False

        bookmark_id = created.get("id")
        if not bookmark_id:
            self.log("❌ No bookmark ID returned")
            return False

        # Test GET bookmarks (should have 1 now)
        success, data = self.run_test("Get Bookmarks After Create", "GET", "/bookmarks", 200)
        if success:
            bookmarks = data.get("bookmarks", [])
            if len(bookmarks) >= 1:
                self.log(f"✅ Bookmark created successfully")
            else:
                self.log(f"❌ Bookmark not found after creation")
                return False

        # Test DELETE bookmark
        success, _ = self.run_test("Delete Bookmark", "DELETE", f"/bookmarks/{bookmark_id}", 200)
        return success

    def test_tajweed_rules(self):
        """Test tajweed rules endpoint"""
        success, data = self.run_test("Get Tajweed Rules", "GET", "/tajweed/rules", 200)
        if success:
            rules = data.get("rules", [])
            if len(rules) == 7:
                self.log(f"✅ Correct number of tajweed rules: {len(rules)}")
                return True, data
            else:
                self.log(f"❌ Expected 7 tajweed rules, got {len(rules)}")
        return success, data

    def test_tajweed_session(self):
        """Test tajweed session creation"""
        session_data = {"verse_key": "1:1"}
        success, data = self.run_test("Create Tajweed Session", "POST", "/tajweed/sessions", 200, data=session_data)
        if success:
            session_id = data.get("id")
            if session_id:
                # Test getting the session
                success2, _ = self.run_test("Get Tajweed Session", "GET", f"/tajweed/sessions/{session_id}", 200)
                return success2
        return success

    def test_reciters_endpoint(self):
        """Test reciters endpoint"""
        return self.run_test("Get Reciters", "GET", "/reciters", 200)

    def run_all_tests(self):
        """Run all backend tests"""
        self.log("🚀 Starting TILAWA Backend API Tests")
        self.log(f"🌐 Testing against: {self.base_url}")
        
        # Test basic endpoints
        self.test_root_endpoint()
        
        # Test surahs
        self.test_surahs_endpoint()
        self.test_single_surah(1)  # Al-Fatihah
        
        # Test verses
        self.test_verses_endpoint(1)  # Al-Fatihah verses
        
        # Test audio
        self.test_audio_timings(1)
        
        # Test search
        self.test_search_endpoint()
        
        # Test bookmarks CRUD
        self.test_bookmarks_crud()
        
        # Test tajweed
        self.test_tajweed_rules()
        self.test_tajweed_session()
        
        # Test reciters
        self.test_reciters_endpoint()
        
        # Print summary
        self.log("\n" + "="*50)
        self.log(f"📊 Test Summary:")
        self.log(f"   Total Tests: {self.tests_run}")
        self.log(f"   Passed: {self.tests_passed}")
        self.log(f"   Failed: {len(self.failed_tests)}")
        self.log(f"   Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.failed_tests:
            self.log("\n❌ Failed Tests:")
            for test in self.failed_tests:
                error_msg = test.get('error', f"Status {test.get('actual')} != {test.get('expected')}")
                self.log(f"   - {test['test']}: {error_msg}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = TilawaAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())