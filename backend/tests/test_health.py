def test_health_endpoint(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["status"] == "ok"
    assert data["database"] == "connected"


def test_404_handler(client):
    resp = client.get("/api/nonexistent")
    assert resp.status_code == 404
    assert resp.get_json()["error"] == "Not found"
