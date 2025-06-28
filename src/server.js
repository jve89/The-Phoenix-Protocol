const express = require('express');
const dotenv = require('dotenv');
const routes = require('./routes/routes');

const result = dotenv.config({ path: './.env' });
if (result.error) throw result.error;
console.log('Loaded STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));
app.use('/api', routes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});