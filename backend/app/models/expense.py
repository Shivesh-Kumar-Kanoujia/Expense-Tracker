from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Optional

from app.extensions import db


class Expense(db.Model):
    __tablename__ = "expenses"

    id: int = db.Column(db.Integer, primary_key=True)
    user_id: int = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    date: datetime = db.Column(db.Date, nullable=False)
    category: str = db.Column(db.String(50), nullable=False)
    amount: Decimal = db.Column(db.Numeric(12, 2), nullable=False)
    description: Optional[str] = db.Column(db.String(255), nullable=True)
    created_at: datetime = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at: datetime = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "date": self.date.isoformat(),
            "category": self.category,
            "amount": float(self.amount),
            "description": self.description,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
