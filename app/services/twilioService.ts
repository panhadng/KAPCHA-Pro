import twilio from 'twilio';
import { twilioConfig } from '../config/twilioConfig';

const client = twilio(twilioConfig.accountSid, twilioConfig.authToken);

export class TwilioService {
  static async sendSMS(to: string, body: string) {
    try {
      const message = await client.messages.create({
        body,
        to,
        from: twilioConfig.phoneNumber,
      });
      return message;
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }

  static async sendBulkSMS(recipients: string[], body: string) {
    try {
      const messages = await Promise.all(
        recipients.map((to) =>
          client.messages.create({
            body,
            to,
            from: twilioConfig.phoneNumber,
          })
        )
      );
      return messages;
    } catch (error) {
      console.error('Error sending bulk SMS:', error);
      throw error;
    }
  }
} 