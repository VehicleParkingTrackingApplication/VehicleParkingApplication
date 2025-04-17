import siteRouter from './site.js';

function route(app) {
    // app.use('/camera', registerRouter)
    app.use('/', siteRouter);
}

// module.exports = route;
export default route;