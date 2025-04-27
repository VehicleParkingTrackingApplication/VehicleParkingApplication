import homeRouter from './home.js';
import accountRouter from './account.js';
// import parkingRouter from './parking.js';

function route(app) {
//   app.use('/camera-data', parkingRouter);
  app.use('/account', accountRouter)
  app.use('/', homeRouter);
}

// module.exports = route;
export default route;
