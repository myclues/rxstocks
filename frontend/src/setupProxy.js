const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = (app) => {
    app.use(createProxyMiddleware('/api', {
        target: 'http://localhost:5000/',
    }));
    app.use(createProxyMiddleware('/media', {
        target: 'http://localhost:5000/',
    }));
}