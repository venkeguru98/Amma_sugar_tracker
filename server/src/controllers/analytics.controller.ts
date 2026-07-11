import { Response } from 'express';
import prisma from '../db';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import dayjs from 'dayjs';
import { getProgressData } from './monitoring.controller';


// HbA1c estimation using ADAG formula: HbA1c = (Avg Glucose + 46.7) / 28.7
const estimateHbA1c = (avgGlucose: number): number => {
  if (!avgGlucose || avgGlucose <= 0) return 0;
  return parseFloat(((avgGlucose + 46.7) / 28.7).toFixed(2));
};

// Calculate standard deviation
const calculateStdDev = (values: number[], mean: number): number => {
  if (values.length <= 1) return 0;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
  return parseFloat(Math.sqrt(variance).toFixed(2));
};

// Calculate median
const calculateMedian = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : parseFloat(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2));
};

// Helper to determine color category
const getSugarCategory = (sugar: number, targetMin: number, targetMax: number) => {
  if (sugar < targetMin) return 'red'; // low sugar is danger
  if (sugar <= targetMax) return 'green'; // normal
  if (sugar <= targetMax + 40) return 'yellow'; // slightly high
  if (sugar <= targetMax + 100) return 'orange'; // high
  return 'red'; // danger high
};

// Helper to classify time of day
const getTimeOfDay = (timeStr: string) => {
  const hour = parseInt(timeStr.split(':')[0]) || 0;
  if (hour >= 5 && hour < 12) return 'morning'; // 5am - 12pm
  if (hour >= 12 && hour < 17) return 'afternoon'; // 12pm - 5pm
  if (hour >= 17 && hour < 21) return 'evening'; // 5pm - 9pm
  return 'night'; // 9pm - 5am
};

// Calculate streak of consecutive days with at least one reading
const calculateStreak = (readings: { readingDate: string }[]): number => {
  if (readings.length === 0) return 0;
  
  // Extract unique sorted dates (newest first)
  const uniqueDates = Array.from(new Set(readings.map((r) => r.readingDate))).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const newestDate = new Date(uniqueDates[0]);
  newestDate.setHours(0, 0, 0, 0);

  // If the latest reading is older than yesterday, the current streak is 0
  const diffTime = today.getTime() - newestDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 1) {
    return 0;
  }

  for (let i = 0; i < uniqueDates.length; i++) {
    if (i === 0) {
      streak = 1;
      continue;
    }
    const current = new Date(uniqueDates[i]);
    const previous = new Date(uniqueDates[i - 1]);
    const diff = previous.getTime() - current.getTime();
    const daysDiff = Math.round(diff / (1000 * 60 * 60 * 24));

    if (daysDiff === 1) {
      streak++;
    } else if (daysDiff > 1) {
      break; // Streak broken
    }
  }

  return streak;
};

