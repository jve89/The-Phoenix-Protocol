const express = require('express');
const dotenv = require('dotenv');
const routes = require('./routes/routes');

dotenv.config({ path: './.env' }); // Explicit root path
if (!process.env.STRIPE_SECRET_KEY) console.error('Stripe key not loaded');

const app = express();

app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));
app.use('/api', routes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});