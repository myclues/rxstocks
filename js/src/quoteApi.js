import axios from 'axios';

const host = 'http://localhost:5000';
const apiPath = (symbol) => `${host}/api/symbol/${symbol}`;

export const getQuote = (symbol) => axios.get(apiPath(symbol))
    .then(resp => {
        const data = {
            ...resp.data,
            date: new Date(resp.data.date)
        }
        return data;
    })
    .catch(err => {
        console.error(`ERROR FETCHING ${apiPath(symbol)}\t\t`, err);
    });