import siteRouter from './site.js';
import parkingRouter from './parking.js';

function route(app) {
    app.use('/camera-data', parkingRouter)
    app.use('/', siteRouter);
}

// module.exports = route;
export default route;