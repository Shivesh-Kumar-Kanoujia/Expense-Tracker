from marshmallow import Schema, fields, validate


class CategorySchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=1, max=50))


class CategoryUpdateSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=1, max=50))
