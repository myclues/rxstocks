import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import Q from 'q';
import * as Chartist from 'chartist';
import ChartistGraph from 'react-chartist';

import 'chartist/dist/chartist.min.css';
import './portfolio.css';

import { PortfolioStatus, Quote, fetchPortfolioStatuses, fetchQuoteHistory } from './portfolioApi';
import dayjs from 'dayjs';

interface PortfolioState {
    loading: boolean,
    loaded: boolean,
    statuses: PortfolioStatus[],
    quoteHistory: Quote[],
}

const initialState = {
    loading: false,
    loaded: false,
    statuses: [],
    quoteHistory: [],
}

const latestStatus = (statuses: PortfolioStatus[]) => {
    return _.chain(statuses)
        .orderBy(s => s.datetime, ['desc'])
        .head()
        .value();
};

const portfolioValue = (ps: PortfolioStatus) => {
    return ps.currentCash + ps.stash + (ps.numShares * ps.costAvg);
};

const netGainLoss = (starting: number, ps: PortfolioStatus) => {
    return portfolioValue(ps) - starting;
};

const toDollars = (number: number) => Math.round(number * 1000000) / 1000000;

const formatDate = (d: dayjs.Dayjs) => d.format('MMM D, HH:mm');

const closestOrLatestStatus = (dt: dayjs.Dayjs, statuses: PortfolioStatus[]) => 
    _.find(statuses, s => dt.diff(s.datetime, 's') <= 30) || statuses[statuses.length -1];

const TechComponent = () => {
    let [state, setState] = useState<PortfolioState>(initialState);

    useEffect(() => {
        if (!state.loading) {
            if (!state.loaded) {
                setState({
                    ...state,
                    loading: true,
                    loaded: false,
                })

                Q.all([
                    fetchQuoteHistory('xdgusd'),
                    fetchPortfolioStatuses(),
                ])
                    .then(results => {
                        const [quoteHistory, statuses] = results;
                        console.log('history', quoteHistory);
                        console.log('statuses', statuses);
                        setState({
                            ...state,
                            loading: false,
                            loaded: true,
                            statuses,
                            quoteHistory,
                        })
                    })
                    .catch(err => {
                        console.error(err);
                        setState({
                            ...state,
                            loading: false,
                            loaded: false,
                        });
                    })
            }
        }
    },
        [state]
    );

    const chartOpts = {
        width: '1024px',
        height: '768px',
        onlyInteger: true,
        series: {
            'starting': {
                showPoint: false,
            },
            'stash': {
                showArea: true,
                showPoint: false,
            },
            'total': {
                showPoint: false,
            },
            'cash': {
                lineSmooth: Chartist.Interpolation.step(),
                showLine: false,
                showPoint: false,
            },
            'stocks': {
                lineSmooth: Chartist.Interpolation.step(),
                showLine: true,
                showPoint: false,
                showArea: true,
            },
            'price': {
                showLine: false,
                showPoint: true,
            }
        }
    };

    const chartData = {
        labels: _.map(state.quoteHistory, q => q.datetime.format('HH:mm')),
        series: [
            {
                name: 'starting',
                data: _.range(0, state.quoteHistory.length).map(i => (10000)),
            },
            {
                name: 'stash',
                data: _.map(state.quoteHistory, q => {
                    const status = closestOrLatestStatus(q.datetime, state.statuses);
                    return status ? status.stash : null;
                }),
            }, {
                name: 'total',
                data: _.map(state.quoteHistory, q => {
                    const status = closestOrLatestStatus(q.datetime, state.statuses);
                    return status ? (status.stash + status.currentCash + (status.numShares * q.price)) : null;
                }),
            },
            {
                name: 'stocks',
                data: _.map(state.quoteHistory, q => {
                    const status = closestOrLatestStatus(q.datetime, state.statuses);
                    return status ? (status.numShares * q.price) : null;
                }),
            },
            {
                name: 'cash',
                data: _.map(state.quoteHistory, q => {
                    const status = closestOrLatestStatus(q.datetime, state.statuses);
                    return status ? status.currentCash : null;
                }),
            },
            {
                name: 'price',
                data: _.map(state.quoteHistory, h => h.price * 10000)
            },
        ],
    }

    return (
        <div className="portfolio">
            <div className="chartbox">
                <h2>DOGE (xdgusd)
                    {state.quoteHistory.length && (
                        <span>{formatDate(state.quoteHistory[0].datetime)} - {formatDate(state.quoteHistory[state.quoteHistory.length - 1].datetime)}</span>
                    )}
                </h2>
                <ChartistGraph type='Line'
                    data={chartData}
                    // @ts-ignore
                    options={chartOpts}
                />
            </div>
            <div className="right-col">
                <div className="legend">
                    <p><span className="line-color black dashed" /> starting value</p>
                    <p><span className="line-color bright-green" /> total portfolio value</p>
                    <p><span className="area-dark-green" /> stashed cash</p>
                    <p><span className="line-color blue" /> trading cash</p>
                    <p><span className="line-color red" /> stock value</p>
                    <p><span className="line-color yellow" /> stock price</p>
                </div>
                {state.statuses.length && (
                    <div className="summary">
                        <h2>Summary</h2>
                        <p>Portfolio value start: <span className="strong">$10000</span></p>
                        <p>Portfolio value end: <span className="strong">${toDollars(portfolioValue(latestStatus(state.statuses)))}</span></p>
                        <p>Net gains: <span className="strong">${toDollars(netGainLoss(10000, latestStatus(state.statuses)))} ({(Math.round(toDollars(netGainLoss(10000, latestStatus(state.statuses))) * 100) / 10000)}%)</span></p>
                        <p>Stash: <span className="strong">${toDollars(latestStatus(state.statuses).stash)}</span></p>
                        <p>Liquid: <span className="strong">${toDollars(portfolioValue(latestStatus(state.statuses)) - latestStatus(state.statuses).stash)}</span></p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TechComponent;