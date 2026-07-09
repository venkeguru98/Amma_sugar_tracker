import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, Plus, Trash2, Bell, FileText, Upload, Eye, CheckCircle2, UserPlus, ChevronLeft
} from 'lucide-react';

interface BPLog { id: string; readingDate: string; readingTime: string; systolic: number; diastolic: number; pulse: number | null; remarks: string | null; }
interface WeightLog { id: string; readingDate: string; weight: number; bmi: number | null; remarks: string | null; }
interface Reminder { id: string; medName: string; dosage: string; time: string; isActive: boolean; remarks: string | null; }
interface DoctorLog { id: string; visitDate: string; doctorName: string; specialty: string | null; symptoms: string | null; diagnosis: string | null; treatment: string | null; nextVisit: string | null; notes: string | null; }
interface LabReportLog { id: string; testDate: string; reportName: string; labName: string | null; fileUrl: string; hba1c: number | null; remarks: string | null; }
interface PrescriptionLog { id: string; doctorName: string; issueDate: string; fileUrl: string; notes: string | null; }

export const HealthHub: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'bp' | 'weight' | 'reminders' | 'docs' | 'doctor'>('bp');

  // Lists states
  const [bpLogs, setBpLogs] = useState<BPLog[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [doctorLogs, setDoctorLogs] = useState<DoctorLog[]>([]);
  const [labReports, setLabReports] = useState<LabReportLog[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionLog[]>([]);

  // Status state
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Forms state
  const [bpDate, setBpDate] = useState(new Date().toISOString().split('T')[0]);
  const [bpTime, setBpTime] = useState('08:00');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [bpRemarks, setBpRemarks] = useState('');

  const [weightDate, setWeightDate] = useState(new Date().toISOString().split('T')[0]);
  const [weightVal, setWeightVal] = useState('');
  const [weightRemarks, setWeightRemarks] = useState('');

  const [medName, setMedName] = useState('');
  const [dosage, setDosage] = useState('');
  const [alarmTime, setAlarmTime] = useState('09:00');
  const [medRemarks, setMedRemarks] = useState('');

  const [docVisitDate, setDocVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [doctorName, setDoctorName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [docSymptoms, setDocSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [nextVisit, setNextVisit] = useState('');
  const [docNotes, setDocNotes] = useState('');

  // Upload state
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportName, setReportName] = useState('');
  const [labName, setLabName] = useState('');
  const [hba1cVal, setHba1cVal] = useState('');
  const [reportRemarks, setReportRemarks] = useState('');
  const [reportFile, setReportFile] = useState<File | null>(null);

  const [presDoctor, setPresDoctor] = useState('');
  const [presDate, setPresDate] = useState(new Date().toISOString().split('T')[0]);
  const [presNotes, setPresNotes] = useState('');
  const [presFile, setPresFile] = useState<File | null>(null);

  useEffect(() => {
    fetchHubData();
  }, [activeTab]);

  const fetchHubData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'bp') {
        const res = await axios.get('/api/extra/bp');
        setBpLogs(res.data);
      } else if (activeTab === 'weight') {
        const res = await axios.get('/api/extra/weight');
        setWeightLogs(res.data);
      } else if (activeTab === 'reminders') {
        const res = await axios.get('/api/extra/reminders');
        setReminders(res.data);
      } else if (activeTab === 'doctor') {
        const res = await axios.get('/api/extra/doctor-notes');
        setDoctorLogs(res.data);
      } else if (activeTab === 'docs') {
        const r1 = await axios.get('/api/extra/lab-reports');
        const r2 = await axios.get('/api/extra/prescriptions');
        setLabReports(r1.data);
        setPrescriptions(r2.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 2500);
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

  const handleAddBP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/extra/bp', {
        readingDate: bpDate, readingTime: bpTime, systolic, diastolic, pulse, remarks: bpRemarks
      });
      setSystolic(''); setDiastolic(''); setPulse(''); setBpRemarks('');
      fetchHubData();
      showNotification(t('settings.saveBtn') === 'அமைப்புகளைச் சேமி' ? 'இரத்த அழுத்தம் சேமிக்கப்பட்டது' : 'Blood pressure reading saved');
    } catch (err) {
      alert('Error creating BP reading');
    }
  };

  const handleDeleteBP = async (id: string) => {
    if (!window.confirm(t('history.confirmDelete'))) return;
    await axios.delete(`/api/extra/bp/${id}`);
    fetchHubData();
  };

  const handleAddWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/extra/weight', {
        readingDate: weightDate, weight: weightVal, remarks: weightRemarks
      });
      setWeightVal(''); setWeightRemarks('');
      fetchHubData();
      showNotification(t('settings.saveBtn') === 'அமைப்புகளைச் சேமி' ? 'உடல் எடை பதிவு சேமிக்கப்பட்டது' : 'Weight log recorded');
    } catch (err) {
      alert('Error saving weight');
    }
  };

  const handleDeleteWeight = async (id: string) => {
    if (!window.confirm(t('history.confirmDelete'))) return;
    await axios.delete(`/api/extra/weight/${id}`);
    fetchHubData();
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/extra/reminders', {
        medName, dosage, time: alarmTime, remarks: medRemarks
      });
      setMedName(''); setDosage(''); setMedRemarks('');
      fetchHubData();
      showNotification(t('settings.saveBtn') === 'அமைப்புகளைச் சேமி' ? 'அலாரம் அமைக்கப்பட்டது' : 'Reminder alarm active');
    } catch (err) {
      alert('Error setting reminder');
    }
  };

  const handleToggleReminder = async (id: string, currentStatus: boolean) => {
    await axios.put(`/api/extra/reminders/${id}/toggle`, { isActive: !currentStatus });
    fetchHubData();
  };

  const handleDeleteReminder = async (id: string) => {
    await axios.delete(`/api/extra/reminders/${id}`);
    fetchHubData();
  };

  const handleAddDoctorNote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/extra/doctor-notes', {
        visitDate: docVisitDate, doctorName, specialty, symptoms: docSymptoms, diagnosis, treatment, nextVisit, notes: docNotes
      });
      setDoctorName(''); setSpecialty(''); setDocSymptoms(''); setDiagnosis(''); setTreatment(''); setNextVisit(''); setDocNotes('');
      fetchHubData();
      showNotification(t('settings.saveBtn') === 'அமைப்புகளைச் சேமி' ? 'ஆலோசனைக் குறிப்பு சேமிக்கப்பட்டது' : 'Doctor visit note saved');
    } catch (err) {
      alert('Error adding note');
    }
  };

  const handleDeleteDoctorNote = async (id: string) => {
    if (!window.confirm(t('history.confirmDelete'))) return;
    await axios.delete(`/api/extra/doctor-notes/${id}`);
    fetchHubData();
  };

  const handleUploadLabReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportFile) return alert('Select file');
    const formData = new FormData();
    formData.append('testDate', reportDate);
    formData.append('reportName', reportName);
    formData.append('labName', labName);
    formData.append('hba1c', hba1cVal);
    formData.append('remarks', reportRemarks);
    formData.append('file', reportFile);
    try {
      await axios.post('/api/extra/lab-reports', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setReportName(''); setLabName(''); setHba1cVal(''); setReportRemarks(''); setReportFile(null);
      fetchHubData();
      showNotification('Report uploaded');
    } catch (err) {
      alert('Upload failed');
    }
  };

  const handleUploadPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!presFile) return alert('Select file');
    const formData = new FormData();
    formData.append('doctorName', presDoctor);
    formData.append('issueDate', presDate);
    formData.append('notes', presNotes);
    formData.append('file', presFile);
    try {
      await axios.post('/api/extra/prescriptions', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPresDoctor(''); setPresNotes(''); setPresFile(null);
      fetchHubData();
      showNotification('Prescription uploaded');
    } catch (err) {
      alert('Upload failed');
    }
  };

  const handleDeleteLabReport = async (id: string) => {
    if (!window.confirm(t('history.confirmDelete'))) return;
    await axios.delete(`/api/extra/lab-reports/${id}`);
    fetchHubData();
  };

  const handleDeletePrescription = async (id: string) => {
    if (!window.confirm(t('history.confirmDelete'))) return;
    await axios.delete(`/api/extra/prescriptions/${id}`);
    fetchHubData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in pb-20">
      
      {/* Title */}
      <div className="flex items-center gap-2 border-b pb-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-105 rounded-lg text-slate-500"><ChevronLeft className="w-6 h-6" /></button>
        <h1 className="text-3xl font-heading font-extrabold text-slate-850 dark:text-white">
          {t('nav.healthHub')}
        </h1>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-955/20 text-emerald-600 dark:text-emerald-450 border border-emerald-100 rounded-xl font-semibold">
          {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-slate-100 dark:border-slate-850 gap-1 pb-1">
        {[
          { id: 'bp', label: t('extra.bpTitle'), icon: <Heart className="w-4 h-4" /> },
          { id: 'weight', label: t('extra.weightTitle'), icon: <FileText className="w-4 h-4" /> },
          { id: 'reminders', label: t('extra.remindersTitle'), icon: <Bell className="w-4 h-4" /> },
          { id: 'doctor', label: t('extra.doctorTitle'), icon: <UserPlus className="w-4 h-4" /> },
          { id: 'docs', label: t('nav.dashboard') === 'முகப்பு' ? 'கோப்புகள் பதிவேற்றம்' : 'File Uploads', icon: <Upload className="w-4 h-4" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-sm font-bold border-b-2 transition-all ${activeTab === tab.id ? 'border-emerald-500 text-emerald-600 dark:text-emerald-450' : 'border-transparent text-slate-500'}`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Form */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-6">
          {activeTab === 'bp' && (
            <form onSubmit={handleAddBP} className="space-y-4">
              <h3 className="text-base font-bold text-slate-800 dark:text-white">{t('nav.dashboard') === 'முகப்பு' ? 'இரத்த அழுத்தப் பதிவு' : 'Record BP Reading'}</h3>
              <input type="date" value={bpDate} onChange={(e) => setBpDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input type="time" value={bpTime} onChange={(e) => setBpTime(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" required placeholder={t('extra.systolic')} value={systolic} onChange={(e) => setSystolic(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                <input type="number" required placeholder={t('extra.diastolic')} value={diastolic} onChange={(e) => setDiastolic(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <input type="number" placeholder={t('extra.pulse')} value={pulse} onChange={(e) => setPulse(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input type="text" placeholder={t('reading.remarks')} value={bpRemarks} onChange={(e) => setBpRemarks(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <button type="submit" className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold">{t('reading.save')}</button>
            </form>
          )}

          {activeTab === 'weight' && (
            <form onSubmit={handleAddWeight} className="space-y-4">
              <h3 className="text-base font-bold text-slate-800 dark:text-white">{t('nav.dashboard') === 'முகப்பு' ? 'எடை பதிவு' : 'Record Weight'}</h3>
              <input type="date" value={weightDate} onChange={(e) => setWeightDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input type="number" step="any" required placeholder={t('settings.weight')} value={weightVal} onChange={(e) => setWeightVal(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input type="text" placeholder={t('reading.remarks')} value={weightRemarks} onChange={(e) => setWeightRemarks(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <button type="submit" className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold">{t('reading.save')}</button>
            </form>
          )}

          {activeTab === 'reminders' && (
            <form onSubmit={handleAddReminder} className="space-y-4">
              <h3 className="text-base font-bold text-slate-800 dark:text-white">{t('nav.dashboard') === 'முகப்பு' ? 'மருந்து அலாரம்' : 'Add Medicine Alarm'}</h3>
              <input type="text" required placeholder={t('reading.medName')} value={medName} onChange={(e) => setMedName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input type="text" required placeholder="Dosage (e.g. 500mg)" value={dosage} onChange={(e) => setDosage(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input type="time" required value={alarmTime} onChange={(e) => setAlarmTime(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input type="text" placeholder={t('reading.remarks')} value={medRemarks} onChange={(e) => setMedRemarks(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <button type="submit" className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold">{t('settings.addMed')}</button>
            </form>
          )}

          {activeTab === 'doctor' && (
            <form onSubmit={handleAddDoctorNote} className="space-y-4">
              <h3 className="text-base font-bold text-slate-800 dark:text-white">{t('nav.dashboard') === 'முகப்பு' ? 'ஆலோசனைக் குறிப்பு' : 'Log Consultation Notes'}</h3>
              <input type="date" required value={docVisitDate} onChange={(e) => setDocVisitDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input type="text" required placeholder={t('extra.docName')} value={doctorName} onChange={(e) => setDoctorName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input type="text" placeholder={t('extra.specialty')} value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input type="text" placeholder={t('reading.symptoms')} value={docSymptoms} onChange={(e) => setDocSymptoms(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input type="text" placeholder={t('extra.diagnosis')} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <textarea rows={2} placeholder={t('extra.treatment')} value={treatment} onChange={(e) => setTreatment(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm resize-none" />
              <input type="date" placeholder={t('extra.nextVisit')} value={nextVisit} onChange={(e) => setNextVisit(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <textarea rows={2} placeholder={t('reading.remarks')} value={docNotes} onChange={(e) => setDocNotes(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm resize-none" />
              <button type="submit" className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold">{t('reading.save')}</button>
            </form>
          )}

          {activeTab === 'docs' && (
            <div className="space-y-6">
              <form onSubmit={handleUploadLabReport} className="space-y-3.5 border-b pb-5">
                <h3 className="text-base font-bold text-slate-800 dark:text-white">{t('extra.uploadReport')}</h3>
                <input type="date" required value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg text-xs" />
                <input type="text" required placeholder={t('extra.reportName')} value={reportName} onChange={(e) => setReportName(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg text-xs" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder={t('extra.labName')} value={labName} onChange={(e) => setLabName(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg text-xs" />
                  <input type="number" step="any" placeholder="HbA1c (%)" value={hba1cVal} onChange={(e) => setHba1cVal(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg text-xs" />
                </div>
                <input type="file" required onChange={(e) => setReportFile(e.target.files?.[0] || null)} className="w-full text-xs text-slate-500" />
                <button type="submit" className="w-full py-2 bg-emerald-500 text-white font-bold rounded-lg text-xs">Upload Report</button>
              </form>

              <form onSubmit={handleUploadPrescription} className="space-y-3.5">
                <h3 className="text-base font-bold text-slate-800 dark:text-white">{t('extra.uploadPrescription')}</h3>
                <input type="text" required placeholder={t('extra.docName')} value={presDoctor} onChange={(e) => setPresDoctor(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg text-xs" />
                <input type="date" required value={presDate} onChange={(e) => setPresDate(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg text-xs" />
                <input type="text" placeholder="Notes" value={presNotes} onChange={(e) => setPresNotes(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg text-xs" />
                <input type="file" required onChange={(e) => setPresFile(e.target.files?.[0] || null)} className="w-full text-xs text-slate-500" />
                <button type="submit" className="w-full py-2 bg-emerald-500 text-white font-bold rounded-lg text-xs">Upload Prescription</button>
              </form>
            </div>
          )}
        </div>

        {/* Display lists */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading...</div>
          ) : (
            <>
              {activeTab === 'bp' && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-4">
                  <h4 className="font-heading font-bold text-slate-850 dark:text-white">{t('nav.dashboard') === 'முகப்பு' ? 'இரத்த அழுத்தப் பதிவுகளின் பட்டியல்' : 'BP Readings Log'}</h4>
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800 text-xxs font-bold border-b">
                        <th className="p-3">{t('reading.date')}</th>
                        <th className="p-3">{t('extra.bpTitle')}</th>
                        <th className="p-3">{t('extra.pulse')}</th>
                        <th className="p-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {bpLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                          <td className="p-3 font-semibold">{formatLocalDate(log.readingDate)} | {log.readingTime}</td>
                          <td className="p-3 font-bold">{log.systolic} / {log.diastolic} mmHg</td>
                          <td className="p-3">{log.pulse ? `${log.pulse} bpm` : '--'}</td>
                          <td className="p-3">
                            <button onClick={() => handleDeleteBP(log.id)} className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'weight' && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-4">
                  <h4 className="font-heading font-bold text-slate-850 dark:text-white">{t('nav.dashboard') === 'முகப்பு' ? 'உடல் எடைப் பட்டியல்' : 'Weight & BMI Logs'}</h4>
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800 text-xxs font-bold border-b">
                        <th className="p-3">{t('reading.date')}</th>
                        <th className="p-3">{t('settings.weight')}</th>
                        <th className="p-3">{t('extra.bmi')}</th>
                        <th className="p-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {weightLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                          <td className="p-3 font-semibold">{formatLocalDate(log.readingDate)}</td>
                          <td className="p-3 font-bold">{log.weight} kg</td>
                          <td className="p-3 font-bold text-emerald-650">{log.bmi || '--'}</td>
                          <td className="p-3">
                            <button onClick={() => handleDeleteWeight(log.id)} className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'reminders' && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-4">
                  <h4 className="font-heading font-bold text-slate-855 dark:text-white">{t('extra.remindersSub')}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {reminders.map((rem) => (
                      <div key={rem.id} className={`p-4 rounded-xl border flex justify-between items-center ${rem.isActive ? 'bg-emerald-50/20 border-emerald-100' : 'bg-slate-50 opacity-60'}`}>
                        <div>
                          <div className="font-bold text-slate-850 dark:text-white">{rem.medName}</div>
                          <div className="text-xs text-slate-500 font-semibold">{rem.dosage}</div>
                          <div className="text-xxs text-slate-450">🕒 {rem.time} | {rem.remarks || 'Regular'}</div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleToggleReminder(rem.id, rem.isActive)} className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 rounded text-[10px] font-bold">
                            {rem.isActive ? 'Active' : 'Disabled'}
                          </button>
                          <button onClick={() => handleDeleteReminder(rem.id)} className="p-1 text-rose-500 hover:bg-rose-55 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'doctor' && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-4">
                  <h4 className="font-heading font-bold text-slate-855 dark:text-white">{t('extra.doctorSub')}</h4>
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                    {doctorLogs.map((log) => (
                      <div key={log.id} className="p-4 bg-slate-55 dark:bg-slate-850 rounded-xl border space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-bold text-emerald-600 block uppercase">{log.specialty || 'Diabetologist'}</span>
                            <h5 className="font-bold text-sm text-slate-800 dark:text-white">{log.doctorName}</h5>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xxs text-slate-400 font-bold">{formatLocalDate(log.visitDate)}</span>
                            <button onClick={() => handleDeleteDoctorNote(log.id)} className="p-1 text-rose-500 hover:bg-rose-55 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        <div className="text-xxs text-slate-550 border-t pt-1.5 grid grid-cols-2 gap-2">
                          <div><span className="font-bold">{t('reading.symptoms')}:</span> {log.symptoms || '--'}</div>
                          <div><span className="font-bold">{t('extra.diagnosis')}:</span> {log.diagnosis || '--'}</div>
                        </div>
                        <p className="text-xs bg-white dark:bg-slate-900 p-2 rounded-lg border text-slate-705 whitespace-pre-line mt-1">{log.treatment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'docs' && (
                <div className="space-y-4">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                    <h4 className="font-heading font-bold text-slate-850 dark:text-white">{t('nav.dashboard') === 'முகப்பு' ? 'பரிசோதனை அறிக்கைகள்' : 'Lab Reports'}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {labReports.map((rep) => (
                        <div key={rep.id} className="p-4 bg-slate-55 dark:bg-slate-850 rounded-xl border flex justify-between items-center">
                          <div>
                            <div className="font-bold text-sm text-slate-800 dark:text-white">{rep.reportName}</div>
                            <div className="text-xxs text-slate-400">{formatLocalDate(rep.testDate)} | {rep.labName || 'Diagnostic Center'}</div>
                            {rep.hba1c && <div className="text-xs font-bold text-emerald-650">HbA1c: {rep.hba1c}%</div>}
                          </div>
                          <div className="flex items-center gap-1">
                            <a href={rep.fileUrl} target="_blank" rel="noreferrer" className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"><Eye className="w-5 h-5" /></a>
                            <button onClick={() => handleDeleteLabReport(rep.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                    <h4 className="font-heading font-bold text-slate-855 dark:text-white">{t('nav.dashboard') === 'முகப்பு' ? 'மருந்துச் சீட்டுகள்' : 'Prescription Files'}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {prescriptions.map((pres) => (
                        <div key={pres.id} className="p-4 bg-slate-55 dark:bg-slate-850 rounded-xl border flex justify-between items-center">
                          <div>
                            <div className="font-bold text-sm text-slate-800 dark:text-white">Prescription by {pres.doctorName}</div>
                            <div className="text-xxs text-slate-400">Date: {formatLocalDate(pres.issueDate)}</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <a href={pres.fileUrl} target="_blank" rel="noreferrer" className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"><Eye className="w-5 h-5" /></a>
                            <button onClick={() => handleDeletePrescription(pres.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </div>

    </div>
  );
};
export default HealthHub;
