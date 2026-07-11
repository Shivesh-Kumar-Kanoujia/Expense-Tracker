from typing import Any

from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required
from marshmallow import ValidationError

from app.extensions import db
from app.models.category import DEFAULT_CATEGORIES, Category
from app.schemas.category import CategorySchema, CategoryUpdateSchema

categories_bp = Blueprint("categories", __name__)
category_schema = CategorySchema()
category_update_schema = CategoryUpdateSchema()


def seed_default_categories(user_id: int) -> None:
    existing: set[str] = {c.name for c in db.session.execute(db.select(Category).filter_by(user_id=user_id)).scalars().all()}
    for name in DEFAULT_CATEGORIES:
        if name not in existing:
            db.session.add(Category(user_id=user_id, name=name))
    db.session.commit()


@categories_bp.route("", methods=["GET"])
@login_required
def list_categories() -> tuple:
    seed_default_categories(current_user.id)
    categories = db.session.execute(db.select(Category).filter_by(user_id=current_user.id).order_by(Category.sort_order, Category.name)).scalars().all()
    return jsonify({"categories": [c.to_dict() for c in categories]})


@categories_bp.route("", methods=["POST"])
@login_required
def create_category() -> tuple:
    try:
        data: dict[str, Any] = category_schema.load(request.get_json())
    except ValidationError as err:
        return jsonify({"error": err.messages}), 400

    existing = db.session.execute(db.select(Category).filter_by(user_id=current_user.id, name=data["name"])).scalar()
    if existing:
        return jsonify({"error": "Category already exists"}), 409

    category = Category(user_id=current_user.id, name=data["name"])
    db.session.add(category)
    db.session.commit()

    return jsonify({"category": category.to_dict()}), 201


@categories_bp.route("/<int:category_id>", methods=["PUT"])
@login_required
def update_category(category_id: int) -> tuple:
    category = db.session.execute(db.select(Category).filter_by(id=category_id, user_id=current_user.id)).scalar()
    if not category:
        return jsonify({"error": "Category not found"}), 404

    try:
        data = category_update_schema.load(request.get_json())
    except ValidationError as err:
        return jsonify({"error": err.messages}), 400

    conflict = db.session.execute(db.select(Category).filter_by(user_id=current_user.id, name=data["name"])).scalar()
    if conflict and conflict.id != category_id:
        return jsonify({"error": "Category name already taken"}), 409

    category.name = data["name"]
    db.session.commit()

    return jsonify({"category": category.to_dict()})


@categories_bp.route("/<int:category_id>", methods=["DELETE"])
@login_required
def delete_category(category_id: int) -> tuple:
    category = db.session.execute(db.select(Category).filter_by(id=category_id, user_id=current_user.id)).scalar()
    if not category:
        return jsonify({"error": "Category not found"}), 404

    db.session.delete(category)
    db.session.commit()

    return jsonify({"message": "Category deleted"})


@categories_bp.route("/reorder", methods=["PUT"])
@login_required
def reorder_categories() -> tuple:
    data = request.get_json()
    order = data.get("order", [])
    for item in order:
        cat = db.session.execute(db.select(Category).filter_by(id=item["id"], user_id=current_user.id)).scalar()
        if cat:
            cat.sort_order = item["sort_order"]
    db.session.commit()
    return jsonify({"message": "Order updated"})
