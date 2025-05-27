import homeRouter from './home.js';
import accountRouter from './account.js';
import parkingRouter from './parking.js';
import userRouter from './user.js';

function route(app) {
  app.use('/api/parking', parkingRouter);
  app.use('/account', accountRouter)
  app.use('/users', userRouter);
  app.use('/', homeRouter);
}

// module.exports = route;
export default route;
