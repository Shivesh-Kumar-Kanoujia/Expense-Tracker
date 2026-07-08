import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "sqlite:///" + os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "instance", "app.db"),
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET = os.getenv("JWT_SECRET", SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", "900"))
    JWT_REFRESH_TOKEN_EXPIRES = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES", str(7 * 24 * 3600)))
    JWT_ISSUER = os.getenv("JWT_ISSUER", "expense-tracker")
    JWT_AUDIENCE = os.getenv("JWT_AUDIENCE", "expense-tracker-api")
    SENTRY_DSN = os.getenv("SENTRY_DSN", "")
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
    SECURE_COOKIE = os.getenv("SECURE_COOKIE", "false").lower() == "true"
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
