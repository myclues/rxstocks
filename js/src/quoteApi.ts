import axios from 'axios';

const host = 'http://localhost:5000';


export interface Quote {
    datetime: Date,
    symbol: string,
    price: number,
}

export const getQuote = (symbol): Promise<Quote> => axios.get(`${host}/api/fetch/${symbol}`)
    .then(resp => resp.data)
    .catch(err => {
        console.error(`ERROR FETCHING ${symbol}\t\t`, err);
    });

export const getHistory = (symbol): Promise<Quote[]> => axios.get(`${host}/api/history/${symbol}`)
    .then(resp => resp.data.data)
    .catch(err => {
        console.error(`Error fetching history ${symbol}\t\t`, err);
    });

export const getCryptoQuote = (symbol): Promise<Quote> => axios.get(`${host}/api/crypto/fetch/${symbol}`)
    .then(resp => resp.data)
    .catch(err => {
        console.error(`ERROR FETCHING ${symbol}\t\t`, err);
    });