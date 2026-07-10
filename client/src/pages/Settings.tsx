import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  User, Shield, Eye, Database, ChevronLeft, Clock, Calendar, CheckSquare, Bell
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Settings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const { 
    largeTextMode, highContrastMode, darkMode,
    toggleLargeTextMode, toggleHighContrastMode, toggleDarkMode,
    familyView, setFamilyView
  } = useTheme();

  // Browser Push Notification state
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Elder Mode state
  const [elderMode, setElderMode] = useState(() => {
    return localStorage.getItem('theme-elder-mode') === 'true';
  });

  // Profile Form States
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [diabetesType, setDiabetesType] = useState('Type 2');
  const [targetMin, setTargetMin] = useState('70');
  const [targetMax, setTargetMax] = useState('140');
  const [medicines, setMedicines] = useState<string[]>([]);
  const [newMed, setNewMed] = useState('');

  // WhatsApp & SMS Notification States
  const [caregiverPhone, setCaregiverPhone] = useState('');
  const [ammaPhone, setAmmaPhone] = useState('');
  const [enableWhatsapp, setEnableWhatsapp] = useState(false);
  const [enableSms, setEnableSms] = useState(false);

  // Monitoring Plan States
  const [monFrequency, setMonFrequency] = useState('custom_days');
  const [monScheduleDays, setMonScheduleDays] = useState<string[]>(['1', '4']); // default Mon, Thu
  const [monReminderTime, setMonReminderTime] = useState('08:00');
  const [monReadingTypes, setMonReadingTypes] = useState<string[]>([
    'fasting', 'before_lunch', 'after_lunch', 'before_dinner', 'after_dinner'
  ]);
  const [monStartDate, setMonStartDate] = useState('');
  const [monEndDate, setMonEndDate] = useState('');
  const [monIsActive, setMonIsActive] = useState(false);
  const [monLoading, setMonLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hasPlanInDb, setHasPlanInDb] = useState(false);

  // Wizard States
  const [wizardStep, setWizardStep] = useState(1);
  const [monCreator, setMonCreator] = useState<'doctor' | 'family' | 'myself'>('doctor');
  const [monReminderOption, setMonReminderOption] = useState<'morning' | 'afternoon' | 'evening' | 'custom'>('morning');

  // Status indicators
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setAge(user.age?.toString() || '');
      setWeight(user.weight?.toString() || '');
      setHeight(user.height?.toString() || '');
      setDiabetesType(user.diabetesType || 'Type 2');
      setTargetMin(user.targetMin.toString());
      setTargetMax(user.targetMax.toString());
      setMedicines(user.medicines || []);

      // Load notification parameters from user's themeSettings meta
      const meta = user.themeSettings || {};
      setCaregiverPhone(meta.caregiverPhone || '');
      setAmmaPhone(meta.ammaPhone || '');
      setEnableWhatsapp(meta.enableWhatsapp || false);
      setEnableSms(meta.enableSms || false);
    }
  }, [user]);

  // Fetch active monitoring plan only once on mount
  useEffect(() => {
    axios.get('/api/extra/monitoring-plan')
      .then((res) => {
        const plan = res.data;
        setMonFrequency(plan.frequency);
        setMonScheduleDays(plan.scheduleDays.split(',').map((s: string) => s.trim()).filter(Boolean));
        setMonReminderTime(plan.reminderTime);
        setMonReadingTypes(plan.readingTypes.split(',').map((s: string) => s.trim()).filter(Boolean));
        setMonStartDate(plan.startDate || '');
        setMonEndDate(plan.endDate || '');
        setMonIsActive(plan.isActive);
        setMonCreator(plan.adviser || 'doctor');
        if (plan && plan.id) {
          setHasPlanInDb(true);
        } else {
          setHasPlanInDb(false);
        }

        // Infer option
        if (plan.reminderTime === '08:00') setMonReminderOption('morning');
        else if (plan.reminderTime === '13:00') setMonReminderOption('afternoon');
        else if (plan.reminderTime === '20:00') setMonReminderOption('evening');
        else setMonReminderOption('custom');
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      await updateUserProfile({
        name,
        age: age ? parseInt(age) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        height: height ? parseFloat(height) : undefined,
        diabetesType,
        targetMin: parseFloat(targetMin),
        targetMax: parseFloat(targetMax),
        medicines,
        themeSettings: {
          ...(user?.themeSettings || {}),
          caregiverPhone,
          ammaPhone,
          enableWhatsapp,
          enableSms
        }
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMonitoringPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setMonLoading(true);
    setSuccess(false);
    setError(null);

    try {
      await axios.post('/api/extra/monitoring-plan', {
        frequency: monFrequency,
        scheduleDays: monScheduleDays.join(','),
        reminderTime: monReminderTime,
        readingTypes: monReadingTypes.join(','),
        startDate: monStartDate || null,
        endDate: monEndDate || null,
        isActive: monIsActive,
        adviser: monCreator
      });
      setSuccess(true);
      setHasPlanInDb(true);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save monitoring plan');
    } finally {
      setMonLoading(false);
    }
  };

  const toggleFamilyViewSelection = (view: 'amma' | 'caregiver') => {
    setFamilyView(view); // Updates ThemeContext + localStorage, no reload needed
  };

  const toggleElderModeSelection = (checked: boolean) => {
    setElderMode(checked);
    localStorage.setItem('theme-elder-mode', String(checked));
    
    const root = window.document.documentElement;
    if (checked) {
      root.classList.add('accessibility-elder-mode');
    } else {
      root.classList.remove('accessibility-elder-mode');
    }
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
  };

  const addMedicine = () => {
    if (!newMed.trim()) return;
    if (medicines.includes(newMed.trim())) return;
    setMedicines([...medicines, newMed.trim()]);
    setNewMed('');
  };

  const removeMedicine = (med: string) => {
    setMedicines(medicines.filter((m) => m !== med));
  };

  // Helper toggle schedule days (0 for Sunday, 1 for Monday etc)
  const toggleScheduleDay = (day: string) => {
    if (monScheduleDays.includes(day)) {
      setMonScheduleDays(monScheduleDays.filter(d => d !== day));
    } else {
      setMonScheduleDays([...monScheduleDays, day]);
    }
  };

  // Helper toggle reading types to check
  const toggleReadingTypeCheck = (type: string) => {
    if (monReadingTypes.includes(type)) {
      setMonReadingTypes(monReadingTypes.filter(t => t !== type));
    } else {
      setMonReadingTypes([...monReadingTypes, type]);
    }
  };

  // Backup Export
  const downloadBackup = async () => {
    try {
      const res = await axios.get('/api/reading', { params: { limit: 'all' } });
      const readings = res.data.readings;
      const backupData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        profile: { age, weight, height, diabetesType, targetMin, targetMax, medicines },
        readings
      };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `sugar_tracker_backup_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      alert("Failed to export backup");
    }
  };

  // Backup Restore
  const handleRestoreUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = e.target.files;
    if (!files || files.length === 0) return;

    fileReader.readAsText(files[0], "UTF-8");
    fileReader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.readings || !Array.isArray(parsed.readings)) {
          throw new Error("Invalid backup format");
        }
        if (!window.confirm(`Restore and upload ${parsed.readings.length} records?`)) return;
        setLoading(true);
        for (const item of parsed.readings) {
          await axios.post('/api/reading', {
            readingDate: item.readingDate,
            readingTime: item.readingTime,
            readingType: item.readingType,
            bloodSugar: item.bloodSugar,
            medicineTaken: item.medicineTaken,
            medicineName: item.medicineName,
            insulinUnits: item.insulinUnits,
            mealNotes: item.mealNotes,
            symptoms: item.symptoms,
            remarks: item.remarks
          });
        }
        alert("Backup restored successfully!");
        window.location.reload();
      } catch (err: any) {
        alert("Failed to restore backup: " + err.message);
      } finally {
        setLoading(false);
      }
    };
  };

  const isTamil = i18n.language.startsWith('ta');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in pb-24">
      
      {/* Title */}
      <div className="flex items-center gap-2 border-b pb-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-105 rounded-lg text-slate-500"><ChevronLeft className="w-6 h-6" /></button>
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-slate-805 dark:text-white">
            {t('settings.title')}
          </h1>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-955/20 text-emerald-600 dark:text-emerald-450 border border-emerald-100 rounded-xl font-bold">
          {isTamil ? "அமைப்புகள் வெற்றிகரமாக சேமிக்கப்பட்டன!" : "Settings Saved Successfully!"}
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-400 border border-rose-100 rounded-xl font-bold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        
        {/* Left Column Accessibility */}
        <div className="md:col-span-1 space-y-6">
          
          {/* Dashboard Mode Selector */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-slate-800 dark:text-white border-b pb-2 flex items-center gap-1.5">
              <Eye className="w-5 h-5 text-emerald-500" />
              <span>{t('settings.accessibility', { defaultValue: 'Display Settings' })}</span>
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => toggleFamilyViewSelection('amma')}
                className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all ${familyView === 'amma' ? 'bg-emerald-50 border-emerald-350 text-emerald-650 font-extrabold' : 'bg-slate-50 border-transparent text-slate-500'}`}
              >
                👩 {isTamil ? 'அம்மா பார்வை' : 'Amma View'}
              </button>
              <button
                type="button"
                onClick={() => toggleFamilyViewSelection('caregiver')}
                className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all ${familyView === 'caregiver' ? 'bg-blue-50 border-blue-355 text-blue-650 font-extrabold' : 'bg-slate-50 border-transparent text-slate-500'}`}
              >
                👨 {isTamil ? 'பராமரிப்பாளர்' : 'Caregiver View'}
              </button>
            </div>
          </div>

          {/* Accessibility Toggles */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-slate-800 dark:text-white border-b pb-2 flex items-center gap-1.5">
              <Eye className="w-5 h-5 text-emerald-500" />
              <span>{t('settings.accessibility')}</span>
            </h2>

            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-semibold text-slate-650 dark:text-slate-350">Elder Mode (உதவிப் பார்வை)</span>
                <input
                  type="checkbox"
                  checked={elderMode}
                  onChange={(e) => toggleElderModeSelection(e.target.checked)}
                  className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-semibold text-slate-655 dark:text-slate-350">{t('settings.largeText')}</span>
                <input
                  type="checkbox"
                  checked={largeTextMode}
                  onChange={toggleLargeTextMode}
                  className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-semibold text-slate-655 dark:text-slate-350">{t('settings.highContrast')}</span>
                <input
                  type="checkbox"
                  checked={highContrastMode}
                  onChange={toggleHighContrastMode}
                  className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-semibold text-slate-655 dark:text-slate-355">{t('settings.darkMode')}</span>
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={toggleDarkMode}
                  className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                />
              </label>
            </div>
          </div>

          {/* Language Switch */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-slate-850 dark:text-white border-b pb-2">🌐 {isTamil ? 'மொழி விருப்பம்' : 'Language Toggle'}</h2>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => changeLanguage('en')}
                className={`py-3 rounded-xl border text-sm font-bold transition-all ${i18n.language.startsWith('en') ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-transparent'}`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => changeLanguage('ta')}
                className={`py-3 rounded-xl border text-sm font-bold transition-all ${i18n.language.startsWith('ta') ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-transparent'}`}
              >
                தமிழ்
              </button>
            </div>
          </div>

          {/* Browser Push Notifications */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-slate-800 dark:text-white border-b pb-2 flex items-center gap-1.5">
              <Bell className="w-5 h-5 text-emerald-500" />
              <span>{isTamil ? 'அறிவிப்புகள்' : 'Reminders'}</span>
            </h2>

            <div className="space-y-3">
              {/* Permission Status Badge */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-650 dark:text-slate-350">
                  {isTamil ? 'அறிவிப்பு நிலை' : 'Push Notification Status'}
                </span>
                <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                  notificationPermission === 'granted'
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    : notificationPermission === 'denied'
                    ? 'bg-rose-50 text-rose-600 border border-rose-100'
                    : 'bg-amber-50 text-amber-600 border border-amber-100'
                }`}>
                  {notificationPermission === 'granted'
                    ? (isTamil ? '✅ அனுமதிக்கப்பட்டது' : '✅ Allowed')
                    : notificationPermission === 'denied'
                    ? (isTamil ? '🚫 தடுக்கப்பட்டது' : '🚫 Blocked')
                    : (isTamil ? '⏳ கேட்கப்படவில்லை' : '⏳ Not asked yet')}
                </span>
              </div>

              {/* Request Permission Button */}
              {notificationPermission !== 'granted' && notificationPermission !== 'denied' && (
                <button
                  type="button"
                  onClick={() => {
                    Notification.requestPermission().then((perm) => {
                      setNotificationPermission(perm);
                    });
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors"
                >
                  {isTamil ? '🔔 அறிவிப்புகளை இயக்கு' : '🔔 Enable Reminders'}
                </button>
              )}

              {notificationPermission === 'denied' && (
                <p className="text-xs text-rose-500 font-semibold">
                  {isTamil
                    ? 'அறிவிப்புகள் உலாவியில் தடுக்கப்பட்டுள்ளன. உலாவி அமைப்புகளில் அனுமதிக்கவும்.'
                    : 'Notifications are blocked in your browser. Please allow them in browser settings.'}
                </p>
              )}

              {notificationPermission === 'granted' && (
                <p className="text-xs text-emerald-600 font-semibold">
                  {isTamil
                    ? '✅ சர்க்கரை பரிசோதனை நேரத்தில் நினைவூட்டல் வழங்கப்படும்.'
                    : '✅ You will receive an in-browser reminder when your scheduled sugar test time arrives.'}
                </p>
              )}

              {/* WhatsApp/SMS Disclaimer */}
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-955/20 border border-amber-100 dark:border-amber-900 rounded-xl">
                <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold leading-relaxed">
                  ℹ️ {isTamil
                    ? 'WhatsApp / SMS தகவல்கள் Twilio API ஒருங்கிணைப்பு தேவை. தற்போது சாண்ட்பாக்ஸ் பயிற்சி பயன்முறையில் உள்ளது.'
                    : 'WhatsApp & SMS alerts require a custom Twilio API setup and are currently in sandbox/demo mode only.'}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Profile & Monitoring Settings */}
        <div className="md:col-span-2 space-y-6">
          
          <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800/80 space-y-6">
            
            <h2 className="text-lg font-heading font-bold text-slate-800 dark:text-white border-b pb-3 flex items-center gap-1.5">
              <User className="w-5 h-5 text-emerald-500" />
              <span>{t('settings.profileSec')}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('auth.name')}</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border dark:bg-slate-800 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('settings.age')}</label>
                <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border dark:bg-slate-800 text-sm focus:outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('settings.weight')}</label>
                <input type="number" step="any" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border dark:bg-slate-800 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('settings.height')}</label>
                <input type="number" step="any" value={height} onChange={(e) => setHeight(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border dark:bg-slate-800 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('settings.diabetesType')}</label>
                <select value={diabetesType} onChange={(e) => setDiabetesType(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border dark:bg-slate-800 text-sm focus:outline-none">
                  <option value="Type 1">Type 1</option>
                  <option value="Type 2">Type 2</option>
                  <option value="Pre-diabetes">Pre-diabetes</option>
                  <option value="Gestational">Gestational</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-650 flex items-center gap-1.5"><Shield className="w-4 h-4 text-emerald-500" /> {t('settings.targetRange')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-505 mb-1">{t('settings.minTarget')}</label>
                  <input type="number" value={targetMin} onChange={(e) => setTargetMin(e.target.value)} className="w-full px-4 py-2 border rounded-xl dark:bg-slate-800 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-505 mb-1">{t('settings.maxTarget')}</label>
                  <input type="number" value={targetMax} onChange={(e) => setTargetMax(e.target.value)} className="w-full px-4 py-2 border rounded-xl dark:bg-slate-800 text-sm focus:outline-none" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-655 flex items-center gap-1.5">💊 {t('settings.medsList')}</h3>
              <div className="flex gap-2">
                <input type="text" placeholder="Add medicine name" value={newMed} onChange={(e) => setNewMed(e.target.value)} className="flex-1 px-4 py-2 border rounded-xl dark:bg-slate-800 text-sm focus:outline-none" />
                <button type="button" onClick={addMedicine} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm">{t('settings.addMed')}</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {medicines.map((m) => (
                  <span key={m} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-2">
                    <span>{m}</span>
                    <button type="button" onClick={() => removeMedicine(m)} className="text-rose-500 font-bold">×</button>
                  </span>
                ))}
              </div>
            </div>

            {/* 📲 WhatsApp & SMS Reminders Section */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <span>📲</span>
                <span>{isTamil ? "வாட்ஸ்அப் மற்றும் எஸ்எம்எஸ் நினைவூட்டல்கள்" : "WhatsApp & SMS Reminders"}</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">{isTamil ? "அம்மாவின் தொலைபேசி எண்" : "Amma's Phone Number"}</label>
                  <input 
                    type="tel" 
                    placeholder="e.g. +919876543210" 
                    value={ammaPhone} 
                    onChange={(e) => setAmmaPhone(e.target.value)} 
                    className="w-full px-4 py-2.5 rounded-xl border dark:bg-slate-800 text-sm focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">{isTamil ? "பராமரிப்பாளர் தொலைபேசி எண்" : "Caregiver's Phone Number"}</label>
                  <input 
                    type="tel" 
                    placeholder="e.g. +919876543211" 
                    value={caregiverPhone} 
                    onChange={(e) => setCaregiverPhone(e.target.value)} 
                    className="w-full px-4 py-2.5 rounded-xl border dark:bg-slate-800 text-sm focus:outline-none" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800/40">
                  <input
                    type="checkbox"
                    checked={enableWhatsapp}
                    onChange={(e) => setEnableWhatsapp(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">{isTamil ? "வாட்ஸ்அப் நினைவூட்டல்களை இயக்கு" : "Enable WhatsApp Reminders"}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{isTamil ? "அம்மாவின் வாட்ஸ்அப்பிற்கு தானியங்கி செய்திகள் அனுப்பப்படும்" : "Sends automated reminders to Amma's WhatsApp"}</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800/40">
                  <input
                    type="checkbox"
                    checked={enableSms}
                    onChange={(e) => setEnableSms(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">{isTamil ? "எஸ்எம்எஸ் நினைவூட்டல்களை இயக்கு" : "Enable SMS Reminders"}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{isTamil ? "சோதனை தவறும் போது பராமரிப்பாளருக்கு எஸ்எம்எஸ் எச்சரிக்கை" : "Sends SMS alert to Caregiver if reading is missed"}</span>
                  </div>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold shadow-lg text-lg min-h-[52px]"
            >
              {loading ? 'Saving...' : t('settings.saveBtn')}
            </button>

          </form>

          {/* 🩺 Sugar Check Schedule Wizard (Visible ONLY to Caregiver) */}
          {familyView === 'caregiver' && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800/80 space-y-6">
              <h2 className="text-lg font-heading font-bold text-slate-805 dark:text-white border-b pb-3 flex items-center gap-1.5">
                <Calendar className="w-5 h-5 text-emerald-500" />
                <span>{isTamil ? "🩺 சர்க்கரை பரிசோதனை அட்டவணை" : "🩺 Sugar Check Schedule"}</span>
              </h2>

              {/* Toggle to enable/disable scheduling */}
              <div className="flex items-center justify-between cursor-pointer bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-sm font-bold text-slate-750 dark:text-slate-205">
                  {isTamil ? "சோதனை அட்டவணையை இயக்கு" : "Enable Sugar Check Schedule"}
                </span>
                <input
                  type="checkbox"
                  checked={monIsActive}
                  disabled={monLoading}
                  onChange={async (e) => {
                    const val = e.target.checked;
                    setMonIsActive(val);
                    if (hasPlanInDb) {
                      setMonLoading(true);
                      try {
                        await axios.post('/api/extra/monitoring-plan', {
                          frequency: monFrequency,
                          scheduleDays: monScheduleDays.join(','),
                          reminderTime: monReminderTime,
                          readingTypes: monReadingTypes.join(','),
                          startDate: monStartDate || null,
                          endDate: monEndDate || null,
                          isActive: val,
                          adviser: monCreator
                        });
                        setSuccess(true);
                      } catch (err: any) {
                        setError(err.response?.data?.error || 'Failed to update plan status');
                      } finally {
                        setMonLoading(false);
                      }
                    }
                  }}
                  className="w-5 h-5 text-emerald-650 border-slate-350 rounded focus:ring-emerald-500"
                />
              </div>

              {monIsActive && hasPlanInDb && !isEditing && (
                <div className="space-y-6 border-t pt-4">
                  <div className="bg-emerald-50/20 dark:bg-slate-850 p-6 rounded-2xl border border-emerald-100/35 space-y-4">
                    <h3 className="text-sm font-black text-slate-855 dark:text-white flex items-center gap-1.5 border-b pb-2">
                      <span>📋</span>
                      <span>{isTamil ? "தற்போதைய சர்க்கரை பரிசோதனை அட்டவணை" : "Current Monitoring Plan"}</span>
                    </h3>
                    
                    <div className="space-y-3 text-xs text-slate-650 dark:text-slate-300 font-semibold leading-relaxed">
                      <p>
                        👤 <strong className="text-slate-850 dark:text-white">{isTamil ? "அமைப்பவர்:" : "Adviser:"}</strong>{' '}
                        {monCreator === 'doctor' ? (isTamil ? 'மருத்துவர்' : 'Doctor') : monCreator === 'family' ? (isTamil ? 'குடும்ப உறுப்பினர்' : 'Family Caregiver') : (isTamil ? 'சுய கண்காணிப்பு' : 'Myself')}
                      </p>
                      <p>
                        📅 <strong className="text-slate-850 dark:text-white">{isTamil ? "அதிர்வெண்:" : "Frequency:"}</strong>{' '}
                        {monFrequency === 'daily' 
                          ? (isTamil ? 'தினமும்' : 'Every Day')
                          : monFrequency === 'alternate'
                          ? (isTamil ? '2 நாட்களுக்கு ஒருமுறை' : 'Every 2 Days')
                          : monFrequency === 'weekly'
                          ? (isTamil ? 'வாரத்திற்கு ஒருமுறை' : 'Weekly (Every 7 Days)')
                          : (isTamil ? `குறிப்பிட்ட நாட்கள்: ${monScheduleDays.map(d => ['ஞாயிறு','திங்கள்','செவ்வாய்','புதன்','வியாழன்','வெள்ளி','சனி'][parseInt(d)]).join(', ')}` : `Custom Days (${monScheduleDays.map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][parseInt(d)]).join(', ')})`)}
                      </p>
                      <p>
                        ⏰ <strong className="text-slate-850 dark:text-white">{isTamil ? "நினைவூட்டல்:" : "Reminder:"}</strong>{' '}
                        {monReminderTime}
                      </p>
                      {monStartDate && (
                        <p>
                          📅 <strong className="text-slate-850 dark:text-white">{isTamil ? "துவங்கும் நாள்:" : "Active From:"}</strong>{' '}
                          {monStartDate}
                        </p>
                      )}
                      {monEndDate && (
                        <p>
                          📅 <strong className="text-slate-850 dark:text-white">{isTamil ? "முடிவடையும் நாள்:" : "Ends:"}</strong>{' '}
                          {monEndDate}
                        </p>
                      )}
                      <p>
                        🩺 <strong className="text-slate-850 dark:text-white">{isTamil ? "தேவையான சோதனைகள்:" : "Required Tests:"}</strong>{' '}
                        {monReadingTypes.map(tKey => t(`reading.types.${tKey}`)).join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 border-t pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(true);
                        setWizardStep(1);
                      }}
                      className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      ✏️ {isTamil ? "அட்டவணையை திருத்தவும்" : "Edit Plan"}
                    </button>
                    
                    <button
                      type="button"
                      onClick={async () => {
                        setMonLoading(true);
                        try {
                          await axios.post('/api/extra/monitoring-plan', {
                            frequency: monFrequency,
                            scheduleDays: monScheduleDays.join(','),
                            reminderTime: monReminderTime,
                            readingTypes: monReadingTypes.join(','),
                            startDate: monStartDate || null,
                            endDate: monEndDate || null,
                            isActive: false,
                            adviser: monCreator
                          });
                          setMonIsActive(false);
                          setSuccess(true);
                        } catch (err: any) {
                          setError(err.response?.data?.error || 'Failed to disable plan');
                        } finally {
                          setMonLoading(false);
                        }
                      }}
                      disabled={monLoading}
                      className="py-3 px-6 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      🛑 {isTamil ? "அட்டவணையை முடக்கவும்" : "Disable Plan"}
                    </button>
                  </div>
                </div>
              )}

              {monIsActive && (!hasPlanInDb || isEditing) && (
                <div className="space-y-6 border-t pt-4">
                  {/* Wizard Step Progress Indicator */}
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase pb-2">
                    <span>{isTamil ? `படி ${wizardStep} / 5` : `Step ${wizardStep} of 5`}</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <div
                          key={s}
                          className={`w-3.5 h-1.5 rounded-full ${s <= wizardStep ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Step 1: Creator */}
                  {wizardStep === 1 && (
                    <div className="space-y-4 animate-fade-in">
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                        {isTamil ? "1. இந்த அட்டவணையை உருவாக்குவது யார்?" : "1. Who is advising this sugar check plan?"}
                      </label>
                      <div className="flex flex-col gap-3">
                        {[
                          { key: 'doctor', labelEn: "Doctor (Diabetologist)", labelTa: "🩺 மருத்துவர் பரிந்துரை" },
                          { key: 'family', labelEn: "Family Member (Caregiver)", labelTa: "👪 குடும்ப உறுப்பினர்" },
                          { key: 'myself', labelEn: "Myself (Self-monitoring)", labelTa: "👤 நான் (சுய கண்காணிப்பு)" }
                        ].map((opt) => (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => setMonCreator(opt.key as any)}
                            className={`p-4 rounded-2xl border text-left font-bold transition-all text-sm flex items-center justify-between ${monCreator === opt.key ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-650 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-850 border-transparent text-slate-700 dark:text-slate-300'}`}
                          >
                            <span>{isTamil ? opt.labelTa : opt.labelEn}</span>
                            {monCreator === opt.key && <span className="text-emerald-500">✓</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Frequency & Weekdays selection */}
                  {wizardStep === 2 && (
                    <div className="space-y-4 animate-fade-in">
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-255">
                        {isTamil ? "2. அம்மா எவ்வளவு அடிக்கடி சர்க்கரையை சோதிக்க வேண்டும்?" : "2. How often should Amma check sugar?"}
                      </label>
                      <div className="flex flex-col gap-3">
                        {[
                          { key: 'daily', labelEn: "Check Daily", labelTa: "📅 தினமும் சோதிக்கவும்" },
                          { key: 'alternate', labelEn: "Check Every 2 Days", labelTa: "📅 2 நாட்களுக்கு ஒருமுறை" },
                          { key: 'custom_days', labelEn: "Check on specific days (e.g. Mon & Thu)", labelTa: "📅 குறிப்பிட்ட நாட்களில் மட்டும் (எ.கா. திங்கள், வியாழன்)" }
                        ].map((opt) => (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => setMonFrequency(opt.key)}
                            className={`p-4 rounded-2xl border text-left font-bold transition-all text-sm flex items-center justify-between ${monFrequency === opt.key ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-650 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-855 border-transparent text-slate-700 dark:text-slate-300'}`}
                          >
                            <span>{isTamil ? opt.labelTa : opt.labelEn}</span>
                            {monFrequency === opt.key && <span className="text-emerald-500">✓</span>}
                          </button>
                        ))}
                      </div>

                      {monFrequency === 'custom_days' && (
                        <div className="pt-2 space-y-2">
                          <span className="text-xxs font-bold text-slate-400 uppercase block">
                            {isTamil ? "அட்டவணை நாட்களைத் தேர்ந்தெடுக்கவும்:" : "Select Schedule Days:"}
                          </span>
                          <div className="grid grid-cols-4 gap-2">
                            {[
                              { labelEn: "Mon", labelTa: "திங்கள்", index: "1" },
                              { labelEn: "Tue", labelTa: "செவ்வாய்", index: "2" },
                              { labelEn: "Wed", labelTa: "புதன்", index: "3" },
                              { labelEn: "Thu", labelTa: "வியாழன்", index: "4" },
                              { labelEn: "Fri", labelTa: "வெள்ளி", index: "5" },
                              { labelEn: "Sat", labelTa: "சனி", index: "6" },
                              { labelEn: "Sun", labelTa: "ஞாயிறு", index: "0" }
                            ].map((day) => {
                              const active = monScheduleDays.includes(day.index);
                              return (
                                <button
                                  key={day.index}
                                  type="button"
                                  onClick={() => toggleScheduleDay(day.index)}
                                  className={`py-2 px-1 rounded-xl text-xxs font-bold border transition-all ${active ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200'}`}
                                >
                                  {isTamil ? day.labelTa : day.labelEn}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 3: Reminder Time picker options */}
                  {wizardStep === 3 && (
                    <div className="space-y-4 animate-fade-in">
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-205">
                        {isTamil ? "3. எந்த நேரத்தில் அம்மாவிற்கு நினைவூட்ட வேண்டும்?" : "3. What time should we remind Amma?"}
                      </label>
                      <div className="flex flex-col gap-3">
                        {[
                          { key: 'morning', time: '08:00', labelEn: "Morning (8:00 AM)", labelTa: "🌅 காலை 8:00 மணி" },
                          { key: 'afternoon', time: '13:00', labelEn: "Afternoon (1:00 PM)", labelTa: "☀️ மதியம் 1:00 மணி" },
                          { key: 'evening', time: '20:00', labelEn: "Evening (8:00 PM)", labelTa: "🌙 மாலை 8:00 மணி" },
                          { key: 'custom', time: '', labelEn: "Custom Time...", labelTa: "⏰ குறிப்பிட்ட நேரம்..." }
                        ].map((opt) => (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => {
                              setMonReminderOption(opt.key as any);
                              if (opt.time) setMonReminderTime(opt.time);
                            }}
                            className={`p-4 rounded-2xl border text-left font-bold transition-all text-sm flex items-center justify-between ${monReminderOption === opt.key ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-650 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-850 border-transparent text-slate-700 dark:text-slate-300'}`}
                          >
                            <span>{isTamil ? opt.labelTa : opt.labelEn}</span>
                            {monReminderOption === opt.key && <span className="text-emerald-500">✓</span>}
                          </button>
                        ))}
                      </div>

                      {monReminderOption === 'custom' && (
                        <div className="pt-2 animate-fade-in">
                          <label className="block text-xs font-bold text-slate-400 mb-1.5">{isTamil ? "நினைவூட்டல் நேரத்தைத் தேர்வு செய்க:" : "Choose Custom Time:"}</label>
                          <input
                            type="time"
                            value={monReminderTime}
                            onChange={(e) => setMonReminderTime(e.target.value)}
                            className="w-full px-4 py-2 border rounded-xl dark:bg-slate-800 text-sm focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 4: Reading Types checkboxes */}
                  {wizardStep === 4 && (
                    <div className="space-y-4 animate-fade-in">
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-205">
                        {isTamil ? "4. இன்றைய சோதனைகள் (எவை செய்ய வேண்டும்?)" : "4. Sugar tests Amma should do:"}
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {[
                          { key: 'fasting', label: t('reading.types.fasting') },
                          { key: 'before_breakfast', label: t('reading.types.before_breakfast') },
                          { key: 'after_breakfast', label: t('reading.types.after_breakfast') },
                          { key: 'before_lunch', label: t('reading.types.before_lunch') },
                          { key: 'after_lunch', label: t('reading.types.after_lunch') },
                          { key: 'before_dinner', label: t('reading.types.before_dinner') },
                          { key: 'after_dinner', label: t('reading.types.after_dinner') },
                          { key: 'bedtime', label: t('reading.types.bedtime') },
                          { key: 'random', label: t('reading.types.random') }
                        ].map((type) => {
                          const checked = monReadingTypes.includes(type.key);
                          return (
                            <label key={type.key} className="flex items-center gap-2.5 cursor-pointer p-3 hover:bg-slate-50 dark:hover:bg-slate-855 rounded-xl border border-slate-100 dark:border-slate-800/40">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleReadingTypeCheck(type.key)}
                                className="w-4 h-4 text-emerald-650 border-slate-350 rounded focus:ring-emerald-500"
                              />
                              <span className="font-extrabold text-slate-700 dark:text-slate-200">{type.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Step 5: Summary Review & Save */}
                  {wizardStep === 5 && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="bg-emerald-50/20 dark:bg-slate-850 p-5 rounded-2xl border border-emerald-100/35 space-y-4">
                        <h3 className="text-sm font-black text-slate-850 dark:text-white flex items-center gap-1.5 border-b pb-2">
                          <span>📋</span>
                          <span>{isTamil ? "அட்டவணை சுருக்கம்" : "Schedule Summary"}</span>
                        </h3>
                        
                        <div className="space-y-2.5 text-xs text-slate-650 dark:text-slate-300 font-semibold leading-relaxed">
                          <p>
                            👤 <strong className="text-slate-850 dark:text-white">{isTamil ? "அமைப்பவர்:" : "Advised By:"}</strong>{' '}
                            {monCreator === 'doctor' ? (isTamil ? 'மருத்துவர்' : 'Doctor') : monCreator === 'family' ? (isTamil ? 'குடும்ப உறுப்பினர்' : 'Family Caregiver') : (isTamil ? 'சுய கண்காணிப்பு' : 'Myself')}
                          </p>
                          <p>
                            📅 <strong className="text-slate-850 dark:text-white">{isTamil ? "அதிர்வெண்:" : "Frequency:"}</strong>{' '}
                            {monFrequency === 'daily' 
                              ? (isTamil ? 'தினமும்' : 'Every Day')
                              : monFrequency === 'alternate'
                              ? (isTamil ? '2 நாட்களுக்கு ஒருமுறை' : 'Every 2 Days')
                              : (isTamil ? `குறிப்பிட்ட நாட்கள்: ${monScheduleDays.map(d => ['ஞாயிறு','திங்கள்','செவ்வாய்','புதன்','வியாழன்','வெள்ளி','சனி'][parseInt(d)]).join(', ')}` : `Custom Days (Mon/Thu/etc)`)}
                          </p>
                          <p>
                            ⏰ <strong className="text-slate-850 dark:text-white">{isTamil ? "நினைவூட்டல் நேரம்:" : "Reminder Time:"}</strong>{' '}
                            {monReminderTime}
                          </p>
                          <p>
                            🩺 <strong className="text-slate-850 dark:text-white">{isTamil ? "செய்ய வேண்டிய சோதனைகள்:" : "Sugar Tests to Do:"}</strong>{' '}
                            {monReadingTypes.map(tKey => t(`reading.types.${tKey}`)).join(', ')}
                          </p>
                        </div>
                      </div>

                      {/* Optional prescription active duration dates */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 mb-1.5">{isTamil ? "துவங்கும் நாள் (விருப்பத்தேர்வு)" : "Start From (Optional)"}</label>
                          <input
                            type="date"
                            value={monStartDate}
                            onChange={(e) => setMonStartDate(e.target.value)}
                            className="w-full px-4 py-2 border rounded-xl dark:bg-slate-800 text-sm focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 mb-1.5">{isTamil ? "முடிவடையும் நாள் (விருப்பத்தேர்வு)" : "Finish On (Optional)"}</label>
                          <input
                            type="date"
                            value={monEndDate}
                            onChange={(e) => setMonEndDate(e.target.value)}
                            className="w-full px-4 py-2 border rounded-xl dark:bg-slate-800 text-sm focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation Footer Buttons inside Wizard */}
                  <div className="flex justify-between items-center gap-4 border-t pt-4">
                    {wizardStep > 1 ? (
                      <button
                        type="button"
                        onClick={() => setWizardStep(wizardStep - 1)}
                        className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-colors"
                      >
                        ← {isTamil ? "முந்தைய" : "Back"}
                      </button>
                    ) : (
                      <div />
                    )}

                    {wizardStep < 5 ? (
                      <button
                        type="button"
                        onClick={() => setWizardStep(wizardStep + 1)}
                        className="py-3 px-6 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl text-xs transition-colors shadow-sm ml-auto"
                      >
                        {isTamil ? "தொடர்க" : "Continue"} →
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={monLoading}
                        onClick={handleSaveMonitoringPlan}
                        className="py-3 px-8 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl text-xs transition-colors shadow-md ml-auto"
                      >
                        {monLoading ? 'Saving...' : (isTamil ? 'அட்டவணையை சேமிக்கவும்' : 'SAVE PLAN')}
                      </button>
                    )}
                  </div>

                </div>
              )}
            </div>
          )}

          {/* Backups */}
          {familyView === 'caregiver' && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800/80 space-y-4">
              <h2 className="text-lg font-heading font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b pb-3">
                <Database className="w-5 h-5 text-emerald-500" />
                <span>{t('settings.dataSec')}</span>
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={downloadBackup}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  📥 {t('settings.backup')}
                </button>
                <label className="py-3 px-4 border hover:bg-slate-55 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors text-center">
                  <span>📤 {t('settings.restore')}</span>
                  <input type="file" accept=".json" onChange={handleRestoreUpload} className="hidden" />
                </label>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
export default Settings;
