import axios from 'axios';
import dayjs from 'dayjs';
import { Tx } from './dumbProcessor';

const host = 'http://localhost:5000';


export interface PortfolioStatus {
    timestamp: Date,
    stash: number,
    numShares: number,
    costAvg: number,
    currentCash: number,
}

export interface Transaction {
    datetime: Date,
    price: number,
    numShares: number,
    txType: string,
}


export const logPortfolioChange = (ps: PortfolioStatus, tx: Tx) => {
    const txSave = {
        datetime: tx.datetime.toDate(),
        price: tx.price,
        numShares: tx.numShares,
        symbol: tx.symbol,
    }
    const logTx = axios.post(`${host}/api/portfolio/addTransaction`, txSave);

    const logPs = axios.post(`${host}/api/portfolio/addStatus`, ps);

    return Promise.all([logTx, logPs]);
}