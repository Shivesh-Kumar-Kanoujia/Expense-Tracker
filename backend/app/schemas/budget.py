from marshmallow import Schema, fields, validate


class BudgetSchema(Schema):
    amount = fields.Float(required=True, validate=validate.Range(min=0.01))
    category = fields.String(allow_none=True, validate=validate.Length(max=50))
    month = fields.Integer(required=True, validate=validate.Range(min=1, max=12))
    year = fields.Integer(required=True)


class BudgetUpdateSchema(Schema):
    amount = fields.Float(required=True, validate=validate.Range(min=0.01))
    category = fields.String(allow_none=True, validate=validate.Length(max=50))
    month = fields.Integer(required=True, validate=validate.Range(min=1, max=12))
    year = fields.Integer(required=True)
