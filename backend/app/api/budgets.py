from typing import Any

from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from marshmallow import ValidationError
from app.extensions import db
from app.models.budget import Budget
from app.schemas.budget import BudgetSchema, BudgetUpdateSchema

budgets_bp = Blueprint("budgets", __name__)
budget_schema = BudgetSchema()
budget_update_schema = BudgetUpdateSchema()


@budgets_bp.route("", methods=["GET"])
@login_required
def list_budgets() -> tuple:
    month = request.args.get("month", type=int)
    year = request.args.get("year", type=int)

    query = db.select(Budget).filter_by(user_id=current_user.id)
    if month:
        query = query.filter(Budget.month == month)
    if year:
        query = query.filter(Budget.year == year)

    query = query.order_by(Budget.category.asc().nullsfirst())
    budgets = db.session.execute(query).scalars().all()
    return jsonify({"budgets": [b.to_dict() for b in budgets]})


@budgets_bp.route("", methods=["POST"])
@login_required
def create_budget() -> tuple:
    try:
        data: dict[str, Any] = budget_schema.load(request.get_json())
    except ValidationError as err:
        return jsonify({"error": err.messages}), 400

    existing = db.session.execute(
        db.select(Budget).filter_by(
            user_id=current_user.id,
            category=data.get("category"),
            month=data["month"],
            year=data["year"],
        )
    ).scalar()

    if existing:
        existing.amount = data["amount"]
        db.session.commit()
        return jsonify({"budget": existing.to_dict()}), 200

    budget = Budget(
        user_id=current_user.id,
        category=data.get("category"),
        amount=data["amount"],
        month=data["month"],
        year=data["year"],
    )
    db.session.add(budget)
    db.session.commit()
    return jsonify({"budget": budget.to_dict()}), 201


@budgets_bp.route("/<int:budget_id>", methods=["PUT"])
@login_required
def update_budget(budget_id: int) -> tuple:
    budget = db.session.execute(
        db.select(Budget).filter_by(id=budget_id, user_id=current_user.id)
    ).scalar()
    if not budget:
        return jsonify({"error": "Budget not found"}), 404

    try:
        data = budget_update_schema.load(request.get_json())
    except ValidationError as err:
        return jsonify({"error": err.messages}), 400

    budget.amount = data["amount"]
    budget.category = data.get("category")
    budget.month = data["month"]
    budget.year = data["year"]
    db.session.commit()
    return jsonify({"budget": budget.to_dict()})


@budgets_bp.route("/<int:budget_id>", methods=["DELETE"])
@login_required
def delete_budget(budget_id: int) -> tuple:
    budget = db.session.execute(
        db.select(Budget).filter_by(id=budget_id, user_id=current_user.id)
    ).scalar()
    if not budget:
        return jsonify({"error": "Budget not found"}), 404

    db.session.delete(budget)
    db.session.commit()
    return jsonify({"message": "Budget deleted"})
