import json
import yfinance as yf


gme = yf.Ticker("GME")

print("1. Downloading symbol info")
info = gme.info
print(json.dumps(info, sort_keys=True, indent=2))

print("\n2. Downloading history: period = 1d")
hist_period_day = gme.history(period="1d")
print(hist_period_day)
print("Shows DAILY historical data for the last 1 day")

print("\n3. Downloading history: period = max")
hist_period_max = gme.history(period="max")
print(hist_period_max)
print("Shows DAILY historical data for the max life of stock")

print("\n4. Downloading history: interval = 1d")
hist_interval_1d = gme.history(interval="1d")
print(hist_interval_1d)
print("Shows historical data in 1-day increments. Default period may be 1mo?")

print("\n5. Downloading history: interval = 90m")
hist_interval_90m = gme.history(interval="90m")
print(hist_interval_90m)
print("Shows historical data in 90-min increments.")

print("\n6. Max period rows 3-5")
print(hist_period_max[2:5])
print("Object is a pandas dataframe so need to use .loc() and index to access")
