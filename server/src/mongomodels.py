from mongoengine import *

connect(
    alias='stocks',
    db='stocks',
    username='root',
    password='pw',
    authentication_source='admin',
    host='mongodb://db',
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