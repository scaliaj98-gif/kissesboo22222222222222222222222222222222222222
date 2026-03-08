#!/usr/bin/env python3
import requests

# Simulate the exact conditions from my test
def test_logic():
    response = requests.get('https://determined-lewin-4.preview.emergentagent.com/api/auth/me', timeout=30)
    
    print(f"Response type: {type(response)}")
    print(f"Response: {response}")
    print(f"Has status_code: {hasattr(response, 'status_code')}")
    print(f"Status code: {response.status_code}")
    
    # Test both conditions
    print(f"response evaluation: {bool(response)}")
    print(f"hasattr(response, 'status_code'): {hasattr(response, 'status_code')}")
    
    # Combined condition
    condition_result = response and hasattr(response, 'status_code')
    print(f"Combined condition (response and hasattr(response, 'status_code')): {condition_result}")
    
    # Alternative condition
    condition_alt = hasattr(response, 'status_code') and response.status_code is not None
    print(f"Alternative condition: {condition_alt}")

test_logic()