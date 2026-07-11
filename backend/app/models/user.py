import hashlib
import secrets
from datetime import UTC, datetime
from typing import Any

from flask_login import UserMixin
from werkzeug.security import check_password_hash, generate_password_hash

from app.extensions import db


class User(UserMixin, db.Model):
    __tablename__ = "users"

    id: int = db.Column(db.Integer, primary_key=True)
    email: str = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash: str = db.Column(db.String(255), nullable=False)
    name: str = db.Column(db.String(100), nullable=False)
    email_verified: bool = db.Column(db.Boolean, default=False)
    role: str = db.Column(db.String(20), default="user")
    created_at: datetime = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(UTC))

    expenses = db.relationship("Expense", backref="user", lazy="dynamic", cascade="all, delete-orphan")
    refresh_tokens = db.relationship("RefreshToken", backref="user", lazy="dynamic", cascade="all, delete-orphan")

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "email_verified": self.email_verified,
            "role": self.role,
            "created_at": self.created_at.isoformat(),
        }


class RefreshToken(db.Model):
    __tablename__ = "refresh_tokens"

    id: int = db.Column(db.Integer, primary_key=True)
    user_id: int = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    token_hash: str = db.Column(db.String(255), nullable=False)
    device_info: str | None = db.Column(db.String(255), nullable=True)
    ip_address: str | None = db.Column(db.String(45), nullable=True)
    expires_at: datetime = db.Column(db.DateTime, nullable=False)
    created_at: datetime = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(UTC))
    revoked_at: datetime | None = db.Column(db.DateTime, nullable=True)

    @staticmethod
    def generate_token() -> str:
        return secrets.token_urlsafe(64)

    @staticmethod
    def hash_token(token: str) -> str:
        return hashlib.sha256(token.encode()).hexdigest()
