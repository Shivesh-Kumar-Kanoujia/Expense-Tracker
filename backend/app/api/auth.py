from datetime import datetime, timezone, timedelta
from typing import Any, Optional

import jwt
from flask import Blueprint, request, jsonify, current_app
from flask_login import logout_user, login_required, current_user
from marshmallow import ValidationError
from app.extensions import db
from app.models.user import User, RefreshToken
from app.schemas.auth import RegisterSchema, LoginSchema
from app.utils.rate_limiter import rate_limit
from app.utils.auth import admin_required

auth_bp = Blueprint("auth", __name__)
register_schema = RegisterSchema()
login_schema = LoginSchema()


def _generate_access_token(user: User) -> str:
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": str(user.id),
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
        "iat": now,
        "exp": now + timedelta(seconds=current_app.config["JWT_ACCESS_TOKEN_EXPIRES"]),
        "iss": current_app.config["JWT_ISSUER"],
        "aud": current_app.config["JWT_AUDIENCE"],
        "type": "access",
    }
    return jwt.encode(payload, current_app.config["JWT_SECRET"], algorithm="HS256")


def _generate_refresh_token(user: User, device_info: Optional[str] = None, ip_address: Optional[str] = None) -> str:
    raw = RefreshToken.generate_token()
    hashed = RefreshToken.hash_token(raw)
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=current_app.config["JWT_REFRESH_TOKEN_EXPIRES"])

    db.session.add(RefreshToken(
        user_id=user.id,
        token_hash=hashed,
        device_info=device_info,
        ip_address=ip_address,
        expires_at=expires_at,
    ))
    db.session.commit()

    return raw


def _set_refresh_cookie(response: Any, token: str, expires_in: int) -> None:
    response.set_cookie(
        "refresh_token",
        token,
        httponly=True,
        secure=current_app.config["SECURE_COOKIE"],
        samesite="Lax",
        max_age=expires_in,
        path="/api/auth",
    )


def _clear_refresh_cookie(response: Any) -> None:
    response.set_cookie("refresh_token", "", httponly=True, secure=current_app.config["SECURE_COOKIE"],
                        samesite="Lax", max_age=0, path="/api/auth")


def _build_auth_response(user: User, refresh_raw: Optional[str] = None) -> tuple:
    access_token = _generate_access_token(user)
    data = {
        "user": user.to_dict(),
        "access_token": access_token,
        "token_type": "Bearer",
        "expires_in": current_app.config["JWT_ACCESS_TOKEN_EXPIRES"],
    }
    response = jsonify(data)
    if refresh_raw:
        _set_refresh_cookie(response, refresh_raw, current_app.config["JWT_REFRESH_TOKEN_EXPIRES"])
    return response, 200


def _read_refresh_token_from_request() -> Optional[str]:
    return request.cookies.get("refresh_token")


def _validate_refresh_token(raw: str) -> Optional[RefreshToken]:
    hashed = RefreshToken.hash_token(raw)
    token = db.session.execute(
        db.select(RefreshToken).filter(
            RefreshToken.token_hash == hashed,
            RefreshToken.revoked_at.is_(None),
            RefreshToken.expires_at > datetime.now(timezone.utc),
        )
    ).scalar()
    return token


@auth_bp.route("/register", methods=["POST"])
@rate_limit(max_requests=5, window_seconds=300)
def register() -> tuple:
    try:
        data = register_schema.load(request.get_json())
    except ValidationError as err:
        return jsonify({"error": err.messages}), 400

    if db.session.execute(db.select(User).filter_by(email=data["email"])).scalar():
        return jsonify({"error": "Email already registered"}), 409

    user = User(email=data["email"], name=data["name"])
    user.set_password(data["password"])
    db.session.add(user)
    db.session.commit()

    refresh_raw = _generate_refresh_token(user, ip_address=request.remote_addr)
    return _build_auth_response(user, refresh_raw)


@auth_bp.route("/login", methods=["POST"])
@rate_limit(max_requests=10, window_seconds=60)
def login() -> tuple:
    try:
        data = login_schema.load(request.get_json())
    except ValidationError as err:
        return jsonify({"error": err.messages}), 400

    user = db.session.execute(db.select(User).filter_by(email=data["email"])).scalar()
    if not user or not user.check_password(data["password"]):
        return jsonify({"error": "Invalid email or password"}), 401

    refresh_raw = _generate_refresh_token(
        user,
        device_info=request.headers.get("User-Agent", None),
        ip_address=request.remote_addr,
    )
    return _build_auth_response(user, refresh_raw)


