import siteRouter from './site.js';
import newsRouter from './news.js';

function route(app) {

    app.use('/news', newsRouter);
    app.use('/', siteRouter);

    // app.get('/news', (req, res) => {
    //     res.render('news');
    // });
    // app.get('/', (req, res) => {
    //     res.render('home');
    // });
    
    // app.get('/search', (req, res) => {
    //     res.render('search');
    // });
}

// module.exports = route;
export default route;