import express from 'express';
import morgan from 'morgan';
import session from 'express-session';
import { engine } from 'express-handlebars';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cookieParser from 'cookie-parser';
// import swaggerUi from 'swagger-ui-express';
// import swaggerDocument from './swagger.js';
// import swagge_jsdoc from './swagger-jsdoc';

import route from './routes/index.js';
import dbConnect from './config/db/index.js';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 1313;

// Connect to DB
dbConnect();

app.use(express.static(join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.json());
app.use(
    session({
        secret: 'yourSecretKey',
        resave: false,
        saveUninitialized: true,
    }),
);

// HTTP logger display
app.use(morgan('combined')); // get log when request is successful

// Swagger UI
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Template engine
app.engine(
    'hbs',
    engine({
        extname: '.hbs',
    }),
);
app.set('view engine', 'hbs');
app.set('views', join(__dirname, 'resources/views'));

// routes init
route(app);

app.listen(PORT, () =>
    console.log(`Server is running on http://localhost:${PORT}`),
);
