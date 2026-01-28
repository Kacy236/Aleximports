import nodemailer from "nodemailer";

// 1. Initialize the Transporter once
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

/**
 * Generates a random 6-digit OTP
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Action: Send the verification email
 */
export const sendVerificationEmail = async (email: string, code: string) => {
  const mailOptions = {
    from: `"Alex imports" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Verify your account",
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: auto;">
        <h2 style="color: #333;">Confirm Your Email</h2>
        <p>Your verification code is below. It will expire in 10 minutes.</p>
        <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4F46E5;">
          ${code}
        </div>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
};