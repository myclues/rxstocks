from mongomodels import *
from pymongo.errors import *
from mongoengine.errors import NotUniqueError
from mongoengine import connect
from datetime import datetime
import math
import json
from flask import (
    Flask,
    jsonify,
    request,
    Response,
)
import yfinance as yf

import krakenex
from pykrakenapi import KrakenAPI

krakapi = krakenex.API()
kraken = KrakenAPI(krakapi)


connect(
    alias='crypto',
    db='crypto',
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


target_date_format = "%Y-%m-%dT%H:%M:%S.%fZ"


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
    latest = get_latest(data, "Close")

    q = Quote(
        symbol=symbol.lower(),
        datetime=latest.name,
        price=latest["Close"],
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
            symbol=txObj["symbol"],
            datetime=datetime.strptime(txObj["datetime"], target_date_format),
            price=txObj["price"],
            num_shares=txObj["numShares"],
            tx_type="buy" if txObj["txType"] == 0 else "sell",
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
            datetime=datetime.strptime(psObj["datetime"], target_date_format),
            stash=psObj["stash"],
            current_cash=psObj["currentCash"],
            num_shares=psObj["numShares"],
            cost_avg=psObj["costAvg"],
            gains=psObj["gains"],
            losses=psObj["losses"],
        )
        ps.save()
        return Response("success", status=200)
    except (DuplicateKeyError, NotUniqueError):
        return Response("success", status=200)
    except Exception as e:
        print(f"PS ERR: {e}")
        return Response("PS ERR", status=500)


@app.route("/api/portfolio", methods=["get"])
def get_portfolio_status():
    data = PortfolioStatus.objects().order_by('datetime')
    res = list(map(PortfolioStatusSerializer, list(data)))
    return {
        'data': res
    }


# get latest row w/ defined/non-NaN key
# TODO: change this to finite loop
def get_latest(df, key):
    latest = None
    lasti = -1
    while latest is None:
        next = df.iloc[lasti]
        val = next[key]
        if math.isnan(val) or val is None:
            lasti -= 1
        else:
            latest = next
    return latest


@app.route("/api/fetchBatchData", methods=['post'])
def get_batch_data():
    input = json.loads(request.data)
    symbols = input["symbols"]
    data = yf.download(
        tickers=" ".join(symbols).lower(),
        group_by="ticker",
        period="1d",
        interval="1m",
    )

    result = []
    for symbol in symbols:
        d = data[symbol]
        latest = get_latest(d, "Close")
        result.append({
            "datetime": latest.name.strftime(target_date_format),
            "price": latest["Close"],
            "symbol": symbol.lower(),
        })

    return {
        "data": result
    }


# https://github.com/dominiktraxl/pykrakenapi
@app.route("/api/crypto/fetch/<symbol>", methods=["get"])
def get_crypto_quote(symbol):
    data, last = kraken.get_ohlc_data(symbol)

    # get latest entry - this API is in reverse chrono thank god...
    latest = data.iloc[0]

    q = Quote(
        symbol=symbol.lower(),
        datetime=latest.name,
        price=latest["close"],
    )
    try:
        q.save()
    except (DuplicateKeyError, NotUniqueError) as e:
        print("Trying to insert dupe")

    res = QuoteSerializer(q)

    return res


if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)
