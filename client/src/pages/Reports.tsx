import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Clock, Calendar, Info, ChevronLeft, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

export const Reports: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'>('monthly');
  const [startDate, setStartDate] = useState(() => dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(() => dayjs().format('YYYY-MM-DD'));
  const [readingType, setReadingType] = useState('');

  const handlePeriodChange = (type: 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom') => {
    setPeriod(type);
    const today = dayjs();
    
    if (type === 'weekly') {
      setStartDate(today.subtract(7, 'day').format('YYYY-MM-DD'));
      setEndDate(today.format('YYYY-MM-DD'));
    } else if (type === 'monthly') {
      setStartDate(today.subtract(30, 'day').format('YYYY-MM-DD'));
      setEndDate(today.format('YYYY-MM-DD'));
    } else if (type === 'quarterly') {
      setStartDate(today.subtract(90, 'day').format('YYYY-MM-DD'));
      setEndDate(today.format('YYYY-MM-DD'));
    } else if (type === 'yearly') {
      setStartDate(today.subtract(365, 'day').format('YYYY-MM-DD'));
      setEndDate(today.format('YYYY-MM-DD'));
    }
  };

  const getQueryString = () => {
    const params = new URLSearchParams();
    params.append('startDate', startDate);
    params.append('endDate', endDate);
    if (readingType) {
      params.append('readingType', readingType);
    }
    params.append('lang', i18n.language.startsWith('ta') ? 'ta' : 'en');
    return params.toString();
  };

  const downloadReport = (format: 'pdf' | 'excel' | 'csv') => {
    const qStr = getQueryString();
    window.open(`/api/export/${format}?${qStr}`, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-fade-in pb-20">
      
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
            {t('reports.title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {t('reports.subtitle')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        
        {/* Period selection */}
        <div className="md:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
          <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-1.5 border-b pb-2">
            <Clock className="w-5 h-5 text-emerald-500" />
            <span>{t('nav.dashboard') === 'முகப்பு' ? 'கால அளவு' : 'Select Period'}</span>
          </h2>

          <div className="flex flex-col gap-2">
            {[
              { id: 'weekly', label: t('reports.weekly') },
              { id: 'monthly', label: t('reports.monthly') },
              { id: 'quarterly', label: t('reports.quarterly') },
              { id: 'yearly', label: t('reports.yearly') },
              { id: 'custom', label: t('reports.custom') }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handlePeriodChange(p.id as any)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${period === p.id ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/50' : 'text-slate-600 dark:text-slate-355 hover:bg-slate-50'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Configurations panel */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
          <h2 className="text-lg font-heading font-bold text-slate-800 dark:text-white flex items-center gap-1.5 border-b pb-3">
            <Calendar className="w-5 h-5 text-emerald-500" />
            <span>{t('nav.dashboard') === 'முகப்பு' ? 'அறிக்கை விருப்பங்கள்' : 'Report Options'}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1.5">{t('nav.dashboard') === 'முகப்பு' ? 'துவக்க தேதி' : 'Start Date'}</label>
              <input
                type="date"
                disabled={period !== 'custom'}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border dark:bg-slate-800 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-355 mb-1.5">{t('nav.dashboard') === 'முகப்பு' ? 'முடிவு தேதி' : 'End Date'}</label>
              <input
                type="date"
                disabled={period !== 'custom'}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border dark:bg-slate-800 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-355 mb-1.5">{t('reading.type')}</label>
            <select
              value={readingType}
              onChange={(e) => setReadingType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border dark:bg-slate-800 text-sm focus:outline-none"
            >
              <option value="">{t('history.filterType')}</option>
              <option value="fasting">{t('reading.types.fasting')}</option>
              <option value="before_breakfast">{t('reading.types.before_breakfast')}</option>
              <option value="after_breakfast">{t('reading.types.after_breakfast')}</option>
              <option value="before_lunch">{t('reading.types.before_lunch')}</option>
              <option value="after_lunch">{t('reading.types.after_lunch')}</option>
              <option value="before_dinner">{t('reading.types.before_dinner')}</option>
              <option value="after_dinner">{t('reading.types.after_dinner')}</option>
              <option value="bedtime">{t('reading.types.bedtime')}</option>
              <option value="random">{t('reading.types.random')}</option>
            </select>
          </div>

          <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl flex items-start gap-2.5 text-xs text-slate-500">
            <Info className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span>
              {t('nav.dashboard') === 'முகப்பு' 
                ? 'மதிப்பிடப்பட்ட HbA1c, சராசரி சர்க்கரை அளவுகள் மற்றும் உங்களது அட்டவணையை உள்ளடக்கிய PDF மற்றும் Excel கோப்புகளைப் பதிவிறக்கி மருத்துவரிடம் எளிதாகப் பகிரலாம்.'
                : 'Generates clinical graphs, HbA1c projections, and daily table lists to share with your family doctor.'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
            <button
              onClick={() => downloadReport('pdf')}
              className="py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-md flex items-center justify-center gap-2 text-sm transition-colors"
            >
              <FileText className="w-4.5 h-4.5" />
              <span>{t('reports.downloadPdf')}</span>
            </button>

            <button
              onClick={() => downloadReport('excel')}
              className="py-3 px-4 border hover:bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-colors"
            >
              <Download className="w-4.5 h-4.5 text-emerald-500" />
              <span>{t('reports.downloadExcel')}</span>
            </button>

            <button
              onClick={() => downloadReport('csv')}
              className="py-3 px-4 border hover:bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-colors"
            >
              <Download className="w-4.5 h-4.5 text-slate-400" />
              <span>{t('reports.downloadCsv')}</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
export default Reports;
