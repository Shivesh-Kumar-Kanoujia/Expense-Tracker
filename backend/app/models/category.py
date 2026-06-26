from datetime import datetime, timezone
from typing import Any

from app.extensions import db


DEFAULT_CATEGORIES: list[str] = ["Food", "Travel", "Shopping", "Bills", "Entertainment", "Other"]


class Category(db.Model):
    __tablename__ = "categories"

    id: int = db.Column(db.Integer, primary_key=True)
    user_id: int = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    name: str = db.Column(db.String(50), nullable=False)
    created_at: datetime = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (db.UniqueConstraint("user_id", "name", name="uq_user_category"),)

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "created_at": self.created_at.isoformat(),
        }
