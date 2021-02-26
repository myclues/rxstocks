import { from } from 'rxjs';
import { filter, scan } from 'rxjs/operators';
import * as dayjs from 'dayjs';

import { Quote, getHistory } from './quoteApi';
import { State, getMoney } from './dumbProcessor';


const config = {
    symbol: 'gme',

    // tweak these knobs
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

    getHistory(config.symbol).then(history => {
        from(history)
            .pipe(
                filter((val: Quote) => {
                    const dt = dayjs(val.datetime)
                    if (!initial.latestDate || dt.isAfter(initial.latestDate)) {
                        initial.latestDate = dt;
                        return true;
                    } else {
                        return false;
                    }
                }),
                scan(getMoney(config), initial),
            )
            .subscribe({
                next: next => {
                    // console.log();
                    return next;
                },
                complete: () => {
                    console.log("DONE!!!\n--------------------------");
                    process.exit(0);
                }
            });
    });
})();