import homeRouter from './home.js';
import accountRouter from './account.js';
import parkingRouter from './parking.js';
import userRouter from './user.js';
import authRouter from './auth.js';

function route(app) {
    // API routes
    app.use('/api/parking', parkingRouter);
    
    // Auth routes
    app.use('/api/auth', authRouter);
    
    // Account routes
    app.use('/api/account', accountRouter);
    
    // User routes
    app.use('/api/users', userRouter);
    
    // Home routes (should be last)
    app.use('/api/home', homeRouter);
}

// module.exports = route;
export default route;
