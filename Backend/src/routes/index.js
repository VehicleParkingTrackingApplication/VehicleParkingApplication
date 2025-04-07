import siteRouter from './site.js';
import newsRouter from './news.js';

function route(app) {
    app.get('/', siteRouter);
    app.get('/news', newsRouter);
}

// module.exports = route;
export default route;