import { createTransporter } from "@/lib/nodemailer";

interface PasswordResetEmailOptions {
  email: string;
  userName: string;
  resetToken: string;
}

export async function sendPasswordResetEmail({
  email,
  userName,
  resetToken,
}: PasswordResetEmailOptions) {
  try {
    const transporter = await createTransporter();
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: `"SkillConnect" <${process.env.SENDER_EMAIL}>`,
      to: email,
      subject: "SkillConnect Password Reset",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
              color: #333333; 
              margin: 0; 
              padding: 0; 
              background-color: #f7fafc;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            }
            .header { 
              background-color: #111827; 
              padding: 32px; 
              text-align: center;
            }
            .logo { 
              color: #ffffff; 
              font-size: 24px; 
              font-weight: 700;
              letter-spacing: 0.5px;
            }
            .content { 
              padding: 32px; 
              line-height: 1.6;
            }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background-color: #111827; 
              color: white; 
              text-decoration: none; 
              border-radius: 6px; 
              font-weight: 500;
              margin: 16px 0;
            }
            .footer { 
              margin-top: 32px; 
              font-size: 12px; 
              color: #6b7280; 
              text-align: center;
              padding-top: 16px;
              border-top: 1px solid #e5e7eb;
            }
            .highlight {
              color: #111827;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">SkillConnect</div>
            </div>
            <div class="content">
              <h2>Password Reset Request, <span class="highlight">${userName}</span></h2>
              <p>We received a request to reset your SkillConnect password. Click the button below to reset it:</p>
              
              <a href="${resetUrl}" class="button">Reset Password</a>
              
              <p>This link will expire in <span class="highlight">1 hour</span>. If you didn't request a password reset, you can safely ignore this email.</p>
              
              <p>Best regards,<br>The SkillConnect Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} SkillConnect. All rights reserved.</p>
              <p>Connecting professionals with opportunities that matter.</p>
              <p>If you have any questions, please contact us at support@skillconnect.com</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`Password reset email sent to ${email}`);
    return { success: true, message: "Password reset email sent successfully." };
  } catch (error: unknown) {
    console.error("Error sending password reset email:", error);
    return { 
      success: false, 
      message: "Failed to send password reset email. Please try again later." 
    };
  }
}