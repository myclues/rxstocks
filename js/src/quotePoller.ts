import { Observable } from 'rxjs';
import { filter, scan } from 'rxjs/operators';

import { State, getMoney } from './dumbProcessor';
import { Quote, getQuote } from './quoteApi';

const config = {
    symbol: 'gme',

    // tweak these knobs
    interval: 60,
    startingCash: 10000,
    stashPercent: .5,
    txFee: 0,
    trailingStopLossPercent: -.03,
    trailingGainPercent: .07,
    buybackDelay: 5, // number of iterations to wait before buying back in if price rising
};

(function main() {
    const initial: State = {
        latestDate: null,
        stash: 0,
        numShares: 0,
        costAvg: 0,
        currentCash: config.startingCash,
        txHistory: [],
        isFalling: false,
        buybackCounter: config.buybackDelay, // start at max so we immediately buy in
    };

    /**
    https://rxjs.dev/api/index/class/Observable
    - Observable constructor takes a handler (subscriber => ())
    - subscriber has 3 methods: .next, .error, .complete to emit those events
    - when subscribing to an instance of Observable, provide 3 handlers for what to do when receiving same 3 events

    Recursive poller to generate data stream:
    https://stackoverflow.com/questions/41388199/how-to-create-an-infinite-observable-that-produces-random-numbers-at-random-inte
    */
    const quotePoller = new Observable(sub => {
        let timeout = null;

        const fetchNextData = () => {
            timeout = setTimeout(
                () => {
                    getQuote(config.symbol).then((data) => {
                        sub.next(data);
                        fetchNextData();
                    });
                },
                config.interval * 1001,
            );
            return () => clearTimeout(timeout);
        };

        getQuote(config.symbol).then((data) => {
            sub.next(data);
            fetchNextData();
        });
    });

    // @ts-ignore
    quotePoller
        .pipe(
            // filter((val: Quote) => {
            //     const dt = dayjs(val.datetime)
            //     if (!initial.latestDate || dt.isAfter(initial.latestDate)) {
            //         initial.latestDate = dt;
            //         return true;
            //     } else {
            //         return false;
            //     }
            // }),
            scan(getMoney(config), initial),
        )
        .subscribe({
            next: (ev: Quote) => { },
            error: err => console.error(err),
            complete: () => {
                process.exit(0);
            }
        });

    console.log(`Polling ${config.symbol} every ${config.interval} seconds...`);
})();