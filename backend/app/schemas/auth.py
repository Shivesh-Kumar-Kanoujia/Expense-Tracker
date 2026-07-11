import re

from marshmallow import Schema, ValidationError, fields, validate


def _validate_password_strength(password: str) -> None:
    errors: list[str] = []
    if len(password) < 8:
        errors.append("At least 8 characters")
    if len(password) > 128:
        errors.append("At most 128 characters")
    if not re.search(r"[A-Z]", password):
        errors.append("An uppercase letter")
    if not re.search(r"[a-z]", password):
        errors.append("A lowercase letter")
    if not re.search(r"[0-9]", password):
        errors.append("A number")
    if not re.search(r"[^A-Za-z0-9]", password):
        errors.append("A special character")
    if errors:
        raise ValidationError("Password must include: " + ", ".join(errors))


class RegisterSchema(Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True, validate=[validate.Length(min=8, max=128), _validate_password_strength])
    name = fields.String(required=True, validate=validate.Length(min=1, max=100))


class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True)
