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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 1313;

// Connect to DB
dbConnect();

app.use(cors())
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
