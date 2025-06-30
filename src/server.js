const express = require('express');
const dotenv = require('dotenv');
const routes = require('./routes/routes');
const { startCron } = require('./utils/cron');

dotenv.config({ path: './.env' });
if (!process.env.STRIPE_SECRET_KEY) console.error('Stripe key not loaded');

const app = express();

// Optional HTTPS redirect
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
  startCron(); // Explicitly start the cron only when server is ready
});
