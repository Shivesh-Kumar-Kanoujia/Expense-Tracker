from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

from app.extensions import db


class Expense(db.Model):
    __tablename__ = "expenses"

    id: int = db.Column(db.Integer, primary_key=True)
    user_id: int = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    date: datetime = db.Column(db.Date, nullable=False)
    category: str = db.Column(db.String(50), nullable=False)
    amount: Decimal = db.Column(db.Numeric(12, 2), nullable=False)
    description: str | None = db.Column(db.String(255), nullable=True)
    created_at: datetime = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(UTC))
    updated_at: datetime = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
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
