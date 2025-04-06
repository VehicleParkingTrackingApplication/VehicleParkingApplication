import express from 'express';
import morgan from 'morgan';
import { engine } from 'express-handlebars';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import route from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

// route direct to index.js in routes
// const route = require('./routes');



app.use(express.static(join(__dirname, 'public')));
app.use(
  express.urlencoded({
      extended: true,
  }),
);
app.use(express.json());

// HTTP logger display
app.use(morgan('combined')); // get log when request is successful

// Template engine
app.engine('hbs', engine({
  extname: '.hbs'
}));
app.set('view engine', 'hbs');
app.set('views', join(__dirname, 'resources/views'));

// routes init
route(app);


app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));