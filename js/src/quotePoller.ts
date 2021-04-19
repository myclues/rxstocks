import { Observable } from 'rxjs';
import { filter, scan } from 'rxjs/operators';

import { State, getMoney, printRes } from './dumbProcessor';
import { Quote, getCryptoQuote } from './quoteApi';
import { logPortfolioChange } from './resultsApi';
import { fetchPortfolioStatuses } from './portfolioApi';
import dayjs from 'dayjs';

const config = {
    symbol: 'xdgusd',

    // tweak these knobs
    interval: 60 * 5,
    startingCash: 10000,
    stashPercent: .5,
    txFee: 0,
    trailingStopLossPercent: -.03,
    trailingGainPercent: .07,
    buybackDelay: 5, // number of iterations to wait before buying back in if price rising
};

const savePortfolioChange = (ps, tx) => logPortfolioChange(ps, tx);

(function main() {
    const defaultState: State = {
        latestDate: null,
        stash: 0,
        numShares: 0,
        costAvg: 0,
        currentCash: config.startingCash,
        txHistory: [],
        isFalling: false,
        buybackCounter: config.buybackDelay, // start at max so we immediately buy in
        gains: 0,
        losses: 0,
    };

    let lastUpdate;

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
                    getCryptoQuote(config.symbol).then((data) => {
                        console.log('quotedata', data);
                        if (!!data) {
                            sub.next(data);
                        }
                        fetchNextData();
                    }).catch((e) => {
                        console.log('error fetching quote');
                    });
                },
                config.interval * 1001,
            );
            return () => clearTimeout(timeout);
        };

        getCryptoQuote(config.symbol).then((data) => {
            console.log('quotedata', data);
            if (!!data) {
                sub.next(data);
            }
            fetchNextData();
        }).catch((e) => {
            console.log('error fetching quote');
        });
    });

    fetchPortfolioStatuses()
        .then(statuses => {
            const initial = {
                ...defaultState,
                ...statuses[0],
            };

            console.log('Starting with portfolio...', initial);

            // @ts-ignore
            quotePoller
                .pipe(
                    filter((val: Quote) => {
                        const allow = !lastUpdate || dayjs(val.datetime).isAfter(lastUpdate)
                        if (!allow) {
                            console.log("No new data, skipping...");
                        }
                        return allow;
                    }),
                    scan(getMoney(config, savePortfolioChange), initial),
                )
                .subscribe({
                    next: (ev) => {
                        // printRes(ev, initial.currentCash);
                        lastUpdate = ev.latestDate;
                    },
                    error: err => console.error(err),
                    complete: () => {
                        process.exit(0);
                    }
                });

            console.log(`Polling ${config.symbol} every ${config.interval} seconds...`);
        })
        .catch(err => {
            console.error('Could not fetch initial status. Exiting...', err);
        });

})();