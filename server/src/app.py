from flask import (
    Flask,
    jsonify,
)
import yfinance as yf
import json

from mongoengine import connect
from pymongo.errors import *

from mongomodels import *

connect(
    alias='stocks',
    db='stocks',
    username='root',
    password='pw',
    authentication_source='admin',
    host='mongodb://db',
)


app = Flask("turkquotesy")

tickers = {}


COLUMNS = [
    "Open",
    "High",
    "Low",
    "Close",
    "Volume",
]

@app.route("/api/history/<symbol>")
def history(symbol):
    try:
        data = Quote.objects(symbol__iexact=symbol).order_by('datetime')
        res = list(map(QuoteSerializer, list(data)))
        return {
            'data': res
        }
    except Exception as e:
        print(e)


@app.route("/api/fetch/<symbol>")
def quote(symbol):
    try:
        ticker = tickers[symbol]
    except KeyError as e:
        print(f"DEBUG: {symbol} has no ticker yet. creating...")
        tickers[symbol] = yf.Ticker(symbol)
        ticker = tickers[symbol]

    # fetch historical data for 1 day in 1-min increments
    data = ticker.history(period="1d", interval="1m")
    # print(data)

    # get latest entry
    dt = data.index[-1]
    quote = data.tail(1)

    q = Quote(
        symbol = symbol.lower(),
        datetime = dt.to_pydatetime(),
        price = quote["Close"].tolist()[0],
    )
    try:
        q.save()
    except (DuplicateKeyError, NotUniqueError) as e:
        print("Trying to insert dupe")

    res = QuoteSerializer(q)

    return res


if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)