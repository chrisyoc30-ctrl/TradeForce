#!/usr/bin/env python3
"""
Comprehensive test script for the TradeScore Flask API
Tests all endpoints in logical order
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:5000"
API_KEY = "change-me-in-production"

# ANSI colors for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_test(name):
    print(f"\n{BLUE}{'='*60}")
    print(f"TEST: {name}")
    print(f"{'='*60}{RESET}")

def print_success(msg):
    print(f"{GREEN}✓ {msg}{RESET}")

def print_error(msg):
    print(f"{RED}✗ {msg}{RESET}")

def print_info(msg):
    print(f"{YELLOW}ℹ {msg}{RESET}")

def print_response(response):
    print(f"\nStatus: {response.status_code}")
    try:
        print(f"Response:\n{json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response: {response.text}")

def test_health():
    """Test 1: Health check"""
    print_test("Health Check")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print_response(response)
        if response.status_code == 200:
            print_success("Health check passed")
            return True
        else:
            print_error("Health check failed")
            return False
    except Exception as e:
        print_error(f"Connection error: {e}")
        return False

def test_signup():
    """Test 2: Signup"""
    print_test("Signup - Create New Customer")
    
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    email = f"test_plumber_{timestamp}@example.com"
    
    payload = {
        "email": email,
        "password": "TestPassword123",
        "name": "John Plumber",
        "phone": "07700123456",
        "trade": "Plumbing",
        "postcode": "G1 1AA"
    }
    
    print_info(f"Signing up: {email}")
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/signup", json=payload)
        print_response(response)
        
        if response.status_code == 201:
            data = response.json()
            if 'token' in data and 'customer_id' in data:
                print_success(f"Signup successful - Customer ID: {data['customer_id']}")
                return {
                    'email': email,
                    'password': 'TestPassword123',
                    'customer_id': data['customer_id'],
                    'token': data['token']
                }
            else:
                print_error("Signup response missing token or customer_id")
                return None
        else:
            print_error(f"Signup failed with status {response.status_code}")
            return None
    except Exception as e:
        print_error(f"Signup error: {e}")
        return None

def test_login(customer_data):
    """Test 3: Login"""
    print_test("Login - Authenticate Customer")
    
    payload = {
        "email": customer_data['email'],
        "password": customer_data['password']
    }
    
    print_info(f"Logging in: {customer_data['email']}")
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json=payload)
        print_response(response)
        
        if response.status_code == 200:
            data = response.json()
            if 'token' in data:
                print_success(f"Login successful - Token received")
                customer_data['login_token'] = data['token']
                return True
            else:
                print_error("Login response missing token")
                return False
        else:
            print_error(f"Login failed with status {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Login error: {e}")
        return False

def test_get_profile(customer_data):
    """Test 4: Get Customer Profile"""
    print_test("Get Customer Profile")
    
    headers = {'Authorization': customer_data['token']}
    
    try:
        response = requests.get(f"{BASE_URL}/api/customer/profile", headers=headers)
        print_response(response)
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Profile retrieved - {data['name']} ({data['email']})")
            print_info(f"Free leads remaining: {data['free_leads_remaining']}")
            return True
        else:
            print_error(f"Get profile failed with status {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Get profile error: {e}")
        return False

def test_submit_lead():
    """Test 5: Submit a Lead (Public endpoint)"""
    print_test("Submit Lead - Create New Lead")
    
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    
    payload = {
        "name": "Sarah Johnson",
        "email": f"sarah_{timestamp}@homeowner.com",
        "phone": "07700654321",
        "service": "Plumbing",
        "location": "Glasgow G1",
        "description": "Urgent: Burst pipe in kitchen, need ASAP"
    }
    
    print_info(f"Submitting lead for {payload['service']}")
    
    try:
        response = requests.post(f"{BASE_URL}/api/submit-lead", json=payload)
        print_response(response)
        
        if response.status_code == 201:
            data = response.json()
            if 'lead_id' in data:
                print_success(f"Lead submitted - Lead ID: {data['lead_id']}")
                return data['lead_id']
            else:
                print_error("Submit lead response missing lead_id")
                return None
        else:
            print_error(f"Submit lead failed with status {response.status_code}")
            return None
    except Exception as e:
        print_error(f"Submit lead error: {e}")
        return None

def test_score_all_leads():
    """Test 6: Score All Leads (Admin endpoint)"""
    print_test("Score All Leads - Admin Endpoint")
    
    headers = {'X-API-Key': API_KEY}
    
    try:
        response = requests.post(f"{BASE_URL}/api/score-all-leads", headers=headers)
        print_response(response)
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Leads scored - {data.get('scored', 0)} leads updated")
            return True
        else:
            print_error(f"Score all leads failed with status {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Score all leads error: {e}")
        return False

def test_get_customer_leads(customer_data):
    """Test 7: Get Customer's Available Leads"""
    print_test("Get Customer Leads - Available Leads for Customer")
    
    headers = {'Authorization': customer_data['token']}
    
    try:
        response = requests.get(f"{BASE_URL}/api/customer/leads", headers=headers)
        print_response(response)
        
        if response.status_code == 200:
            data = response.json()
            lead_count = data.get('count', 0)
            print_success(f"Customer leads retrieved - {lead_count} available leads")
            
            if lead_count > 0:
                first_lead = data['leads'][0]
                print_info(f"First lead: {first_lead['name']} - Score: {first_lead.get('score', 'N/A')}")
                return first_lead['id']
            else:
                print_info("No leads available for this customer")
                return None
        else:
            print_error(f"Get customer leads failed with status {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Get customer leads error: {e}")
        return False

