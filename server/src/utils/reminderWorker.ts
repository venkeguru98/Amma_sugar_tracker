import prisma from '../db';
import { sendSMS, sendWhatsApp } from './notification';
import dayjs from 'dayjs';

const sentReminders = new Set<string>();

// India Standard Time (IST) is UTC+5:30
const getIstDateTime = () => {
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const ist = new Date(utc + (3600000 * 5.5));
  
  const yyyy = ist.getFullYear();
  const mm = String(ist.getMonth() + 1).padStart(2, '0');
  const dd = String(ist.getDate()).padStart(2, '0');
  const hh = String(ist.getHours()).padStart(2, '0');
  const min = String(ist.getMinutes()).padStart(2, '0');
  
  return {
    dateStr: `${yyyy}-${mm}-${dd}`,
    timeStr: `${hh}:${min}`
  };
};

const isDateScheduled = (date: dayjs.Dayjs, plan: any): boolean => {
  if (!plan.isActive) return false;
  if (plan.startDate && date.format('YYYY-MM-DD') < plan.startDate) return false;
  if (plan.endDate && date.format('YYYY-MM-DD') > plan.endDate) return false;

  if (plan.frequency === 'daily') {
    return true;
  }
  if (plan.frequency === 'alternate') {
    const base = plan.startDate ? dayjs(plan.startDate) : dayjs('2026-01-01');
    const diff = Math.abs(date.diff(base, 'day'));
    return diff % 2 === 0;
  }
  if (plan.frequency === 'weekly') {
    const base = plan.startDate ? dayjs(plan.startDate) : dayjs('2026-01-01');
    const diff = Math.abs(date.diff(base, 'day'));
    return diff % 7 === 0;
  }
  if (plan.frequency === 'custom_days') {
    const days = plan.scheduleDays.split(',').map((d: string) => d.trim());
    return days.includes(String(date.day()));
  }
  return false;
};

export const checkAndSendReminders = async () => {
  try {
    const { dateStr, timeStr } = getIstDateTime();
    const today = dayjs(dateStr);

    // Clean up cache periodically (e.g. at midnight)
    if (timeStr === '00:00') {
      sentReminders.clear();
    }

    const activePlans = await prisma.monitoringPlan.findMany({
      where: { isActive: true },
      include: { user: true }
    });

    for (const plan of activePlans) {
      if (plan.reminderTime !== timeStr) {
        continue;
      }

      if (!isDateScheduled(today, plan)) {
        continue;
      }

      // Check cache to prevent duplicate processing in the same minute
      const cacheKey = `${plan.userId}-${dateStr}-${timeStr}`;
      if (sentReminders.has(cacheKey)) {
        continue;
      }
      sentReminders.add(cacheKey);

      // Verify if readings for required types have already been completed
      const todayReadings = await prisma.sugarReading.findMany({
        where: {
          userId: plan.userId,
          readingDate: dateStr
        }
      });

      const requiredTypes = plan.readingTypes.split(',').map(t => t.trim()).filter(Boolean);
      const allDone = requiredTypes.every((type) => {
        return todayReadings.some(r => r.readingType === type);
      });

      if (!allDone) {
        // Readings are still pending! Retrieve notification profiles from user metadata
        const metadata = (plan.user.themeSettings || {}) as any;
        const enableWhatsapp = metadata.enableWhatsapp === true;
        const enableSms = metadata.enableSms === true;
        const AmmaPhone = metadata.ammaPhone;
        const CaregiverPhone = metadata.caregiverPhone;

        const whatsAppBody = `🌸 Amma Sugar Tracker Reminder 🌸\n\nHello Amma! Please remember to check and record your scheduled blood sugar readings today.\nஅம்மா! இன்றைய இரத்த சர்க்கரை அளவுகளை பரிசோதித்து பதிவு செய்யுமாறு கேட்டுக்கொள்கிறோம்.`;
        const smsBody = `📢 Sugar Check Pending Alert 📢\n\nHi Caregiver, Amma's scheduled blood sugar readings are still pending. Please verify she records them.`;
        const caregiverWhatsAppBody = `📢 Amma Sugar Tracker Alert 📢\n\nHi Caregiver, Amma's scheduled blood sugar readings are still pending. Please verify she records them.`;

        if (enableWhatsapp) {
          if (AmmaPhone) {
            console.log(`[ReminderWorker] Triggering WhatsApp notification for user ${plan.userId} to ${AmmaPhone}`);
            await sendWhatsApp(AmmaPhone, whatsAppBody);
          }
          if (CaregiverPhone) {
            console.log(`[ReminderWorker] Triggering Caregiver WhatsApp notification for user ${plan.userId} to ${CaregiverPhone}`);
            await sendWhatsApp(CaregiverPhone, caregiverWhatsAppBody);
          }
        }

        if (enableSms && CaregiverPhone) {
          console.log(`[ReminderWorker] Triggering SMS alert for user ${plan.userId} to ${CaregiverPhone}`);
          await sendSMS(CaregiverPhone, smsBody);
        }
      }
    }
  } catch (error) {
    console.error('[ReminderWorker] Error executing scheduled checks:', error);
  }
};

export const startReminderWorker = () => {
  console.log('[ReminderWorker] Starting background sugar monitoring reminder engine...');
  // Run checks every minute
  setInterval(checkAndSendReminders, 60000);
};
