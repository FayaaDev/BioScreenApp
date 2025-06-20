import axios from 'axios';

export interface WhatsAppMessage {
  to: string;
  message: string;
  type: 'screening_reminder' | 'appointment' | 'general';
}

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  whatsappNumber: string;
  apiUrl: string;
}

class WhatsAppService {
  private static instance: WhatsAppService;
  private config: TwilioConfig | null = null;

  static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  initialize(config: TwilioConfig): void {
    this.config = config;
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // If it starts with 0, replace with country code (assuming +966 for Saudi Arabia)
    if (cleaned.startsWith('0')) {
      cleaned = '966' + cleaned.substring(1);
    }
    
    // If it doesn't start with country code, add it
    if (!cleaned.startsWith('966')) {
      cleaned = '966' + cleaned;
    }
    
    // Format for Twilio WhatsApp API (whatsapp:+966...)
    return `whatsapp:+${cleaned}`;
  }

  async sendMessage(message: WhatsAppMessage): Promise<boolean> {
    if (!this.config) {
      console.error('WhatsApp service not initialized');
      return false;
    }

    try {
      const formattedPhone = this.formatPhoneNumber(message.to);
      const fromNumber = `whatsapp:${this.config.whatsappNumber}`;
      
      // Twilio WhatsApp API endpoint
      const url = `${this.config.apiUrl}/2010-04-01/Accounts/${this.config.accountSid}/Messages.json`;
      
      const payload = {
        From: fromNumber,
        To: formattedPhone,
        Body: message.message
      };

      const response = await axios.post(url, payload, {
        auth: {
          username: this.config.accountSid,
          password: this.config.authToken
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      console.log('WhatsApp message sent successfully via Twilio:', {
        to: formattedPhone,
        messageSid: response.data?.sid,
        type: message.type
      });

      return true;
    } catch (error) {
      console.error('Error sending WhatsApp message via Twilio:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Status code:', error.response?.status);
      }
      return false;
    }
  }

  async sendScreeningReminder(
    phoneNumber: string,
    personName: string,
    screeningName: string,
    dueDate: string
  ): Promise<boolean> {
    const message = `🔔 *BioScreen Health Reminder*

Hello ${personName},

This is a friendly reminder that your *${screeningName}* screening is due on ${dueDate}.

📅 *Due Date:* ${dueDate}
🏥 *Screening:* ${screeningName}

Please schedule your appointment as soon as possible to maintain your health.

For questions or support, please contact your healthcare provider.

*BioScreen Team*`;

    return this.sendMessage({
      to: phoneNumber,
      message,
      type: 'screening_reminder'
    });
  }

  async sendOverdueReminder(
    phoneNumber: string,
    personName: string,
    screeningName: string,
    daysOverdue: number
  ): Promise<boolean> {
    const message = `⚠️ *BioScreen Urgent Health Reminder*

Hello ${personName},

Your *${screeningName}* screening is *${daysOverdue} days overdue*.

🚨 *Status:* OVERDUE
🏥 *Screening:* ${screeningName}
⏰ *Days Overdue:* ${daysOverdue}

This screening is important for your health. Please schedule your appointment immediately.

For questions or support, please contact your healthcare provider.

*BioScreen Team*`;

    return this.sendMessage({
      to: phoneNumber,
      message,
      type: 'screening_reminder'
    });
  }

  async sendAppointmentReminder(
    phoneNumber: string,
    personName: string,
    appointmentDetails: string,
    appointmentDate: string
  ): Promise<boolean> {
    const message = `📅 *BioScreen Appointment Reminder*

Hello ${personName},

This is a reminder for your upcoming appointment:

📋 *Details:* ${appointmentDetails}
📅 *Date:* ${appointmentDate}

Please arrive 10 minutes before your scheduled time.

If you need to reschedule, please contact us as soon as possible.

*BioScreen Team*`;

    return this.sendMessage({
      to: phoneNumber,
      message,
      type: 'appointment'
    });
  }

  async sendWelcomeMessage(
    phoneNumber: string,
    personName: string
  ): Promise<boolean> {
    const message = `🎉 *Welcome to BioScreen!*

Hello ${personName},

Thank you for joining BioScreen! We're here to help you stay on top of your health screenings.

You'll receive WhatsApp reminders for:
• Upcoming screenings
• Overdue screenings
• Health tips and updates

To manage your notifications or update your information, please use the BioScreen app.

*BioScreen Team*`;

    return this.sendMessage({
      to: phoneNumber,
      message,
      type: 'general'
    });
  }
}

export default WhatsAppService; 