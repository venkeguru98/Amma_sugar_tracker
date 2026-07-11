import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Calendar as CalendarIcon, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAuth } from '../contexts/AuthContext';

interface DailyLog {
  date: string;
  count: number;
  avgSugar: number;
  readings: any[];
}

export const CalendarView: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const targetMin = user?.targetMin ?? 70;
  const targetMax = user?.targetMax ?? 140;

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

  const [currentDate, setCurrentDate] = useState(() => dayjs());
  const [logsMap, setLogsMap] = useState<Record<string, DailyLog>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMonthLogs();
  }, [currentDate]);

  const fetchMonthLogs = async () => {
    try {
      setLoading(true);
      const startOfMonth = currentDate.startOf('month').format('YYYY-MM-DD');
      const endOfMonth = currentDate.endOf('month').format('YYYY-MM-DD');
      const res = await axios.get('/api/analytics/deep', {
        params: { startDate: startOfMonth, endDate: endOfMonth }
      });
      
      const heatmap: any[] = res.data.heatmap || [];
      const map: Record<string, DailyLog> = {};
      heatmap.forEach((day) => {
        map[day.date] = {
          date: day.date,
          count: day.count,
          avgSugar: day.avgSugar,
          readings: day.readings || []
        };
      });
      setLogsMap(map);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const days: dayjs.Dayjs[] = [];
    const firstDay = currentDate.startOf('month');
    const startOffset = firstDay.day();

    for (let i = 0; i < startOffset; i++) {
      days.push(null as any);
    }

    const totalDays = currentDate.daysInMonth();
    for (let i = 1; i <= totalDays; i++) {
      days.push(currentDate.date(i));
    }

    return days;
  };

  const prevMonth = () => {
    setCurrentDate(currentDate.subtract(1, 'month'));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(currentDate.add(1, 'month'));
    setSelectedDate(null);
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

  const getMonthHeader = () => {
    const locale = i18n.language.startsWith('ta') ? 'ta-IN' : 'en-US';
    return currentDate.toDate().toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long'
    });
  };

  const days = getDaysInMonth();
  const weekdays = i18n.language.startsWith('ta')
    ? ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const selectedDayLog = selectedDate ? logsMap[selectedDate] : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-fade-in pb-20">
      
      {/* Header */}
      <div className="flex items-center gap-2 border-b pb-4">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 hover:bg-slate-105 rounded-lg text-slate-500 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-3xl font-heading font-extrabold text-slate-800 dark:text-white">
          {t('calendar.title')}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="text-xl font-bold font-heading text-slate-800 dark:text-white capitalize">
              {getMonthHeader()}
            </h3>
            
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-2 border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-805"><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={nextMonth} className="p-2 border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-805"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center">
            {weekdays.map((w) => (
              <div key={w} className="text-xxs font-bold text-slate-400 uppercase tracking-wider py-1 truncate">{w}</div>
            ))}

            {loading ? (
              <div className="col-span-7 py-20 text-slate-400 font-bold">...</div>
            ) : (
              days.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} className="aspect-square"></div>;
                const formattedDate = day.format('YYYY-MM-DD');
                const log = logsMap[formattedDate];

                let cellColor = 'bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 border-slate-100 dark:border-slate-800';
                if (log && log.count > 0) {
                  if (log.avgSugar < 70) {
                    cellColor = 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-955/20 dark:border-rose-900';
                  } else if (log.avgSugar <= 140) {
                    cellColor = 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-955/20 dark:border-emerald-900';
                  } else if (log.avgSugar <= 180) {
                    cellColor = 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-955/20 dark:border-amber-900';
                  } else {
                    cellColor = 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-955/20 dark:border-rose-900';
                  }
                }

                const isSelected = selectedDate === formattedDate;

                return (
                  <button
                    key={formattedDate}
                    onClick={() => setSelectedDate(formattedDate)}
                    className={`aspect-square border rounded-xl flex flex-col items-center justify-between p-1.5 transition-all text-sm font-bold relative ${cellColor} ${isSelected ? 'ring-4 ring-emerald-555/30 border-emerald-500 scale-95 shadow-md' : ''}`}
                  >
                    <span className="self-start text-[10px] opacity-60">{day.date()}</span>
                    {log && log.count > 0 && (
                      <span className="text-xs font-black">{Math.round(log.avgSugar)}</span>
                    )}
                    {log && log.count > 0 && (
                      <span className="text-[9px] opacity-40 uppercase tracking-widest">{log.count} pts</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Selected date readings list */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <h4 className="font-heading font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5 border-b pb-2">
            <CalendarIcon className="w-5 h-5 text-emerald-500" />
            <span>{t('calendar.title')}</span>
          </h4>

          {!selectedDate ? (
            <div className="py-20 text-center text-slate-400 text-sm">
              {t('nav.dashboard') === 'முகப்பு' ? 'தேதியைத் தேர்ந்தெடுக்கவும்' : 'Tap a date to view readings list'}
            </div>
          ) : !selectedDayLog || selectedDayLog.readings.length === 0 ? (
            <div className="space-y-4 text-center py-10">
              <span className="text-sm font-bold text-slate-600 block">{formatLocalDate(selectedDate)}</span>
              <p className="text-xs text-slate-400">{t('calendar.emptyDay')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-bold text-slate-455 border-b pb-2">
                <span>{formatLocalDate(selectedDate)}</span>
                <span className="text-emerald-600">Avg: {Math.round(selectedDayLog.avgSugar)} mg/dL</span>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {selectedDayLog.readings.map((r, i) => {
                  const status = getGlucoseStatusDetails(r.bloodSugar);
                  const isTa = i18n.language.startsWith('ta');
                  return (
                    <div key={i} className="p-3.5 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800/60 rounded-2xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xxs uppercase tracking-wider font-extrabold bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-lg text-slate-700 dark:text-slate-300">
                          {t(`reading.types.${r.readingType}`, { defaultValue: r.readingType })}
                        </span>
                        <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {r.readingTime}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="text-base font-extrabold text-slate-850 dark:text-white flex items-baseline gap-0.5">
                          <span>{r.bloodSugar}</span>
                          <span className="text-xxs font-normal text-slate-400">mg/dL</span>
                        </div>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border flex items-center gap-1 ${status.bg} ${status.color}`}>
                          <span>{status.dot}</span>
                          <span>{status.text}</span>
                        </span>
                      </div>

                      {r.medicineTaken && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-450 block font-bold mt-1">
                          💊 {r.medicineName || (isTa ? "பரிந்துரைக்கப்பட்ட மருந்து" : "Prescribed medicine")}
                        </span>
                      )}

                      {r.symptoms && (
                        <p className="text-[10px] text-rose-600 dark:text-rose-455 font-bold mt-1 border-t dark:border-slate-800/80 pt-1 flex items-start gap-1">
                          <span>⚠️</span>
                          <span>{isTa ? "அறிகுறிகள்:" : "Symptoms:"} {r.symptoms}</span>
                        </p>
                      )}

                      {r.mealNotes && (
                        <p className="text-xxs text-slate-550 dark:text-slate-400 italic mt-1 border-t dark:border-slate-800/80 pt-1">
                          "{r.mealNotes}"
                        </p>
                      )}

                      {r.remarks && (
                        <p className="text-xxs text-slate-500 dark:text-slate-450 italic mt-1 border-t dark:border-slate-800/80 pt-1">
                          {isTa ? "குறிப்புகள்:" : "Remarks:"} "{r.remarks}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
export default CalendarView;
