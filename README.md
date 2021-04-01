# RxStocks

This is a really rudimentary auto-trading bot to test out trading strategies, especially on high-volatility ~~stonks~~ stocks like GME.

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