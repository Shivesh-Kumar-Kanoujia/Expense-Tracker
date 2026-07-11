from typing import Any

from flask import Blueprint, jsonify
from flask_login import current_user, login_required
from sqlalchemy import func, select

from app.extensions import db
from app.models.expense import Expense

summary_bp = Blueprint("summary", __name__)


@summary_bp.route("", methods=["GET"])
@login_required
def get_summary() -> tuple:
    stats: Any = db.session.execute(
        select(
            func.count(Expense.id).label("count"),
            func.coalesce(func.sum(Expense.amount), 0).label("total"),
            func.coalesce(func.avg(Expense.amount), 0).label("average"),
        ).filter(Expense.user_id == current_user.id)
    ).first()

    category_breakdown: list[Any] = db.session.execute(
        select(
            Expense.category,
            func.sum(Expense.amount).label("total"),
            func.count(Expense.id).label("count"),
        ).filter(Expense.user_id == current_user.id).group_by(Expense.category)
    ).all()

    recent = db.session.execute(
        select(Expense).filter_by(user_id=current_user.id).order_by(
            Expense.date.desc(), Expense.created_at.desc()
        ).limit(5)
    ).scalars().all()

    return jsonify({
        "total": float(stats.total),
        "average": float(stats.average),
        "count": stats.count,
        "categories": [
            {"category": c.category, "total": float(c.total), "count": c.count}
            for c in category_breakdown
        ],
        "recent": [e.to_dict() for e in recent],
    })
