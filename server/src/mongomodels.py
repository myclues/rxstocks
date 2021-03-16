from mongoengine import (
    Document,
    StringField,
    DateTimeField,
    DecimalField,
    IntField,
)


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
    gains = DecimalField()
    losses = DecimalField()
    
    meta = {
        'db_alias': 'stocks',
        'indexes': [
            'datetime'
        ]
    }

def PortfolioStatusSerializer(p):
    return {
        "datetime": p.datetime.isoformat(),
        "stash": float(p.stash),
        "currentCash": float(p.current_cash),
        "numShares": p.num_shares,
        "costAvg": float(p.cost_avg),
        "gains": float(p.gains) if p.gains is not None else 0,
        "losses": float(p.losses) if p.losses is not None else 0,
    }