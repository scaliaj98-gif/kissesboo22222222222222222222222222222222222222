#!/usr/bin/env python3
import requests
import json

def test_endpoint(method, url, **kwargs):
    try:
        print(f"\nTesting {method} {url}")
        response = getattr(requests, method.lower())(url, timeout=30, **kwargs)
        print(f"Status: {response.status_code}")
        try:
            print(f"Response: {response.json()}")
        except:
            print(f"Response text: {response.text[:200]}")
        return response
    except Exception as e:
        print(f"Error: {e}")
        return None

base_url = "https://determined-lewin-4.preview.emergentagent.com"

# Test the problematic endpoints
print("=== Testing Unauthenticated Endpoints ===")
test_endpoint("GET", f"{base_url}/api/health")
test_endpoint("GET", f"{base_url}/api/auth/me")
test_endpoint("GET", f"{base_url}/api/folders")
test_endpoint("GET", f"{base_url}/api/media")
test_endpoint("GET", f"{base_url}/api/stats")

# Test POST endpoints
test_endpoint("POST", f"{base_url}/api/auth/session", json={})
test_endpoint("POST", f"{base_url}/api/folders", json={"name": "test"})
test_endpoint("PATCH", f"{base_url}/api/media/test123", json={"title": "test"})