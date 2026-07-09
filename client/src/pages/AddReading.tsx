import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Calendar, Clock, Activity, ChevronLeft, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ReadingFormValues {
  readingDate: string;
  readingTime: string;
  bloodSugar: number;
  readingType: string;
  medicineTaken: boolean;
  medicineName: string;
  insulinUnits: string;
  mealNotes: string;
  symptoms: string;
  remarks: string;
}

export const AddReading: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toggle advanced details
  const [showMoreDetails, setShowMoreDetails] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ReadingFormValues>({
    defaultValues: {
      readingDate: new Date().toISOString().split('T')[0],
      readingTime: new Date().toLocaleTimeString('en-US', { hour12: false }).substring(0, 5),
      readingType: 'fasting',
      medicineTaken: false,
      medicineName: '',
      insulinUnits: '',
      mealNotes: '',
      symptoms: '',
      remarks: ''
    }
  });

  const medicineTaken = watch('medicineTaken');

  useEffect(() => {
    if (isEdit && id) {
      setLoading(true);
      axios.get(`/api/reading/${id}`)
        .then((res) => {
          const r = res.data;
          setValue('readingDate', r.readingDate);
          setValue('readingTime', r.readingTime);
          setValue('bloodSugar', r.bloodSugar);
          setValue('readingType', r.readingType);
          setValue('medicineTaken', r.medicineTaken);
          setValue('medicineName', r.medicineName || '');
          setValue('insulinUnits', r.insulinUnits || '');
          setValue('mealNotes', r.mealNotes || '');
          setValue('symptoms', r.symptoms || '');
          setValue('remarks', r.remarks || '');
          if (r.medicineTaken || r.mealNotes || r.symptoms || r.remarks) {
            setShowMoreDetails(true);
          }
        })
        .catch(() => {
          setError(t('history.confirmDelete') ? 'விவரங்களை பெற முடியவில்லை' : 'Failed to fetch details');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isEdit, id, setValue, t]);

  const onSubmit = async (data: ReadingFormValues) => {
    setLoading(true);
    setError(null);
    try {
      if (isEdit) {
        await axios.put(`/api/reading/${id}`, data);
      } else {
        await axios.post('/api/reading', data);
      }
      setSuccess(true);
      setTimeout(() => {
        navigate('/history');
      }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const symptomOptions = ['Fatigue', 'Headache', 'Dizziness', 'Sweating', 'Trembling', 'Blurred Vision', 'Dry Mouth', 'Frequent Urination', 'Nausea'];

  const symptomsMap: Record<string, string> = {
    'Fatigue': i18n.language.startsWith('ta') ? 'சோர்வு (Fatigue)' : 'Fatigue',
    'Headache': i18n.language.startsWith('ta') ? 'தலைவலி (Headache)' : 'Headache',
    'Dizziness': i18n.language.startsWith('ta') ? 'தலைச்சுற்றல் (Dizziness)' : 'Dizziness',
    'Sweating': i18n.language.startsWith('ta') ? 'வியர்த்தல் (Sweating)' : 'Sweating',
    'Trembling': i18n.language.startsWith('ta') ? 'நடுக்கம் (Trembling)' : 'Trembling',
    'Blurred Vision': i18n.language.startsWith('ta') ? 'மங்கலான பார்வை (Blurred Vision)' : 'Blurred Vision',
    'Dry Mouth': i18n.language.startsWith('ta') ? 'வாய் வறட்சி (Dry Mouth)' : 'Dry Mouth',
    'Frequent Urination': i18n.language.startsWith('ta') ? 'அடிக்கடி சிறுநீர் கழித்தல்' : 'Frequent Urination',
    'Nausea': i18n.language.startsWith('ta') ? 'குமட்டல் (Nausea)' : 'Nausea'
  };

  const toggleSymptom = (symptom: string) => {
    const currentSymptoms = watch('symptoms') || '';
    let newList = currentSymptoms.split(',').map(s => s.trim()).filter(Boolean);
    if (newList.includes(symptom)) {
      newList = newList.filter(s => s !== symptom);
    } else {
      newList.push(symptom);
    }
    setValue('symptoms', newList.join(', '));
  };

  const activeSymptoms = (watch('symptoms') || '').split(',').map(s => s.trim());

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6 animate-fade-in pb-20">
      
      {/* Header */}
      <div className="flex items-center gap-2">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 hover:bg-slate-105 rounded-lg text-slate-500 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-heading font-extrabold text-slate-800 dark:text-white">
          {isEdit ? t('reading.editTitle') : t('reading.addTitle')}
        </h1>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-6 h-6" />
          <span>{t('settings.saveBtn') === 'அமைப்புகளைச் சேமி' ? 'பதிவு சேமிக்கப்பட்டது! பக்கத்திற்கு செல்கிறது...' : 'Record saved! Redirecting...'}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 rounded-xl border border-rose-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
        
        {/* Glucose */}
        <div>
          <label className="block text-lg font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1.5">
            <Activity className="w-5 h-5 text-emerald-500" />
            <span>{t('reading.value')}</span>
          </label>
          <input
            type="number"
            step="any"
            placeholder="0"
            {...register('bloodSugar', { 
              required: t('reading.errors.valueRequired'), 
              min: { value: 1, message: t('reading.errors.valueMin') } 
            })}
            className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-sans text-2xl font-black text-center focus:outline-none min-h-[56px]"
          />
          {errors.bloodSugar && <p className="text-rose-555 text-xs mt-1 font-bold">{errors.bloodSugar.message}</p>}
        </div>

        {/* Reading Type */}
        <div>
          <label className="block text-base font-bold text-slate-700 dark:text-slate-200 mb-2">
            {t('reading.type')}
          </label>
          <select
            {...register('readingType')}
            className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-850 dark:text-white font-sans text-lg font-semibold focus:outline-none min-h-[52px]"
          >
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

        {/* More details */}
        <div className="border-t border-slate-50 dark:border-slate-800 pt-4">
          <button
            type="button"
            onClick={() => setShowMoreDetails(!showMoreDetails)}
            className="w-full flex items-center justify-between py-2 text-slate-550 hover:text-slate-800 dark:hover:text-slate-200 text-sm font-bold"
          >
            <span>{t('settings.saveBtn') === 'அமைப்புகளைச் சேமி' ? 'கூடுதல் விவரங்கள் (விருப்பத்திற்குரியது)' : 'More Details (Optional)'}</span>
            {showMoreDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {showMoreDetails && (
          <div className="space-y-6 pt-2 animate-fade-in">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{t('reading.date')}</span>
                </label>
                <input
                  type="date"
                  {...register('readingDate')}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{t('reading.time')}</span>
                </label>
                <input
                  type="time"
                  {...register('readingTime')}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
            </div>

            {/* Medicine Taken */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('medicineTaken')}
                  className="w-5 h-5 text-emerald-600 border-slate-350 rounded focus:ring-emerald-500"
                />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{t('reading.medTaken')}</span>
              </label>

              {medicineTaken && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-505 mb-1">{t('reading.medName')}</label>
                    <input
                      type="text"
                      placeholder="e.g. Metformin"
                      {...register('medicineName')}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-505 mb-1">{t('reading.insulinUnits')}</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 12"
                      {...register('insulinUnits')}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Symptoms */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                {t('reading.symptoms')}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {symptomOptions.map((sym) => {
                  const active = activeSymptoms.includes(sym);
                  const label = symptomsMap[sym] || sym;
                  return (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => toggleSymptom(sym)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${active ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-650'}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Meals and Remarks */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{t('reading.mealNotes')}</label>
                <input
                  type="text"
                  placeholder="e.g. Oats or brown rice"
                  {...register('mealNotes')}
                  className="w-full px-3 py-2.5 border rounded-xl dark:bg-slate-800 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{t('reading.remarks')}</label>
                <input
                  type="text"
                  placeholder="Remarks / Other notes"
                  {...register('remarks')}
                  className="w-full px-3 py-2.5 border rounded-xl dark:bg-slate-800 text-sm focus:outline-none"
                />
              </div>
            </div>

          </div>
        )}

        {/* Form buttons */}
        <div className="flex flex-col sm:flex-row gap-4 border-t border-slate-50 dark:border-slate-800 pt-6">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold shadow-lg text-lg min-h-[52px]"
          >
            {loading ? '...' : t('reading.save')}
          </button>
          
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-4 border-2 border-slate-200 dark:border-slate-700 text-slate-550 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl font-bold text-lg min-h-[52px]"
          >
            {t('reading.cancel')}
          </button>
        </div>

      </form>
    </div>
  );
};
export default AddReading;
