import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import * as Chartist from 'chartist';
import ChartistGraph from 'react-chartist';

import 'chartist/dist/chartist.min.css';
import './portfolio.css';

import { PortfolioStatus, fetchPortfolioStatuses } from './portfolioApi';

interface PortfolioState {
    loading: boolean,
    loaded: boolean,
    statuses: PortfolioStatus[],

}

const initialState = {
    loading: false,
    loaded: false,
    statuses: [],
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

const toDollars = (number: number) => Math.round(number * 100) / 100;

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

                fetchPortfolioStatuses()
                    .then(statuses => {
                        console.log('statuses', statuses);
                        setState({
                            ...state,
                            loading: false,
                            loaded: true,
                            statuses,
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
            },
            'total': {

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
        }
    };

    const chartData = {
        labels: _.map(state.statuses, s => s.datetime.format('ddd HH:mm')),
        series: [
            {
                name: 'starting',
                data: _.range(0, state.statuses.length).map(i => (10000)),
            },
            {
                name: 'stash',
                data: _.map(state.statuses, s => s.stash)
            }, {
                name: 'total',
                data: _.map(state.statuses, s => (s.stash + s.currentCash + (s.numShares * s.costAvg)))
            },
            {
                name: 'stocks',
                data: _.map(state.statuses, s => (s.numShares * s.costAvg))
            },
            {
                name: 'cash',
                data: _.map(state.statuses, s => s.currentCash)
            },
        ],
    }

    return (
        <div className="portfolio">
            <div className="chartbox">
                <h2>GME</h2>
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
                </div>
                {state.statuses.length && (
                    <div className="summary">
                        <h2>Summary</h2>
                        <p>Portfolio value start: <span className="strong">$10000</span></p>
                        <p>Portfolio value end: <span className="strong">${toDollars(portfolioValue(latestStatus(state.statuses)))}</span></p>
                        <p>Net gains: <span className="strong">${toDollars(netGainLoss(10000, latestStatus(state.statuses)))}</span></p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TechComponent;