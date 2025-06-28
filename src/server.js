const express = require('express');
const dotenv = require('dotenv');
const routes = require('./routes/routes');

dotenv.config({ path: './.env' }); // Explicit root path
if (!process.env.STRIPE_SECRET_KEY) console.error('Stripe key not loaded');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));
app.use('/api', routes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});