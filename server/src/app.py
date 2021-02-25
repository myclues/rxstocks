from flask import (
    Flask,
    jsonify,
)
import yfinance as yf
import json
from mongomodels import *

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
    datetime = data.index[-1]
    quote = data.tail(1)

    # re-map data
    res = {
        "date": datetime.strftime("%Y/%m/%d %H:%M:%S"),
        # for interval history, all price columns show same value
        "price": quote["Close"].tolist()[0],
    }
    # for key in COLUMNS:
    #     res[key.lower()] = quote[key].tolist()[0]

    return res


if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)