const sgMail = require('@sendgrid/mail');

const { SENDGRID_API_KEY, FROM, TO } = process.env;
if (!SENDGRID_API_KEY || !FROM || !TO) {
  console.error('Missing env: SENDGRID_API_KEY, FROM, TO');
  process.exit(1);
}
sgMail.setApiKey(SENDGRID_API_KEY);

const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Arial;font-size:16px;color:#222;">
    <h1 style="margin:0 0 12px 0;font-size:20px;">Welcome to The Phoenix Protocol</h1>
    <p style="margin:0 0 16px 0;">Controlled test. If any other unsubscribe sentence appears in the body, it was injected.</p>
    <div style="font-size:12px;color:#777;text-align:center;margin-top:24px;padding:10px 16px;border-top:1px solid #eee;">
      You are receiving this because you signed up on our site.
    </div>
  </div>
`;

const msg = {
  to: TO,
  from: FROM,
  subject: 'TPP – SendGrid body footer test',
  html,
  tracking_settings: { subscription_tracking: { enable: false } },
  mail_settings: { footer: { enable: false } },
};

sgMail.send(msg)
  .then(([res]) => console.log('Sent. Status:', res.statusCode))
  .catch((e) => {
    console.error('Send failed:', e.response?.body || e.message);
    process.exit(1);
  });
