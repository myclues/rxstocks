import { of, Observable } from 'rxjs';
import dayjs from 'dayjs';

import { getQuote } from './quoteApi.js';

const config = {
    interval: 65,
    symbol: 'gme',
};

(function main() {
    // https://stackoverflow.com/questions/41388199/how-to-create-an-infinite-observable-that-produces-random-numbers-at-random-inte
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

    quotePoller.subscribe({
        next: ev => console.log(ev),
        error: err => console.error(err),
        complete: () => {
            process.exit(0);
        }
    });

    console.log(`Polling ${config.symbol} every ${config.interval} seconds...`);
})();