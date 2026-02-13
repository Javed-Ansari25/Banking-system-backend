import nodemailer from 'nodemailer';
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Bank of Javed" <${process.env.EMAIL_USER}`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    // console.log('Message sent: %s', info.messageId);
    // console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// sendRegistrationEmail
const sendRegistrationEmail = async ({ email, fullName }) => {
  const subject = '🎉 Welcome to Bank of Javed!';

  const text = `
      Hi ${fullName},
      Welcome to Bank of Javed! Your account is now active.
      We’re here to make banking simple and secure.
      Thanks for joining us!
      – Bank Support Team
    `;

  const html = `
        <div style="font-family: Arial, sans-serif; line-height:1.5; color:#333;">
            <h2>Hi ${fullName} 👋</h2>
            <p>Welcome to <strong>Bank of Javed</strong>! Your account is now active.</p>
            <p>We’re here to make banking simple and secure.</p>
            <p>Thanks for joining us!<br/><strong>Bank Support Team</strong></p>
        </div>
    `;

  try {
    await sendEmail(email, subject, text, html);
    console.log(`Registration email sent to ${email}`);
  } catch (error) {
    console.error(`Error sending registration email to ${email}:`, error);
  }
};

const sendTransactionEmail = async ({
  email,
  fullName,
  amount,
  toAccount
}) => {
  const subject = '✅ Transaction Successful | Bank of Javed';

  const text = `
Hi ${fullName},

Your transaction was successful.

Amount: ₹${amount}
To Account: ${toAccount}

Thank you for banking with us.
– Bank of Javed Support Team
`;

  const html = `
<div style="font-family: Arial, sans-serif; line-height:1.5; color:#333;">
  <h2>Hi ${fullName} 👋</h2>

  <p>Your transaction has been 
    <strong style="color:green;">successfully completed</strong>.
  </p>

  <p>
    <strong>Amount:</strong> ₹${amount}<br/>
    <strong>To Account:</strong> ${toAccount}
  </p>

  <p>Thank you for choosing <strong>Bank of Javed</strong>.</p>
  <p><strong>Bank Support Team</strong></p>
</div>
`;

  try {
    await sendEmail(email, subject, text, html);
    console.log(`Transaction success email sent to ${email}`);
  } catch (error) {
    console.error(`Error sending transaction email to ${email}:`, error);
  }
};

const sendTransactionEmailFailure = async ({
  email,
  fullName,
  amount,
  toAccount
}) => {
  const subject = '❌ Transaction Failed | Bank of Javed';

  const text = `
Hi ${fullName},

Unfortunately, your transaction could not be completed.

Amount: ₹${amount}
To Account: ${toAccount}

Please try again later or contact support.
– Bank of Javed Support Team
`;

  const html = `
<div style="font-family: Arial, sans-serif; line-height:1.5; color:#333;">
  <h2>Hi ${fullName} 👋</h2>

  <p>
    Your transaction 
    <strong style="color:red;">failed</strong>.
  </p>

  <p>
    <strong>Amount:</strong> ₹${amount}<br/>
    <strong>To Account:</strong> ${toAccount}
  </p>

  <p>Please try again or reach out to our support team.</p>
  <p><strong>Bank of Javed Support Team</strong></p>
</div>
`;

  try {
    await sendEmail(email, subject, text, html);
    console.log(`Transaction failure email sent to ${email}`);
  } catch (error) {
    console.error(`Error sending failure email to ${email}:`, error);
  }
};

export { sendRegistrationEmail, sendTransactionEmail, sendTransactionEmailFailure };
