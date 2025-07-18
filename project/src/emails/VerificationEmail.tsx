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
      subject: "Your SkillConnect Verification Code",
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
            .code-container { 
              background-color: #f3f4f6; 
              border-radius: 6px; 
              padding: 16px; 
              margin: 24px 0;
              text-align: center;
            }
            .verification-code { 
              font-size: 32px; 
              font-weight: 700; 
              color: #111827;
              letter-spacing: 2px;
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
              <h2>Welcome to SkillConnect, <span class="highlight">${userName}</span>!</h2>
              <p>Thank you for joining our professional network. We're excited to help you connect with top talent and opportunities.</p>
              
              <p>To complete your registration, please verify your email address using the following verification code:</p>
              
              <div class="code-container">
                <div class="verification-code">${verificationCode}</div>
              </div>
              
              <p>This code will expire in <span class="highlight">10 minutes</span>. For security reasons, please do not share this code with anyone.</p>
              
              <p>If you didn't request this code, you can safely ignore this email. Someone else might have entered your email address by mistake.</p>
              
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

    console.log(`Verification email sent to ${email}`);
    return { success: true, message: "Verification email sent successfully." };
  } catch (error: unknown) {
    console.error("Error sending verification email:", error);
    return { 
      success: false, 
      message: "Failed to send verification email. Please try again later." 
    };
  }
}