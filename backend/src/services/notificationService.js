let twilioClient = null;

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;
const defaultRecipient = process.env.COMPLIANCE_ALERT_RECIPIENT_PHONE || '+15550199943';

if (accountSid && authToken && fromPhone && !accountSid.includes('your_')) {
  try {
    const twilio = require('twilio');
    twilioClient = twilio(accountSid, authToken);
    console.log('[NotificationService] Twilio SMS client initialized.');
  } catch (err) {
    console.warn('[NotificationService] Failed to initialize Twilio client:', err.message);
  }
} else {
  console.log('[NotificationService] Twilio credentials not configured. Running in Mock SMS Dispatch mode.');
}

/**
 * Sends SMS notification when an environmental compliance violation occurs.
 * Falls back to logged mock dispatch if Twilio is not configured.
 */
async function sendComplianceAlertSMS({ alertType, parameter, measuredValue, regulatoryLimit, facilityCode, recipientPhone }) {
  const targetPhone = recipientPhone || defaultRecipient;
  const messageBody = `🚨 [ECOFLOW AI ALERT] Critical Environmental Compliance Breach at ${facilityCode}!
Parameter: ${parameter}
Measured Value: ${measuredValue} (Limit: ${regulatoryLimit})
Type: ${alertType}
Immediate remediation required under NPDES permit standards.`;

  if (twilioClient) {
    try {
      const message = await twilioClient.messages.create({
        body: messageBody,
        from: fromPhone,
        to: targetPhone,
      });

      console.log(`[Twilio SMS Sent] Message SID: ${message.sid} to ${targetPhone}`);
      return {
        attempted: true,
        sent: true,
        messageSid: message.sid,
        recipientPhone: targetPhone,
        timestamp: new Date(),
        mode: 'LIVE_TWILIO',
      };
    } catch (error) {
      console.error('[Twilio SMS Error]', error.message);
      return {
        attempted: true,
        sent: false,
        recipientPhone: targetPhone,
        timestamp: new Date(),
        error: error.message,
        mode: 'LIVE_TWILIO_ERROR_FALLBACK',
      };
    }
  }

  // Simulated Fallback Dispatch
  const mockSid = 'SM_' + Math.random().toString(36).substring(2, 12).toUpperCase();
  console.log(`[EcoFlow SMS Fallback Simulation] Dispatched to ${targetPhone}: "${messageBody.replace(/\n/g, ' ')}" [SID: ${mockSid}]`);

  return {
    attempted: true,
    sent: true,
    messageSid: mockSid,
    recipientPhone: targetPhone,
    timestamp: new Date(),
    mode: 'MOCK_DISPATCH',
  };
}

module.exports = {
  sendComplianceAlertSMS,
};
