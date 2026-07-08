import logging
import time
from typing import Any

import jwt
import structlog
from flask import Flask, request, jsonify
from flask_cors import CORS
from sentry_sdk.integrations.flask import FlaskIntegration
import sqlalchemy as sa
from sqlalchemy import text

from app.config import Config
from app.extensions import db, migrate, login_manager


def setup_logging(log_level: str = "INFO") -> None:
    timestamper = structlog.processors.TimeStamper(fmt="iso")

    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            timestamper,
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.dev.ConsoleRenderer() if log_level == "DEBUG"
            else structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level, logging.INFO))
    handler = logging.StreamHandler()
    handler.setFormatter(structlog.stdlib.ProcessorFormatter(
        processor=structlog.processors.JSONRenderer(),
    ))
    root_logger.addHandler(handler)

    for lib in ("werkzeug", "sqlalchemy", "urllib3"):
        logging.getLogger(lib).setLevel(logging.WARNING)


def setup_sentry(app: Flask, dsn: str) -> None:
    if not dsn:
        return
    import sentry_sdk
    sentry_sdk.init(
        dsn=dsn,
        integrations=[FlaskIntegration()],
        traces_sample_rate=0.1,
        send_default_pii=False,
    )


def create_app(config_class: type = Config) -> Flask:
    app = Flask(__name__, static_folder="../../frontend/dist", static_url_path="/")
    app.config.from_object(config_class)

    setup_logging(app.config.get("LOG_LEVEL", "INFO"))
    setup_sentry(app, app.config.get("SENTRY_DSN", ""))

    logger = structlog.get_logger(__name__)
    logger.info("app_starting", environment=app.config.get("FLASK_ENV", "production"))

    CORS(app,
         supports_credentials=True,
         origins=[app.config["FRONTEND_URL"]] if app.config["FRONTEND_URL"] else None,
         methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
         allow_headers=["Content-Type", "Authorization"])

    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)

    @login_manager.unauthorized_handler
    def unauthorized() -> tuple:
        return jsonify({"error": "Authentication required"}), 401

    from app.models.user import User, RefreshToken
    from app.models.expense import Expense
    from app.models.category import Category
    from app.models.budget import Budget

    with app.app_context():
        try:
            db.create_all()
            inspector = sa.inspect(db.engine)
            if "email_verified" not in [c["name"] for c in inspector.get_columns("users")]:
                db.session.execute(sa.text("ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE"))
                logger.info("auth_migration", action="added_email_verified_column")
            if "role" not in [c["name"] for c in inspector.get_columns("users")]:
                db.session.execute(sa.text("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user'"))
                logger.info("auth_migration", action="added_role_column")
            if "sort_order" not in [c["name"] for c in inspector.get_columns("categories")]:
                db.session.execute(sa.text("ALTER TABLE categories ADD COLUMN sort_order INTEGER DEFAULT 0"))
                logger.info("auth_migration", action="added_sort_order_column")
            db.session.commit()
        except Exception as exc:
            logger.warning("auth_migration_failed", error=str(exc))

    @login_manager.user_loader
    def load_user(user_id: str) -> User | None:
        return db.session.get(User, int(user_id))

    @login_manager.request_loader
    def load_user_from_request(req: Any) -> User | None:
        auth_header = req.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
            try:
                payload = jwt.decode(
                    token,
                    app.config["JWT_SECRET"],
                    algorithms=["HS256"],
                    audience=app.config["JWT_AUDIENCE"],
                    issuer=app.config["JWT_ISSUER"],
                    options={"require": ["sub", "exp", "iat", "type"]},
                )
                if payload.get("type") != "access":
                    return None
                return db.session.get(User, int(payload["sub"]))
            except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
                return None
        return None

    from app.api.auth import auth_bp
    from app.api.expenses import expenses_bp
    from app.api.summary import summary_bp
    from app.api.categories import categories_bp
    from app.api.analytics import analytics_bp
    from app.api.budgets import budgets_bp
    from app.api.chat import chat_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(expenses_bp, url_prefix="/api/expenses")
    app.register_blueprint(summary_bp, url_prefix="/api/summary")
    app.register_blueprint(categories_bp, url_prefix="/api/categories")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")
    app.register_blueprint(budgets_bp, url_prefix="/api/budgets")
    app.register_blueprint(chat_bp, url_prefix="/api")

    @app.route("/health")
    def health() -> tuple[dict, int]:
        status = {"status": "ok"}
        status_code = 200
        try:
            db.session.execute(text("SELECT 1"))
            status["database"] = "connected"
        except Exception as exc:
            logger.exception("health_db_failure")
            status["database"] = "disconnected"
            status["status"] = "degraded"
            status_code = 503
        return jsonify(status), status_code

    @app.route("/metrics")
    def metrics() -> tuple[str, int]:
        if app.config.get("TESTING"):
            return "metrics_disabled_in_testing", 200
        import prometheus_client
        return prometheus_client.generate_latest(), 200, {"Content-Type": "text/plain; version=0.0.4"}

    @app.before_request
    def start_timer() -> None:
        request._start_time = time.time()

    @app.after_request
    def add_security_headers(response: Any) -> Any:
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "0"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        if app.config["SECURE_COOKIE"]:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        return response

    @app.after_request
    def log_request(response: Any) -> Any:
        if request.path.startswith("/api"):
            elapsed = time.time() - getattr(request, "_start_time", time.time())
            logger.info(
                "request",
                method=request.method,
                path=request.path,
                status=response.status_code,
                elapsed_ms=round(elapsed * 1000, 2),
                ip=request.remote_addr,
            )
        return response

    @app.route("/")
    def index() -> tuple:
        return app.send_static_file("index.html"), 200

    @app.errorhandler(404)
    def not_found(e: Exception) -> tuple:
        logger.warning("not_found", path=request.path)
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(500)
    def server_error(e: Exception) -> tuple:
        logger.exception("internal_error", path=request.path)
        return jsonify({"error": "Internal server error"}), 500

    return app
