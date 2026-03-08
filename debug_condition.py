#!/usr/bin/env python3
import requests

# Test exact condition
response = requests.get('https://determined-lewin-4.preview.emergentagent.com/api/auth/me', timeout=30)
print(f"Response: {response}")
print(f"Status code: {response.status_code}")
print(f"Type of status code: {type(response.status_code)}")
print(f"response is not None: {response is not None}")
print(f"response.status_code is not None: {response.status_code is not None}")
print(f"Combined condition: {response and response.status_code is not None}")

# The actual test logic
if response and response.status_code is not None:
    print("SUCCESS - Condition passed")
else:
    print("FAILURE - Condition failed")
    print(f"response truth value: {bool(response)}")
    print(f"status_code is not None: {response.status_code is not None if response else 'N/A'}")