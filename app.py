from flask import Flask, render_template, request, redirect, url_for
import os
from models import Expense, ExpenseTracker
from utils import analyze_expenses, get_recent_expenses, delete_expense_by_date

app = Flask(__name__)

# Use absolute path to data directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "expenses.csv")

tracker = ExpenseTracker(DATA_PATH)

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        date = request.form["date"].strip()
        category = request.form["category"].strip()
        amount = request.form["amount"].strip()

        # Input validation - check for empty fields
        if not date or not category or not amount:
            return render_template("index.html", error="All fields are required!")

        # Validate amount is positive
        try:
            amount = float(amount)
            if amount <= 0:
                return render_template("index.html", error="Amount must be greater than 0!")
        except ValueError:
            return render_template("index.html", error="Invalid amount format!")

        expense = Expense(date, category, amount)
        tracker.add_expense(expense)

        # After POST, show results
        return redirect(url_for("results"))

    # GET request - show the form
    return render_template("index.html")

@app.route("/results")
def results():
    total, avg = analyze_expenses("data/expenses.csv")
    has_expenses = total > 0
    recent = get_recent_expenses("data/expenses.csv", limit=5)
    return render_template("result.html", total=total, avg=avg, has_expenses=has_expenses, recent_expenses=recent)

@app.route("/all")
def all_expenses():
    all_exp = tracker.get_all_expenses()
    return render_template("all_expenses.html", expenses=all_exp)

@app.route("/delete")
def delete_expense():
    date = request.args.get("date")
    amount = request.args.get("amount")

    if date and amount:
        delete_expense_by_date(DATA_PATH, date, float(amount))

    return redirect(url_for("results"))

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
