import { of, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import dayjs from 'dayjs';

import { Quote, getQuote } from './quoteApi';

const config = {
    interval: 60,
    symbol: 'gme',
};

(function main() {
    let minPrice;
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

    quotePoller
        .pipe(
            filter((val: Quote) => !minPrice || val.price < minPrice),
        )
        .subscribe({
            next: (ev: Quote) => {
                console.debug(`fetched`, ev);
                if (!minPrice) console.log('No minPrice set yet.');
                console.log(`Setting new minPrice to: ${ev.price}`);
                minPrice = ev.price;
            },
            error: err => console.error(err),
            complete: () => {
                process.exit(0);
            }
        });

    console.log(`Polling ${config.symbol} every ${config.interval} seconds...`);
})();