import { createTransporter } from "@/lib/nodemailer";

interface VerificationEmailOptions {
  userName: string;
  verificationCode: string;
  email: string;
}

export async function sendVerificationEmail({
  email,
  userName,
  verificationCode,
}: VerificationEmailOptions) {
  try {
    const transporter = await createTransporter();

    await transporter.sendMail({
      from: `"SkillConnect" <${process.env.SENDER_EMAIL}>`,
      to: email,
      subject: "Verify Your SkillConnect Account",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; margin: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; }
            .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h2 { margin: 0; font-size: 24px; }
            .content { padding: 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
            .code { font-size: 28px; font-weight: bold; color: #2563eb; text-align: center; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; }
            .footer { margin-top: 20px; font-size: 12px; color: #6b7280; text-align: center; }
            @media (max-width: 600px) { .content { padding: 16px; } .header h2 { font-size: 20px; } }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Welcome to UniChat, ${userName}!</h2>
            </div>
            <div class="content">
              <p>You're one step away from connecting with fellow undergraduate and graduate students!</p>
              <p>Please verify your email address by using the code below:</p>
              <p class="code">${verificationCode}</p>
              <p>This code will expire in 10 minutes.</p>
              <p>Alternatively, click the button below to verify your account:</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/verify?code=${verificationCode}&email=${encodeURIComponent(email)}" class="button">Verify Email</a>
              <p>If you didn’t sign up for UniChat, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} UniChat. All rights reserved.</p>
              <p>Connecting students for collaboration and community.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`Verification email sent to ${email}`);
    return { success: true, message: "Verification email sent successfully." };
  } catch (error: unknown) {
    console.error("Error sending verification email:", error);
    return { success: false, message: "Failed to send verification email." };
  }
}
