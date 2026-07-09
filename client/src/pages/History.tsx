import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Trash2, Edit3, Printer, FileSpreadsheet, FileDown, Eye, X, ChevronLeft
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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

const getReadingTypeBadgeClass = (type: string) => {
  switch (type) {
    case 'fasting':
      return 'bg-emerald-50 dark:bg-emerald-955/20 text-emerald-700 dark:text-emerald-400 border-emerald-100/60';
    case 'before_breakfast':
    case 'before_lunch':
    case 'before_dinner':
      return 'bg-blue-50 dark:bg-blue-955/20 text-blue-750 dark:text-blue-400 border-blue-105';
    case 'after_breakfast':
    case 'after_lunch':
    case 'after_dinner':
      return 'bg-amber-50 dark:bg-amber-955/20 text-amber-700 dark:text-amber-450 border-amber-100';
    case 'bedtime':
      return 'bg-purple-50 dark:bg-purple-955/20 text-purple-700 dark:text-purple-400 border-purple-105';
    default:
      return 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-350 border-slate-205';
  }
};

export const History: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isTamil = i18n.language.startsWith('ta');

  const [readings, setReadings] = useState<Reading[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sugarRangeFilter, setSugarRangeFilter] = useState('');

  // Pagination / Sort State
  const [page, setPage] = useState(1);
  const [limit] = useState(12);

  // Details Modal
  const [selectedReading, setSelectedReading] = useState<Reading | null>(null);

  // Selected view
  const familyView = localStorage.getItem('family_view') || 'amma';

  useEffect(() => {
    fetchReadings();
  }, [search, typeFilter, sugarRangeFilter, page]);

  const fetchReadings = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit,
        sortBy: 'readingDate',
        sortOrder: 'desc'
      };
      if (search) params.search = search;
      if (typeFilter) params.readingType = typeFilter;
      if (sugarRangeFilter) params.sugarRange = sugarRangeFilter;

      const res = await axios.get('/api/reading', { params });
      setReadings(res.data.readings);
      setTotalCount(res.data.pagination.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('history.confirmDelete'))) return;
    try {
      await axios.delete(`/api/reading/${id}`);
      fetchReadings();
    } catch (err) {
      console.error(err);
    }
  };

  const triggerExport = (format: 'csv' | 'excel' | 'pdf') => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (typeFilter) params.append('readingType', typeFilter);
    if (sugarRangeFilter) params.append('sugarRange', sugarRangeFilter);
    params.append('lang', i18n.language.startsWith('ta') ? 'ta' : 'en');
    window.open(`/api/export/${format}?${params.toString()}`, '_blank');
  };

  const formatLocalDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00'); // offset timezone shift
    const locale = i18n.language.startsWith('ta') ? 'ta-IN' : 'en-US';
    return d.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getGlucoseStatus = (val: number) => {
    const min = user?.targetMin || 70;
    const max = user?.targetMax || 140;

    if (val < min) {
      return {
        dot: '🔴',
        status: t('dashboard.low'),
        desc: t('dashboard.danger'),
        color: 'text-rose-600 font-bold'
      };
    }
    if (val <= max) {
      return {
        dot: '🟢',
        status: t('dashboard.normal'),
        desc: t('dashboard.journey.diffBetter'),
        color: 'text-emerald-600 font-bold'
      };
    }
    if (val <= max + 40) {
      return {
        dot: '🟡',
        status: t('dashboard.slightlyHigh'),
        desc: t('dashboard.slightlyHigh'),
        color: 'text-amber-600 font-bold'
      };
    }
    return {
      dot: '🔴',
      status: t('dashboard.high'),
      desc: t('dashboard.journey.diffWorse'),
      color: 'text-rose-600 font-bold'
    };
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-fade-in pb-20 print:p-0">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-105 rounded-lg text-slate-500"><ChevronLeft className="w-6 h-6" /></button>
          <div>
            <h1 className="text-3xl font-heading font-extrabold text-slate-800 dark:text-white">
              {t('history.title')}
            </h1>
          </div>
        </div>

        {/* Exports (Only caregiver view) */}
        {familyView === 'caregiver' && (
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => triggerExport('csv')}
              className="flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
            >
              <FileDown className="w-4 h-4" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => triggerExport('excel')}
              className="flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Excel</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
            >
              <Printer className="w-4 h-4" />
              <span>{t('history.print')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/80 space-y-4 print:hidden">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="relative col-span-1 sm:col-span-2">
            <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={t('history.searchPlaceholder')}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none min-h-[48px]"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none min-h-[48px]"
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

          <select
            value={sugarRangeFilter}
            onChange={(e) => { setSugarRangeFilter(e.target.value); setPage(1); }}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none min-h-[48px]"
          >
            <option value="">{t('history.filterRange')}</option>
            <option value="0-70">{t('dashboard.low')} (&lt;70)</option>
            <option value="70-140">{t('dashboard.normal')} (70-140)</option>
            <option value="141-180">{t('dashboard.slightlyHigh')} (141-180)</option>
            <option value="181-400">{t('dashboard.high')} (&gt;180)</option>
          </select>
        </div>

      </div>

      {/* Logs Table / Cards Wrapper */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/80 overflow-hidden">
        
        {/* Loading Indicator */}
        {loading && (
          <div className="p-12 text-center text-slate-400 font-bold">{t('history.loading', { defaultValue: 'Loading records...' })}</div>
        )}

        {/* Empty State */}
        {!loading && readings.length === 0 && (
          <div className="p-12 text-center text-slate-400 font-bold">{t('history.searchPlaceholder')} (0 records)</div>
        )}

        {/* 1. Desktop View (Table Layout) */}
        {!loading && readings.length > 0 && (
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 dark:text-slate-450 text-xs font-bold border-b border-slate-100 dark:border-slate-800 uppercase tracking-widest">
                  <th className="py-4 px-6">{isTamil ? "தேதி மற்றும் நேரம்" : "Date & Time"}</th>
                  <th className="py-4 px-6">{t('nav.addReading')}</th>
                  <th className="py-4 px-6">{t('reading.type')}</th>
                  <th className="py-4 px-6 print:hidden text-center">{t('history.actions', { defaultValue: 'Actions' })}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-medium">
                {readings.map((r) => {
                  const status = getGlucoseStatus(r.bloodSugar);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20 transition-colors">
                      {/* Column 1: Date & Time */}
                      <td className="py-5 px-6">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-slate-700 dark:text-slate-200">📅 {formatLocalDate(r.readingDate)}</span>
                          <span className="text-slate-400 font-bold text-xxs flex items-center gap-0.5">🕒 {r.readingTime}</span>
                        </div>
                      </td>

                      {/* Column 2: Sugar Reading */}
                      <td className="py-5 px-6">
                        <div className="flex flex-col">
                          <span className={`text-xl font-heading font-black tracking-tight ${status.color}`}>
                            {r.bloodSugar} <span className="text-xs font-bold text-slate-400">mg/dL</span>
                          </span>
                          <span className="text-xxs font-black text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                            <span>{status.dot}</span>
                            <span>{status.status}</span>
                          </span>
                        </div>
                      </td>

                      {/* Column 3: Check Type */}
                      <td className="py-5 px-6">
                        <span className={`px-3 py-1.5 border rounded-xl text-xs font-black uppercase tracking-wider ${getReadingTypeBadgeClass(r.readingType)}`}>
                          {t(`reading.types.${r.readingType}`, { defaultValue: r.readingType })}
                        </span>
                      </td>

                      {/* Column 4: Actions */}
                      <td className="py-5 px-6 print:hidden">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedReading(r)}
                            title={t('history.viewDetails')}
                            className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-white transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
                          >
                            <Eye className="w-5.5 h-5.5" />
                          </button>
                          <button
                            onClick={() => navigate(`/edit/${r.id}`)}
                            title={t('history.edit')}
                            className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-white transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
                          >
                            <Edit3 className="w-5.5 h-5.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
                            title={t('history.delete')}
                            className="p-2.5 rounded-xl text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-955/20 hover:text-rose-600 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
                          >
                            <Trash2 className="w-5.5 h-5.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. Mobile View (Card List Layout) */}
        {!loading && readings.length > 0 && (
          <div className="block sm:hidden p-4 space-y-4">
            {readings.map((r) => {
              const status = getGlucoseStatus(r.bloodSugar);
              return (
                <div key={r.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                  {/* Date & Time Header */}
                  <div className="flex justify-between items-center border-b pb-2.5 border-slate-50 dark:border-slate-800/60">
                    <span className="text-xs font-black text-slate-500 uppercase flex items-center gap-1">
                      <span>📅</span>
                      <span>{formatLocalDate(r.readingDate)}</span>
                    </span>
                    <span className="text-xxs font-bold text-slate-400 flex items-center gap-0.5">
                      <span>🕒</span>
                      <span>{r.readingTime}</span>
                    </span>
                  </div>

                  {/* Sugar Reading & Status */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xxs font-bold text-slate-400 block uppercase tracking-wider">{isTamil ? "சர்க்கரை அளவு" : "Sugar Reading"}</span>
                      <span className={`text-2xl font-heading font-black tracking-tight ${status.color} mt-0.5 block`}>
                        {r.bloodSugar} <span className="text-xs font-bold text-slate-400">mg/dL</span>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 bg-slate-50 dark:bg-slate-850 border dark:border-slate-700/60 rounded-xl text-xxs font-black text-slate-655 dark:text-slate-350 flex items-center gap-1 uppercase">
                        <span>{status.dot}</span>
                        <span>{status.status}</span>
                      </span>
                    </div>
                  </div>

                  {/* Check Type & Actions footer */}
                  <div className="flex justify-between items-center border-t pt-3 border-slate-50 dark:border-slate-800/60">
                    {/* Check Type badge */}
                    <span className={`px-3 py-1 border rounded-xl text-xs font-black uppercase tracking-wider ${getReadingTypeBadgeClass(r.readingType)}`}>
                      {t(`reading.types.${r.readingType}`, { defaultValue: r.readingType })}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedReading(r)}
                        className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-105 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => navigate(`/edit/${r.id}`)}
                        className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-105 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <Edit3 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="p-2.5 rounded-xl text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-955/20 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && readings.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center p-5 border-t border-slate-100 dark:border-slate-850 gap-4 print:hidden">
            <span className="text-xs font-bold text-slate-400 uppercase">
              {t('history.pagination', {
                start: (page - 1) * limit + 1,
                end: Math.min(page * limit, totalCount),
                total: totalCount
              })}
            </span>
            
            <div className="flex items-center gap-3">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-5 py-3 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-355 disabled:opacity-50 min-h-[44px] transition-colors"
              >
                {t('history.prev', { defaultValue: 'Previous' })}
              </button>
              <span className="text-sm font-bold text-slate-750 dark:text-slate-200">
                {page} / {Math.ceil(totalCount / limit) || 1}
              </span>
              <button
                disabled={page >= Math.ceil(totalCount / limit)}
                onClick={() => setPage(page + 1)}
                className="px-5 py-3 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-355 disabled:opacity-50 min-h-[44px] transition-colors"
              >
                {t('history.next', { defaultValue: 'Next' })}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedReading && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-xl overflow-hidden border border-slate-105 dark:border-slate-800 animate-fade-in">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-heading font-bold text-slate-800 dark:text-white">{t('history.recordDetails', { defaultValue: 'Record Details' })}</h3>
              <button 
                onClick={() => setSelectedReading(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xxs font-bold text-slate-400 uppercase">{t('reading.date')}</span>
                  <div className="text-sm font-bold text-slate-805 dark:text-white">{formatLocalDate(selectedReading.readingDate)} | {selectedReading.readingTime}</div>
                </div>
                <div>
                  <span className="text-xxs font-bold text-slate-400 uppercase">{t('reading.value')}</span>
                  <div className="text-lg font-black text-slate-805 dark:text-white">{selectedReading.bloodSugar} mg/dL</div>
                </div>
              </div>

              <div>
                <span className="text-xxs font-bold text-slate-400 uppercase">{t('dashboard.status')}</span>
                <div className="mt-1">
                  <span className={`px-3 py-1.5 rounded-xl border text-sm font-bold block ${
                    selectedReading.bloodSugar < (user?.targetMin || 70) 
                      ? 'bg-rose-50 border-rose-100 text-rose-700' 
                      : selectedReading.bloodSugar <= (user?.targetMax || 140)
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                      : 'bg-amber-50 border-amber-100 text-amber-700'
                  }`}>
                    {getGlucoseStatus(selectedReading.bloodSugar).dot} {getGlucoseStatus(selectedReading.bloodSugar).status} ({getGlucoseStatus(selectedReading.bloodSugar).desc})
                  </span>
                </div>
              </div>

              {selectedReading.medicineName && (
                <div>
                  <span className="text-xxs font-bold text-slate-400 uppercase">{t('reading.medTaken')}</span>
                  <div className="text-sm font-semibold text-emerald-600 mt-0.5">
                    💊 {selectedReading.medicineName} {selectedReading.insulinUnits ? `(${selectedReading.insulinUnits} Units)` : ''}
                  </div>
                </div>
              )}

              {selectedReading.mealNotes && (
                <div>
                  <span className="text-xxs font-bold text-slate-400 uppercase">{t('reading.mealNotes')}</span>
                  <div className="text-sm text-slate-650 dark:text-slate-300 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl mt-1">{selectedReading.mealNotes}</div>
                </div>
              )}

              {selectedReading.symptoms && (
                <div>
                  <span className="text-xxs font-bold text-slate-400 uppercase">{t('reading.symptoms')}</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {selectedReading.symptoms.split(',').map((sym) => (
                      <span key={sym} className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/20 text-amber-750 dark:text-amber-400 rounded-lg text-xs font-bold border border-amber-100">
                        {sym.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedReading.remarks && (
                <div>
                  <span className="text-xxs font-bold text-slate-400 uppercase">{t('reading.remarks')}</span>
                  <div className="text-sm text-slate-650 dark:text-slate-355 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl mt-1">{selectedReading.remarks}</div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-100">
              <button
                onClick={() => { setSelectedReading(null); navigate(`/edit/${selectedReading.id}`); }}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-sm text-sm"
              >
                {t('history.edit')}
              </button>
              <button
                onClick={() => setSelectedReading(null)}
                className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm bg-white hover:bg-slate-50"
              >
                {t('history.close', { defaultValue: 'Close' })}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default History;
