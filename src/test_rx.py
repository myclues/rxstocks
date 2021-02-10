from rx import of, operators as ops
import yfinance as yf


def get_data():
    return of(1, 2, 3, 4, 5)


def next(i):
    print(f"turkey: {i}")


def err(e):
    print(f"ERRR: {e}")


def done():
    print("DONEZO")


def even(i):
    print(f"EVEN: {i}")


def main():
    data = get_data()
    data.subscribe(
        on_next=next,
        on_error=err,
        on_completed=done,
    )

    evens = data.pipe(ops.filter(lambda i: i % 2 == 0)).subscribe(even)


if __name__ == "__main__":
    main()