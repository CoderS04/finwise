import requests
import json

BASE_URL = "http://127.0.0.1:8000"

print("=" * 60)
print("Testing Finwise API - Register and Login")
print("=" * 60)

# Test data
test_user = {
    "email": "testuser@example.com",
    "password": "testpassword123"
}

# Test 1: Register
print("\n[TEST 1] Register a new user")
print("-" * 60)
print(f"Endpoint: POST {BASE_URL}/auth/register")
print(f"Payload: {json.dumps(test_user, indent=2)}")

try:
    response = requests.post(f"{BASE_URL}/auth/register", json=test_user)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print("✓ Registration successful!")
    else:
        print("✗ Registration failed!")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 2: Login with correct credentials
print("\n[TEST 2] Login with correct credentials")
print("-" * 60)
print(f"Endpoint: POST {BASE_URL}/auth/login")
print(f"Payload: {json.dumps(test_user, indent=2)}")

try:
    response = requests.post(f"{BASE_URL}/auth/login", json=test_user)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print("✓ Login successful!")
        token = response.json().get("access_token")
        if token:
            print(f"Access Token: {token[:50]}...")
    else:
        print("✗ Login failed!")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 3: Login with wrong password
print("\n[TEST 3] Login with wrong password")
print("-" * 60)
wrong_credentials = {
    "email": "testuser@example.com",
    "password": "wrongpassword"
}
print(f"Endpoint: POST {BASE_URL}/auth/login")
print(f"Payload: {json.dumps(wrong_credentials, indent=2)}")

try:
    response = requests.post(f"{BASE_URL}/auth/login", json=wrong_credentials)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 401:
        print("✓ Correctly rejected wrong password!")
    else:
        print("✗ Should have rejected wrong password!")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 4: Try to register the same email again
print("\n[TEST 4] Try to register the same email again")
print("-" * 60)
print(f"Endpoint: POST {BASE_URL}/auth/register")
print(f"Payload: {json.dumps(test_user, indent=2)}")

try:
    response = requests.post(f"{BASE_URL}/auth/register", json=test_user)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 400:
        print("✓ Correctly rejected duplicate email!")
    else:
        print("✗ Should have rejected duplicate email!")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 5: Root endpoint
print("\n[TEST 5] Test root endpoint")
print("-" * 60)
print(f"Endpoint: GET {BASE_URL}/")

try:
    response = requests.get(f"{BASE_URL}/")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print("✓ Root endpoint working!")
    else:
        print("✗ Root endpoint failed!")
except Exception as e:
    print(f"✗ Error: {e}")

print("\n" + "=" * 60)
print("Testing complete!")
print("=" * 60)
