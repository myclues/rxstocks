import axios from 'axios';
import _ from 'lodash';
import dayjs from 'dayjs';

export interface PortfolioStatus {
    datetime: dayjs.Dayjs,
    stash: number,
    currentCash: number,
    numShares: number,
    costAvg: number,
    gains: number,
    losses: number,
}


export const fetchPortfolioStatuses = () => axios.get('/api/portfolio')
    .then(resp => resp.data)
    .then(res => _.map(res.data, s => {
        return {
            ...s,
            datetime: dayjs(s.datetime).subtract(4, 'h'),
        }
    }));


export interface Quote {
    datetime: dayjs.Dayjs,
    symbol: string,
    price: number,
}


export const fetchQuoteHistory = (symbol: string) => axios.get(`/api/history/${symbol}`)
    .then(resp => resp.data)
    .then(res => {
        return _.map(res.data, q => {
            return {
                ...q,
                datetime: dayjs(q.datetime),
            };
        });
    });