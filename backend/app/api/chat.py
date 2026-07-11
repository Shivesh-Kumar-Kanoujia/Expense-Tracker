import json
from datetime import UTC, datetime
from decimal import Decimal

import structlog
from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required
from groq import Groq

from app.config import Config
from app.extensions import db
from app.models.category import Category
from app.models.expense import Expense

chat_bp = Blueprint("chat", __name__)
logger = structlog.get_logger(__name__)

SYSTEM_PROMPT = (
    "You are a helpful expense tracking assistant. You help users manage their expenses and categories.\n\n"
    "You have access to tools to manage expenses and categories. "
    "When the user asks you to do something, use the appropriate tool. "
    "Always confirm what you've done in a friendly way.\n"
    "For dates, use YYYY-MM-DD format. "
    "Today's date is " + datetime.now(UTC).strftime("%Y-%m-%d") + ".\n"
    "When listing expenses, format them nicely with date, category, amount, and description."
)

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_expenses",
            "description": "Get recent expenses for the current user",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "description": "Number of expenses to return",
                        "default": 10,
                    }
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_categories",
            "description": "Get all categories for the current user",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_expense",
            "description": "Create a new expense",
            "parameters": {
                "type": "object",
                "properties": {
                    "date": {"type": "string", "description": "Date in YYYY-MM-DD format"},
                    "category": {"type": "string", "description": "Category name (e.g. Food, Travel)"},
                    "amount": {"type": "number", "description": "Amount spent"},
                    "description": {"type": "string", "description": "Optional description"},
                },
                "required": ["date", "category", "amount"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "delete_expense",
            "description": "Delete an expense by its ID",
            "parameters": {
                "type": "object",
                "properties": {
                    "expense_id": {"type": "integer", "description": "ID of the expense to delete"}
                },
                "required": ["expense_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_category",
            "description": "Create a new category",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "Category name"}
                },
                "required": ["name"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "delete_category",
            "description": "Delete a category by its ID",
            "parameters": {
                "type": "object",
                "properties": {
                    "category_id": {"type": "integer", "description": "ID of the category to delete"}
                },
                "required": ["category_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_summary",
            "description": "Get spending summary for a specific month and year",
            "parameters": {
                "type": "object",
                "properties": {
                    "month": {"type": "integer", "description": "Month number (1-12)"},
                    "year": {"type": "integer", "description": "Year (e.g. 2026)"},
                },
            },
        },
    },
]


def execute_tool(name: str, args: dict) -> dict:
    if name == "get_expenses":
        limit = args.get("limit", 10)
        stmt = db.select(Expense).filter_by(user_id=current_user.id).order_by(Expense.date.desc()).limit(limit)
        expenses = db.session.execute(stmt).scalars().all()
        return {"expenses": [e.to_dict() for e in expenses]}

    if name == "get_categories":
        stmt = db.select(Category).filter_by(user_id=current_user.id).order_by(Category.sort_order)
        categories = db.session.execute(stmt).scalars().all()
        return {"categories": [c.to_dict() for c in categories]}

    if name == "create_expense":
        expense = Expense(
            user_id=current_user.id,
            date=datetime.strptime(args["date"], "%Y-%m-%d").date(),
            category=args["category"],
            amount=Decimal(str(args["amount"])),
            description=args.get("description"),
        )
        db.session.add(expense)
        db.session.commit()
        return {"expense": expense.to_dict(), "message": "Expense created successfully"}

    if name == "delete_expense":
        stmt = db.select(Expense).filter_by(id=args["expense_id"], user_id=current_user.id)
        expense = db.session.execute(stmt).scalar()
        if not expense:
            return {"error": "Expense not found"}
        db.session.delete(expense)
        db.session.commit()
        return {"message": "Expense deleted successfully"}

    if name == "create_category":
        existing = db.session.execute(
            db.select(Category).filter_by(user_id=current_user.id, name=args["name"])
        ).scalar()
        if existing:
            return {"error": "Category already exists"}
        category = Category(user_id=current_user.id, name=args["name"])
        db.session.add(category)
        db.session.commit()
        return {"category": category.to_dict(), "message": "Category created successfully"}

    if name == "delete_category":
        stmt = db.select(Category).filter_by(id=args["category_id"], user_id=current_user.id)
        category = db.session.execute(stmt).scalar()
        if not category:
            return {"error": "Category not found"}
        db.session.delete(category)
        db.session.commit()
        return {"message": "Category deleted successfully"}

    if name == "get_summary":
        month = args.get("month", datetime.now(UTC).month)
        year = args.get("year", datetime.now(UTC).year)
        stmt = db.select(Expense).filter(
            Expense.user_id == current_user.id,
            db.extract("month", Expense.date) == month,
            db.extract("year", Expense.date) == year,
        )
        expenses = db.session.execute(stmt).scalars().all()
        total = sum(float(e.amount) for e in expenses)
        return {
            "month": month,
            "year": year,
            "total": round(total, 2),
            "count": len(expenses),
            "expenses": [e.to_dict() for e in expenses],
        }

    return {"error": f"Unknown tool: {name}"}


@chat_bp.route("/chat", methods=["POST"])
@login_required
def chat():
    data = request.get_json()
    if not data or "message" not in data:
        return jsonify({"error": "Message is required"}), 400

    user_message = data["message"]
    api_key = Config.GROQ_API_KEY
    if not api_key:
        return jsonify({"reply": "Groq API key is not configured. Please set GROQ_API_KEY in your .env file."}), 200

    client = Groq(api_key=api_key)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_message},
    ]

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
            max_tokens=4096,
        )

        choice = response.choices[0]

        if choice.finish_reason == "tool_calls":
            for tool_call in choice.message.tool_calls:
                fn_name = tool_call.function.name
                fn_args = json.loads(tool_call.function.arguments)
                logger.info("tool_call", tool=fn_name, args=fn_args)
                result = execute_tool(fn_name, fn_args)
                messages.append(choice.message)
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(result),
                })

            final_response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                max_tokens=4096,
            )
            reply = final_response.choices[0].message.content
        else:
            reply = choice.message.content

        if not reply:
            reply = "I'm not sure how to help with that. Can you rephrase?"

        return jsonify({"reply": reply})

    except Exception as exc:
        logger.exception("chat_error", error=str(exc))
        return jsonify({"reply": "Sorry, I encountered an error processing your request. Please try again."}), 200
