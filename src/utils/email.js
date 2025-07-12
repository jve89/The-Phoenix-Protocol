const sgMail = require('@sendgrid/mail');
require('dotenv').config({ path: './.env' });

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const fromEmail = { name: 'The Phoenix Protocol', email: 'no-reply@thephoenixprotocol.app' };

const sendEmail = async (to, subject, html) => {
  const msg = { to, from: fromEmail, subject, html };
  try {
    await sgMail.send(msg);
    console.log('Email sent to', to, 'from', fromEmail);
  } catch (error) {
    console.error('Email error:', error.response ? error.response.body : error.message);
  }
};

module.exports = { sendEmail };