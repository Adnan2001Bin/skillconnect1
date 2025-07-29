import { createTransporter } from "@/lib/nodemailer";

interface DeletionEmailOptions {
  userName: string;
  email: string;
  deletionReason: string;
}

export async function sendDeletionEmail({
  email,
  userName,
  deletionReason,
}: DeletionEmailOptions) {
  try {
    const transporter = await createTransporter();

    await transporter.sendMail({
      from: `"SkillConnect" <${process.env.SENDER_EMAIL}>`,
      to: email,
      subject: "SkillConnect Account Deletion Notification",
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
            .reason-container { 
              background-color: #f3f4f6; 
              border-radius: 6px; 
              padding: 16px; 
              margin: 24px 0;
            }
            .reason-text { 
              font-size: 16px; 
              color: #111827;
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
              <h2>Account Deletion Notice, <span class="highlight">${userName}</span></h2>
              <p>We regret to inform you that your talent account on SkillConnect has been deleted due to the following reason:</p>
              
              <div class="reason-container">
                <div class="reason-text">${deletionReason}</div>
              </div>
              
              <p>If you believe this was a mistake or have questions about this decision, please contact our support team at the email below.</p>
              
              <p>Thank you for your time with SkillConnect. We wish you the best in your future endeavors.</p>
              
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

    console.log(`Deletion email sent to ${email}`);
    return { success: true, message: "Deletion email sent successfully." };
  } catch (error: unknown) {
    console.error("Error sending deletion email:", error);
    return { 
      success: false, 
      message: "Failed to send deletion email. Please try again later." 
    };
  }
}