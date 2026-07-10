import dotenv from 'dotenv';
dotenv.config();

export const sendSMS = async (to: string, body: string) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_SMS_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn(`[SMS] Twilio credentials missing. Mock sending to ${to}: ${body}`);
    return { success: false, error: 'Twilio credentials missing' };
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    
    const params = new URLSearchParams();
    params.append('To', to);
    params.append('From', fromNumber);
    params.append('Body', body);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const data = await response.json() as any;
    if (response.ok) {
      console.log(`[SMS] Sent successfully to ${to}. Message SID: ${data.sid}`);
      return { success: true, sid: data.sid };
    } else {
      console.error(`[SMS] Twilio failed sending to ${to}:`, data);
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.error(`[SMS] Error sending to ${to}:`, error);
    return { success: false, error };
  }
};

export const sendWhatsApp = async (to: string, body: string) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

  if (!accountSid || !authToken) {
    console.warn(`[WhatsApp] Twilio credentials missing. Mock sending to ${to}: ${body}`);
    return { success: false, error: 'Twilio credentials missing' };
  }

  const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    
    const params = new URLSearchParams();
    params.append('To', formattedTo);
    params.append('From', fromNumber);
    params.append('Body', body);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const data = await response.json() as any;
    if (response.ok) {
      console.log(`[WhatsApp] Sent successfully to ${to}. Message SID: ${data.sid}`);
      return { success: true, sid: data.sid };
    } else {
      console.error(`[WhatsApp] Twilio failed sending to ${to}:`, data);
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.error(`[WhatsApp] Error sending to ${to}:`, error);
    return { success: false, error };
  }
};
