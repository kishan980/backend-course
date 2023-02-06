import { createTransport } from 'nodemailer';

export const sendEmail = async (to, subject, text) => {
  const transporter = createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_HOST,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  await transporter.sendMail({
    to,
    subject,
    text,
    // from: 'kya1.glosbaliasoft@gmail.com',
  });
};
