import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import os

def analyze_expenses(file_path):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(base_dir, file_path)

    if not os.path.exists(file_path) or os.path.getsize(file_path) == 0:
        return 0, 0

    df = pd.read_csv(file_path)

    if len(df) == 0:
        return 0, 0

    total = df["amount"].sum()
    avg = np.mean(df["amount"])

    category_sum = df.groupby("category")["amount"].sum()

    # Graph - fix label overlap for single entry
    if len(category_sum) > 0:
        plt.figure(figsize=(8, 6))

        if len(category_sum) == 1:
            plt.pie(category_sum.values, labels=category_sum.index, autopct="%1.1f%%", textprops={'fontsize': 12})
        else:
            category_sum.plot(kind="pie", autopct="%1.1f%%")

        plt.title("Category-wise Spending")
        plt.tight_layout()
        plt.savefig(os.path.join(base_dir, "static/graph.png"))
        plt.close()

    return total, avg

def get_recent_expenses(file_path, limit=5):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(base_dir, file_path)

    if not os.path.exists(file_path) or os.path.getsize(file_path) == 0:
        return []

    df = pd.read_csv(file_path)

    if len(df) == 0:
        return []

    # Get last 'limit' entries (most recent)
    recent = df.tail(limit).copy()
    recent = recent.reset_index(drop=True)

    return recent.to_dict('records')

def delete_expense_by_date(file_path, date, amount):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(base_dir, file_path)

    if not os.path.exists(file_path):
        return

    df = pd.read_csv(file_path)

    # Remove the row matching date and amount
    mask = (df["date"] != date) | (df["amount"] != amount)
    df = df[mask]

    # Save back to CSV with header
    df.to_csv(file_path, index=False)
