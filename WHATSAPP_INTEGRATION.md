# Twilio WhatsApp Notification System Integration

## Overview

The BioScreen application has been updated to use Twilio's WhatsApp API for sending screening reminders instead of local notifications. This provides a more reliable and user-friendly notification system that works even when the app is not running.

## Features

### ✅ Implemented Features

1. **Twilio WhatsApp API Integration**
   - Sends screening reminders via Twilio's WhatsApp API
   - Supports both user and family member notifications
   - Automatic phone number formatting for Saudi Arabia (+966)
   - Simple authentication with Account SID and Auth Token

2. **Smart Scheduling System**
   - Schedules reminders 7 days before due date
   - Daily checks for overdue screenings at 9 AM
   - Automatic retry mechanism for failed messages

3. **Message Templates**
   - Screening reminders with due date and screening name
   - Overdue reminders with urgency indicators
   - Welcome messages for new users
   - Appointment reminders

4. **Server-Side Management**
   - All notifications managed on the server
   - No dependency on device notifications
   - Persistent across app restarts and device changes

## Setup Instructions

### 1. Twilio WhatsApp API Setup

1. **Create a Twilio Account**
   - Go to [Twilio Console](https://console.twilio.com/)
   - Sign up for a free account
   - Navigate to WhatsApp section

2. **Enable WhatsApp Sandbox**
   - In Twilio Console, go to Messaging → Try it out → Send a WhatsApp message
   - Follow the instructions to join your WhatsApp sandbox
   - Note down your Twilio WhatsApp number

3. **Get Your Credentials**
   - Find your Account SID in the Twilio Console dashboard
   - Generate an Auth Token (or use the default one)
   - Note your Twilio WhatsApp number

4. **Environment Variables**
   Add these to your `.env` file:
   ```env
   TWILIO_API_URL=https://api.twilio.com
   TWILIO_ACCOUNT_SID=your_account_sid_here
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_WHATSAPP_NUMBER=your_twilio_whatsapp_number_here
   ```

### 2. Database Updates

The system automatically adds phone number fields to users and family members:
- `users.phone_number` - For user WhatsApp notifications
- `family_members.phone_number` - For family member notifications

### 3. Server Configuration

The server automatically initializes:
- Twilio WhatsApp service with your credentials
- Notification scheduler for automated reminders
- API endpoints for notification management

## API Endpoints

### Notification Management

- `POST /api/notifications/schedule-screening` - Schedule user screening reminder
- `POST /api/notifications/schedule-family-screening` - Schedule family member screening reminder
- `POST /api/notifications/send-welcome` - Send welcome message
- `GET /api/notifications/status` - Check notification system status

### Request Examples

**Schedule Screening Reminder:**
```json
{
  "userId": 1,
  "screeningId": 5,
  "dueDate": "2024-12-25",
  "reminderDays": 7
}
```

**Send Welcome Message:**
```json
{
  "phoneNumber": "+966501234567",
  "personName": "Ahmed Ali"
}
```

## Message Templates

### Screening Reminder
```
🔔 BioScreen Health Reminder

Hello [Name],

This is a friendly reminder that your [Screening Name] screening is due on [Due Date].

📅 Due Date: [Due Date]
🏥 Screening: [Screening Name]

Please schedule your appointment as soon as possible to maintain your health.

For questions or support, please contact your healthcare provider.

BioScreen Team
```

### Overdue Reminder
```
⚠️ BioScreen Urgent Health Reminder

Hello [Name],

Your [Screening Name] screening is [X] days overdue.

🚨 Status: OVERDUE
🏥 Screening: [Screening Name]
⏰ Days Overdue: [X]

This screening is important for your health. Please schedule your appointment immediately.

For questions or support, please contact your healthcare provider.

BioScreen Team
```

## Mobile App Integration

### Updated Components

1. **NotificationContext** - Now uses Twilio WhatsApp API instead of local notifications
2. **WhatsAppNotificationTest** - Test component for verifying integration
3. **Removed local notification dependencies**

### Key Changes

- No more `expo-notifications` dependency
- No device permission requests
- All notifications handled server-side
- Real-time status checking via API

## Testing

### 1. Server Status Check
```bash
curl http://your-server/api/notifications/status
```

### 2. Send Test Welcome Message
```bash
curl -X POST http://your-server/api/notifications/send-welcome \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+966501234567", "personName": "Test User"}'
```

### 3. Mobile App Testing
Use the `WhatsAppNotificationTest` component in the mobile app to:
- Check notification system status
- Send test welcome messages
- Schedule test screening reminders

## Monitoring and Logs

### Server Logs
The system logs all Twilio WhatsApp activities:
- Message scheduling
- Message sending attempts
- Success/failure status
- Retry attempts

### Key Log Messages
```
✅ Twilio WhatsApp service initialized
✅ Notification scheduler initialized
📅 Scheduled screening reminder for [Name] - [Screening] on [Date]
📤 Processing notification job: [JobID]
✅ WhatsApp message sent successfully via Twilio for job: [JobID]
❌ Failed to send WhatsApp message after 3 attempts for job: [JobID]
```

## Troubleshooting

### Common Issues

1. **Twilio API Not Initialized**
   - Check environment variables
   - Verify Account SID and Auth Token are correct
   - Ensure WhatsApp number is properly formatted

2. **Messages Not Sending**
   - Check Twilio sandbox status (for testing)
   - Verify phone number format
   - Check server logs for Twilio error codes
   - Ensure recipient has joined your WhatsApp sandbox

3. **Scheduler Not Running**
   - Check server startup logs
   - Verify notification scheduler initialization
   - Check for JavaScript errors

### Debug Commands

```bash
# Check server health
curl http://your-server/api/health

# Check notification status
curl http://your-server/api/notifications/status

# View server logs
tail -f /path/to/server/logs
```

### Twilio Error Codes

Common Twilio error codes and solutions:
- `21211`: Invalid phone number format
- `21214`: Phone number not verified (sandbox mode)
- `21608`: Message body too long
- `21610`: Rate limit exceeded

## Security Considerations

1. **API Token Security**
   - Store Account SID and Auth Token in environment variables
   - Never commit credentials to version control
   - Rotate Auth Token regularly

2. **Phone Number Privacy**
   - Phone numbers are stored encrypted
   - Only used for WhatsApp notifications
   - Can be deleted on user request

3. **Message Content**
   - No sensitive health data in messages
   - Generic reminder templates
   - User consent required for notifications

## Twilio Sandbox vs Production

### Sandbox Mode (Testing)
- Free tier available
- Limited to 1000 messages per month
- Recipients must join your sandbox
- Perfect for development and testing

### Production Mode
- Requires Twilio approval
- Higher message limits
- No sandbox restrictions
- Professional WhatsApp Business API

## Future Enhancements

1. **Message Customization**
   - User-configurable reminder times
   - Custom message templates
   - Language support (Arabic/English)

2. **Advanced Scheduling**
   - Multiple reminder intervals
   - Escalation for overdue screenings
   - Integration with calendar systems

3. **Analytics**
   - Message delivery tracking via Twilio webhooks
   - User engagement metrics
   - Effectiveness reporting

## Support

For technical support or questions about the Twilio WhatsApp integration:
- Check server logs for detailed error messages
- Verify Twilio account configuration
- Test with the provided test components
- Check Twilio documentation for API details
- Contact the development team for assistance 