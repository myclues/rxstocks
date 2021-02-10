import json
import yfinance as yf

from datetime import datetime
import json
import os


SYMBOL = "GME"

try:
    os.mkdir(f"data/{SYMBOL}")
except FileExistsError:
    pass

filedate = datetime.now().strftime("%Y-%m-%d")

gme = yf.Ticker(SYMBOL)
data = gme.history(
    period="1d",
    interval="1m",
)

barf = data.to_csv()

f = open(f"data/{SYMBOL}/{filedate}.csv", "w")
f.write(barf)
f.close()