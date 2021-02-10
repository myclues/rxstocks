from rx import (
    # creation
    of,
    # factory creation
    interval,
    # operators
    operators as ops,
    switch_map,
)
import yfinance as yf


def get_data():
    return of(1, 2, 3, 4, 5)


def get_yf_data(ticker):
    hist_month = ticker.history(period="1d")
    print(hist_month)

    dates = hist_month.index
    quote_info = hist_month.values.tolist()
    combined = list(zip(dates, quote_info))

    return combined


def next(i):
    print(f"turkey: {i}")


def err(e):
    print(f"ERRR: {e}")


def done():
    print("DONEZO")


def even(i):
    print(f"EVEN: {i}")


def main():
    gme = yf.Ticker("GME")

    data = interval(5.0).pipe(
        switch_map(lambda i: get_yf_data(gme)),
    )
    data.subscribe(
        on_next=next,
        on_error=err,
        on_completed=next,
    )


if __name__ == "__main__":
    main()