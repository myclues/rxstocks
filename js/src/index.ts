import register from '@babel/register';
import { from, Observable, of } from 'rxjs';
import { filter } from 'rxjs/operators';
import * as dayjs from 'dayjs';

import { Quote, getHistory } from './quoteApi';


register({
    extensions: ['.js', '.ts']
});

const config = {
    symbol: 'gme',
};

(function main() {
    let res = {
        latest: null,
        gains: 0,
        txHistory: [],
    };

    getHistory(config.symbol).then(history => {
        from(history.data)
            .pipe(
                filter((val: Quote) => {
                    const dt = dayjs(val.datetime)
                    if (!res.latest || dt.isAfter(res.latest)) {
                        res.latest = dt;
                        return true;
                    } else {
                        return false;
                    }
                }),
            )
            .subscribe({
                next: quote => {
                    console.log(`latest: ${quote.price}`)
                },
                complete: () => {
                    process.exit(0);
                }
            });
    });
})();