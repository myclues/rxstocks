import React from 'react';

import logo from '../../logo-square-250x250.png';

const BearwaveHeader = () => (
    <header className="main-header">
        <div className="header-grid">
            <div className="logo-container">
                <img src={logo} alt="Bearwave" />
            </div>
            <div className="title">
            </div>
            <div className="nav-links">
                <ul>
                    <li>git money.</li>
                </ul>
            </div>
        </div>
        <div className="header-underlay">&nbsp;</div>
    </header>
);

export default BearwaveHeader;