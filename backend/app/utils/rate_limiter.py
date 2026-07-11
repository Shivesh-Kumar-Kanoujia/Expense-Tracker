import time
from collections.abc import Callable
from functools import wraps
from typing import Any

from flask import jsonify, request

_limits: dict[str, list[float]] = {}


def rate_limit(max_requests: int = 10, window_seconds: int = 60) -> Callable:
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            key = f"{request.remote_addr}:{request.path}"
            now = time.time()
            timestamps = _limits.get(key, [])

            timestamps = [t for t in timestamps if now - t < window_seconds]
            _limits[key] = timestamps

            if len(timestamps) >= max_requests:
                return jsonify({"error": f"Rate limit exceeded. Try again in {window_seconds}s"}), 429

            _limits[key].append(now)
            return f(*args, **kwargs)
        return wrapper
    return decorator
