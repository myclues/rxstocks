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