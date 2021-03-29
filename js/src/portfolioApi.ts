import axios from 'axios';
import _ from 'lodash';
import dayjs from 'dayjs';

const host = 'http://localhost:5000';

export interface PortfolioStatus {
    datetime: dayjs.Dayjs,
    stash: number,
    currentCash: number,
    numShares: number,
    costAvg: number,
    gains: number,
    losses: number,
}

export const fetchPortfolioStatuses = () => axios.get(`${host}/api/portfolio`)
    .then(resp => resp.data.data)
    .then(res => _.chain(res)
        .map(s => {
            return {
                ...s,
                datetime: dayjs(s.datetime),
            }
        })
        .orderBy(s => s.datetime.toDate(), ['desc'])
        .value());