import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  Plus, Flame, Heart, TrendingUp, TrendingDown, Clock, Activity, 
  ChevronRight, Smile, Coffee, Apple, Utensils, AlertCircle, Sparkles,
  Droplets, Footprints, Pill, CheckSquare, Calendar, Star, CheckCircle, Circle
} from 'lucide-react';
import dayjs from 'dayjs';
import { getAdjustedFoodPlan, AdjustedPlan } from '../utils/foodRecommendations';

interface Reading {
  id: string;
  readingDate: string;
  readingTime: string;
  readingType: string;
  bloodSugar: number;
  medicineTaken: boolean;
  medicineName: string | null;
  insulinUnits: number | null;
  mealNotes: string | null;
  symptoms: string | null;
  remarks: string | null;
}

interface Reminder {
  id: string;
  medName: string;
  dosage: string;
  time: string;
  isActive: boolean;
  remarks: string | null;
}

interface ProgressItem {
  type: string;
  checked: boolean;
  sugar: number | null;
  time: string | null;
}

interface AdherenceData {
  completedDays: number;
  totalScheduledDays: number;
  rate: number;
}

interface MonitoringProgress {
  isScheduledToday: boolean;
  checklist: ProgressItem[];
  checkedCount: number;
  totalCount: number;
  completionPercent: number;
  nextScheduled: { date: string; dayEn: string; dayTa: string };
  adherence: AdherenceData;
  reminderTime?: string;
  isActive?: boolean;
}

interface SummaryData {
  todayAvg: number;
  yesterdayAvg: number;
  weeklyAvg: number;
  monthlyAvg: number;
  yearlyAvg: number;
  highest: number;
  lowest: number;
  avgFasting: number;
  avgPostMeal: number;
  hba1c: number;
  latestReading: Reading | null;
  totalReadings: number;
  streak: number;
  categories: { green: number; yellow: number; orange: number; red: number };
}

