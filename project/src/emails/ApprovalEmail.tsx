import { createTransporter } from "@/lib/nodemailer";

interface ApprovalEmailOptions {
  userName: string;
  email: string;
}

export async function sendApprovalEmail({ email, userName }: ApprovalEmailOptions) {
  try {
    const transporter = await createTransporter();

    await transporter.sendMail({
      from: `"SkillConnect" <${process.env.SENDER_EMAIL}>`,
      to: email,
      subject: "SkillConnect Profile Approved",
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
              <h2>Congratulations, <span class="highlight">${userName}</span>!</h2>
              <p>Your talent profile on SkillConnect has been approved by our admin team. You can now fully access the platform and start connecting with clients.</p>
              
              <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">Go to Dashboard</a>
              
              <p>Thank you for joining our professional network. We're excited to see your contributions!</p>
              
              <p>Best regards,<br>The SkillConnect Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} SkillConnect. All rights reserved.</p>
              <p>Connecting professionals with opportunities that matter.</p>
              <p>Contact us at <a href="mailto:support@skillconnect.com">support@skillconnect.com</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`Approval email sent to ${email}`);
    return { success: true, message: "Approval email sent successfully." };
  } catch (error: unknown) {
    console.error("Error sending approval email:", error);
    return { 
      success: false, 
      message: "Failed to send approval email. Please try again later." 
    };
  }
}