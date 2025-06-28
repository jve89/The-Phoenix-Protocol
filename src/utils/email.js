const sgMail = require('@sendgrid/mail');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (to, subject, html) => {
  const msg = { to, from: 'no-reply@thephoenixprotocol.com', subject, html };
  try {
    await sgMail.send(msg);
    console.log('Email sent to', to);
  } catch (error) {
    console.error('Email error:', error);
  }
};

module.exports = { sendEmail };