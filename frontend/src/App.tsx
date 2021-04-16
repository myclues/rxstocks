import React from 'react';
import {
    HashRouter as Router,
    Switch,
    Redirect,
    Route,
} from 'react-router-dom';

import BearwaveHeader from "./components/header/Header";
import Portfolio from "./components/portfolio/Portfolio";

import './App.css';

function App() {
    return (
        <Router>
            <div className="app">
                <BearwaveHeader />
                <Switch>
                    <Route exact path="/doge"><Portfolio /></Route>
                    <Redirect to="/doge" />
                </Switch>
            </div>
        </Router>
    );
}

export default App;
