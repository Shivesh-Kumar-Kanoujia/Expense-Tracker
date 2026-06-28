from typing import Any

from sqlalchemy import func, extract, select
from flask import Blueprint, jsonify
from flask_login import login_required, current_user
from app.extensions import db
from app.models.expense import Expense

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.route("/monthly", methods=["GET"])
@login_required
def monthly_trends() -> tuple:
    year_col = extract("year", Expense.date).label("year")
    month_col = extract("month", Expense.date).label("month")
    total_col = func.sum(Expense.amount).label("total")
    count_col = func.count(Expense.id).label("count")

    rows: list[Any] = db.session.execute(
        select(year_col, month_col, total_col, count_col)
        .filter(Expense.user_id == current_user.id)
        .group_by(year_col, month_col)
        .order_by(year_col, month_col)
    ).all()

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
    total_col = func.sum(Expense.amount).label("total")
    count_col = func.count(Expense.id).label("count")

    rows: list[Any] = db.session.execute(
        select(Expense.category, total_col, count_col)
        .filter(Expense.user_id == current_user.id)
        .group_by(Expense.category)
        .order_by(total_col.desc())
        .limit(10)
    ).all()

    grand_total = sum(float(r.total) for r in rows) if rows else 0

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
