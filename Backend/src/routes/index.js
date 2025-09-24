import homeRouter from './home.js';
import accountRouter from './account.js';
import parkingRouter from './parking.js';
import userRouter from './user.js';
import authRouter from './auth.js';
import staffRouter from './staff.js';
import reportsRouter from './reports.js';
import notificationRouter from './notification.js';
import schedulerRouter from './scheduler.js';
import blacklistRouter from './blacklist.js';
import qaRouter from './qa.js';

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
    
    // Notification routes
    app.use('/api/notification', notificationRouter);
    
    // Blacklist routes
    app.use('/api/blacklist', blacklistRouter);

    // Scheduler routes
    app.use('/api/scheduler', schedulerRouter);
  
    // Home routes (should be last)
    app.use('/api/home', homeRouter);

    app.use('/api/reports', reportsRouter);
    
    // QA routes
    app.use('/api/qa', qaRouter);
}

export default route;