@auth_bp.route("/refresh", methods=["POST"])
def refresh() -> tuple:
    raw = _read_refresh_token_from_request()
    if not raw:
        return jsonify({"error": "No refresh token provided"}), 401

    token_record = _validate_refresh_token(raw)
    if not token_record:
        response = jsonify({"error": "Invalid or expired refresh token"})
        _clear_refresh_cookie(response)
        return response, 401

    user = db.session.get(User, token_record.user_id)
    if not user:
        return jsonify({"error": "User not found"}), 401

    token_record.revoked_at = datetime.now(timezone.utc)

    new_refresh_raw = _generate_refresh_token(
        user,
        device_info=request.headers.get("User-Agent", None),
        ip_address=request.remote_addr,
    )
    db.session.commit()

    access_token = _generate_access_token(user)
    data = {
        "access_token": access_token,
        "token_type": "Bearer",
        "expires_in": current_app.config["JWT_ACCESS_TOKEN_EXPIRES"],
    }
    response = jsonify(data)
    _set_refresh_cookie(response, new_refresh_raw, current_app.config["JWT_REFRESH_TOKEN_EXPIRES"])
    return response, 200


@auth_bp.route("/logout", methods=["POST"])
@login_required
def logout() -> tuple:
    raw = _read_refresh_token_from_request()
    if raw:
        hashed = RefreshToken.hash_token(raw)
        token_record = db.session.execute(
            db.select(RefreshToken).filter(RefreshToken.token_hash == hashed)
        ).scalar()
        if token_record:
            token_record.revoked_at = datetime.now(timezone.utc)
            db.session.commit()

    logout_user()
    response = jsonify({"message": "Logged out successfully"})
    _clear_refresh_cookie(response)
    return response, 200


@auth_bp.route("/me", methods=["GET"])
@login_required
def me() -> tuple:
    return jsonify({"user": current_user.to_dict()})


@auth_bp.route("/sessions", methods=["GET"])
@login_required
def list_sessions() -> tuple:
    tokens: list[RefreshToken] = db.session.execute(
        db.select(RefreshToken)
        .filter(RefreshToken.user_id == current_user.id, RefreshToken.revoked_at.is_(None))
        .order_by(RefreshToken.created_at.desc())
    ).scalars().all()

    return jsonify({
        "sessions": [
            {
                "id": t.id,
                "device_info": t.device_info,
                "ip_address": t.ip_address,
                "created_at": t.created_at.isoformat(),
                "expires_at": t.expires_at.isoformat(),
            }
            for t in tokens
        ]
    })


@auth_bp.route("/sessions/<int:session_id>", methods=["DELETE"])
@login_required
def revoke_session(session_id: int) -> tuple:
    token_record = db.session.execute(
        db.select(RefreshToken).filter(
            RefreshToken.id == session_id,
            RefreshToken.user_id == current_user.id,
            RefreshToken.revoked_at.is_(None),
        )
    ).scalar()

    if not token_record:
        return jsonify({"error": "Session not found"}), 404

    token_record.revoked_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify({"message": "Session revoked"}), 200


@auth_bp.route("/admin/users", methods=["GET"])
@login_required
@admin_required
def admin_list_users() -> tuple:
    users: list[User] = db.session.execute(db.select(User).order_by(User.created_at.desc())).scalars().all()
    return jsonify({"users": [u.to_dict() for u in users]})


@auth_bp.route("/sessions/others", methods=["DELETE"])
@login_required
def revoke_other_sessions() -> tuple:
    now = datetime.now(timezone.utc)
    raw = _read_refresh_token_from_request()
    current_hashed = RefreshToken.hash_token(raw) if raw else None

    tokens = db.session.execute(
        db.select(RefreshToken).filter(
            RefreshToken.user_id == current_user.id,
            RefreshToken.revoked_at.is_(None),
        )
    ).scalars().all()

    for t in tokens:
        if current_hashed and t.token_hash == current_hashed:
            continue
        t.revoked_at = now

    db.session.commit()
    return jsonify({"message": "Other sessions revoked"}), 200
