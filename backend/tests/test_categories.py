def test_list_categories_seeds_defaults(client, auth_headers):
    resp = client.get("/api/categories", headers=auth_headers)
    assert resp.status_code == 200
    names = [c["name"] for c in resp.get_json()["categories"]]
    assert "Food" in names
    assert "Travel" in names
    assert len(names) >= 6


def test_create_category(client, auth_headers):
    resp = client.post("/api/categories", json={"name": "Health"}, headers=auth_headers)
    assert resp.status_code == 201
    assert resp.get_json()["category"]["name"] == "Health"


def test_create_duplicate_category(client, auth_headers):
    client.post("/api/categories", json={"name": "Health"}, headers=auth_headers)
    resp = client.post("/api/categories", json={"name": "Health"}, headers=auth_headers)
    assert resp.status_code == 409


def test_update_category(client, auth_headers):
    r = client.post("/api/categories", json={"name": "OldName"}, headers=auth_headers)
    cid = r.get_json()["category"]["id"]
    resp = client.put(f"/api/categories/{cid}", json={"name": "NewName"}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.get_json()["category"]["name"] == "NewName"


def test_update_nonexistent_category(client, auth_headers):
    resp = client.put("/api/categories/999", json={"name": "X"}, headers=auth_headers)
    assert resp.status_code == 404


def test_delete_category(client, auth_headers):
    r = client.post("/api/categories", json={"name": "Temp"}, headers=auth_headers)
    cid = r.get_json()["category"]["id"]
    resp = client.delete(f"/api/categories/{cid}", headers=auth_headers)
    assert resp.status_code == 200


def test_categories_unauthenticated(client):
    resp = client.get("/api/categories")
    assert resp.status_code == 401
    resp = client.post("/api/categories", json={"name": "X"})
    assert resp.status_code == 401


def test_categories_isolated_per_user(app):
    from app.api.auth import generate_token
    from app.models.user import User
    from app.extensions import db as _db

    # Setup: create users and tokens (inside app context)
    with app.app_context():
        u1 = User(email="u1@test.com", name="U1")
        u1.set_password("password123")
        u2 = User(email="u2@test.com", name="U2")
        u2.set_password("password123")
        _db.session.add_all([u1, u2])
        _db.session.commit()
        t1 = generate_token(u1)
        t2 = generate_token(u2)

    # App context is now POPPED.
    # Each test client request will create its own fresh app context.
    c = app.test_client()

    me1 = c.get("/api/auth/me", headers={"Authorization": f"Bearer {t1}"}).get_json()["user"]
    me2 = c.get("/api/auth/me", headers={"Authorization": f"Bearer {t2}"}).get_json()["user"]
    assert me1["email"] == "u1@test.com"
    assert me2["email"] == "u2@test.com"
    assert me1["id"] != me2["id"]

    r = c.post("/api/categories", json={"name": "Custom1"}, headers={"Authorization": f"Bearer {t1}"})
    assert r.status_code == 201

    cats1 = c.get("/api/categories", headers={"Authorization": f"Bearer {t1}"}).get_json()["categories"]
    cats2 = c.get("/api/categories", headers={"Authorization": f"Bearer {t2}"}).get_json()["categories"]
    names1 = {cat["name"] for cat in cats1}
    names2 = {cat["name"] for cat in cats2}
    assert "Custom1" in names1
    assert "Custom1" not in names2