def test_get_lead_details(customer_data, lead_id):
    """Test 8: Get Lead Details"""
    print_test(f"Get Lead Details - Lead ID: {lead_id}")
    
    headers = {'Authorization': customer_data['token']}
    
    try:
        response = requests.get(f"{BASE_URL}/api/customer/leads/{lead_id}", headers=headers)
        print_response(response)
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Lead details retrieved - {data['name']}")
            print_info(f"Service: {data['service']}, Location: {data['location']}")
            print_info(f"Score: {data.get('score', 'N/A')}")
            return True
        else:
            print_error(f"Get lead details failed with status {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Get lead details error: {e}")
        return False

def test_claim_lead(customer_data, lead_id):
    """Test 9: Claim a Lead"""
    print_test(f"Claim Lead - Lead ID: {lead_id}")
    
    headers = {'Authorization': customer_data['token']}
    
    try:
        response = requests.post(f"{BASE_URL}/api/customer/leads/{lead_id}/claim", headers=headers)
        print_response(response)
        
        if response.status_code == 200:
            print_success(f"Lead claimed successfully")
            return True
        else:
            print_error(f"Claim lead failed with status {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Claim lead error: {e}")
        return False

def test_get_all_leads_admin():
    """Test 10: Get All Leads (Admin endpoint)"""
    print_test("Get All Leads - Admin Endpoint")
    
    headers = {'X-API-Key': API_KEY}
    
    try:
        response = requests.get(f"{BASE_URL}/api/get-leads", headers=headers)
        print_response(response)
        
        if response.status_code == 200:
            data = response.json()
            lead_count = len(data.get('leads', []))
            print_success(f"Admin leads retrieved - {lead_count} total leads in system")
            return True
        else:
            print_error(f"Get all leads failed with status {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Get all leads error: {e}")
        return False

def main():
    print(f"\n{YELLOW}{'='*60}")
    print("TRADEFORCE API - COMPREHENSIVE TEST SUITE")
    print(f"{'='*60}{RESET}")
    print(f"Base URL: {BASE_URL}")
    print(f"Timestamp: {datetime.utcnow().isoformat()}")
    
    results = {}
    
    # Test 1: Health
    results['health'] = test_health()
    if not results['health']:
        print_error("Cannot proceed - Flask server not responding")
        return
    
    # Test 2: Signup
    customer_data = test_signup()
    results['signup'] = customer_data is not None
    if not customer_data:
        print_error("Cannot proceed - Signup failed")
        return
    
    # Test 3: Login
    results['login'] = test_login(customer_data)
    
    # Test 4: Get Profile
    results['get_profile'] = test_get_profile(customer_data)
    
    # Test 5: Submit Lead
    lead_id = test_submit_lead()
    results['submit_lead'] = lead_id is not None
    
    # Test 6: Score All Leads
    results['score_all_leads'] = test_score_all_leads()
    
    # Test 7: Get Customer Leads
    available_lead_id = test_get_customer_leads(customer_data)
    results['get_customer_leads'] = available_lead_id is not None
    
    # Test 8: Get Lead Details (if we have a lead)
    if available_lead_id:
        results['get_lead_details'] = test_get_lead_details(customer_data, available_lead_id)
        
        # Test 9: Claim Lead
        results['claim_lead'] = test_claim_lead(customer_data, available_lead_id)
    
    # Test 10: Get All Leads (Admin)
    results['get_all_leads_admin'] = test_get_all_leads_admin()
    
    # Summary
    print(f"\n{BLUE}{'='*60}")
    print("TEST SUMMARY")
    print(f"{'='*60}{RESET}")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = f"{GREEN}PASS{RESET}" if result else f"{RED}FAIL{RESET}"
        print(f"{test_name.ljust(25)} {status}")
    
    print(f"\n{YELLOW}Total: {passed}/{total} tests passed{RESET}")
    
    if passed == total:
        print(f"{GREEN}✓ ALL TESTS PASSED - API IS READY FOR FRONTEND INTEGRATION{RESET}")
    else:
        print(f"{RED}✗ SOME TESTS FAILED - REVIEW ERRORS ABOVE{RESET}")

if __name__ == "__main__":
    main()