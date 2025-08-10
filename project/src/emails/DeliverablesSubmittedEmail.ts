
import { createTransporter } from "@/lib/nodemailer";

interface DeliverablesSubmittedEmailOptions {
  email: string;
  userName: string;
  projectTitle: string;
  orderId: string;
  note?: string | null;
  fileCount: number;
}

export async function sendDeliverablesSubmittedEmail({
  email,
  userName,
  projectTitle,
  orderId,
  note,
  fileCount,
}: DeliverablesSubmittedEmailOptions) {
  try {
    const transporter = await createTransporter();

    await transporter.sendMail({
      from: `"SkillConnect" <${process.env.SENDER_EMAIL}>`,
      to: email,
      subject: `Deliverables Submitted for ${projectTitle}`,
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
              <h2>Hello, <span class="highlight">${userName}</span>!</h2>
              <p>The talent has submitted deliverables for your project: <span class="highlight">${projectTitle}</span>.</p>
              <p><strong>Order ID:</strong> ${orderId}</p>
              ${
                note
                  ? `<p><strong>Submission Note:</strong> ${note}</p>`
                  : "<p>No submission note provided.</p>"
              }
              <p><strong>Files Submitted:</strong> ${fileCount}</p>
              <p>Please review the deliverables at your earliest convenience.</p>
              
              <a href="${
                process.env.NEXTAUTH_URL
              }/orders/${orderId}" class="button">View Deliverables</a>
              
              <p>Thank you for using SkillConnect!</p>
              
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

    console.log(`Deliverables submitted email sent to ${email}`);
    return { success: true, message: "Deliverables submitted email sent successfully." };
  } catch (error: unknown) {
    console.error("Error sending deliverables submitted email:", error);
    return {
      success: false,
      message: "Failed to send deliverables submitted email. Please try again later.",
    };
  }
}
