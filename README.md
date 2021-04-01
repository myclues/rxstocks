# RxStocks

This is a really rudimentary auto-trading bot to test out trading strategies, especially on high-volatility ~~stonks~~ stocks like GME.

## Dev setup

1. `docker-compose up -d` to build the backend Flask server - yfinance API is python only, but RxPY sucks
2. In `/js`, run `yarn run poller` to start the node application
3. You will need pm2 installed `npm install -g pm2`
   1. From the project root, run `pm2 start pm2config.yml`