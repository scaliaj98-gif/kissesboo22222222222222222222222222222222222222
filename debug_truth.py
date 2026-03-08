#!/usr/bin/env python3
import requests

response = requests.get('https://determined-lewin-4.preview.emergentagent.com/api/auth/me', timeout=30)
print(f"Response object: {response}")
print(f"Truth value: {bool(response)}")
print(f"Status code: {response.status_code}")
print(f"Response.ok: {response.ok}")

# Check 200 response
response_ok = requests.get('https://determined-lewin-4.preview.emergentagent.com/api/health', timeout=30)
print(f"\n200 Response object: {response_ok}")
print(f"200 Truth value: {bool(response_ok)}")
print(f"200 Status code: {response_ok.status_code}")
print(f"200 Response.ok: {response_ok.ok}")