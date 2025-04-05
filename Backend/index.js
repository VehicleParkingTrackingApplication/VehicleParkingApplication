const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  console.log('Ohhh now I hit the / endpoint!');
  // res.send('Hello World!');
  res.sendStatus(201);
});

app.get('/dashboard', (req, res) => {
  console.log('Ohhh now I hit the /dashboard endpoint!');
  res.send('Welcome to the Dashboard!');
});
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));