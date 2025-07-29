import { createTransporter } from "@/lib/nodemailer";

interface RejectionEmailOptions {
  userName: string;
  email: string;
  rejectionReason: string;
}

export async function sendRejectionEmail({
  email,
  userName,
  rejectionReason,
}: RejectionEmailOptions) {
  try {
    const transporter = await createTransporter();

    await transporter.sendMail({
      from: `"SkillConnect" <${process.env.SENDER_EMAIL}>`,
      to: email,
      subject: "SkillConnect Profile Review Update",
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
              <h2>Profile Review Update, <span class="highlight">${userName}</span></h2>
              <p>We regret to inform you that your talent profile on SkillConnect has not been approved at this time.</p>
              
              <p>Reason for rejection:</p>
              <div class="reason-container">
                <div class="reason-text">${rejectionReason}</div>
              </div>
              
              <p>You can revise your profile and resubmit for review. Please address the issues mentioned above and ensure all required fields are complete.</p>
              
              <a href="${process.env.NEXTAUTH_URL}/talent/complete/profile" class="button">Update Your Profile</a>
              
              <p>If you have any questions or need assistance, please contact our support team.</p>
              
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

    console.log(`Rejection email sent to ${email}`);
    return { success: true, message: "Rejection email sent successfully." };
  } catch (error: unknown) {
    console.error("Error sending rejection email:", error);
    return { 
      success: false, 
      message: "Failed to send rejection email. Please try again later." 
    };
  }
}