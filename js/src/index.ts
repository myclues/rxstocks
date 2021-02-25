import { from, Observable, of } from 'rxjs';
import { filter, scan } from 'rxjs/operators';
import * as dayjs from 'dayjs';

import { Quote, getHistory } from './quoteApi';

const NodeColors = {
    Cyan: "\x1b[36m",
    Red: "\x1b[31m",
    Green: "\x1b[32m",
    Reset: "\x1b[0m",
}


const config = {
    startingCash: 1000,

    symbol: 'gme',
    stashPercent: .5,
    txFee: 10,
    trailingStopLossPercent: -.05,
    trailingGainPercent: .05,
};

enum TxType {
    Buy,
    Sell
};

interface Tx {
    datetime: dayjs.Dayjs,
    price: number,
    numShares: number,
    txType: TxType,
};


interface State {
    latestDate: dayjs.Dayjs,
    stash: number,
    numShares: number,
    costAvg: number,
    currentCash: number,
    txHistory: Tx[],
    isFalling: boolean,
};


const printRes = (result) => {
    console.log(`[[${result.latestDate}]]`)
    console.log(`stash: ${result.stash}\ttrading cash: ${result.currentCash}\tcash total: ${toDollars(result.stash + result.currentCash)}`)
    console.log(`shares: ${result.numShares}\tavg: ${result.costAvg}\t\tvalue: ${toDollars(result.numShares * result.costAvg)}`);

    const color = ((result.stash + result.currentCash + (result.numShares * result.costAvg)) > config.startingCash) ? NodeColors.Green : NodeColors.Red;
    console.log(`Portfolio value: ${color}$${toDollars(result.stash + result.currentCash + (result.numShares * result.costAvg))}${NodeColors.Reset}`);
    console.log('--------------');
}


const percent = number => Math.floor(number * 10000) / 100;
const toDollars = number => Math.round(number * 100) / 100;


const getMoney = (res: State, quote: Quote) => {
    if (res.currentCash <= 0 && res.numShares == 0) {
        console.log(`${NodeColors.Red} Bankrupt. WAMP WAMP`);
        process.exit(0);
    }

    console.log(`-----\n[${dayjs(quote.datetime).format('HH:mm:SS')}]\t price: $${quote.price}`);

    const now = dayjs(quote.datetime);


    const isFalling = (quote.price < res.costAvg);
    let result = {
        ...res,
        isFalling,
    };

    // more cash to buy more shares
    // TODO: maybe only buy if cost average goes down/stays the same
    const sharesToBuy = Math.floor((res.currentCash - config.txFee) / quote.price);

    if (sharesToBuy >= 1) {
        // if ((res.numShares == 0 || res.isFalling) && sharesToBuy >= 1) {
        const tx = {
            datetime: now,
            price: quote.price,
            numShares: sharesToBuy,
            txType: TxType.Buy,
        }
        const cost = tx.numShares * tx.price + config.txFee;

        result = {
            ...res,
            latestDate: now,
            costAvg: toDollars(((res.numShares * res.costAvg) + (tx.numShares * tx.price)) / (res.numShares + tx.numShares)),
            currentCash: toDollars(res.currentCash - cost),
            numShares: res.numShares + tx.numShares,
            txHistory: res.txHistory.concat([tx])
        }

        console.log(`${NodeColors.Cyan}BUYING! (${tx.numShares} x ${tx.price}) = $${toDollars(cost)}\tremaining cash: $${result.currentCash} ${NodeColors.Reset}`);
        printRes(result);
    } else {

        const priceDiff = quote.price - res.costAvg;
        const priceDiffPercent = priceDiff / res.costAvg;

        if (!result.isFalling && priceDiffPercent >= config.trailingGainPercent && result.numShares > 0) {
            // sell and take profit

            const gain = res.numShares * quote.price - config.txFee;

            const stashAmount = priceDiff * res.numShares * config.stashPercent;

            const tx = {
                datetime: dayjs(),
                price: quote.price,
                numShares: res.numShares,
                txType: TxType.Sell,
            };

            result = {
                ...res,
                latestDate: now,
                numShares: 0,
                currentCash: toDollars(res.currentCash + gain - stashAmount),
                stash: toDollars(res.stash + stashAmount),
                costAvg: 0,
                txHistory: res.txHistory.concat([tx]),
            }
            console.log(`${NodeColors.Green}LOCK PROFITS!\t${toDollars(gain)}${NodeColors.Reset}`);
            printRes(result);
        } else if (priceDiffPercent <= config.trailingStopLossPercent) {
            // sell and hedge
            const tx = {
                datetime: dayjs(),
                price: quote.price,
                numShares: res.numShares,
                txType: TxType.Sell,
            };

            const gain = res.numShares * quote.price - config.txFee;

            result = {
                ...res,
                latestDate: now,
                numShares: 0,
                currentCash: toDollars(res.currentCash + gain),
                costAvg: 0,
                txHistory: res.txHistory.concat([tx]),
            }
            console.log(`${NodeColors.Red}STOP LOSS! (${tx.numShares} x ${tx.price}) = $${toDollars(gain)} (${percent(priceDiffPercent)}%)${NodeColors.Reset}`);
            printRes(result);
        } else {
            // do nothing, bump latest date processed
            result = {
                ...res,
                latestDate: now,
            }
        }
    }

    return result;
};


(function main() {
    let res: State = {
        latestDate: null,
        stash: 0,
        numShares: 0,
        costAvg: 0,
        currentCash: config.startingCash,
        txHistory: [],
        isFalling: false,
    };

    getHistory(config.symbol).then(history => {
        from(history)
            .pipe(
                filter((val: Quote) => {
                    const dt = dayjs(val.datetime)
                    if (!res.latestDate || dt.isAfter(res.latestDate)) {
                        res.latestDate = dt;
                        return true;
                    } else {
                        return false;
                    }
                }),
                scan(getMoney, res),
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