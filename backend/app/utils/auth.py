from functools import wraps
from typing import Any, Callable

from flask import jsonify
from flask_login import current_user


def require_role(*roles: str) -> Callable:
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            if not current_user.is_authenticated:
                return jsonify({"error": "Authentication required"}), 401
            if current_user.role not in roles:
                return jsonify({"error": "Insufficient permissions"}), 403
            return f(*args, **kwargs)
        return wrapper
    return decorator


def admin_required(f: Callable) -> Callable:
    return require_role("admin")(f)
