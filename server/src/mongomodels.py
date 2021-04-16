from mongoengine import (
    Document,
    StringField,
    DateTimeField,
    FloatField,
    IntField,
)


class Quote(Document):
    symbol = StringField(max_length=10, required=True)
    datetime = DateTimeField(required=True, unique_with=['symbol'])
    price = FloatField(required=True)  # Close price

    meta = {
        'db_alias': 'crypto',
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
    price = FloatField()
    num_shares = IntField()
    tx_type = StringField(max_length=10)

    meta = {
        'db_alias': 'crypto',
        'indexes': [
            'datetime'
        ]
    }


class PortfolioStatus(Document):
    datetime = DateTimeField(unique=True)
    stash = FloatField()
    current_cash = FloatField()
    num_shares = IntField()
    cost_avg = FloatField()
    gains = FloatField()
    losses = FloatField()

    meta = {
        'db_alias': 'crypto',
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
