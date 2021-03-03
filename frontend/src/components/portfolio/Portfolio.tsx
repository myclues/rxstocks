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
                showLine: false,
                showPoint: false,
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
            <div className="legend">
                <p><span className="line-color black dashed" /> starting value</p>
                <p><span className="line-color bright-green" /> total portfolio value</p>
                <p><span className="area-dark-green" /> stashed cash</p>
                <p><span className="line-color blue" /> trading cash</p>
                <p><span className="line-color red" /> stock value</p>
            </div>
        </div>
    );
};

export default TechComponent;