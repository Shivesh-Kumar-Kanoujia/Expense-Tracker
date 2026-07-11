import time
from collections.abc import Callable
from functools import wraps
from typing import Any

from flask import current_app, jsonify, request

_attempts: dict[str, list[float]] = {}
MAX_ATTEMPTS = 5
WINDOW_SECONDS = 600


def get_login_key(email: str) -> str:
    return f"login:{email}"


def record_failed_attempt(email: str) -> None:
    key = get_login_key(email)
    now = time.time()
    timestamps = _attempts.get(key, [])
    timestamps = [t for t in timestamps if now - t < WINDOW_SECONDS]
    timestamps.append(now)
    _attempts[key] = timestamps


def clear_attempts(email: str) -> None:
    key = get_login_key(email)
    _attempts.pop(key, None)


def is_login_blocked(email: str) -> bool:
    key = get_login_key(email)
    now = time.time()
    timestamps = _attempts.get(key, [])
    timestamps = [t for t in timestamps if now - t < WINDOW_SECONDS]
    _attempts[key] = timestamps
    return len(timestamps) >= MAX_ATTEMPTS


def login_rate_limit(f: Callable) -> Callable:
    @wraps(f)
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        data = request.get_json(silent=True) or {}
        email = data.get("email", "")
        if email and is_login_blocked(email):
            current_app.logger.warning("login_blocked", extra={"email": email})
            return jsonify({
                "error": "Too many login attempts. Please try again in 10 minutes."
            }), 429
        return f(*args, **kwargs)
    return wrapper
