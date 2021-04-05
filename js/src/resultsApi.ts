import axios from 'axios';
import dayjs from 'dayjs';
import { Tx } from './dumbProcessor';

const host = 'http://localhost:5000';


export interface PortfolioStatus {
    datetime: Date,
    stash: number,
    currentCash: number,
    numShares: number,
    costAvg: number,
}

export interface Transaction {
    datetime: Date,
    price: number,
    numShares: number,
    txType: number,
    symbol: string,
}


export const logPortfolioChange = (ps: PortfolioStatus, tx: Tx) => {
    const txSave = {
        datetime: tx.datetime.toDate(),
        price: tx.price,
        numShares: tx.numShares,
        symbol: tx.symbol,
        txType: tx.txType,
    }
    const logTx = axios.post(`${host}/api/portfolio/addTransaction`, txSave);

    const logPs = axios.post(`${host}/api/portfolio/addStatus`, ps);

    return Promise.all([logTx, logPs])
        .catch(errs => {
            console.error('Error saving portfolio status', errs);
        });
}