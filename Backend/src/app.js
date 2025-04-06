import express from 'express';
import morgan from 'morgan';
import { engine } from 'express-handlebars';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.static(join(__dirname, 'public')));

// HTTP logger display
app.use(morgan('combined')); // get log when request is successful

// Template engine
app.engine('hbs', engine({
  extname: '.hbs'
}));
app.set('view engine', 'hbs');
app.set('views', join(__dirname, 'resources/views'));

app.get('/', (req, res) => {
  
  res.render('home');
});

app.get('/news', (req, res) => {
  res.render('news');
});

app.get('/search', (req, res) => {
  res.render('search');
});

app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));