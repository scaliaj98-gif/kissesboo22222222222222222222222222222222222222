#!/usr/bin/env python3
import requests

# Test the exact same logic as in the test class
def make_request_debug(method, url, **kwargs):
    headers = kwargs.get('headers', {})
    
    # Only set Content-Type for requests with body
    if method.upper() in ['POST', 'PUT', 'PATCH'] and 'json' in kwargs:
        headers.setdefault('Content-Type', 'application/json')
        
    if headers:  # Only set headers if we have any
        kwargs['headers'] = headers
    kwargs.setdefault('timeout', 30)
    
    try:
        print(f"Making {method} request to {url}")
        if headers:
            print(f"Headers: {headers}")
        response = getattr(requests, method.lower())(url, **kwargs)
        print(f"Response: {response.status_code}")
        return response
    except Exception as e:
        print(f"Request failed for {method} {url}: {e}")
        class MockResponse:
            def __init__(self, error_msg):
                self.status_code = None
                self.text = error_msg
            def json(self):
                return {"error": error_msg}
        return MockResponse(str(e))

base_url = "https://determined-lewin-4.preview.emergentagent.com"

# Test unauthenticated /api/auth/me
print("=== Test unauthenticated auth/me ===")
response = make_request_debug('GET', f'{base_url}/api/auth/me')
print(f"Status code: {response.status_code}")
print(f"Has status_code attr: {hasattr(response, 'status_code')}")
print(f"Status code is None: {response.status_code is None}")

if response and response.status_code is not None:
    print("SUCCESS: Response has valid status code")
else:
    print("FAILURE: Response missing or no status code")