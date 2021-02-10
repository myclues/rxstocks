import { of, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import dayjs from 'dayjs';

import { getQuote } from './quoteApi.js';

const config = {
    interval: 65,
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

        const push = () => {
            timeout = setTimeout(
                () => {
                    getQuote(config.symbol).then((data) => {
                        sub.next(data);
                        push();
                    });
                },
                config.interval * 1000,
            );
            return () => clearTimeout(timeout);
        };

        getQuote(config.symbol).then((data) => {
            sub.next(data);
            push();
        });
    });

    quotePoller
        .pipe(
            filter(val => minPrice && val < minPrice)
        )
        .subscribe({
            next: ev => {
                console.log(ev);
                if (!minPrice) console.log('No price set yet.');
                console.log(`Setting minPrice to: ${ev.price}`);
            },
            error: err => console.error(err),
            complete: () => {
                process.exit(0);
            }
        });

    console.log(`Polling ${config.symbol} every ${config.interval} seconds...`);
})();