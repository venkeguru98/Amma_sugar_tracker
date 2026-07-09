import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  TrendingUp, BarChart3, Calendar, Heart, Award, AlertCircle, ChevronLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DeepStats {
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  hba1c: number;
  consistencyScore: number;
  daysMissed: number;
}

export const Analytics: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  
  // Analytics Metrics States
  const [stats, setStats] = useState<DeepStats | null>(null);
  const [averages, setAverages] = useState<{ fasting: number; postMeal: number } | null>(null);
  const [bestMonth, setBestMonth] = useState<any>(null);
  const [worstMonth, setWorstMonth] = useState<any>(null);
  const [timeOfDayAnalysis, setTimeOfDayAnalysis] = useState<any[]>([]);
  const [distribution, setDistribution] = useState<any[]>([]);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [rolling, setRolling] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any[]>([]);

  // Filter dates
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchDeepAnalytics();
  }, [startDate, endDate]);

  const fetchDeepAnalytics = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const res = await axios.get('/api/analytics/deep', { params });
      if (res.data.hasData) {
        setStats(res.data.stats);
        setAverages(res.data.averages);
        setBestMonth(res.data.bestMonth);
        setWorstMonth(res.data.worstMonth);
        setTimeOfDayAnalysis(res.data.timeOfDayAnalysis);
        setDistribution(res.data.distribution);
        setHeatmap(res.data.heatmap);
        setRolling(res.data.rolling);
        setForecast(res.data.forecast);
        setHasData(true);
      } else {
        setHasData(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTranslatedTimeOfDay = (name: string) => {
    return t(`analytics.tod.${name}`, { defaultValue: name });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <div className="h-12 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
        <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  // Localized Time Of Day averages for charts
  const localizedTimeOfDay = timeOfDayAnalysis.map((item) => ({
    name: getTranslatedTimeOfDay(item.name),
    avg: item.avg
  }));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fade-in pb-20">
      
      {/* Header */}
      <div className="flex items-center gap-2 border-b pb-4">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 hover:bg-slate-105 rounded-lg text-slate-500 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-slate-800 dark:text-white">
            {t('analytics.title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {t('analytics.subtitle')}
          </p>
        </div>
      </div>

      {/* Date Filter */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div>
          <label className="block text-xxs font-bold text-slate-450 uppercase mb-1">
            {t('nav.dashboard') === 'முகப்பு' ? 'துவக்க தேதி' : 'Start Date'}
          </label>
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
            className="px-3 py-1.5 border rounded-lg dark:bg-slate-800 text-xs focus:outline-none" 
          />
        </div>
        <div>
          <label className="block text-xxs font-bold text-slate-455 uppercase mb-1">
            {t('nav.dashboard') === 'முகப்பு' ? 'முடிவு தேதி' : 'End Date'}
          </label>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
            className="px-3 py-1.5 border rounded-lg dark:bg-slate-800 text-xs focus:outline-none" 
          />
        </div>
        <button 
          onClick={() => { setStartDate(''); setEndDate(''); }} 
          className="mt-4 px-3 py-1.5 text-xs font-bold text-rose-500 hover:bg-rose-55 rounded-lg"
        >
          {t('reading.cancel')}
        </button>
      </div>

      {!hasData || !stats ? (
        <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100">
          <AlertCircle className="w-12 h-12 text-slate-350 mx-auto" />
          <p className="text-slate-450 mt-2">
            {t('nav.dashboard') === 'முகப்பு' ? 'மதிப்பீடு செய்ய பதிவுகள் எதுவும் இல்லை.' : 'No checks logged to calculate advanced stats.'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Main KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase">{t('analytics.median')}</span>
              <div className="text-3xl font-heading font-extrabold text-slate-800 dark:text-white mt-1">
                {stats.median} <span className="text-sm font-medium text-slate-450">mg/dL</span>
              </div>
              <div className="text-xxs text-slate-455 mt-2 border-t pt-2 flex justify-between">
                <span>{t('analytics.stdDev')}</span>
                <span className="font-bold text-slate-705 dark:text-slate-300">± {stats.stdDev} mg/dL</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase">{t('dashboard.journey.thisMonthAvg') === 'இந்த மாத சராசரி' ? '3-மாத சராசரி (A1c)' : '3-Month Average (A1c)'}</span>
              <div className="text-3xl font-heading font-extrabold text-slate-800 dark:text-white mt-1">
                {stats.hba1c} <span className="text-sm font-medium text-slate-450">%</span>
              </div>
              <div className="text-xxs text-slate-455 mt-2 border-t pt-2 flex justify-between">
                <span>{t('nav.dashboard') === 'முகப்பு' ? 'சராசரி சர்க்கரை' : 'Mean Glucose'}</span>
                <span className="font-bold text-slate-705 dark:text-slate-300">{stats.mean} mg/dL</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase">{t('analytics.consistency')}</span>
              <div className="text-3xl font-heading font-extrabold text-slate-800 dark:text-white mt-1">
                {stats.consistencyScore} <span className="text-sm font-medium text-slate-450">%</span>
              </div>
              <div className="text-xxs text-slate-455 mt-2 border-t pt-2 flex justify-between">
                <span>{t('analytics.daysMissed')}</span>
                <span className="font-bold text-slate-705 dark:text-slate-300">{stats.daysMissed} {t('dashboard.days')}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase">{t('nav.dashboard') === 'முகப்பு' ? 'வெறும் வயிறு vs உணவிற்கு பின்' : 'Fasting vs Post Meal'}</span>
              <div className="space-y-1.5 mt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-450">{t('reading.types.fasting')}</span>
                  <span className="font-bold text-emerald-600">{averages?.fasting || 0} mg/dL</span>
                </div>
                <div className="flex justify-between text-xs pt-1 border-t">
                  <span className="text-slate-455">{t('nav.dashboard') === 'முகப்பு' ? 'உணவிற்கு பின் சராசரி' : 'Post Meal Average'}</span>
                  <span className="font-bold text-blue-600">{averages?.postMeal || 0} mg/dL</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rolling average */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <span>{t('analytics.rollingAvg')}</span>
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={rolling} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                  <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="transparent" name={t('nav.dashboard') === 'முகப்பு' ? 'சர்க்கரை அளவு' : 'Actual Glucose'} />
                  <Area type="monotone" dataKey="movingAvg" stroke="#10b981" strokeWidth={3} fill="transparent" name={t('analytics.rollingAvg')} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Projections */}
          {forecast.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-850 dark:text-white flex items-center gap-1.5">
                <Award className="w-5 h-5 text-amber-500" />
                <span>{t('analytics.forecast')}</span>
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecast} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-850" />
                    <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="sugar" stroke="#f59e0b" strokeWidth={3} fillOpacity={0.1} fill="#f59e0b" name={t('nav.dashboard') === 'முகப்பு' ? 'கணிக்கப்பட்ட அளவு' : 'Projected Sugar'} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Distribution list & Radar angles */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1"><BarChart3 className="w-4 h-4 text-emerald-500" /> {t('analytics.distribution')}</h4>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distribution}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="range" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" radius={[3, 3, 0, 0]} name={t('nav.dashboard') === 'முகப்பு' ? 'பதிவுகளின் எண்ணிக்கை' : 'Logs Count'} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1"><Heart className="w-4 h-4 text-rose-500" /> {t('analytics.todAnalysis')} (mg/dL)</h4>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={localizedTimeOfDay}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis domain={[0, 200]} />
                    <Radar name={t('nav.dashboard') === 'முகப்பு' ? 'சராசரி அளவு' : 'Avg Sugar'} dataKey="avg" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Heatmap calendar */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <span>{t('analytics.heatmapTitle')}</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {heatmap.slice(-30).map((day, idx) => {
                const level = day.count === 1 ? 'opacity-40 bg-emerald-500' : day.count === 2 ? 'opacity-70 bg-emerald-500' : day.count >= 3 ? 'opacity-100 bg-emerald-600' : 'bg-slate-100 dark:bg-slate-800';
                return (
                  <div
                    key={idx}
                    title={`${day.date}: ${day.count} checks (avg: ${day.avgSugar} mg/dL)`}
                    className={`w-7 h-7 rounded-md flex items-center justify-center text-[9px] font-bold text-slate-700 dark:text-slate-350 cursor-pointer ${level}`}
                  >
                    {day.date.substring(8)}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
export default Analytics;
