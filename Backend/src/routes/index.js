import siteRouter from './site.js';
import newsRouter from './news.js';

function route(app) {
    app.use('/news', newsRouter);
    app.use('/', siteRouter);
}

// module.exports = route;
export default route;