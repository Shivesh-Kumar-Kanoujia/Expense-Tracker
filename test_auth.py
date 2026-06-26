import urllib.request
import json

def test_auth():
    req = urllib.request.Request("http://localhost:5000/api/auth/register", data=json.dumps({"email": "test@test.com", "password": "password", "name": "Test"}).encode(), headers={"Content-Type": "application/json"})
    try:
        res = urllib.request.urlopen(req)
        data = json.loads(res.read())
        token = data.get("token")
        print("Register token:", token)
    except Exception as e:
        print("Register error:", e)
        # Maybe already registered
        req = urllib.request.Request("http://localhost:5000/api/auth/login", data=json.dumps({"email": "test@test.com", "password": "password"}).encode(), headers={"Content-Type": "application/json"})
        res = urllib.request.urlopen(req)
        data = json.loads(res.read())
        token = data.get("token")
        print("Login token:", token)
        
    req = urllib.request.Request("http://localhost:5000/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    try:
        res = urllib.request.urlopen(req)
        print("ME response:", res.read())
    except Exception as e:
        print("ME error:", e)
        try:
            print(e.read())
        except:
            pass

test_auth()
