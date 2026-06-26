def test_create_expense(client, auth_headers):
    resp = client.post("/api/expenses", json={
        "date": "2026-06-24", "category": "Food", "amount": 15.50,
    }, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.get_json()["expense"]
    assert data["category"] == "Food"
    assert data["amount"] == 15.50


def test_create_expense_validation(client, auth_headers):
    resp = client.post("/api/expenses", json={"date": "bad-date"}, headers=auth_headers)
    assert resp.status_code == 400


def test_list_expenses(client, auth_headers):
    client.post("/api/expenses", json={
        "date": "2026-06-24", "category": "Food", "amount": 10,
    }, headers=auth_headers)
    resp = client.get("/api/expenses", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.get_json()
    assert len(data["expenses"]) == 1
    assert data["total"] == 1
    assert data["page"] == 1


def test_list_expenses_pagination(client, auth_headers):
    for i in range(5):
        client.post("/api/expenses", json={
            "date": "2026-06-24", "category": "Food", "amount": 10 + i,
        }, headers=auth_headers)
    resp = client.get("/api/expenses?page=1&per_page=2", headers=auth_headers)
    data = resp.get_json()
    assert len(data["expenses"]) == 2
    assert data["total"] == 5
    assert data["pages"] == 3


def test_list_expenses_filter_category(client, auth_headers):
    client.post("/api/expenses", json={
        "date": "2026-06-24", "category": "Food", "amount": 10,
    }, headers=auth_headers)
    client.post("/api/expenses", json={
        "date": "2026-06-24", "category": "Travel", "amount": 20,
    }, headers=auth_headers)
    resp = client.get("/api/expenses?category=Food", headers=auth_headers)
    data = resp.get_json()
    assert len(data["expenses"]) == 1
    assert data["expenses"][0]["category"] == "Food"


def test_list_expenses_filter_date_range(client, auth_headers):
    client.post("/api/expenses", json={
        "date": "2026-06-01", "category": "Food", "amount": 10,
    }, headers=auth_headers)
    client.post("/api/expenses", json={
        "date": "2026-06-30", "category": "Food", "amount": 20,
    }, headers=auth_headers)
    resp = client.get("/api/expenses?date_from=2026-06-15&date_to=2026-07-01", headers=auth_headers)
    data = resp.get_json()
    assert len(data["expenses"]) == 1


def test_get_expense(client, auth_headers):
    create_resp = client.post("/api/expenses", json={
        "date": "2026-06-24", "category": "Food", "amount": 25,
    }, headers=auth_headers)
    eid = create_resp.get_json()["expense"]["id"]
    resp = client.get(f"/api/expenses/{eid}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.get_json()["expense"]["amount"] == 25


def test_get_expense_not_found(client, auth_headers):
    resp = client.get("/api/expenses/999", headers=auth_headers)
    assert resp.status_code == 404


def test_get_expense_other_user(app, client):
    c1 = app.test_client()
    c2 = app.test_client()

    def register(c, email):
        r = c.post("/api/auth/register", json={
            "email": email, "password": "password123", "name": "User",
        })
        return {"Authorization": f"Bearer {r.get_json()['token']}"}

    t1 = register(c1, "user1@test.com")
    t2 = register(c2, "user2@test.com")

    r = c1.post("/api/expenses", json={
        "date": "2026-06-24", "category": "Food", "amount": 50,
    }, headers=t1)
    eid = r.get_json()["expense"]["id"]

    resp = c2.get(f"/api/expenses/{eid}", headers=t2)
    assert resp.status_code == 404


def test_update_expense(client, auth_headers):
    r = client.post("/api/expenses", json={
        "date": "2026-06-24", "category": "Food", "amount": 10,
    }, headers=auth_headers)
    eid = r.get_json()["expense"]["id"]

    resp = client.put(f"/api/expenses/{eid}", json={"amount": 30.0}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.get_json()["expense"]["amount"] == 30.0


def test_delete_expense(client, auth_headers):
    r = client.post("/api/expenses", json={
        "date": "2026-06-24", "category": "Food", "amount": 10,
    }, headers=auth_headers)
    eid = r.get_json()["expense"]["id"]

    resp = client.delete(f"/api/expenses/{eid}", headers=auth_headers)
    assert resp.status_code == 200

    resp = client.get("/api/expenses", headers=auth_headers)
    assert resp.get_json()["total"] == 0


def test_expenses_unauthenticated(client):
    resp = client.get("/api/expenses")
    assert resp.status_code == 401

    resp = client.post("/api/expenses", json={"date": "2026-01-01", "category": "Food", "amount": 10})
    assert resp.status_code == 401
