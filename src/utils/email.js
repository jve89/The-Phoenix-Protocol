// src/utils/email.js

const sgMail = require('@sendgrid/mail');
require('dotenv').config(); // rely on global config

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const fromEmail = { name: 'The Phoenix Protocol', email: 'no-reply@thephoenixprotocol.app' };

const sendEmail = async (to, subject, html) => {
  if (!to || !subject || !html) {
    console.error('sendEmail called with invalid params:', { to, subject });
    throw new Error('Invalid email parameters');
  }

  const msg = { to, from: fromEmail, subject, html };

  try {
    await sgMail.send(msg);
    console.log('Email sent to', to);
  } catch (error) {
    console.error('Email error:', error.response ? error.response.body : error.message);
    throw error; // propagate error so caller can handle retries or logging
  }
};

module.exports = { sendEmail, fromEmail };
