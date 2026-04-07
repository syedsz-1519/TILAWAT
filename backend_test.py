#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class TilawaAPITester:
    def __init__(self, base_url="https://islamic-verse-reader.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.session_id = f"test_session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=30):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                    elif isinstance(response_data, dict):
                        print(f"   Response keys: {list(response_data.keys())}")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")

            return success, response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test basic health endpoint"""
        return self.run_test("Health Check", "GET", "health", 200)

    def test_get_surahs(self):
        """Test getting all 114 surahs"""
        success, response = self.run_test("Get All Surahs", "GET", "surahs", 200)
        if success and isinstance(response, list):
            if len(response) == 114:
                print(f"   ✅ Correct number of surahs: {len(response)}")
                # Check first surah structure
                if response[0].get('number') == 1 and 'name' in response[0]:
                    print(f"   ✅ Surah structure looks correct")
                    print(f"   First surah: {response[0].get('englishName', 'N/A')}")
                else:
                    print(f"   ⚠️  Surah structure may be incorrect")
            else:
                print(f"   ❌ Expected 114 surahs, got {len(response)}")
                success = False
        return success

    def test_get_surah_details(self):
        """Test getting specific surah (Al-Fatiha)"""
        success, response = self.run_test("Get Surah 1 (Al-Fatiha)", "GET", "surah/1", 200)
        if success and isinstance(response, dict):
            if 'info' in response and 'verses' in response:
                verses = response['verses']
                if len(verses) == 7:  # Al-Fatiha has 7 verses
                    print(f"   ✅ Al-Fatiha has correct number of verses: {len(verses)}")
                    # Check verse structure
                    if verses[0].get('arabic') and verses[0].get('translation_en'):
                        print(f"   ✅ Verse structure includes Arabic and translation")
                    else:
                        print(f"   ⚠️  Verse structure may be incomplete")
                else:
                    print(f"   ❌ Expected 7 verses for Al-Fatiha, got {len(verses)}")
                    success = False
            else:
                print(f"   ❌ Response missing 'info' or 'verses' keys")
                success = False
        return success

    def test_get_tajweed_lessons(self):
        """Test getting tajweed lessons"""
        success, response = self.run_test("Get Tajweed Lessons", "GET", "tajweed/lessons", 200)
        if success and isinstance(response, list):
            if len(response) == 5:
                print(f"   ✅ Correct number of tajweed lessons: {len(response)}")
                # Check lesson structure
                lesson_names = [lesson.get('name') for lesson in response]
                expected_names = ['Ikhfa', 'Idgham', 'Iqlab', 'Qalqalah', 'Ghunnah']
                if all(name in lesson_names for name in expected_names):
                    print(f"   ✅ All expected lesson names found")
                else:
                    print(f"   ⚠️  Some lesson names may be missing")
            else:
                print(f"   ❌ Expected 5 lessons, got {len(response)}")
                success = False
        return success

    def test_ai_chat(self):
        """Test AI chat functionality"""
        test_message = "What is the meaning of Al-Fatiha?"
        success, response = self.run_test(
            "AI Chat", 
            "POST", 
            "chat", 
            200,
            data={"message": test_message, "session_id": self.session_id}
        )
        if success and isinstance(response, dict):
            if 'response' in response and 'session_id' in response:
                ai_response = response['response']
                if len(ai_response) > 10:  # Basic check for meaningful response
                    print(f"   ✅ AI responded with meaningful content ({len(ai_response)} chars)")
                    print(f"   AI Response preview: {ai_response[:100]}...")
                else:
                    print(f"   ⚠️  AI response seems too short")
            else:
                print(f"   ❌ Response missing 'response' or 'session_id' keys")
                success = False
        return success

    def test_specific_verse(self):
        """Test getting a specific verse"""
        success, response = self.run_test("Get Specific Verse (1:1)", "GET", "verse/1/1", 200)
        if success and isinstance(response, dict):
            if response.get('arabic') and response.get('surah') == 1 and response.get('ayah') == 1:
                print(f"   ✅ Verse data structure correct")
                print(f"   Arabic text: {response.get('arabic', '')[:50]}...")
            else:
                print(f"   ⚠️  Verse structure may be incomplete")
        return success

    def test_search_functionality(self):
        """Test Quran search"""
        success, response = self.run_test("Search Quran", "GET", "search?q=Allah", 200)
        if success:
            if isinstance(response, dict) and 'count' in response:
                print(f"   ✅ Search returned structured response")
                print(f"   Search results count: {response.get('count', 0)}")
            else:
                print(f"   ⚠️  Search response structure unexpected")
        return success

    def test_invalid_endpoints(self):
        """Test error handling for invalid requests"""
        # Test invalid surah number
        success1, _ = self.run_test("Invalid Surah (999)", "GET", "surah/999", 400)
        
        # Test invalid verse
        success2, _ = self.run_test("Invalid Verse", "GET", "verse/1/999", 404)
        
        return success1 and success2

def main():
    print("🕌 TILAWA API Testing Suite")
    print("=" * 50)
    
    tester = TilawaAPITester()
    
    # Run all tests
    test_results = []
    
    print("\n📡 Basic Connectivity Tests")
    test_results.append(tester.test_health_check())
    
    print("\n📖 Quran Data Tests")
    test_results.append(tester.test_get_surahs())
    test_results.append(tester.test_get_surah_details())
    test_results.append(tester.test_specific_verse())
    test_results.append(tester.test_search_functionality())
    
    print("\n🎓 Tajweed Tests")
    test_results.append(tester.test_get_tajweed_lessons())
    
    print("\n🤖 AI Integration Tests")
    test_results.append(tester.test_ai_chat())
    
    print("\n🚫 Error Handling Tests")
    test_results.append(tester.test_invalid_endpoints())
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed! Backend API is working correctly.")
        return 0
    else:
        print("⚠️  Some tests failed. Check the details above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())