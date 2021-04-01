# RxStocks

This is a really rudimentary auto-trading bot to test out trading strategies, especially on high-volatility ~~stonks~~ stocks like GME.  It's just a pet project to practice/learn RxJs, and look into Pandas a tiny bit.

Some parameters in this bot are configurable:

```
## DEFAULT VALUES
symbol: 'gme',
interval: 60 * 5, // seconds
startingCash: 10000,
stashPercent: .5, // what fraction of gains to stash away
txFee: 0,
trailingStopLossPercent: -.03, // not actually a trailing stop loss limit, poorly named
trailingGainPercent: .07, // not actually a trailing gain limit, also poorly named
buybackDelay: 5, // number of iterations to wait before buying back in if price rising
```

The logic behind the bot follows a few basic rules:

* Query the latest stock price on an `interval`
* If we can afford shares, buy as many as possible.  No partial shares yet.
* Compare the current share price to our current cost average
   * If the difference is > `trailingGainPercent`, sell and lock some profits
   * If the difference is < `trailingStopLossPercent`, sell and stem the losses
* If a sale occurs, wait `buybackDelay` iterations before buying back in 



## Setup

1. `docker-compose up -d` to build the backend Flask server - yfinance API is python only, but RxPY is incomplete
1. Either of the following methods will work

### Running in the background (PM2)

1. Needs pm2 installed (`npm install -g pm2`)
1. In `/js`, run `yarn run build` or `tsc -p tsconfig.json` 
1. From project root, run `pm2 start pm2config.yml`
   * Boots up a webserver on port 3000 to view the frontend
   * Also a background polling daemon that queries the python/Flask backend server

### Live dev server
1. In `/js`, run `yarn run poller` to start the node application
1. In `/frontend`, run `yarn start`, which will boot up on port 3000


## Components

1. Backend Python server, port 5000
1. Background JS poller that calls out to the Python server
1. Frontend graph react app, port 3000