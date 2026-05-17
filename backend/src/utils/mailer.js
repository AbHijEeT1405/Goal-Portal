const nodemailer = require('nodemailer');
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = require('../config/env');

let transporter = null;

if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: false,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

async function sendMail({ to, subject, html, text }) {
  if (!transporter) {
    console.log('Mailer not configured. Skipping email:', subject);
    return;
  }

  try {
    await transporter.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to,
      subject,
      text,
      html,
    });
    console.log('Email sent:', subject, '->', to);
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
}

module.exports = { sendMail };