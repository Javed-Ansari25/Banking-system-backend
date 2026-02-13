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

const sendCreditEmail = async ({
  email,
  fullName,
  amount,
  fromAccount,
  transactionId
}) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail", // or use SMTP config
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"Your Bank" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "💰 Amount Credited Successfully",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: green;">Amount Credited</h2>
          
          <p>Dear <strong>${fullName}</strong>,</p>
          
          <p>We are pleased to inform you that an amount of 
          <strong>₹${amount}</strong> has been successfully credited to your account.</p>
          
          ${
            fromAccount
              ? `<p><strong>From Account:</strong> ${fromAccount}</p>`
              : ""
          }

          ${
            transactionId
              ? `<p><strong>Transaction ID:</strong> ${transactionId}</p>`
              : ""
          }

          <p>If you did not authorize this transaction, please contact support immediately.</p>

          <br/>

          <p>Thank you for banking with us.</p>
          <p><strong>Your Bank Team</strong></p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    console.log("Credit email sent successfully");
  } catch (error) {
    console.error("Error sending credit email:", error.message);
  }
};
  
export { sendRegistrationEmail, sendTransactionEmail, sendCreditEmail };
