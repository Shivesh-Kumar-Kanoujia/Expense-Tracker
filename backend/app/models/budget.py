from datetime import UTC, datetime
from typing import Any

from app.extensions import db


class Budget(db.Model):
    __tablename__ = "budgets"
    __table_args__ = (
        db.UniqueConstraint("user_id", "category", "month", "year", name="uq_user_budget_month"),
    )

    id: int = db.Column(db.Integer, primary_key=True)
    user_id: int = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    category: str | None = db.Column(db.String(50), nullable=True)
    amount: float = db.Column(db.Numeric(12, 2), nullable=False)
    month: int = db.Column(db.Integer, nullable=False)
    year: int = db.Column(db.Integer, nullable=False)
    created_at: datetime = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(UTC))
    updated_at: datetime = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "category": self.category,
            "amount": float(self.amount),
            "month": self.month,
            "year": self.year,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
