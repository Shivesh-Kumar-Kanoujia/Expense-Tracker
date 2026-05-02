import os

class Expense:
    def __init__(self, date, category, amount):
        self.date = date
        self.category = category
        self.amount = float(amount)

class ExpenseTracker:
    def __init__(self, file_path):
        self.file_path = file_path
        

    def add_expense(self, expense):
        # Check if file exists and has content (header + data)
        file_exists = os.path.exists(self.file_path) and os.path.getsize(self.file_path) > 0

        with open(self.file_path, "a") as f:
            # If file doesn't exist or is empty, header is already there
            # But we need to add newline before data only if file has content
            if file_exists:
                f.write("\n")
            # Write the expense data
            f.write(f"{expense.date},{expense.category},{expense.amount}")

    def get_all_expenses(self):
        expenses = []
        if os.path.exists(self.file_path):
            with open(self.file_path, "r") as f:
                lines = f.readlines()
                for i, line in enumerate(lines):
                    # Skip header row (first line) and blank lines
                    if i == 0 or not line.strip():
                        continue
                    parts = line.strip().split(",")
                    if len(parts) >= 3:
                        expenses.append(Expense(parts[0], parts[1], float(parts[2])))
        return expenses