export const getDashboardAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const targetMin = user.targetMin;
    const targetMax = user.targetMax;

    // Capture client date or fall back to server's date
    const todayStr = req.query.clientDate ? String(req.query.clientDate) : dayjs().format('YYYY-MM-DD');

    // Fetch all sugar readings
    const allReadings = await prisma.sugarReading.findMany({
      where: { userId: req.user.id },
      orderBy: [{ readingDate: 'desc' }, { readingTime: 'desc' }]
    });

    // Fetch reminders and monitoring progress in parallel to speed up database queries
    const [reminders, monitoringProgress] = await Promise.all([
      prisma.medicineReminder.findMany({
        where: { userId: req.user.id, isActive: true },
        orderBy: { time: 'asc' }
      }),
      getProgressData(req.user.id, todayStr)
    ]);

    if (allReadings.length === 0) {
      return res.json({
        hasData: false,
        summary: {
          todayAvg: 0,
          yesterdayAvg: 0,
          weeklyAvg: 0,
          monthlyAvg: 0,
          yearlyAvg: 0,
          highest: 0,
          lowest: 0,
          avgFasting: 0,
          avgPostMeal: 0,
          hba1c: 0,
          latestReading: null,
          totalReadings: 0,
          streak: 0,
          categories: { green: 0, yellow: 0, orange: 0, red: 0 },
          lastMonthAvg: 0,
          todayVal: null,
          yesterdayVal: null,
          actualTodayAvg: null,
          actualYesterdayAvg: null
        },
        charts: { daily: [], weekly: [], monthly: [], yearly: [] },
        recentReadings: [],
        reminders,
        monitoringProgress
      });
    }

    const yesterdayStr = dayjs(todayStr).subtract(1, 'day').format('YYYY-MM-DD');
    const weekAgoStr = dayjs(todayStr).subtract(7, 'day').format('YYYY-MM-DD');
    const monthAgoStr = dayjs(todayStr).subtract(30, 'day').format('YYYY-MM-DD');
    const yearAgoStr = dayjs(todayStr).subtract(365, 'day').format('YYYY-MM-DD');
    
    // For comparing with last month (days 31 to 60)
    const m0Start = dayjs(todayStr).subtract(30, 'day').format('YYYY-MM-DD');
    const m1Start = dayjs(todayStr).subtract(60, 'day').format('YYYY-MM-DD');

    // Sugar stats calculations
    let todaySum = 0, todayCount = 0;
    let yesterdaySum = 0, yesterdayCount = 0;
    let weeklySum = 0, weeklyCount = 0;
    let monthlySum = 0, monthlyCount = 0;
    let yearlySum = 0, yearlyCount = 0;
    let lastMonthSum = 0, lastMonthCount = 0;
    let fastingSum = 0, fastingCount = 0;
    let postMealSum = 0, postMealCount = 0;

    let highest = 0;
    let lowest = Infinity;
    const allSugarValues: number[] = [];

    const categories = { green: 0, yellow: 0, orange: 0, red: 0 };

    // Grouping for time of day averages
    const timeOfDaySum = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    const timeOfDayCount = { morning: 0, afternoon: 0, evening: 0, night: 0 };

    allReadings.forEach((reading) => {
      const val = reading.bloodSugar;
      allSugarValues.push(val);

      if (val > highest) highest = val;
      if (val < lowest) lowest = val;

      const dateStr = reading.readingDate;

      // Color coding count
      const cat = getSugarCategory(val, targetMin, targetMax);
      categories[cat]++;

      // Daily filters
      if (dateStr === todayStr) {
        todaySum += val;
        todayCount++;
      }
      if (dateStr === yesterdayStr) {
        yesterdaySum += val;
        yesterdayCount++;
      }
      if (dateStr >= weekAgoStr) {
        weeklySum += val;
        weeklyCount++;
      }
      if (dateStr >= monthAgoStr) {
        monthlySum += val;
        monthlyCount++;
      }
      if (dateStr >= yearAgoStr) {
        yearlySum += val;
        yearlyCount++;
      }

      // Comparison range: days 31 to 60
      if (dateStr >= m1Start && dateStr < m0Start) {
        lastMonthSum += val;
        lastMonthCount++;
      }

      // Fasting vs Post meal
      const isFasting = ['fasting', 'before_breakfast', 'before_lunch', 'before_dinner'].includes(reading.readingType);
      if (isFasting) {
        fastingSum += val;
        fastingCount++;
      } else {
        postMealSum += val;
        postMealCount++;
      }

      // Time of day calculations
      const tod = getTimeOfDay(reading.readingTime);
      timeOfDaySum[tod] += val;
      timeOfDayCount[tod]++;
    });

    const totalReadings = allReadings.length;
    const avgFasting = fastingCount > 0 ? parseFloat((fastingSum / fastingCount).toFixed(1)) : 0;
    const avgPostMeal = postMealCount > 0 ? parseFloat((postMealSum / postMealCount).toFixed(1)) : 0;
    const overallAvg = allSugarValues.reduce((a, b) => a + b, 0) / totalReadings;

    // Charts Data
    // Daily trend: last 10 readings chronologically
    const dailyChart = [...allReadings]
      .slice(0, 10)
      .reverse()
      .map((r) => ({
        label: `${r.readingDate.substring(5)} ${r.readingTime}`,
        sugar: r.bloodSugar,
        type: r.readingType
      }));

    // Weekly trend: average sugar per day for the last 7 days with readings
    const dateGroups: { [date: string]: number[] } = {};
    allReadings.forEach((r) => {
      if (!dateGroups[r.readingDate]) dateGroups[r.readingDate] = [];
      dateGroups[r.readingDate].push(r.bloodSugar);
    });

    const weeklyChart = Object.keys(dateGroups)
      .sort()
      .slice(-7)
      .map((date) => {
        const vals = dateGroups[date];
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        return {
          label: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          sugar: parseFloat(avg.toFixed(1))
        };
      });

    // Monthly trend: average sugar per month for the past 6 months
    const monthGroups: { [month: string]: number[] } = {};
    allReadings.forEach((r) => {
      const monthKey = r.readingDate.substring(0, 7); // YYYY-MM
      if (!monthGroups[monthKey]) monthGroups[monthKey] = [];
      monthGroups[monthKey].push(r.bloodSugar);
    });

    const monthlyChart = Object.keys(monthGroups)
      .sort()
      .slice(-6)
      .map((month) => {
        const vals = monthGroups[month];
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        const [y, m] = month.split('-');
        const monthLabel = new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('en-US', { month: 'short' });
        return {
          label: `${monthLabel} ${y.substring(2)}`,
          sugar: parseFloat(avg.toFixed(1))
        };
      });

    // Pre-calculate story metrics values to offload the client browser
    const todayAverage = todayCount > 0 ? todaySum / todayCount : null;
    const yesterdayAverage = yesterdayCount > 0 ? yesterdaySum / yesterdayCount : null;
    const latestGlucose = allReadings[0] ? allReadings[0].bloodSugar : 120;

    const todayVal = todayAverage !== null ? Math.round(todayAverage) : (allReadings[0] ? allReadings[0].bloodSugar : null);
    const yesterdayVal = yesterdayAverage !== null ? Math.round(yesterdayAverage) : (allReadings[1] ? allReadings[1].bloodSugar : null);
    const actualTodayAvg = todayAverage !== null ? Math.round(todayAverage) : null;
    const actualYesterdayAvg = yesterdayAverage !== null ? Math.round(yesterdayAverage) : null;
    const lastMonthAvg = lastMonthCount > 0 ? parseFloat((lastMonthSum / lastMonthCount).toFixed(1)) : 0;

    res.json({
      hasData: true,
      summary: {
        todayAvg: todayCount > 0 ? parseFloat((todaySum / todayCount).toFixed(1)) : 0,
        yesterdayAvg: yesterdayCount > 0 ? parseFloat((yesterdaySum / yesterdayCount).toFixed(1)) : 0,
        weeklyAvg: weeklyCount > 0 ? parseFloat((weeklySum / weeklyCount).toFixed(1)) : 0,
        monthlyAvg: monthlyCount > 0 ? parseFloat((monthlySum / monthlyCount).toFixed(1)) : 0,
        yearlyAvg: yearlyCount > 0 ? parseFloat((yearlySum / yearlyCount).toFixed(1)) : 0,
        highest,
        lowest: lowest === Infinity ? 0 : lowest,
        avgFasting,
        avgPostMeal,
        hba1c: estimateHbA1c(overallAvg),
        latestReading: allReadings[0],
        totalReadings,
        streak: calculateStreak(allReadings),
        categories,
        lastMonthAvg,
        todayVal,
        yesterdayVal,
        actualTodayAvg,
        actualYesterdayAvg
      },
      timeOfDayAverages: {
        morning: timeOfDayCount.morning > 0 ? parseFloat((timeOfDaySum.morning / timeOfDayCount.morning).toFixed(1)) : 0,
        afternoon: timeOfDayCount.afternoon > 0 ? parseFloat((timeOfDaySum.afternoon / timeOfDayCount.afternoon).toFixed(1)) : 0,
        evening: timeOfDayCount.evening > 0 ? parseFloat((timeOfDaySum.evening / timeOfDayCount.evening).toFixed(1)) : 0,
        night: timeOfDayCount.night > 0 ? parseFloat((timeOfDaySum.night / timeOfDayCount.night).toFixed(1)) : 0,
      },
      charts: {
        daily: dailyChart,
        weekly: weeklyChart,
        monthly: monthlyChart
      },
      recentReadings: allReadings.slice(0, 10),
      reminders,
      monitoringProgress
    });
  } catch (error: any) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getDeepAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const targetMin = user.targetMin;
    const targetMax = user.targetMax;

    // Fetch ALL readings for full historical analysis
    const readings = await prisma.sugarReading.findMany({
      where: { userId: req.user.id },
      orderBy: [{ readingDate: 'asc' }, { readingTime: 'asc' }]
    });

    if (readings.length === 0) {
      return res.json({
        hasData: false,
        stats: {
          mean: 0, median: 0, min: 0, max: 0, stdDev: 0, hba1c: 0,
          todayAvg: 0, yesterdayAvg: 0, weeklyAvg: 0, monthlyAvg: 0, quarterlyAvg: 0, yearlyAvg: 0,
          longestStreak: 0, momImprovement: 0, yoyImprovement: 0
        },
        averages: { fasting: 0, postMeal: 0 },
        monthlyBreakdown: [],
        timeOfDayAnalysis: [],
        distribution: [],
        heatmap: [],
        rolling: [],
        forecast: []
      });
    }

    const values = readings.map((r) => r.bloodSugar);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = parseFloat((sum / readings.length).toFixed(1));
    const median = calculateMedian(values);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const stdDev = calculateStdDev(values, mean);

    // --- Custom Advanced Long-Term Stats ---
    const todayStr = dayjs().format('YYYY-MM-DD');
    const yesterdayStr = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    const weekAgoStr = dayjs().subtract(7, 'day').format('YYYY-MM-DD');
    const monthAgoStr = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
    const prevMonthStartStr = dayjs().subtract(60, 'day').format('YYYY-MM-DD');
    const quarterAgoStr = dayjs().subtract(90, 'day').format('YYYY-MM-DD');
    const yearAgoStr = dayjs().subtract(365, 'day').format('YYYY-MM-DD');
    const prevYearStartStr = dayjs().subtract(730, 'day').format('YYYY-MM-DD');

    // Averages helper
    const getAvgForPeriod = (start: string, end?: string) => {
      const logs = readings.filter(r => r.readingDate >= start && (!end || r.readingDate < end));
      if (logs.length === 0) return 0;
      const total = logs.reduce((acc, r) => acc + r.bloodSugar, 0);
      return parseFloat((total / logs.length).toFixed(1));
    };

    const todayAvg = getAvgForPeriod(todayStr);
    const yesterdayAvg = getAvgForPeriod(yesterdayStr, todayStr);
    const weeklyAvg = getAvgForPeriod(weekAgoStr);
    const monthlyAvg = getAvgForPeriod(monthAgoStr);
    const quarterlyAvg = getAvgForPeriod(quarterAgoStr);
    const yearlyAvg = getAvgForPeriod(yearAgoStr);

    const prevMonthAvg = getAvgForPeriod(prevMonthStartStr, monthAgoStr);
    const prevYearAvg = getAvgForPeriod(prevYearStartStr, yearAgoStr);

    // MoM & YoY Improvements (negative means sugar decreased, which is improvement)
    const momImprovement = monthlyAvg > 0 && prevMonthAvg > 0 ? parseFloat((prevMonthAvg - monthlyAvg).toFixed(1)) : 0;
    const yoyImprovement = yearlyAvg > 0 && prevYearAvg > 0 ? parseFloat((prevYearAvg - yearlyAvg).toFixed(1)) : 0;

    // HbA1c based strictly on latest 90 days
    const ninetyDayReadings = readings.filter(r => r.readingDate >= quarterAgoStr);
    const ninetyDayAvg = ninetyDayReadings.length > 0 
      ? ninetyDayReadings.reduce((acc, r) => acc + r.bloodSugar, 0) / ninetyDayReadings.length 
      : mean;
    const hba1c = estimateHbA1c(ninetyDayAvg);

    // Longest Recording Streak across all history
    const uniqueDates = Array.from(new Set(readings.map(r => r.readingDate))).sort();
    let longestStreak = 0;
    let currentStreak = 0;
    
    for (let i = 0; i < uniqueDates.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const prevDate = dayjs(uniqueDates[i - 1]);
        const currDate = dayjs(uniqueDates[i]);
        if (currDate.diff(prevDate, 'day') === 1) {
          currentStreak++;
        } else if (currDate.diff(prevDate, 'day') > 1) {
          if (currentStreak > longestStreak) longestStreak = currentStreak;
          currentStreak = 1;
        }
      }
    }
    if (currentStreak > longestStreak) longestStreak = currentStreak;

    // --- End of Advanced Stats ---

    // Grouping by date for heatmaps
    const dateGroups: { [date: string]: number[] } = {};
    readings.forEach((r) => {
      if (!dateGroups[r.readingDate]) dateGroups[r.readingDate] = [];
      dateGroups[r.readingDate].push(r.bloodSugar);
    });

    const daysRecorded = Object.keys(dateGroups).length;
    const totalDaysInScope = readings.length > 0
      ? dayjs(readings[readings.length - 1].readingDate).diff(dayjs(readings[0].readingDate), 'day') + 1
      : 30;
    const consistencyScore = Math.min(100, Math.round((daysRecorded / totalDaysInScope) * 100));
    const daysMissed = Math.max(0, totalDaysInScope - daysRecorded);

    // Fasting vs Post meal
    let fastingSum = 0, fastingCount = 0;
    let postMealSum = 0, postMealCount = 0;

    const todData = { morning: [] as number[], afternoon: [] as number[], evening: [] as number[], night: [] as number[] };
    const monthAverages: { [month: string]: { sum: number; count: number } } = {};
    const heatmapData: { date: string; count: number; avgSugar: number }[] = [];
    const rollingData: { date: string; time: string; value: number; movingAvg: number }[] = [];
    const windowSize = 5;

    readings.forEach((r, idx) => {
      const val = r.bloodSugar;
      const isFasting = ['fasting', 'before_breakfast', 'before_lunch', 'before_dinner'].includes(r.readingType);

      if (isFasting) {
        fastingSum += val;
        fastingCount++;
      } else {
        postMealSum += val;
        postMealCount++;
      }

      const tod = getTimeOfDay(r.readingTime);
      todData[tod].push(val);

      const mKey = r.readingDate.substring(0, 7);
      if (!monthAverages[mKey]) monthAverages[mKey] = { sum: 0, count: 0 };
      monthAverages[mKey].sum += val;
      monthAverages[mKey].count++;

      const windowStart = Math.max(0, idx - windowSize + 1);
      const windowVals = readings.slice(windowStart, idx + 1).map((rd) => rd.bloodSugar);
      const windowAvg = windowVals.reduce((a, b) => a + b, 0) / windowVals.length;

      rollingData.push({
        date: r.readingDate,
        time: r.readingTime,
        value: val,
        movingAvg: parseFloat(windowAvg.toFixed(1))
      });
    });

    Object.keys(dateGroups).forEach((date) => {
      const vals = dateGroups[date];
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      heatmapData.push({
        date,
        count: vals.length,
        avgSugar: parseFloat(avg.toFixed(1))
      });
    });

    const timeOfDayStats = Object.keys(todData).map((key) => {
      const vals = todData[key as keyof typeof todData];
      const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      return {
        name: key,
        avg: parseFloat(avg.toFixed(1)),
        count: vals.length
      };
    });

    const monthlyList = Object.keys(monthAverages).map((month) => {
      const entry = monthAverages[month];
      return {
        month,
        avg: parseFloat((entry.sum / entry.count).toFixed(1)),
        count: entry.count
      };
    }).sort((a, b) => a.month.localeCompare(b.month));

    const bestMonth = monthlyList.length > 0 ? [...monthlyList].sort((a, b) => a.avg - b.avg)[0] : null;
    const worstMonth = monthlyList.length > 0 ? [...monthlyList].sort((a, b) => b.avg - a.avg)[0] : null;

    const distributions: { [range: string]: number } = {};
    values.forEach((v) => {
      const lower = Math.floor(v / 20) * 20;
      const upper = lower + 19;
      const rangeStr = `${lower}-${upper}`;
      distributions[rangeStr] = (distributions[rangeStr] || 0) + 1;
    });

    const distributionList = Object.keys(distributions)
      .map((range) => {
        const [lower] = range.split('-').map(Number);
        return { range, count: distributions[range], lower };
      })
      .sort((a, b) => a.lower - b.lower);

    // Forecast next 7 readings
    const forecast: { label: string; sugar: number; isForecast: boolean }[] = [];
    if (readings.length > 2) {
      const n = readings.length;
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += values[i];
        sumXY += i * values[i];
        sumXX += i * i;
      }
      const b = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const a = (sumY - b * sumX) / n;

      const lastDateStr = readings[readings.length - 1].readingDate;
      const lastDate = new Date(lastDateStr);

      for (let i = 1; i <= 7; i++) {
        const nextIdx = n + i - 1;
        const projectedValue = Math.max(70, Math.min(350, a + b * nextIdx));
        
        const nextDate = new Date(lastDate);
        nextDate.setDate(lastDate.getDate() + i);
        const labelStr = nextDate.toISOString().split('T')[0].substring(5);

        forecast.push({
          label: `${labelStr} (Proj)`,
          sugar: parseFloat(projectedValue.toFixed(1)),
          isForecast: true
        });
      }
    }

    res.json({
      hasData: true,
      stats: {
        mean,
        median,
        min,
        max,
        stdDev,
        hba1c,
        consistencyScore,
        daysMissed,
        todayAvg,
        yesterdayAvg,
        weeklyAvg,
        monthlyAvg,
        quarterlyAvg,
        yearlyAvg,
        longestStreak,
        momImprovement,
        yoyImprovement
      },
      averages: {
        fasting: fastingCount > 0 ? parseFloat((fastingSum / fastingCount).toFixed(1)) : 0,
        postMeal: postMealCount > 0 ? parseFloat((postMealSum / postMealCount).toFixed(1)) : 0
      },
      bestMonth,
      worstMonth,
      monthlyBreakdown: monthlyList,
      timeOfDayAnalysis: timeOfDayStats,
      distribution: distributionList,
      heatmap: heatmapData,
      rolling: rollingData,
      forecast
    });
  } catch (error: any) {
    console.error('Get deep analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

