import homeRouter from './home.js';
import accountRouter from './account.js';
import parkingRouter from './parking.js';
import userRouter from './user.js';
import authRouter from './auth.js';
import staffRouter from './staff.js';
import recordsRouter from './records.js'; // <-- 1. IMPORT your new route
import reportsRouter from './reports.js';

function route(app) {
    // API routes
    app.use('/api/parking', parkingRouter);
    
    // Auth routes
    app.use('/api/auth', authRouter);
    
    // Account routes
    app.use('/api/account', accountRouter);
    
    // User routes
    app.use('/api/users', userRouter);

    // Staff routes
    app.use('/api/staff', staffRouter);
    
    // Home routes (should be last)
    app.use('/api/home', homeRouter);
    
    app.use('/api/records', recordsRouter); 

    app.use('/api/reports', reportsRouter);
}

// module.exports = route;
export default route;
