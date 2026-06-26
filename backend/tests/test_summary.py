def test_summary_empty(client, auth_headers):
    resp = client.get("/api/summary", headers=auth_headers)
    data = resp.get_json()
    assert resp.status_code == 200
    assert data["total"] == 0
    assert data["average"] == 0
    assert data["count"] == 0
    assert data["categories"] == []
    assert data["recent"] == []


def test_summary_with_expenses(client, auth_headers):
    client.post("/api/expenses", json={
        "date": "2026-06-01", "category": "Food", "amount": 100,
    }, headers=auth_headers)
    client.post("/api/expenses", json={
        "date": "2026-06-02", "category": "Food", "amount": 50,
    }, headers=auth_headers)
    client.post("/api/expenses", json={
        "date": "2026-06-03", "category": "Travel", "amount": 200,
    }, headers=auth_headers)

    resp = client.get("/api/summary", headers=auth_headers)
    data = resp.get_json()
    assert data["total"] == 350
    assert data["count"] == 3
    assert len(data["categories"]) == 2
    assert len(data["recent"]) == 3


def test_summary_recent_limit(client, auth_headers):
    for i in range(10):
        client.post("/api/expenses", json={
            "date": "2026-06-01", "category": "Food", "amount": 10,
        }, headers=auth_headers)
    resp = client.get("/api/summary", headers=auth_headers)
    assert len(resp.get_json()["recent"]) == 5


def test_summary_unauthenticated(client):
    resp = client.get("/api/summary")
    assert resp.status_code == 401
