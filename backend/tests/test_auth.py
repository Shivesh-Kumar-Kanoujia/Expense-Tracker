def test_register_success(client):
    resp = client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "password123",
        "name": "Test User",
    })
    data = resp.get_json()
    assert resp.status_code == 201
    assert "token" in data
    assert data["user"]["email"] == "test@example.com"
    assert data["user"]["name"] == "Test User"


def test_register_duplicate_email(client):
    client.post("/api/auth/register", json={
        "email": "dup@example.com", "password": "password123", "name": "User",
    })
    resp = client.post("/api/auth/register", json={
        "email": "dup@example.com", "password": "password123", "name": "User",
    })
    assert resp.status_code == 409
    assert "already registered" in resp.get_json()["error"]


def test_register_validation_error(client):
    resp = client.post("/api/auth/register", json={"email": "bad"})
    assert resp.status_code == 400


def test_login_success(client):
    client.post("/api/auth/register", json={
        "email": "login@example.com", "password": "password123", "name": "User",
    })
    resp = client.post("/api/auth/login", json={
        "email": "login@example.com", "password": "password123",
    })
    assert resp.status_code == 200
    assert "token" in resp.get_json()


def test_login_wrong_password(client):
    client.post("/api/auth/register", json={
        "email": "fail@example.com", "password": "password123", "name": "User",
    })
    resp = client.post("/api/auth/login", json={
        "email": "fail@example.com", "password": "wrongpass",
    })
    assert resp.status_code == 401


def test_login_nonexistent_email(client):
    resp = client.post("/api/auth/login", json={
        "email": "nobody@example.com", "password": "password123",
    })
    assert resp.status_code == 401


def test_me_authenticated(client):
    resp = client.post("/api/auth/register", json={
        "email": "me@example.com", "password": "password123", "name": "Me",
    })
    token = resp.get_json()["token"]
    resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.get_json()["user"]["email"] == "me@example.com"


def test_me_unauthenticated(client):
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401


def test_logout(client):
    resp = client.post("/api/auth/register", json={
        "email": "logout@example.com", "password": "password123", "name": "User",
    })
    token = resp.get_json()["token"]
    resp = client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
