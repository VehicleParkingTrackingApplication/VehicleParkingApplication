import express from 'express';
import morgan from 'morgan';
import session from 'express-session';
import { engine } from 'express-handlebars';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cookieParser from 'cookie-parser';
import route from './src/routes/index.js';
import dbConnect from './src/config/db/index.js';
import dotenv from 'dotenv';
import cors from 'cors';
import serverless from 'serverless-http';

// Import scheduler services
import { ScheduledFtpService } from './src/app/services/scheduledFtpService.js';
import { ScheduledSimulationService } from './src/app/services/scheduledSimulationService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 1313;

// Connect to DB
dbConnect();

// ============= INITIALIZE SCHEDULER SERVICES =============
// Initialize schedulers if not in test environment
const scheduledSimulationService = new ScheduledSimulationService();
scheduledSimulationService.startScheduledProcessing();

// const scheduledFtpService = new ScheduledFtpService();
// scheduledFtpService.startScheduledProcessing();
// ============= END SCHEDULER INITIALIZATION =============

// CORS configuration for development
// app.use(cors());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com'] // Replace with your production domain
        : ['http://localhost:5173', 'http://127.0.0.1:5173'], // Frontend dev server
    credentials: true, // Allow cookies and credentials
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.static(join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.json());
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'yourSecretKey',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        }
    }),
);

// HTTP logger display
app.use(morgan('combined')); // get log when request is successful

// Template engine
app.engine(
    'hbs',
    engine({
        extname: '.hbs',
        helpers: {
            eq: function (v1, v2) {
                return v1 === v2;
            }
        }
    }),
);
app.set('view engine', 'hbs');
app.set('views', join(__dirname, 'resources/views'));

// routes init
route(app);

app.listen(PORT, () =>
    console.log(`Server is running on http://localhost:${PORT}`),
);

const handleRequest = serverless(app);
export const handler = async (event, context) => {
    return await handleRequest(event, context);
}
