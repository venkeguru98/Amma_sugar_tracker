import { Response } from 'express';
import prisma from '../db';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import dayjs from 'dayjs';

// Default configuration fallbacks
// Default configuration fallbacks
const DEFAULT_PLAN = {
  adviser: 'doctor',
  frequency: 'custom_days',
  scheduleDays: '1,4', // Mon, Thu
  reminderTime: '08:00',
  readingTypes: 'fasting,before_lunch,after_lunch,before_dinner,after_dinner',
  startDate: '',
  endDate: '',
  isActive: false
};

export const getPlan = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    let plan = await prisma.monitoringPlan.findUnique({
      where: { userId: req.user.id }
    });

    if (!plan) {
      return res.json(DEFAULT_PLAN);
    }

    res.json(plan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const savePlan = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { frequency, scheduleDays, reminderTime, readingTypes, startDate, endDate, isActive, adviser } = req.body;

    const plan = await prisma.monitoringPlan.upsert({
      where: { userId: req.user.id },
      update: {
        adviser: adviser ? String(adviser) : undefined,
        frequency: String(frequency),
        scheduleDays: String(scheduleDays),
        reminderTime: String(reminderTime),
        readingTypes: String(readingTypes),
        startDate: startDate ? String(startDate) : null,
        endDate: endDate ? String(endDate) : null,
        isActive: Boolean(isActive)
      },
      create: {
        userId: req.user.id,
        adviser: adviser ? String(adviser) : "doctor",
        frequency: String(frequency),
        scheduleDays: String(scheduleDays),
        reminderTime: String(reminderTime),
        readingTypes: String(readingTypes),
        startDate: startDate ? String(startDate) : null,
        endDate: endDate ? String(endDate) : null,
        isActive: Boolean(isActive)
      }
    });

    res.json(plan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper: Check if a date is scheduled under the plan
const isDateScheduled = (date: dayjs.Dayjs, plan: any): boolean => {
  if (!plan.isActive) return false;
  if (plan.startDate && date.format('YYYY-MM-DD') < plan.startDate) return false;
  if (plan.endDate && date.format('YYYY-MM-DD') > plan.endDate) return false;

  if (plan.frequency === 'daily') {
    return true;
  }
  if (plan.frequency === 'alternate') {
    // Check parity of days from start date
    const base = plan.startDate ? dayjs(plan.startDate) : dayjs('2026-01-01');
    const diff = Math.abs(date.diff(base, 'day'));
    return diff % 2 === 0;
  }
  if (plan.frequency === 'weekly') {
    // Check if diff is a multiple of 7
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

export const getProgressData = async (userId: string, clientDate?: string) => {
  let plan = await prisma.monitoringPlan.findUnique({
    where: { userId }
  });

  if (!plan) {
    plan = DEFAULT_PLAN as any;
  }

  // Capture the client's current local date to prevent timezone discrepancy
  const todayStr = clientDate ? String(clientDate) : dayjs().format('YYYY-MM-DD');
  const today = dayjs(todayStr);

  // 1. Is today scheduled?
  const isScheduledToday = isDateScheduled(today, plan);

  // 2. Fetch today's readings
  const todayReadings = await prisma.sugarReading.findMany({
    where: {
      userId,
      readingDate: todayStr
    }
  });

  const requiredTypes = plan!.readingTypes.split(',').map(t => t.trim()).filter(Boolean);
  const checklist = requiredTypes.map((type) => {
    const reading = todayReadings.find(r => r.readingType === type);
    return {
      type,
      checked: !!reading,
      sugar: reading ? reading.bloodSugar : null,
      time: reading ? reading.readingTime : null
    };
  });

  const checkedCount = checklist.filter(c => c.checked).length;
  const totalCount = checklist.length;
  const completionPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  // 3. Find next scheduled day label (English & Tamil)
  let nextScheduledDate = '';
  let nextScheduledDayEn = '';
  let nextScheduledDayTa = '';
  
  if (plan!.isActive) {
    let temp = today.add(1, 'day');
    for (let i = 0; i < 7; i++) {
      if (isDateScheduled(temp, plan)) {
        nextScheduledDate = temp.format('YYYY-MM-DD');
        const dayIndex = temp.day();
        
        const weekdayNamesEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const weekdayNamesTa = ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'];
        
        nextScheduledDayEn = weekdayNamesEn[dayIndex];
        nextScheduledDayTa = weekdayNamesTa[dayIndex];
        break;
      }
      temp = temp.add(1, 'day');
    }
  }

  // 4. Calculate Past 30 Days Adherence
  const pastDays: dayjs.Dayjs[] = [];
  for (let i = 30; i >= 1; i--) {
    const d = today.subtract(i, 'day');
    if (isDateScheduled(d, plan)) {
      pastDays.push(d);
    }
  }

  const monthAgoStr = today.subtract(30, 'day').format('YYYY-MM-DD');
  const pastReadings = await prisma.sugarReading.findMany({
    where: {
      userId,
      readingDate: { gte: monthAgoStr, lt: todayStr }
    }
  });

  let completedDays = 0;
  const totalScheduledDays = pastDays.length;

  pastDays.forEach((day) => {
    const dStr = day.format('YYYY-MM-DD');
    const dayLogs = pastReadings.filter(r => r.readingDate === dStr);
    const isDayComplete = requiredTypes.every((type) => {
      return dayLogs.some(r => r.readingType === type);
    });
    if (isDayComplete) completedDays++;
  });

  const adherenceRate = totalScheduledDays > 0 ? Math.round((completedDays / totalScheduledDays) * 100) : 100;

  return {
    isScheduledToday,
    checklist,
    checkedCount,
    totalCount,
    completionPercent,
    nextScheduled: {
      date: nextScheduledDate,
      dayEn: nextScheduledDayEn,
      dayTa: nextScheduledDayTa
    },
    adherence: {
      completedDays,
      totalScheduledDays,
      rate: adherenceRate
    },
    reminderTime: plan!.reminderTime,
    isActive: plan!.isActive
  };
};

export const getProgress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const clientDate = req.query.clientDate ? String(req.query.clientDate) : undefined;
    const progress = await getProgressData(req.user.id, clientDate);
    res.json(progress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

