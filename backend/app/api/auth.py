from datetime import datetime, timezone, timedelta
from typing import Any

import jwt
from flask import Blueprint, request, jsonify, current_app
from flask_login import logout_user, login_required, current_user
from marshmallow import ValidationError
from app.extensions import db
from app.models.user import User
from app.schemas.auth import RegisterSchema, LoginSchema
from app.utils.rate_limiter import rate_limit

auth_bp = Blueprint("auth", __name__)
register_schema = RegisterSchema()
login_schema = LoginSchema()


def generate_token(user: User) -> str:
    payload: dict[str, Any] = {
        "sub": str(user.id),
        "email": user.email,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(seconds=current_app.config["JWT_ACCESS_TOKEN_EXPIRES"]),
    }
    return jwt.encode(payload, current_app.config["JWT_SECRET"], algorithm="HS256")


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

    token = generate_token(user)

    return jsonify({"user": user.to_dict(), "token": token}), 201


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

    token = generate_token(user)

    return jsonify({"user": user.to_dict(), "token": token})


@auth_bp.route("/logout", methods=["POST"])
@login_required
def logout() -> tuple:
    logout_user()
    return jsonify({"message": "Logged out successfully"})


@auth_bp.route("/me", methods=["GET"])
@login_required
def me() -> tuple:
    return jsonify({"user": current_user.to_dict()})
