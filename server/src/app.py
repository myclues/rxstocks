from flask import (
    Flask,
    jsonify,
    request,
    Response,
)
import yfinance as yf
import json
from datetime import datetime

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

@app.route("/api/history/<symbol>", methods=['get'])
def history(symbol):
    try:
        data = Quote.objects(symbol__iexact=symbol).order_by('datetime')
        res = list(map(QuoteSerializer, list(data)))
        return {
            'data': res
        }
    except Exception as e:
        print(e)


@app.route("/api/fetch/<symbol>", methods=['get'])
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


@app.route("/api/portfolio/addTransaction", methods=['post'])
def save_tx():
    txObj = json.loads(request.data)
    try:
        tx = Transaction(
            symbol = txObj["symbol"],
            datetime = datetime.strptime(txObj["datetime"], "%Y-%m-%dT%H:%M:%S.%fZ"),
            price = txObj["price"],
            num_shares = txObj["numShares"],
            tx_type = "buy" if txObj["txType"] == 0 else "sell",
        )
        tx.save()
        return Response("success", status=200)
    except (DuplicateKeyError, NotUniqueError):
        return Response("success", status=200)
    except Exception as e:
        print(f"TX ERR: {e}")
        return Response("TX ERR", status=500)


@app.route("/api/portfolio/addStatus", methods=['post'])
def save_pf_status():
    psObj = json.loads(request.data)
    try:
        ps = PortfolioStatus(
            datetime = datetime.strptime(psObj["datetime"], "%Y-%m-%dT%H:%M:%S.%fZ"),
            stash = psObj["stash"],
            current_cash = psObj["currentCash"],
            num_shares = psObj["numShares"],
            cost_avg = psObj["costAvg"],
        )
        ps.save()
        return Response("success", status=200)
    except (DuplicateKeyError, NotUniqueError):
        return Response("success", status=200)
    except Exception as e:
        print(f"PS ERR: {e}")
        return Response("PS ERR", status=500)


if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)