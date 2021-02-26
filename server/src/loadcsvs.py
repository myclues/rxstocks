import os
import sys
from datetime import datetime
import csv
from io import TextIOWrapper

from mongoengine import connect
from pymongo.errors import *

from mongomodels import *

connect(
    alias='stocks',
    db='teststocks',
    username='root',
    password='pw',
    authentication_source='admin',
    host='mongodb://db',
)


def insert_quote(symbol, dt, price):
    try:
        q = Quote(
            symbol=symbol,
            datetime=dt,
            price=price,
        )
        q.save()
        return q
    except (DuplicateKeyError, NotUniqueError) as e:
        # print("Trying to insert dupe")
        return None


try:
    fileroot = os.path.abspath(sys.argv[1])
    symbol = sys.argv[2]

    filepath = f"{fileroot}/{symbol}"

    if (len(sys.argv) < 3):
        raise Exception()

    print(f"Reading files from {filepath}")

    files = list(f for f in os.listdir(filepath) if f.lower().endswith('.csv'))
except:
    print(f"Usage:   python3 loadcsvs.py /path/to/dir SYMBOL")


total_insert_count = 0
for f in files:
    with open(f"{filepath}/{f}") as infile:
        rows = list(csv.DictReader(infile))
        insert_count = 0
        for row in rows:
            q = insert_quote(symbol, datetime.strptime(row['Datetime'], '%Y-%m-%d %H:%M:%S%z'), row['Close'])
            if q:
                insert_count += 1
        print(f"Processed 1 file w/ {insert_count}/{len(rows)} records inserted")
        total_insert_count += insert_count

endquotes = Quote.objects()
print(f"Done processing.  Inserted {total_insert_count} records. {len(endquotes)} total found.")

