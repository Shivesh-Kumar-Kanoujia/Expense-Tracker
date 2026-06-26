from typing import Any

from sqlalchemy import func, extract
from flask import Blueprint, jsonify
from flask_login import login_required, current_user
from app.extensions import db
from app.models.expense import Expense

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.route("/monthly", methods=["GET"])
@login_required
def monthly_trends() -> tuple:
    rows: list[Any] = (
        db.session.query(
            extract("year", Expense.date).label("year"),
            extract("month", Expense.date).label("month"),
            func.sum(Expense.amount).label("total"),
            func.count(Expense.id).label("count"),
        )
        .filter(Expense.user_id == current_user.id)
        .group_by("year", "month")
        .order_by("year", "month")
        .all()
    )

    return jsonify({
        "months": [
            {
                "year": int(r.year),
                "month": int(r.month),
                "total": float(r.total),
                "count": r.count,
            }
            for r in rows
        ]
    })


@analytics_bp.route("/top-categories", methods=["GET"])
@login_required
def top_categories() -> tuple:
    rows: list[Any] = (
        db.session.query(
            Expense.category,
            func.sum(Expense.amount).label("total"),
            func.count(Expense.id).label("count"),
        )
        .filter(Expense.user_id == current_user.id)
        .group_by(Expense.category)
        .order_by(func.sum(Expense.amount).desc())
        .limit(10)
        .all()
    )

    grand_total = sum(r.total for r in rows) if rows else 0

    return jsonify({
        "categories": [
            {
                "category": r.category,
                "total": float(r.total),
                "count": r.count,
                "percentage": round(float(r.total) / grand_total * 100, 1) if grand_total > 0 else 0,
            }
            for r in rows
        ]
    })
