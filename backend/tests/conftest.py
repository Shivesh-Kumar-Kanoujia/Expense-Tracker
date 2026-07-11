from collections.abc import Generator
from typing import Any

import pytest
from flask import Flask
from flask.testing import FlaskClient
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.pool import StaticPool

from app import create_app
from app.extensions import db as _db
from app.utils.rate_limiter import _limits


@pytest.fixture(autouse=True)
def clear_rate_limits() -> Generator[Any, Any, None]:
    _limits.clear()
    yield


@pytest.fixture
def app() -> Generator[Flask, Any, None]:
    app = create_app()
    app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite://",
        "SQLALCHEMY_ENGINE_OPTIONS": {"poolclass": StaticPool, "connect_args": {"check_same_thread": False}},
        "SENTRY_DSN": "",
        "LOG_LEVEL": "CRITICAL",
    })

    with app.app_context():
        _db.create_all()

    yield app

    with app.app_context():
        _db.drop_all()


@pytest.fixture
def client(app: Flask) -> FlaskClient:
    return app.test_client()


@pytest.fixture
def auth_headers(client: FlaskClient) -> dict[str, str]:
    resp = client.post("/api/auth/register", json={
        "email": "test@test.com", "password": "password123", "name": "Test",
    })
    token = resp.get_json()["token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def db(app: Flask) -> Generator[SQLAlchemy, Any, None]:
    with app.app_context():
        yield _db
