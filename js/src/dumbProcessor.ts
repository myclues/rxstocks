import { from, Observable, of } from 'rxjs';
import { filter, scan } from 'rxjs/operators';
import * as dayjs from 'dayjs';

import { Quote, getHistory } from './quoteApi';

const NodeColors = {
    Cyan: "\x1b[36m",
    Red: "\x1b[31m",
    Green: "\x1b[32m",
    Reset: "\x1b[0m",
    Dim: "\x1b[2m"
}

enum TxType {
    Buy,
    Sell
};

export interface Tx {
    datetime: dayjs.Dayjs,
    price: number,
    numShares: number,
    txType: TxType,
};


export interface State {
    latestDate: dayjs.Dayjs,
    stash: number,
    numShares: number,
    costAvg: number,
    currentCash: number,
    txHistory: Tx[],
    isFalling: boolean,
    buybackCounter: number,
};


const printRes = (result, startingCash) => {
    const cashTotal = toDollars(result.stash + result.currentCash);
    const stockValue = toDollars(result.numShares * result.costAvg);

    console.log(`[[${result.latestDate}]]`)
    console.log(`stash: ${result.stash}\ttrading cash: ${result.currentCash}\tcash total: ${cashTotal}`)
    console.log(`shares: ${result.numShares}\tavg: ${result.costAvg}\t\tvalue: ${stockValue}`);

    const color = ((result.stash + result.currentCash + (result.numShares * result.costAvg)) > startingCash) ? NodeColors.Green : NodeColors.Red;
    console.log(`Portfolio value: ${color}$${toDollars(cashTotal + stockValue)}${NodeColors.Reset}`);
    console.log('--------------');
}


const percent = number => Math.floor(number * 10000) / 100;
const toDollars = number => Math.round(number * 100) / 100;


export const getMoney = (config) => (res: State, quote: Quote) => {
    if (res.currentCash <= 0 && res.numShares == 0) {
        console.log(`${NodeColors.Red} Bankrupt. WAMP WAMP`);
        process.exit(0);
    }

    console.log(`[${dayjs(quote.datetime).format('HH:mm')}]\t price: $${quote.price}`);

    const now = dayjs(quote.datetime);


    const isFalling = (quote.price < res.costAvg);
    let result = {
        ...res,
        isFalling,
    };

    // more cash to buy more shares
    // TODO: maybe only buy if cost average goes down/stays the same
    const sharesToBuy = Math.floor((res.currentCash - config.txFee) / quote.price);

    if (result.buybackCounter >= config.buybackDelay && sharesToBuy >= 1) {
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

        console.log(`--------------\n${NodeColors.Cyan}BUYING! (${tx.numShares} x ${tx.price}) = $${toDollars(cost)}\tremaining cash: $${result.currentCash} ${NodeColors.Reset}`);
        printRes(result, config.startingCash);
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
                buybackCounter: 0,
            }
            console.log(`--------------\n${NodeColors.Green}LOCK PROFITS!\t${toDollars(gain)}${NodeColors.Reset}`);
            printRes(result, config.startingCash);
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
                buybackCounter: 0,
            }
            console.log(`--------------\n${NodeColors.Red}STOP LOSS! (${tx.numShares} x ${tx.price}) = $${toDollars(gain)} (${percent(priceDiffPercent)}%)${NodeColors.Reset}`);
            printRes(result, config.startingCash);
        } else {
            if (res.buybackCounter < config.buybackDelay && res.txHistory.length) {
                console.log(`Waiting ${config.buybackDelay - res.buybackCounter} more iterations before buying back in`);
            }
            result = {
                ...res,
                latestDate: now,
                buybackCounter: res.buybackCounter + 1,
            }
            console.log(NodeColors.Dim);
            printRes(result, config.startingCash);
            console.log(NodeColors.Reset);
        }
    }

    return result;
};