export const Dashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { familyView } = useTheme();
  const navigate = useNavigate();
  const targetMin = user?.targetMin ?? 70;
  const targetMax = user?.targetMax ?? 140;

  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [weeklyChart, setWeeklyChart] = useState<any[]>([]);
  const [allReadings, setAllReadings] = useState<Reading[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [monProgress, setMonProgress] = useState<MonitoringProgress | null>(null);
  const [isOverdue, setIsOverdue] = useState(false);

  // Story Averages
  const [todayVal, setTodayVal] = useState<number | null>(null);
  const [yesterdayVal, setYesterdayVal] = useState<number | null>(null);
  const [thisWeekAvg, setThisWeekAvg] = useState<number>(0);
  const [lastMonthAvg, setLastMonthAvg] = useState<number>(0);
  const [thisMonthAvg, setThisMonthAvg] = useState<number>(0);
  const [actualTodayAvg, setActualTodayAvg] = useState<number | null>(null);
  const [actualYesterdayAvg, setActualYesterdayAvg] = useState<number | null>(null);

  // Dynamic Adjusted Food Plan & Health Tip States
  const [foodPlan, setFoodPlan] = useState<AdjustedPlan | null>(null);
  // Ref to latest sugar value so food plan recalc can access it without re-fetching
  const [latestGlucoseRef, setLatestGlucoseRef] = useState<number>(120);

  // Request browser notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  // Monitor time and trigger notifications / overdue warnings
  useEffect(() => {
    if (!monProgress || !monProgress.isScheduledToday || !monProgress.reminderTime) {
      setIsOverdue(false);
      return;
    }

    const evaluateReminder = () => {
      const now = dayjs();
      const [rHours, rMinutes] = monProgress.reminderTime!.split(':').map(Number);
      const currentMinutes = now.hour() * 60 + now.minute();
      const reminderMinutes = rHours * 60 + rMinutes;

      const overdue = currentMinutes >= reminderMinutes;
      setIsOverdue(overdue);

      // Trigger notification if overdue and readings are still pending
      const isPending = monProgress.completionPercent < 100;
      const isTa = i18n.language.startsWith('ta');
      if (overdue && isPending) {
        const todayStr = now.format('YYYY-MM-DD');
        const lastNotified = localStorage.getItem('last_notified_date');
        if (lastNotified !== todayStr) {
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(isTa ? "🔔 சர்க்கரை பரிசோதனைக்கான நேரம்" : "🔔 Time for your sugar test", {
              body: isTa 
                ? "அட்டவணைப்படுத்தப்பட்ட சர்க்கரை பரிசோதனை நிலுவையில் உள்ளது. தயவுசெய்து இப்போது பதிவு செய்யவும்." 
                : "Please record today's scheduled sugar readings.",
              icon: '/icon-512.jpg'
            });
            localStorage.setItem('last_notified_date', todayStr);
          }
        }
      }
    };

    evaluateReminder();
    const interval = setInterval(evaluateReminder, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [monProgress, i18n.language]);

  // Fetch dashboard data only on mount (not on language change)
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Recalculate food plan locally whenever language changes — no network call needed
  useEffect(() => {
    if (latestGlucoseRef) {
      const plan = getAdjustedFoodPlan(latestGlucoseRef, targetMin, targetMax, i18n.language);
      setFoodPlan(plan);
    }
  }, [i18n.language]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Parallelize all independent requests to cut waterfall latency
      const [dashRes, allRes, remRes, progressRes] = await Promise.allSettled([
        axios.get('/api/analytics/dashboard'),
        axios.get('/api/reading', { params: { limit: 'all' } }),
        axios.get('/api/extra/reminders'),
        axios.get('/api/extra/monitoring-plan/progress', {
          params: { clientDate: dayjs().format('YYYY-MM-DD') }
        })
      ]);

      // Process analytics dashboard
      if (dashRes.status === 'fulfilled' && dashRes.value.data.hasData) {
        setSummary(dashRes.value.data.summary);
        setWeeklyChart(dashRes.value.data.charts.weekly || []);
        setHasData(true);

        // Process readings
        const list: Reading[] = allRes.status === 'fulfilled'
          ? (allRes.value.data.readings || [])
          : [];
        setAllReadings(list);

        if (list.length > 0) {
          computeStoryMetrics(list, dashRes.value.data.summary);
        }

        // Store latest glucose for future language-triggered recalculations
        const latestGlucose = dashRes.value.data.summary?.latestReading?.bloodSugar || 120;
        setLatestGlucoseRef(latestGlucose);
      } else {
        setHasData(false);
        const defaultPlan = getAdjustedFoodPlan(120, targetMin, targetMax, i18n.language);
        setFoodPlan(defaultPlan);
        setLatestGlucoseRef(120);
      }

      // Process reminders
      if (remRes.status === 'fulfilled') {
        setReminders(remRes.value.data.filter((r: Reminder) => r.isActive));
      }

      // Process monitoring plan progress
      if (progressRes.status === 'fulfilled') {
        setMonProgress(progressRes.value.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getGlucoseStatusDetails = (val: number) => {
    const isTa = i18n.language.startsWith('ta');
    if (val < targetMin) {
      return { 
        text: isTa ? "குறைவு" : "Low", 
        dot: "🔴", 
        color: "text-rose-500", 
        bg: "bg-rose-50 border-rose-200 dark:bg-rose-955/20 dark:border-rose-900" 
      };
    }
    if (val <= targetMax) {
      return { 
        text: isTa ? "இயல்பு" : "Normal", 
        dot: "🟢", 
        color: "text-emerald-500", 
        bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-955/20 dark:border-emerald-900" 
      };
    }
    if (val <= targetMax + 40) {
      return { 
        text: isTa ? "சற்று அதிகம்" : "Slightly High", 
        dot: "🟡", 
        color: "text-amber-500", 
        bg: "bg-amber-50 border-amber-200 dark:bg-amber-955/20 dark:border-amber-900" 
      };
    }
    return { 
      text: isTa ? "அதிகம்" : "High", 
      dot: "🔴", 
      color: "text-rose-500", 
      bg: "bg-rose-50 border-rose-200 dark:bg-rose-955/20 dark:border-rose-900" 
    };
  };

  const computeStoryMetrics = (list: Reading[], sumInfo: any) => {
    const todayStr = dayjs().format('YYYY-MM-DD');
    const yesterdayStr = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    
    const todayLogs = list.filter(r => r.readingDate === todayStr);
    const yesterdayLogs = list.filter(r => r.readingDate === yesterdayStr);

    const todayAverage = todayLogs.length > 0 ? todayLogs.reduce((sum, r) => sum + r.bloodSugar, 0) / todayLogs.length : null;
    const yesterdayAverage = yesterdayLogs.length > 0 ? yesterdayLogs.reduce((sum, r) => sum + r.bloodSugar, 0) / yesterdayLogs.length : null;
    
    setTodayVal(todayAverage ? Math.round(todayAverage) : (list[0] ? list[0].bloodSugar : null));
    setYesterdayVal(yesterdayAverage ? Math.round(yesterdayAverage) : (list[1] ? list[1].bloodSugar : null));
    setActualTodayAvg(todayAverage ? Math.round(todayAverage) : null);
    setActualYesterdayAvg(yesterdayAverage ? Math.round(yesterdayAverage) : null);

    const w0Start = dayjs().subtract(7, 'day').format('YYYY-MM-DD');
    const thisWeekLogs = list.filter(r => r.readingDate >= w0Start);
    const w0Avg = thisWeekLogs.length > 0 ? thisWeekLogs.reduce((sum, r) => sum + r.bloodSugar, 0) / thisWeekLogs.length : 0;
    setThisWeekAvg(Math.round(w0Avg));

    const m0Start = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
    const m1Start = dayjs().subtract(60, 'day').format('YYYY-MM-DD');
    const thisMonthLogs = list.filter(r => r.readingDate >= m0Start);
    const lastMonthLogs = list.filter(r => r.readingDate >= m1Start && r.readingDate < m0Start);

    const m0Avg = thisMonthLogs.length > 0 ? thisMonthLogs.reduce((sum, r) => sum + r.bloodSugar, 0) / thisMonthLogs.length : 0;
    const m1Avg = lastMonthLogs.length > 0 ? lastMonthLogs.reduce((sum, r) => sum + r.bloodSugar, 0) / lastMonthLogs.length : 0;

    setThisMonthAvg(Math.round(m0Avg));
    setLastMonthAvg(Math.round(m1Avg));

    // Dynamic sugar food recommendations
    const latestGlucose = sumInfo.latestReading?.bloodSugar || 120;
    const plan = getAdjustedFoodPlan(
      latestGlucose,
      targetMin,
      targetMax,
      i18n.language
    );
    setFoodPlan(plan);
    setLatestGlucoseRef(latestGlucose);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const isTa = i18n.language.startsWith('ta');
    if (hour >= 5 && hour < 12) return isTa ? "காலை வணக்கம் அம்மா ❤️" : "Good Morning Amma ❤️";
    if (hour >= 12 && hour < 17) return isTa ? "மதிய வணக்கம் அம்மா ❤️" : "Good Afternoon Amma ❤️";
    if (hour >= 17 && hour < 21) return isTa ? "மாலை வணக்கம் அம்மா ❤️" : "Good Evening Amma ❤️";
    return isTa ? "வணக்கம் அம்மா ❤️" : "Hello Amma ❤️";
  };

  const getCurrentDateFormatted = () => {
    const localeStr = i18n.language.startsWith('ta') ? 'ta-IN' : 'en-US';
    return new Date().toLocaleDateString(localeStr, {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatLocalDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    const locale = i18n.language.startsWith('ta') ? 'ta-IN' : 'en-US';
    return d.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 space-y-6">
        <div className="h-16 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
        <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  const latestSugar = summary?.latestReading?.bloodSugar || 0;
  const statusDetails = getGlucoseStatusDetails(latestSugar);
  const diffVal = todayVal && yesterdayVal ? todayVal - yesterdayVal : 0;
  const isTamil = i18n.language.startsWith('ta');

  // Adherence evaluation feedback words
  const getAdherenceFeedback = (rate: number) => {
    if (rate >= 90) return isTamil ? "சிறந்த நிலைத்தன்மை" : "Excellent consistency";
    if (rate >= 75) return isTamil ? "நல்ல பழக்கம்" : "Good consistency";
    return isTamil ? "அதிக கவனம் தேவை" : "Needs attention";
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6 animate-fade-in pb-24 font-sans">

      {/* ===================================================== */}
      {/* 🔔 GLOBAL OVERDUE REMINDER BANNER (Both Views)        */}
      {/* ===================================================== */}
      {isOverdue && monProgress && monProgress.completionPercent < 100 && (
        <div className="p-4 bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900 rounded-3xl font-extrabold text-xs flex items-center gap-2 animate-pulse shadow-xs">
          <span className="text-base">🔔</span>
          <span>
            {isTamil ? "சர்க்கரை பரிசோதனை நேரம்! தயவுசெய்து இன்று அட்டவணைப்படுத்தப்பட்ட சர்க்கரை அளவுகளைப் பதிவு செய்யவும்." : "Time for your sugar test. Please record today's scheduled sugar readings."}
          </span>
        </div>
      )}

      {/* ==================================================== */}
      {/* 🏠 AMMA VIEW (MOBILE-FIRST CALM STORYCARD DESIGN)    */}
      {/* ==================================================== */}
      {familyView === 'amma' && (
        <div className="space-y-6">

          {/* 🌸 Redesigned Amma View Health Companion Card */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-emerald-955/20 p-6 rounded-3xl border border-emerald-100/40 dark:border-slate-800 shadow-sm space-y-4">
            
            {/* Header: Greeting & Date */}
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-heading font-black text-slate-800 dark:text-white flex items-center justify-center gap-1.5">
                <span>{getGreeting()}</span>
              </h1>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-550">
                📅 {getCurrentDateFormatted()}
              </p>
            </div>

            <div className="border-t border-emerald-150/40 dark:border-slate-800 my-3"></div>

            {/* Main Section: TODAY'S SUGAR CHECK */}
            <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-emerald-100/30 dark:border-slate-800 space-y-3.5 shadow-xxs">
              
              {/* Scenario 1: No test scheduled today */}
              {monProgress && !monProgress.isScheduledToday && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    🩸 {isTamil ? "இன்றைய சர்க்கரை பரிசோதனை" : "TODAY'S SUGAR CHECK"}
                  </h3>
                  <p className="text-sm font-bold text-slate-850 dark:text-white flex items-start gap-1.5">
                    <span>🌼</span>
                    <span>{isTamil ? "இன்று சர்க்கரை பரிசோதனை அட்டவணை இல்லை. நிம்மதியாகவும் மகிழ்ச்சியாகவும் இருங்கள்." : "No sugar test is scheduled today. Relax and enjoy your day."}</span>
                  </p>
                  
                  {monProgress.nextScheduled && monProgress.nextScheduled.date && (
                    <div className="pt-2 border-t border-slate-50 dark:border-slate-800/60 text-xxs font-bold text-slate-500">
                      <span>{isTamil ? "அடுத்த பரிசோதனை நாள்:" : "Next scheduled test:"}</span>
                      <span className="block text-slate-800 dark:text-white text-xs mt-0.5">
                        📅 {isTamil 
                          ? `${monProgress.nextScheduled.dayTa}, ${formatLocalDate(monProgress.nextScheduled.date)}`
                          : `${monProgress.nextScheduled.dayEn}, ${formatLocalDate(monProgress.nextScheduled.date)}`}
                      </span>
                    </div>
                  )}

                  {/* Unscheduled / Extra Reading logging option */}
                  <button 
                    onClick={() => navigate('/add')}
                    className="w-full mt-3 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold shadow-md transition-all active:scale-[0.99] text-xs flex items-center justify-center gap-1.5 min-h-[48px]"
                  >
                    <span>➕</span>
                    <span>{isTamil ? "சர்க்கரை அளவை பதிவு செய்யவும்" : "Add Sugar Reading"}</span>
                  </button>
                </div>
              )}

              {/* Scenario 2: Test scheduled today & INCOMPLETE (< 100%) */}
              {monProgress && monProgress.isScheduledToday && monProgress.completionPercent < 100 && (
                <div className="space-y-3.5">
                  <h3 className="text-xs font-black text-rose-500 dark:text-rose-455 uppercase tracking-wider">
                    🩸 {isTamil ? "இன்றைய சர்க்கரை பரிசோதனை" : "TODAY'S SUGAR CHECK"}
                  </h3>
                  
                  {isOverdue ? (
                    <div className="p-3 bg-rose-50 dark:bg-rose-955/20 border border-rose-100 rounded-xl flex items-start gap-2">
                      <span className="text-sm">⏰</span>
                      <p className="text-xs font-bold text-rose-600 dark:text-rose-450">
                        {isTamil ? "அட்டவணைப்படுத்தப்பட்ட சர்க்கரை பரிசோதனை நிலுவையில் உள்ளது. தயவுசெய்து இப்போது பதிவு செய்யவும்." : "Your scheduled sugar test is pending. Please record it now."}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm font-bold text-slate-800 dark:text-white flex items-start gap-1.5">
                      <span>🩸</span>
                      <span>{isTamil ? "இன்று உங்களுக்கு சர்க்கரை பரிசோதனை அட்டவணை உள்ளது. தயவுசெய்து படுக்கைக்கு முன் அவற்றை முடிக்கவும்." : "Today you have scheduled sugar tests. Please complete them before bedtime."}</span>
                    </p>
                  )}
                  
                  <p className="text-xxs font-bold text-slate-400 uppercase pt-1">
                    {isTamil ? "இவற்றை முடிக்கவும்:" : "Please complete these:"}
                  </p>

                  <div className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-205">
                    {monProgress.checklist.map((item) => (
                      <div key={item.type} className="flex items-center justify-between py-0.5">
                        <div className="flex items-center gap-2">
                          {item.checked ? (
                            <span className="text-emerald-500 font-bold">✅</span>
                          ) : (
                            <span className="text-slate-300">☐</span>
                          )}
                          <span className={item.checked ? 'text-slate-450 line-through' : ''}>
                            {t(`reading.types.${item.type}`)}
                          </span>
                        </div>
                        {item.checked && (
                          <span className="text-xxs font-black text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded">
                            {item.sugar} mg/dL ({item.time})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-50 dark:border-slate-800/80 pt-2 flex justify-between items-center text-xxs font-bold text-slate-500">
                    <span>{isTamil ? "முன்னேற்றம்:" : "Progress:"}</span>
                    <span className="text-slate-800 dark:text-white">{monProgress.checkedCount} / {monProgress.totalCount} {isTamil ? "முடிந்தது" : "Completed"}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${monProgress.completionPercent}%` }}
                    ></div>
                  </div>

                  {/* Start Test Button */}
                  <button
                    onClick={() => navigate('/add')}
                    className="w-full py-4.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/10 transition-all text-sm min-h-[52px]"
                  >
                    ➕ {isTamil ? "பரிசோதனையைத் தொடங்கு" : "Start Today's Test"}
                  </button>
                </div>
              )}

              {/* Scenario 3: Test scheduled today & COMPLETED (=== 100%) */}
              {monProgress && monProgress.isScheduledToday && monProgress.completionPercent === 100 && (
                <div className="text-center space-y-2.5 py-1">
                  <span className="text-3xl block">🎉</span>
                  <h3 className="text-sm font-heading font-black text-emerald-805 dark:text-emerald-450 uppercase tracking-wide">
                    {isTamil ? "அருமை அம்மா ❤️" : "Great Job Amma ❤️"}
                  </h3>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-350">
                    {isTamil ? "அருமை! இன்றைய சர்க்கரை பரிசோதனை அட்டவணையை முடித்துவிட்டீர்கள்." : "Excellent! You completed today's monitoring schedule."}
                  </p>
                  <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-450 mt-1">
                    {isTamil ? "🎉 இன்றைய சர்க்கரை கண்காணிப்பு வெற்றிகரமாக முடிந்தது. அருமையான வேலை!" : "🎉 Monitoring completed for today. Excellent work!"}
                  </p>
                  
                  {monProgress.nextScheduled && monProgress.nextScheduled.date && (
                    <div className="text-xxs font-bold text-slate-400 py-1">
                      <span>{isTamil ? "மீண்டும் சந்திப்போம்:" : "See you again on"}</span>
                      <span className="block text-slate-805 dark:text-white text-xs mt-0.5">
                        📅 {isTamil 
                          ? `${monProgress.nextScheduled.dayTa}, ${formatLocalDate(monProgress.nextScheduled.date)}`
                          : `${monProgress.nextScheduled.dayEn}, ${formatLocalDate(monProgress.nextScheduled.date)}`}
                      </span>
                    </div>
                  )}
                </div>
              )}

            </div>

            <div className="border-t border-emerald-150/40 dark:border-slate-800 my-3"></div>

            {/* Secondary Section: Health Reminders */}
            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-200 font-medium">
              <div className="flex items-start gap-2.5">
                <span className="text-sm">💧</span>
                <span>{isTamil ? "இன்று 2-2.5 லிட்டர் தண்ணீர் குடிக்கவும்." : "Drink 2–2.5 liters of water today."}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-sm">🚶</span>
                <span>{isTamil ? "இரவு உணவிற்கு பின் 20 நிமிடங்கள் நடக்கவும்." : "Walk for 20 minutes after dinner."}</span>
              </div>
              {reminders.length > 0 && (
                <div className="flex items-start gap-2.5">
                  <span className="text-sm">💊</span>
                  <span>{isTamil ? "மாத்திரைகளை சரியான நேரத்திற்கு உட்கொள்ளவும்." : "Don't forget your medicines."}</span>
                </div>
              )}
              <div className="flex items-start gap-2.5">
                <span className="text-sm">🍛</span>
                <span>{isTamil ? "இன்றைய உணவுப் பரிந்துரைகள் கீழே தயாராக உள்ளன." : "Today's healthy food menu is ready below."}</span>
              </div>
            </div>

          </div>

          {/* 🟢 Today's Sugar Card */}
          {hasData && summary?.latestReading ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 text-center space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">{isTamil ? 'இன்றைய சர்க்கரை அளவு' : "Today's Sugar"}</span>
              
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="text-6xl font-heading font-black text-slate-855 dark:text-white tracking-tight">
                  {latestSugar}
                </span>
                <span className="text-slate-400 font-bold text-lg">mg/dL</span>
              </div>

              <div className="flex items-center justify-center gap-2">
                <span className={`px-4 py-1.5 rounded-full border text-sm font-extrabold ${statusDetails.bg} ${statusDetails.color}`}>
                  {statusDetails.dot} {statusDetails.text}
                </span>
              </div>

              <div className="text-xxs font-bold text-slate-400 mt-1 flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{isTamil ? "பதிவு செய்யப்பட்ட நேரம்" : "Recorded at"} {summary.latestReading.readingTime}</span>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 text-center space-y-4">
              <span className="text-lg font-bold text-slate-700 dark:text-slate-200 block">{isTamil ? "சர்க்கரை அளவை பதிவு செய்யவில்லை" : "No glucose logged today"}</span>
              <p className="text-xs text-slate-400">{t('dashboard.noReadings')}</p>
            </div>
          )}

          
          {/* ❤️ How Are You Doing? (Amma View Only) */}
          {hasData && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-850 space-y-4">
              <h3 className="text-base font-heading font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                <span>❤️</span>
                <span>{isTamil ? "நலம் விசாரிக்கலாமா?" : "How Are You Doing?"}</span>
              </h3>

              {/* 1. Today's Average */}
              <div className="bg-slate-50 dark:bg-slate-850/40 p-4 rounded-2xl text-center space-y-1">
                <span className="text-xxs font-bold text-slate-400 uppercase tracking-wider">
                  {isTamil ? "இன்றைய சராசரி சர்க்கரை அளவு" : "Today's Average"}
                </span>
                <div className="text-2xl font-black text-slate-800 dark:text-white">
                  {actualTodayAvg !== null ? (
                    <span>{actualTodayAvg} <span className="text-xs text-slate-400 font-bold">mg/dL</span></span>
                  ) : (
                    <span className="text-sm font-semibold text-slate-400">{isTamil ? "போதுமான விவரங்கள் இல்லை." : "Not enough data yet."}</span>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-100 dark:border-slate-800/80 my-1"></div>

              {/* 2. Compared to Yesterday */}
              <div className="flex items-center justify-between py-1 text-xs">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800 dark:text-white">{isTamil ? "நேற்றுடன் ஒப்பிடுகையில்" : "Compared to Yesterday"}</span>
                  <span className="text-xxs text-slate-400 font-semibold">
                    {actualTodayAvg !== null && actualYesterdayAvg !== null ? (
                      (() => {
                        const diff = actualTodayAvg - actualYesterdayAvg;
                        if (diff > 0) return isTamil ? "நேற்றை விட சற்று அதிகம்" : "Slightly higher than yesterday.";
                        if (diff < 0) return isTamil ? "நேற்றை விட மேம்பட்டுள்ளது!" : "Better than yesterday.";
                        return isTamil ? "நேற்றைய அதே அளவு" : "Same as yesterday.";
                      })()
                    ) : (
                      isTamil ? "விவரங்கள் இல்லை" : "No comparison details"
                    )}
                  </span>
                </div>
                <div className="text-right">
                  {actualTodayAvg !== null && actualYesterdayAvg !== null ? (
                    (() => {
                      const diff = actualTodayAvg - actualYesterdayAvg;
                      return (
                        <span className={`font-extrabold text-sm ${diff <= 0 ? 'text-emerald-505' : 'text-rose-500'}`}>
                          {diff > 0 ? `↑ ${diff}` : diff < 0 ? `↓ ${Math.abs(diff)}` : '0'} mg/dL
                        </span>
                      );
                    })()
                  ) : (
                    <span className="text-xxs font-bold text-slate-400">{isTamil ? "போதுமான விவரங்கள் இல்லை." : "Not enough data yet."}</span>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-100 dark:border-slate-800/80 my-1"></div>

              {/* 3. Compared to Last Month */}
              <div className="flex items-center justify-between py-1 text-xs">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-850 dark:text-white">{isTamil ? "கடந்த மாதத்துடன் ஒப்பிடுகையில்" : "Compared to Last Month"}</span>
                  <span className="text-xxs text-slate-400 font-semibold">
                    {thisMonthAvg > 0 && lastMonthAvg > 0 ? (
                      (() => {
                        const diff = thisMonthAvg - lastMonthAvg;
                        if (diff < 0) return isTamil ? "சிறந்த முன்னேற்றம் 🎉" : "Great Improvement 🎉";
                        if (diff > 0) return isTamil ? "கடந்த மாதத்தை விட சற்று அதிகம்" : "Slightly higher than last month.";
                        return isTamil ? "கடந்த மாதத்தின் அதே அளவு" : "Same as last month.";
                      })()
                    ) : (
                      isTamil ? "விவரங்கள் இல்லை" : "No comparison details"
                    )}
                  </span>
                </div>
                <div className="text-right">
                  {thisMonthAvg > 0 && lastMonthAvg > 0 ? (
                    (() => {
                      const diff = thisMonthAvg - lastMonthAvg;
                      return (
                        <span className={`font-extrabold text-sm ${diff <= 0 ? 'text-emerald-505' : 'text-rose-500'}`}>
                          {diff > 0 ? `↑ ${diff}` : diff < 0 ? `↓ ${Math.abs(diff)}` : '0'} mg/dL
                        </span>
                      );
                    })()
                  ) : (
                    <span className="text-xxs font-bold text-slate-400">{isTamil ? "போதுமான விவரங்கள் இல்லை." : "Not enough data yet."}</span>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-100 dark:border-slate-800/80 my-1"></div>

              {/* 4. Friendly Health Message */}
              <div className="p-4 bg-emerald-50/20 dark:bg-emerald-955/10 rounded-2xl border border-emerald-100/30">
                {(() => {
                  let alertText = "";
                  let alertEmoji = "❤️";
                  let alertColor = "text-emerald-600 dark:text-emerald-450";

                  if (actualTodayAvg && actualTodayAvg > targetMax + 40) {
                    alertEmoji = "🔴";
                    alertColor = "text-rose-600 dark:text-rose-400";
                    alertText = isTamil 
                      ? "கடந்த சில நாட்களாக உங்கள் சர்க்கரை அளவு வழக்கத்தை விட அதிகமாக உள்ளது. மருத்துவரின் அறிவுரையைத் தொடர்ந்து பின்பற்றுங்கள். இது தொடர்ந்தால், மருத்துவரை அணுகவும்."
                      : "Your sugar has been higher than usual for the last few days. Please continue following your doctor's advice. If this pattern continues, consider contacting your healthcare provider.";
                  } else if (actualTodayAvg && actualYesterdayAvg && actualTodayAvg > actualYesterdayAvg) {
                    alertEmoji = "🟡";
                    alertColor = "text-amber-600 dark:text-amber-400";
                    alertText = isTamil
                      ? "இன்றைய சராசரி நேற்றை விட சற்று அதிகம். தொடர்ந்து ஆரோக்கியமான உணவுகளை உட்கொள்ளுங்கள்."
                      : "Today's average is slightly higher than yesterday. Continue eating healthy foods.";
                  } else if (thisMonthAvg > 0 && lastMonthAvg > 0 && thisMonthAvg < lastMonthAvg) {
                    alertEmoji = "🟢";
                    alertColor = "text-emerald-600 dark:text-emerald-400";
                    alertText = isTamil
                      ? "சிறந்த முன்னேற்றம்! கடந்த மாதத்தை விட உங்கள் சர்க்கரை அளவு மேம்பட்டுள்ளது."
                      : "Great progress! Your sugar is improving compared to last month.";
                  } else {
                    alertEmoji = "❤️";
                    alertColor = "text-emerald-650 dark:text-emerald-400";
                    alertText = isTamil
                      ? "ஆரோக்கியமான உணவுகளை உட்கொண்டு, சர்க்கரை அளவைத் தொடர்ந்து பரிசோதனை செய்யுங்கள்."
                      : "Keep eating healthy and continue checking your sugar regularly.";
                  }

                  return (
                    <div className="flex gap-2">
                      <span className="text-base">{alertEmoji}</span>
                      <p className={`text-xxs font-bold leading-relaxed ${alertColor}`}>
                        {alertText}
                      </p>
                    </div>
                  );
                })()}
              </div>

            </div>
          )}

          {/* 🍛 Today's Healthy Food Plan */}
          {foodPlan && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-850 space-y-4">
              <h3 className="text-base font-heading font-extrabold text-slate-850 dark:text-white flex items-center gap-2 border-b pb-2">
                <span>🍛</span>
                <span>{isTamil ? "இன்றைய உணவுப் பரிந்துரை" : "Today's Healthy Food Plan"}</span>
              </h3>

              <div className="space-y-4 pt-1">
                {[
                  { label: isTamil ? "🍳 காலை உணவு" : "🍳 Breakfast", value: foodPlan.breakfast },
                  { label: isTamil ? "🍎 முற்பகல் பழம்" : "🍎 Mid Morning Fruit", value: foodPlan.midMorning },
                  { label: isTamil ? "🍛 மதிய உணவு" : "🍛 Lunch", value: foodPlan.lunch },
                  { label: isTamil ? "☕ மாலை சிற்றுண்டி" : "☕ Evening Snack", value: foodPlan.snack },
                  { label: isTamil ? "🌙 இரவு உணவு" : "🌙 Dinner", value: foodPlan.dinner }
                ].map((meal, index) => (
                  <div key={index} className="flex flex-col border-b border-slate-50 dark:border-slate-850 pb-2.5 last:border-b-0 last:pb-0">
                    <span className="text-xxs font-bold text-slate-400 uppercase tracking-wider">{meal.label}</span>
                    <span className="text-sm font-bold text-slate-750 dark:text-slate-200 mt-0.5 leading-relaxed">{meal.value}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-emerald-50/20 dark:bg-slate-800 border border-emerald-100/30 rounded-xl mt-4">
                <p className="text-xxs font-bold text-slate-500 dark:text-slate-300 flex items-start gap-1 leading-relaxed">
                  <AlertCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>{foodPlan.tip}</span>
                </p>
              </div>
            </div>
          )}

          {/* 💊 Medicine Reminder */}
          {reminders.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-850 space-y-4">
              <h3 className="text-base font-heading font-extrabold text-slate-805 dark:text-white flex items-center gap-2">
                <span>💊</span>
                <span>{t('extra.remindersTitle')}</span>
              </h3>

              <div className="space-y-3">
                {reminders.map((rem) => (
                  <div key={rem.id} className="p-3.5 bg-rose-50/15 dark:bg-slate-850/60 rounded-2xl border border-rose-100/20 flex justify-between items-center shadow-xxs">
                    <div>
                      <span className="font-extrabold text-sm text-slate-800 dark:text-white block">{rem.medName}</span>
                      <span className="text-xxs text-slate-400 font-semibold">{rem.dosage}</span>
                    </div>
                    <span className="px-3 py-1 bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-400 font-black text-xs rounded-xl">
                      🕒 {rem.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 🚶 Today's Activity & 😊 Health Tip */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-855 space-y-4">
            <h3 className="text-base font-heading font-extrabold text-slate-805 dark:text-white flex items-center gap-2 border-b pb-2">
              <span>🚶</span>
              <span>{isTamil ? "இன்றைய செயல்பாடு" : "Activity & Health Tip"}</span>
            </h3>

            <div className="space-y-4 text-sm text-slate-700 dark:text-slate-250">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-955/20 flex items-center justify-center text-emerald-500">
                  <Footprints className="w-5.5 h-5.5" />
                </div>
                <div>
                  <span className="text-xxs font-bold text-slate-400 block">{isTamil ? "நடக்கும் இலக்கு" : "Walking Goal"}</span>
                  <span className="font-extrabold text-slate-750 dark:text-white">{isTamil ? "இரவு உணவிற்கு பின் 20 நிமிடங்கள்" : "Walk for 20 minutes after dinner"}</span>
                </div>
              </div>

              {foodPlan && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-955/20 flex items-center justify-center text-amber-500 flex-shrink-0">
                    <Smile className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <span className="text-xxs font-bold text-slate-400 block">{t('dashboard.motivation.title')}</span>
                    <p className="font-semibold text-slate-700 dark:text-slate-300 leading-relaxed mt-0.5">{foodPlan.tip.replace("⚠️", "")}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 📖 Recent Sugar Records */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-850 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-base font-heading font-extrabold text-slate-800 dark:text-white">{t('dashboard.recentLogs')}</h3>
              <Link to="/history" className="text-xs font-bold text-emerald-500 flex items-center gap-0.5">Show all <ChevronRight className="w-4 h-4" /></Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-850">
              {allReadings.slice(0, 5).map((r) => {
                const details = getGlucoseStatusDetails(r.bloodSugar);
                return (
                  <div key={r.id} className="py-3 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-700 dark:text-slate-205">{formatLocalDate(r.readingDate)} | {r.readingTime}</span>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mt-0.5">{t(`reading.types.${r.readingType}`, { defaultValue: r.readingType })}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-slate-850 dark:text-white">{r.bloodSugar} mg/dL</span>
                      <span>{details.dot}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ==================================================== */}
      {/* 👨 CAREGIVER VIEW (VENKAT ANALYTICS LAYOUT)          */}
      {/* ==================================================== */}
      {familyView === 'caregiver' && (
        <div className="space-y-6">
          
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h1 className="text-2xl font-heading font-extrabold text-slate-800 dark:text-white">Dashboard Overview</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Clinical summary indices and diagnostic trackers</p>
            </div>
            <button
              onClick={() => navigate('/add')}
              className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-md flex items-center gap-1 text-xs"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>Log Sugar</span>
            </button>
          </div>

          {/* 📅 Caregiver Monitoring Plan Adherence Tracker Card */}
          {monProgress && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5 border-b pb-2">
                <Calendar className="w-4.5 h-4.5 text-emerald-500" />
                <span>Monitoring Plan Adherence</span>
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-850 border rounded-xl text-center">
                  <span className="text-[9px] font-bold text-slate-450 block mb-0.5">Completion This Month</span>
                  <span className="text-lg font-black text-slate-800 dark:text-white block">
                    {monProgress.adherence.completedDays} / {monProgress.adherence.totalScheduledDays}
                  </span>
                </div>
                
                <div className="p-3 bg-slate-50 dark:bg-slate-850 border rounded-xl text-center">
                  <span className="text-[9px] font-bold text-slate-450 block mb-0.5">Adherence Rate</span>
                  <span className="text-lg font-black text-emerald-650 block">
                    {monProgress.adherence.rate}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xxs font-bold text-slate-450 pt-1">
                <span className="uppercase">Plan consistency status:</span>
                <span className={`px-2 py-0.5 rounded ${monProgress.adherence.rate >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {getAdherenceFeedback(monProgress.adherence.rate)}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-850">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Latest Glucose</span>
              <div className="text-xl font-heading font-black text-slate-805 dark:text-white mt-1">
                {latestSugar} <span className="text-xxs font-semibold text-slate-400">mg/dL</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Status: {statusDetails.text}</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-850">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Weekly Average</span>
              <div className="text-xl font-heading font-black text-slate-805 dark:text-white mt-1">
                {summary?.weeklyAvg} <span className="text-xxs font-semibold text-slate-400">mg/dL</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Past 7 days records</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-850">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Monthly Average</span>
              <div className="text-xl font-heading font-black text-slate-805 dark:text-white mt-1">
                {summary?.monthlyAvg} <span className="text-xxs font-semibold text-slate-400">mg/dL</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Past 30 days averages</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-850">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Estimated HbA1c</span>
              <div className="text-xl font-heading font-black text-slate-805 dark:text-white mt-1">
                {summary?.hba1c} <span className="text-xxs font-semibold text-slate-400">%</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">3-Month average estimate</span>
            </div>
          </div>

          {weeklyChart.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-850 dark:text-white">Recent Checks Trend (mg/dL)</h3>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyChart} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSugarDashboardCaregiver" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-850" />
                    <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="sugar" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSugarDashboardCaregiver)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-4">
              <h4 className="font-bold text-xs text-slate-800 dark:text-white flex items-center gap-1.5"><Activity className="w-4 h-4 text-emerald-500" /> Reading types and targets</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-55 dark:bg-slate-850 border rounded-xl text-center">
                  <span className="text-[9px] font-bold text-slate-400 block mb-0.5">Overall Target Range</span>
                  <span className="font-extrabold">{targetMin} - {targetMax} mg/dL</span>
                </div>
                <div className="p-3 bg-slate-55 dark:bg-slate-850 border rounded-xl text-center">
                  <span className="text-[9px] font-bold text-slate-400 block mb-0.5">Check Streak</span>
                  <span className="font-extrabold">{summary?.streak} Days</span>
                </div>
                <div className="p-3 bg-slate-55 dark:bg-slate-850 border rounded-xl text-center">
                  <span className="text-[9px] font-bold text-slate-400 block mb-0.5">Fasting Average</span>
                  <span className="font-extrabold text-emerald-650">{summary?.avgFasting} mg/dL</span>
                </div>
                <div className="p-3 bg-slate-55 dark:bg-slate-850 border rounded-xl text-center">
                  <span className="text-[9px] font-bold text-slate-400 block mb-0.5">Post Meal Average</span>
                  <span className="font-extrabold text-blue-600">{summary?.avgPostMeal} mg/dL</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-3">
              <h4 className="font-bold text-xs text-slate-805 dark:text-white">Reading Categories Distribution</h4>
              <div className="space-y-1.5 text-xxs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-emerald-600">🟢 Within Target ({targetMin}-{targetMax})</span>
                  <span className="font-bold">{summary?.categories.green} logs</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-amber-600">🟡 Slightly High ({targetMax + 1}-{targetMax + 40})</span>
                  <span className="font-bold">{summary?.categories.yellow} logs</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-rose-600">🟠 High (&gt;{targetMax + 40})</span>
                  <span className="font-bold">{summary?.categories.orange} logs</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-rose-700">🔴 Critical (&lt;{targetMin})</span>
                  <span className="font-bold">{summary?.categories.red} logs</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
export default Dashboard;
