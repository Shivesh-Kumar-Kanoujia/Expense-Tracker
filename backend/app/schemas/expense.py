from marshmallow import Schema, fields, validate


class ExpenseSchema(Schema):
    date = fields.Date(required=True)
    category = fields.String(required=True, validate=validate.Length(min=1, max=50))
    amount = fields.Float(required=True, validate=validate.Range(min=0.01))
    description = fields.String(allow_none=True, validate=validate.Length(max=255))


class ExpenseUpdateSchema(Schema):
    date = fields.Date()
    category = fields.String(validate=validate.Length(min=1, max=50))
    amount = fields.Float(validate=validate.Range(min=0.01))
    description = fields.String(allow_none=True, validate=validate.Length(max=255))
