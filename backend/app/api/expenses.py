from datetime import datetime, timezone
from typing import Any, Optional

from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from marshmallow import ValidationError
from app.extensions import db
from app.models.expense import Expense
from app.schemas.expense import ExpenseSchema, ExpenseUpdateSchema

expenses_bp = Blueprint("expenses", __name__)
expense_schema = ExpenseSchema()
expense_update_schema = ExpenseUpdateSchema()


def parse_date(value: str, label: str) -> Any | None:
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        raise ValueError(f"Invalid {label}: '{value}'. Use YYYY-MM-DD.")


@expenses_bp.route("", methods=["GET"])
@login_required
def list_expenses() -> tuple:
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    per_page = min(per_page, 100)

    category: Optional[str] = request.args.get("category")
    date_from: Optional[str] = request.args.get("date_from")
    date_to: Optional[str] = request.args.get("date_to")

    query = db.select(Expense).filter_by(user_id=current_user.id)

    if category:
        query = query.filter(Expense.category == category)
    try:
        if date_from:
            query = query.filter(Expense.date >= parse_date(date_from, "date_from"))
        if date_to:
            query = query.filter(Expense.date <= parse_date(date_to, "date_to"))
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    query = query.order_by(Expense.date.desc(), Expense.created_at.desc())
    pagination = db.paginate(query, page=page, per_page=per_page, error_out=False)

    return jsonify({
        "expenses": [e.to_dict() for e in pagination.items],
        "total": pagination.total,
        "page": pagination.page,
        "per_page": pagination.per_page,
        "pages": pagination.pages,
    })


@expenses_bp.route("", methods=["POST"])
@login_required
def create_expense() -> tuple:
    try:
        data = expense_schema.load(request.get_json())
    except ValidationError as err:
        return jsonify({"error": err.messages}), 400

    expense = Expense(
        user_id=current_user.id,
        date=data["date"],
        category=data["category"],
        amount=data["amount"],
        description=data.get("description"),
    )
    db.session.add(expense)
    db.session.commit()

    return jsonify({"expense": expense.to_dict()}), 201


@expenses_bp.route("/<int:expense_id>", methods=["GET"])
@login_required
def get_expense(expense_id: int) -> tuple:
    expense = db.session.execute(db.select(Expense).filter_by(id=expense_id, user_id=current_user.id)).scalar()
    if not expense:
        return jsonify({"error": "Expense not found"}), 404
    return jsonify({"expense": expense.to_dict()})


@expenses_bp.route("/<int:expense_id>", methods=["PUT"])
@login_required
def update_expense(expense_id: int) -> tuple:
    expense = db.session.execute(db.select(Expense).filter_by(id=expense_id, user_id=current_user.id)).scalar()
    if not expense:
        return jsonify({"error": "Expense not found"}), 404

    try:
        data: dict[str, Any] = expense_update_schema.load(request.get_json())
    except ValidationError as err:
        return jsonify({"error": err.messages}), 400

    if "date" in data:
        expense.date = data["date"]
    if "category" in data:
        expense.category = data["category"]
    if "amount" in data:
        expense.amount = data["amount"]
    if "description" in data:
        expense.description = data["description"]

    expense.updated_at = datetime.now(timezone.utc)
    db.session.commit()

    return jsonify({"expense": expense.to_dict()})


@expenses_bp.route("/<int:expense_id>", methods=["DELETE"])
@login_required
def delete_expense(expense_id: int) -> tuple:
    expense = db.session.execute(db.select(Expense).filter_by(id=expense_id, user_id=current_user.id)).scalar()
    if not expense:
        return jsonify({"error": "Expense not found"}), 404

    db.session.delete(expense)
    db.session.commit()

    return jsonify({"message": "Expense deleted"})
