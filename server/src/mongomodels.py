from mongoengine import *


class Quote(Document):
    symbol = StringField(max_length=10, required=True)
    datetime = DateTimeField(required=True, unique_with=['symbol'])
    price = DecimalField(required=True) # Close price

    meta = {
        'db_alias': 'stocks',
        'indexes': [
            'datetime'
        ]
    }


def QuoteSerializer(q):
    return {
        "symbol": q.symbol,
        "price": float(q.price),
        "datetime": q.datetime.isoformat(),
    }

class Transaction(Document):
    symbol = StringField(max_length=10)
    datetime = DateTimeField(unique_with=['symbol'])
    price = DecimalField()
    num_shares = IntField()
    tx_type = StringField(max_length=10)

    meta = {
        'db_alias': 'stocks',
        'indexes': [
            'datetime'
        ]
    }

class PortfolioStatus(Document):
    datetime = DateTimeField(unique=True)
    stash = DecimalField()
    current_cash = DecimalField()
    num_shares = IntField()
    cost_avg = DecimalField()
    
    meta = {
        'db_alias': 'stocks',
        'indexes': [
            'datetime'
        ]
    }