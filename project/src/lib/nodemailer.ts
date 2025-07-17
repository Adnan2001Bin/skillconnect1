import nodemailer,{Transporter} from 'nodemailer'
import { getEmailConfig } from '@/schemas/emailConfigSchema';

let transporter : Transporter | null = null

export const createTransporter = async (): Promise<Transporter> => {

  if (transporter) {
    try {
      await transporter.verify();
      console.log('Existing transporter verified successfully');
      return transporter;
    } catch (error) {
      console.error('Existing transporter verification failed:', error);
      transporter = null; 
    }
  }

  try {
    const config = getEmailConfig();

    // Create new transporter
    transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465, 
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      },
    });

    // Verify transporter
    await transporter.verify();
    console.log('Transporter verified successfully');
    return transporter;
  } catch (error: unknown) {
    console.error('Transporter verification failed:', error);
    throw new Error(`Failed to configure email transporter: ${error}`);
  }
};