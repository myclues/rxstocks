import axios from 'axios';
import _ from 'lodash';
import dayjs from 'dayjs';

export interface PortfolioStatus {
    datetime: dayjs.Dayjs,
    stash: number,
    currentCash: number,
    numShares: number,
    costAvg: number,
}


export const fetchPortfolioStatuses = () => axios.get('/api/portfolio')
    .then(resp => resp.data)
    .then(res => _.map(res.data, s => {
        return {
            ...s,
            datetime: dayjs(s.datetime),
        }
    }));