const nodemailer = require('nodemailer');
const { getSettings, isMailConfigured } = require('./settings');

function buildTransport() {
  const s = getSettings();
  if (!isMailConfigured()) {
    throw new Error('SMTP is nog niet ingesteld. Ga naar Instellingen om e-mailgegevens in te vullen.');
  }
  return nodemailer.createTransport({
    host: s.smtp_host,
    port: Number(s.smtp_port) || 587,
    secure: s.smtp_secure === '1',
    auth: s.smtp_user ? { user: s.smtp_user, pass: s.smtp_pass } : undefined
  });
}

async function sendMail({ to, subject, text, html }) {
  const s = getSettings();
  const transport = buildTransport();
  const fromName = s.mail_from_name || 'PC & AI Cursus';
  const fromAddress = s.mail_from_address;
  return transport.sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    to,
    subject,
    text,
    html
  });
}

module.exports = { sendMail, buildTransport };
