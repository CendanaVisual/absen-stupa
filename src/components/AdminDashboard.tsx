import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, Calendar, MapPin, Settings, Plus, Search, Filter, Trash, Edit, Palette,
  ExternalLink, CheckCircle, AlertTriangle, FileSpreadsheet, Loader2, Save, RefreshCw, UserCheck, XCircle, Clock, Printer,
  Eye, Download, Paperclip, Upload, School, Crown, Sparkles
} from 'lucide-react';
import { Employee, AttendanceRecord, SchoolConfig, CustomHoliday } from '../types';
import { addEmployee, updateLeaveRequestStatus, saveAttendanceRecord, updateEmployee } from '../lib/sheets';

interface AdminDashboardProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaveRequests: any[];
  schoolConfig: SchoolConfig;
  spreadsheetId: string;
  accessToken: string;
  onUpdateSchoolConfig: (config: SchoolConfig) => void;
  onRefreshData: () => Promise<void>;
  onUpdateSpreadsheetId: (id: string) => void;
}

const ADMIN_THEMES = [
  {
    id: 'slate',
    name: 'Classic Onyx & Gold',
    primaryText: 'text-slate-900',
    primaryBg: 'bg-slate-900',
    hoverBg: 'hover:bg-slate-800',
    activeBg: 'active:bg-black',
    lightBg: 'bg-amber-50/70',
    borderCol: 'border-amber-200/80 border',
    accentText: 'text-amber-600',
    gradient: 'from-slate-950 via-slate-900 to-slate-950',
    iconCol: 'text-amber-600',
    focusRing: 'focus:border-slate-900',
    previewCircle: 'bg-slate-950 border border-amber-400',
  },
  {
    id: 'emerald',
    name: 'Royal Emerald & Gold',
    primaryText: 'text-emerald-900',
    primaryBg: 'bg-emerald-800',
    hoverBg: 'hover:bg-emerald-900',
    activeBg: 'active:bg-emerald-950',
    lightBg: 'bg-emerald-50/70',
    borderCol: 'border-amber-200 border',
    accentText: 'text-amber-600',
    gradient: 'from-emerald-950 via-emerald-900 to-slate-950',
    iconCol: 'text-amber-600',
    focusRing: 'focus:border-emerald-800',
    previewCircle: 'bg-emerald-800 border border-amber-400',
  },
  {
    id: 'cosmic',
    name: 'Imperial Amethyst & Gold',
    primaryText: 'text-indigo-950',
    primaryBg: 'bg-indigo-900',
    hoverBg: 'hover:bg-indigo-950',
    activeBg: 'active:bg-indigo-950',
    lightBg: 'bg-indigo-50/70',
    borderCol: 'border-amber-200 border',
    accentText: 'text-amber-600',
    gradient: 'from-indigo-950 via-purple-900 to-slate-950',
    iconCol: 'text-amber-600',
    focusRing: 'focus:border-indigo-900',
    previewCircle: 'bg-indigo-900 border border-amber-400',
  },
  {
    id: 'sapphire',
    name: 'Majestic Sapphire & Gold',
    primaryText: 'text-blue-950',
    primaryBg: 'bg-blue-900',
    hoverBg: 'hover:bg-blue-950',
    activeBg: 'active:bg-blue-950',
    lightBg: 'bg-blue-50/70',
    borderCol: 'border-amber-200 border',
    accentText: 'text-amber-500',
    gradient: 'from-blue-950 via-indigo-950 to-slate-950',
    iconCol: 'text-amber-500',
    focusRing: 'focus:border-blue-900',
    previewCircle: 'bg-blue-900 border border-amber-400',
  },
  {
    id: 'amber',
    name: 'Golden Heritage & Obsidian',
    primaryText: 'text-amber-900',
    primaryBg: 'bg-amber-700',
    hoverBg: 'hover:bg-amber-800',
    activeBg: 'active:bg-amber-900',
    lightBg: 'bg-amber-50/80',
    borderCol: 'border-amber-300 border',
    accentText: 'text-amber-700',
    gradient: 'from-amber-950 via-amber-800 to-slate-950',
    iconCol: 'text-amber-700',
    focusRing: 'focus:border-amber-700',
    previewCircle: 'bg-amber-600 border border-amber-200',
  }
];

const SectionHeader = ({ 
  title, 
  subtitle, 
  badge, 
  icon: Icon 
}: { 
  title: string; 
  subtitle: string; 
  badge?: string; 
  icon: React.ComponentType<any> 
}) => {
  return (
    <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-y sm:border border-amber-400/40 px-5 py-4 sm:rounded-2xl shadow-lg relative overflow-hidden mb-5">
      {/* Absolute background patterns */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:16px_16px]" />
      <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-500/[0.05] to-transparent pointer-events-none" />
      
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-md flex items-center justify-center text-slate-950 shrink-0">
            <div className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center">
              <Icon className="w-4.5 h-4.5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black tracking-widest text-amber-500 uppercase">
                PORTAL ADMINISTRATOR
              </span>
              {badge && (
                <span className="px-2 py-0.5 bg-red-600 text-white text-[8px] font-black uppercase tracking-widest rounded-full animate-pulse">
                  {badge}
                </span>
              )}
            </div>
            <h2 className="text-sm sm:text-base font-black text-white tracking-tight uppercase mt-0.5 font-sans flex items-center gap-1.5">
              {title}
            </h2>
            <p className="text-[10px] text-amber-100/65 font-medium tracking-wide">
              {subtitle}
            </p>
          </div>
        </div>
        
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-400/[0.08] border border-amber-400/20 rounded-lg">
          <Crown className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest">EXECUTIVE PLATINUM</span>
        </div>
      </div>
    </div>
  );
};

export default function AdminDashboard({
  employees,
  attendance,
  leaveRequests,
  schoolConfig,
  spreadsheetId,
  accessToken,
  onUpdateSchoolConfig,
  onRefreshData,
  onUpdateSpreadsheetId,
}: AdminDashboardProps) {
  // Theme state
  const [adminTheme, setAdminTheme] = useState<string>(() => {
    return localStorage.getItem('admin_portal_theme') || 'slate';
  });
  const currentTheme = ADMIN_THEMES.find(t => t.id === adminTheme) || ADMIN_THEMES[0];

  // Tabs: 'rekap' | 'pegawai' | 'lokasi' | 'pengaturan' | 'persetujuan'
  const [activeTab, setActiveTab] = useState<'rekap' | 'pegawai' | 'lokasi' | 'pengaturan' | 'persetujuan'>('rekap');
  const [previewPhotoModal, setPreviewPhotoModal] = useState<string | null>(null);
  const [selectedEvidenceUrl, setSelectedEvidenceUrl] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // New Employee Form States
  const [newEmpId, setNewEmpId] = useState('');
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpRole, setNewEmpRole] = useState('Guru Kelas');
  const [newEmpRoleIsCustom, setNewEmpRoleIsCustom] = useState(false);
  const [newEmpRoleCustomVal, setNewEmpRoleCustomVal] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpSalary, setNewEmpSalary] = useState<number>(4000000);
  const [empSubmitting, setEmpSubmitting] = useState(false);
  const [empSuccess, setEmpSuccess] = useState<string | null>(null);

  // Edit Employee Form States (NIP cannot be changed, acts as key)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editEmpName, setEditEmpName] = useState('');
  const [editEmpRole, setEditEmpRole] = useState('');
  const [editEmpRoleIsCustom, setEditEmpRoleIsCustom] = useState(false);
  const [editEmpRoleCustomVal, setEditEmpRoleCustomVal] = useState('');
  const [editEmpEmail, setEditEmpEmail] = useState('');
  const [editEmpSalary, setEditEmpSalary] = useState<number>(0);
  const [editEmpInStart, setEditEmpInStart] = useState('');
  const [editEmpInEnd, setEditEmpInEnd] = useState('');
  const [editEmpOutStartMonThu, setEditEmpOutStartMonThu] = useState('');
  const [editEmpOutEndMonThu, setEditEmpOutEndMonThu] = useState('');
  const [editEmpOutStartFri, setEditEmpOutStartFri] = useState('');
  const [editEmpOutEndFri, setEditEmpOutEndFri] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // School Location Config Form States
  const [schoolName, setSchoolName] = useState(schoolConfig.name);
  const [schoolAddress, setSchoolAddress] = useState(schoolConfig.address);
  const [schoolLat, setSchoolLat] = useState(schoolConfig.latitude);
  const [schoolLng, setSchoolLng] = useState(schoolConfig.longitude);
  const [schoolRad, setSchoolRad] = useState(schoolConfig.radius);
  const [checkInStart, setCheckInStart] = useState(schoolConfig.checkInStart || '06:00');
  const [checkInEnd, setCheckInEnd] = useState(schoolConfig.checkInEnd || '07:45');
  const [checkOutStartMonThu, setCheckOutStartMonThu] = useState(schoolConfig.checkOutStartMonThu || '15:00');
  const [checkOutEndMonThu, setCheckOutEndMonThu] = useState(schoolConfig.checkOutEndMonThu || '18:00');
  const [checkOutStartFri, setCheckOutStartFri] = useState(schoolConfig.checkOutStartFri || '13:00');
  const [checkOutEndFri, setCheckOutEndFri] = useState(schoolConfig.checkOutEndFri || '16:00');

  // New Holiday Rules Configuration
  const [disableSatSun, setDisableSatSun] = useState<boolean>(schoolConfig.disableSatSun !== false);
  const [holidays, setHolidays] = useState<CustomHoliday[]>(schoolConfig.holidays || []);
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayLabel, setNewHolidayLabel] = useState('');
  const [latePenaltyPerMinute, setLatePenaltyPerMinute] = useState<number>(schoolConfig.latePenaltyPerMinute || 1000);
  const [earlyPenaltyPerMinute, setEarlyPenaltyPerMinute] = useState<number>(schoolConfig.earlyPenaltyPerMinute || 1000);

  const [locSuccess, setLocSuccess] = useState<string | null>(null);

  // Settings states
  const [sheetIdInput, setSheetIdInput] = useState(spreadsheetId);
  const [sheetIdSuccess, setSheetIdSuccess] = useState<string | null>(null);

  // Custom Firebase configuration states
  const [fbPastedConfig, setFbPastedConfig] = useState('');
  const [fbSuccess, setFbSuccess] = useState<string | null>(null);
  
  const getCustomFbConfig = () => {
    try {
      const saved = localStorage.getItem('sipeg_custom_firebase_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  };

  const initialFb = getCustomFbConfig();
  const [fbApiKey, setFbApiKey] = useState(initialFb?.apiKey || '');
  const [fbProjectId, setFbProjectId] = useState(initialFb?.projectId || '');
  const [fbAppId, setFbAppId] = useState(initialFb?.appId || '');
  const [fbAuthDomain, setFbAuthDomain] = useState(initialFb?.authDomain || '');
  const [fbStorageBucket, setFbStorageBucket] = useState(initialFb?.storageBucket || '');
  const [fbMessagingSenderId, setFbMessagingSenderId] = useState(initialFb?.messagingSenderId || '');
  const [fbOAuthClientId, setFbOAuthClientId] = useState(initialFb?.oAuthClientId || '');

  const handleAutoExtractFirebaseConfig = () => {
    if (!fbPastedConfig.trim()) return;
    
    const extract = (key: string) => {
      const regex = new RegExp(`['"]?${key}['"]?\\s*:\\s*['"]([^'"]+)['"]`);
      const match = fbPastedConfig.match(regex);
      return match ? match[1] : '';
    };

    const apiKey = extract('apiKey');
    const projectId = extract('projectId');
    const appId = extract('appId');
    const authDomain = extract('authDomain');
    const storageBucket = extract('storageBucket');
    const messagingSenderId = extract('messagingSenderId');
    const oAuthClientId = extract('oAuthClientId') || extract('clientId');

    if (apiKey) setFbApiKey(apiKey);
    if (projectId) setFbProjectId(projectId);
    if (appId) setFbAppId(appId);
    if (authDomain) setFbAuthDomain(authDomain);
    if (storageBucket) setFbStorageBucket(storageBucket);
    if (messagingSenderId) setFbMessagingSenderId(messagingSenderId);
    if (oAuthClientId) setFbOAuthClientId(oAuthClientId);

    setFbSuccess("Berhasil mengekstrak parameter dari teks konfigurasi! Silakan cek kolom di bawah.");
    setTimeout(() => setFbSuccess(null), 4000);
  };

  const handleSaveFirebaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbProjectId.trim() && !fbApiKey.trim()) {
      alert("Masukkan minimal ID Project atau API Key Firebase!");
      return;
    }

    const config = {
      apiKey: fbApiKey.trim(),
      projectId: fbProjectId.trim(),
      appId: fbAppId.trim(),
      authDomain: fbAuthDomain.trim(),
      storageBucket: fbStorageBucket.trim(),
      messagingSenderId: fbMessagingSenderId.trim(),
      oAuthClientId: fbOAuthClientId.trim()
    };

    localStorage.setItem('sipeg_custom_firebase_config', JSON.stringify(config));
    setFbSuccess(`Koneksi Firebase berhasil diperbarui ke '${config.projectId}'! Memuat ulang halaman...`);
    
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const handleResetFirebaseConfig = () => {
    localStorage.removeItem('sipeg_custom_firebase_config');
    setFbSuccess("Koneksi Firebase dikembalikan ke default Studio! Memuat ulang halaman...");
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  // Filters for attendance logs
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [filterStatus, setFilterStatus] = useState('');

  // States for printing recap
  const [rekapMonth, setRekapMonth] = useState(() => (new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [rekapYear, setRekapYear] = useState(() => new Date().getFullYear().toString());
  const [rekapEmployeeId, setRekapEmployeeId] = useState('all');
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const getMonthNameIndoLocal = (mCode: string) => {
    const months: Record<string, string> = {
      'all': 'Semua Bulan',
      '01': 'Januari', '02': 'Februari', '03': 'Maret', '04': 'April',
      '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Agustus',
      '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember'
    };
    return months[mCode] || mCode;
  };

  const handleExportAttendanceToCSV = (filteredLogs: AttendanceRecord[]) => {
    const headers = [
      "No",
      "Tanggal",
      "Waktu",
      "Nama Pegawai",
      "NIP / ID",
      "Tipe Absen",
      "Status Kehadiran",
      "Jarak GPS (meter)",
      "Keterangan/Notes"
    ];
    
    const rows = filteredLogs.map((rec, idx) => {
      let formattedDate = rec.date || '';
      try {
        if (rec.date) {
          const d = new Date(rec.date);
          formattedDate = d.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
        }
      } catch (e) {}
      
      return [
        idx + 1,
        formattedDate,
        rec.time || '-',
        rec.employeeName || '-',
        rec.employeeId || '-',
        rec.type === 'Masuk' ? 'Presensi Masuk' : 'Presensi Pulang',
        rec.status || '-',
        rec.distance && rec.distance !== '-' ? `${rec.distance}m` : '-',
        rec.notes || '-'
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(';'), ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';'))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Rekap_Log_Kehadiran_${getMonthNameIndoLocal(rekapMonth)}_${rekapYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPayrollToCSV = (rekapRows: any[]) => {
    const headers = [
      "No",
      "Nama Pegawai",
      "NIP / ID",
      "Jabatan",
      "Gaji Pokok",
      "Total Hadir",
      "Total Terlambat",
      "Total Sakit/Cuti/Dinas",
      "Potongan Denda",
      "Gaji Bersih"
    ];

    const rows = rekapRows.map((row, idx) => [
      idx + 1,
      row.name,
      row.id,
      row.role,
      `Rp ${row.gajiPokok.toLocaleString('id-ID')}`,
      row.totalHadir,
      row.totalTerlambat,
      row.totalSakit + row.totalCuti + row.totalDinas,
      `Rp ${row.totalDenda.toLocaleString('id-ID')}`,
      `Rp ${row.gajiBersih.toLocaleString('id-ID')}`
    ]);

    const csvContent = "\uFEFF" + [headers.join(';'), ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';'))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Rekap_Payroll_Gaji_${getMonthNameIndoLocal(rekapMonth)}_${rekapYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportToPDF = () => {
    const element = document.getElementById('print-section');
    if (!element) {
      alert('Elemen rekap tidak ditemukan. Pastikan Anda membuka Pratinjau terlebih dahulu.');
      return;
    }

    setIsGeneratingPDF(true);

    const loadScript = (url: string): Promise<any> => {
      return new Promise((resolve, reject) => {
        if ((window as any).html2pdf) {
          resolve((window as any).html2pdf);
          return;
        }
        const script = document.createElement('script');
        script.src = url;
        script.onload = () => resolve((window as any).html2pdf);
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    const oklchCache: Record<string, string> = {};
    const resolveOklch = (match: string) => {
      if (oklchCache[match]) return oklchCache[match];
      try {
        const tempDiv = document.createElement('div');
        tempDiv.style.color = match;
        document.body.appendChild(tempDiv);
        const resolvedColor = window.getComputedStyle(tempDiv).color;
        document.body.removeChild(tempDiv);
        oklchCache[match] = resolvedColor || 'rgb(0, 0, 0)';
        return oklchCache[match];
      } catch (e) {
        return 'rgb(0, 0, 0)';
      }
    };

    const prepareStyles = async () => {
      const restored: any[] = [];
      
      // 1. Handle style element
      const styles = Array.from(document.querySelectorAll('style'));
      for (const style of styles) {
        const originalText = style.textContent;
        if (originalText && originalText.includes('oklch')) {
          const sanitized = originalText.replace(/oklch\([^)]+\)/g, resolveOklch);
          style.textContent = sanitized;
          restored.push({ element: style, originalText });
        }
      }

      // 2. Handle link element
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      for (const link of links) {
        try {
          const href = link.getAttribute('href');
          if (href) {
            const response = await fetch(href);
            const cssText = await response.text();
            if (cssText.includes('oklch')) {
              const sanitized = cssText.replace(/oklch\([^)]+\)/g, resolveOklch);
              const newStyle = document.createElement('style');
              newStyle.textContent = sanitized;
              newStyle.setAttribute('data-pdf-sanitized', 'true');
              document.head.appendChild(newStyle);
              
              (link as any).disabled = true;
              restored.push({ 
                element: link, 
                action: 'link', 
                newStyleElement: newStyle 
              });
            }
          }
        } catch (err) {
          console.warn('Could not sanitize link stylesheet:', err);
        }
      }
      return restored;
    };

    const restoreStyles = (restored: any[]) => {
      for (const item of restored) {
        if (item.action === 'link') {
          (item.element as any).disabled = false;
          if (item.newStyleElement && item.newStyleElement.parentNode) {
            item.newStyleElement.parentNode.removeChild(item.newStyleElement);
          }
        } else {
          item.element.textContent = item.originalText;
        }
      }
    };

    let restoredStylesList: any[] = [];

    prepareStyles()
      .then((restored) => {
        restoredStylesList = restored;
        return loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js');
      })
      .then((html2pdf: any) => {
        const opt = {
          margin:       0.3,
          filename:     `Laporan_Kehadiran_Sipeg_${rekapMonth}_${rekapYear}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, logging: false },
          jsPDF:        { unit: 'in', format: 'a4', orientation: 'landscape' }
        };
        return html2pdf().from(element).set(opt).save();
      })
      .catch((err) => {
        console.error('Gagal memuat html2pdf:', err);
        alert('Gagal mengekspor PDF secara otomatis. Silakan gunakan tombol "Cetak Sekarang (Print)" dan pilih opsi "Simpan sebagai PDF" di dialog browser Anda.');
      })
      .finally(() => {
        restoreStyles(restoredStylesList);
        setIsGeneratingPDF(false);
      });
  };

  const handleQuickExportAttendance = () => {
    const filteredLogs = attendance.filter(record => {
      if (!record.date) return false;
      if (rekapEmployeeId !== 'all' && record.employeeId !== rekapEmployeeId) return false;
      
      const recYear = record.date.substring(0, 4);
      const recMonth = record.date.substring(5, 7);
      
      const matchesMonth = rekapMonth === 'all' || recMonth === rekapMonth;
      const matchesYear = rekapYear === 'all' || recYear === rekapYear;
      return matchesMonth && matchesYear;
    });

    filteredLogs.sort((a, b) => {
      const dateComp = (a.date || '').localeCompare(b.date || '');
      if (dateComp !== 0) return dateComp;
      return (a.time || '').localeCompare(b.time || '');
    });

    handleExportAttendanceToCSV(filteredLogs);
  };

  const handleQuickExportPayroll = () => {
    const filteredEmployeesForRekap = rekapEmployeeId === 'all'
      ? employees
      : employees.filter(emp => emp.id === rekapEmployeeId);

    const rekapRows = filteredEmployeesForRekap.map((emp) => {
      const empRecords = attendance.filter(record => {
        if (record.employeeId !== emp.id) return false;
        if (!record.date) return false;
        const recYear = record.date.substring(0, 4);
        const recMonth = record.date.substring(5, 7);
        
        const matchesMonth = rekapMonth === 'all' || recMonth === rekapMonth;
        const matchesYear = rekapYear === 'all' || recYear === rekapYear;
        return matchesMonth && matchesYear;
      });

      const totalHadir = empRecords.filter(r => r.type === 'Masuk').length;
      const totalTerlambat = empRecords.filter(r => r.type === 'Masuk' && r.status === 'Terlambat').length;
      const totalTepatWaktu = empRecords.filter(r => r.type === 'Masuk' && r.status === 'Tepat Waktu').length;
      const totalSakit = empRecords.filter(r => r.status === 'Sakit').length;
      const totalCuti = empRecords.filter(r => r.status === 'Cuti').length;
      const totalDinas = empRecords.filter(r => r.status === 'Dinas Luar').length;
      
      const totalDenda = empRecords.reduce((sum, r) => {
        const matchPotongan = r.notes?.match(/Potongan:\s*Rp\s*([\d\.]+)/i);
        if (matchPotongan && matchPotongan[1]) {
          const cleanNum = matchPotongan[1].replace(/\./g, '');
          const parsed = parseInt(cleanNum, 10);
          if (!isNaN(parsed)) return sum + parsed;
        }

        const matchTerlambat = r.notes?.match(/Terlambat\s*(\d+)m/i);
        if (matchTerlambat && matchTerlambat[1]) {
          const mins = parseInt(matchTerlambat[1], 10);
          const rate = schoolConfig.latePenaltyPerMinute ?? 1000;
          return sum + (mins * rate);
        }

        const matchMendahului = r.notes?.match(/Mendahului\s*(?:Pulang\s*)?(\d+)m/i);
        if (matchMendahului && matchMendahului[1]) {
          const mins = parseInt(matchMendahului[1], 10);
          const rate = schoolConfig.earlyPenaltyPerMinute ?? 1000;
          return sum + (mins * rate);
        }

        return sum + (r.penaltyAmount || 0);
      }, 0);
      const gajiPokok = emp.baseSalary || 4000000;
      const gajiBersih = Math.max(0, gajiPokok - totalDenda);

      return {
        id: emp.id,
        name: emp.name,
        role: emp.role,
        gajiPokok,
        totalHadir,
        totalTerlambat,
        totalTepatWaktu,
        totalSakit,
        totalCuti,
        totalDinas,
        totalDenda,
        gajiBersih
      };
    });

    handleExportPayrollToCSV(rekapRows);
  };

  // Leave Request Approval States
  const [approvalSubmitting, setApprovalSubmitting] = useState<string | null>(null);

  // Leave Request Confirmation Modal States
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'approve' | 'reject';
    request: any;
    diffDays: number;
  } | null>(null);

  const [adminNotification, setAdminNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const handleApproveLeave = (req: any) => {
    const start = new Date(req.startDate);
    const end = new Date(req.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    setConfirmModal({
      isOpen: true,
      type: 'approve',
      request: req,
      diffDays,
    });
  };

  const handleRejectLeave = (req: any) => {
    setConfirmModal({
      isOpen: true,
      type: 'reject',
      request: req,
      diffDays: 0,
    });
  };

  const executeApproveLeave = async (req: any) => {
    setApprovalSubmitting(req.id);
    try {
      // 1. Update status to 'Disetujui' in "Pengajuan" tab
      await updateLeaveRequestStatus(spreadsheetId, accessToken, req.id, 'Disetujui');

      // 2. Generate and write attendance records into "Absensi" tab for each day
      const start = new Date(req.startDate);
      const end = new Date(req.endDate);
      const dates: string[] = [];
      const current = new Date(start);
      while (current <= end) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }

      const now = new Date();
      const timestamp = now.toLocaleString('id-ID', { hour12: false });

      for (const d of dates) {
        // Record for Check-In ("Masuk")
        const recordMasuk: AttendanceRecord = {
          timestamp,
          employeeId: req.employeeId,
          employeeName: req.employeeName,
          type: 'Masuk',
          date: d,
          time: schoolConfig.checkInStart || '07:30:00', // standard start hour or set from config
          coordinates: '-',
          distance: req.type === 'Dinas Luar' ? 'Dinas Luar' : '-',
          status: req.type as any,
          notes: `[Disetujui Admin] ${req.reason}`,
        };
        await saveAttendanceRecord(spreadsheetId, accessToken, recordMasuk);

        // Record for Check-Out ("Pulang")
        const recordPulang: AttendanceRecord = {
          timestamp,
          employeeId: req.employeeId,
          employeeName: req.employeeName,
          type: 'Pulang',
          date: d,
          time: '15:00:00', // standard check out or set from config
          coordinates: '-',
          distance: req.type === 'Dinas Luar' ? 'Dinas Luar' : '-',
          status: req.type as any,
          notes: `[Disetujui Admin] ${req.reason}`,
        };
        await saveAttendanceRecord(spreadsheetId, accessToken, recordPulang);
      }

      await onRefreshData();
      setAdminNotification({
        message: `Pengajuan ${req.type} berhasil disetujui dan telah terintegrasi otomatis ke dalam riwayat absensi.`,
        type: 'success'
      });
      setTimeout(() => setAdminNotification(null), 8000);
    } catch (err: any) {
      console.error(err);
      setAdminNotification({
        message: 'Gagal menyetujui pengajuan: ' + err.message,
        type: 'error'
      });
    } finally {
      setApprovalSubmitting(null);
    }
  };

  const executeRejectLeave = async (req: any) => {
    setApprovalSubmitting(req.id);
    try {
      await updateLeaveRequestStatus(spreadsheetId, accessToken, req.id, 'Ditolak');
      await onRefreshData();
      setAdminNotification({
        message: `Pengajuan ${req.type} telah ditolak.`,
        type: 'success'
      });
      setTimeout(() => setAdminNotification(null), 5000);
    } catch (err: any) {
      console.error(err);
      setAdminNotification({
        message: 'Gagal menolak pengajuan: ' + err.message,
        type: 'error'
      });
    } finally {
      setApprovalSubmitting(null);
    }
  };

  // Handle Add Employee
  const handleAddEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpId || !newEmpName || !newEmpEmail) {
      alert('Isi semua data pegawai.');
      return;
    }

    setEmpSubmitting(true);
    setEmpSuccess(null);
    try {
      const isExist = employees.some(emp => emp.id === newEmpId);
      if (isExist) {
        throw new Error('Pegawai dengan NIP / ID tersebut sudah terdaftar.');
      }

      const finalRole = (newEmpRole === 'Lainnya' || newEmpRoleIsCustom)
        ? (newEmpRoleCustomVal.trim() || 'Lainnya')
        : newEmpRole.trim();

      const emp: Employee = {
        id: newEmpId.trim(),
        name: newEmpName.trim(),
        role: finalRole,
        email: newEmpEmail.trim().toLowerCase(),
        baseSalary: Number(newEmpSalary) || 0,
      };

      await addEmployee(spreadsheetId, accessToken, emp);
      await onRefreshData();

      setNewEmpId('');
      setNewEmpName('');
      setNewEmpEmail('');
      setNewEmpRoleCustomVal('');
      setNewEmpRoleIsCustom(false);
      setNewEmpRole('Guru Kelas');
      setEmpSuccess(`Pegawai "${emp.name}" berhasil ditambahkan ke database Google Sheets!`);
      setTimeout(() => setEmpSuccess(null), 5000);
    } catch (err: any) {
      console.error(err);
      alert('Gagal menambah pegawai: ' + err.message);
    } finally {
      setEmpSubmitting(false);
    }
  };

  // Open Employee Edit Modal and populate fields
  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditEmpName(emp.name);
    
    const standardRoles = ["Kepala Sekolah", "Guru Kelas", "Guru Mapel", "Staf Tata Usaha", "Pustakawan", "Penjaga Sekolah"];
    if (standardRoles.includes(emp.role)) {
      setEditEmpRole(emp.role);
      setEditEmpRoleIsCustom(false);
      setEditEmpRoleCustomVal('');
    } else {
      setEditEmpRole('Lainnya');
      setEditEmpRoleIsCustom(true);
      setEditEmpRoleCustomVal(emp.role);
    }
    
    setEditEmpEmail(emp.email);
    setEditEmpSalary(emp.baseSalary || 4000000);
    setEditEmpInStart(emp.checkInStart || '');
    setEditEmpInEnd(emp.checkInEnd || '');
    setEditEmpOutStartMonThu(emp.checkOutStartMonThu || '');
    setEditEmpOutEndMonThu(emp.checkOutEndMonThu || '');
    setEditEmpOutStartFri(emp.checkOutStartFri || '');
    setEditEmpOutEndFri(emp.checkOutEndFri || '');
  };

  // Submit Updated Employee data
  const handleEditEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    setEditSubmitting(true);
    try {
      const finalRole = (editEmpRole === 'Lainnya' || editEmpRoleIsCustom)
        ? (editEmpRoleCustomVal.trim() || 'Lainnya')
        : editEmpRole.trim();

      const updated: Employee = {
        ...editingEmployee,
        name: editEmpName.trim(),
        role: finalRole,
        email: editEmpEmail.trim().toLowerCase(),
        baseSalary: Number(editEmpSalary) || 0,
        checkInStart: editEmpInStart || undefined,
        checkInEnd: editEmpInEnd || undefined,
        checkOutStartMonThu: editEmpOutStartMonThu || undefined,
        checkOutEndMonThu: editEmpOutEndMonThu || undefined,
        checkOutStartFri: editEmpOutStartFri || undefined,
        checkOutEndFri: editEmpOutEndFri || undefined,
      };

      await updateEmployee(spreadsheetId, accessToken, updated);
      await onRefreshData();
      setEditingEmployee(null);
      
      setAdminNotification({
        message: `Data pegawai "${updated.name}" berhasil diperbarui di Google Sheets!`,
        type: 'success'
      });
      setTimeout(() => setAdminNotification(null), 5000);
    } catch (err: any) {
      console.error(err);
      alert('Gagal memperbarui data pegawai: ' + err.message);
    } finally {
      setEditSubmitting(false);
    }
  };

  // Handle Update Location Config & Holiday Rules
  const handleUpdateLocation = (e: React.FormEvent) => {
    e.preventDefault();
    const config: SchoolConfig = {
      name: schoolName,
      address: schoolAddress,
      latitude: Number(schoolLat),
      longitude: Number(schoolLng),
      radius: Number(schoolRad),
      checkInStart,
      checkInEnd,
      checkOutStartMonThu,
      checkOutEndMonThu,
      checkOutStartFri,
      checkOutEndFri,
      disableSatSun,
      holidays,
      latePenaltyPerMinute: Number(latePenaltyPerMinute) || 0,
      earlyPenaltyPerMinute: Number(earlyPenaltyPerMinute) || 0,
      logoUrl: schoolConfig.logoUrl,
      backgroundUrl: schoolConfig.backgroundUrl,
    };
    onUpdateSchoolConfig(config);
    setLocSuccess('Konfigurasi sekolah, aturan libur, & denda keterlambatan berhasil diperbarui!');
    setTimeout(() => setLocSuccess(null), 5000);
  };

  // Holiday rule controllers
  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayDate || !newHolidayLabel.trim()) return;

    const isExist = holidays.some(h => h.date === newHolidayDate);
    if (isExist) {
      alert('Hari libur untuk tanggal tersebut sudah terdaftar.');
      return;
    }

    const updatedHolidays = [...holidays, { date: newHolidayDate, label: newHolidayLabel.trim() }].sort(
      (a, b) => a.date.localeCompare(b.date)
    );
    setHolidays(updatedHolidays);
    setNewHolidayDate('');
    setNewHolidayLabel('');

    // Persist into config
    const config: SchoolConfig = {
      name: schoolName,
      address: schoolAddress,
      latitude: Number(schoolLat),
      longitude: Number(schoolLng),
      radius: Number(schoolRad),
      checkInStart,
      checkInEnd,
      checkOutStartMonThu,
      checkOutEndMonThu,
      checkOutStartFri,
      checkOutEndFri,
      disableSatSun,
      holidays: updatedHolidays,
      latePenaltyPerMinute,
      earlyPenaltyPerMinute,
      logoUrl: schoolConfig.logoUrl,
      backgroundUrl: schoolConfig.backgroundUrl,
    };
    onUpdateSchoolConfig(config);
  };

  const handleDeleteHoliday = (dateToDelete: string) => {
    const updatedHolidays = holidays.filter(h => h.date !== dateToDelete);
    setHolidays(updatedHolidays);

    // Persist into config
    const config: SchoolConfig = {
      name: schoolName,
      address: schoolAddress,
      latitude: Number(schoolLat),
      longitude: Number(schoolLng),
      radius: Number(schoolRad),
      checkInStart,
      checkInEnd,
      checkOutStartMonThu,
      checkOutEndMonThu,
      checkOutStartFri,
      checkOutEndFri,
      disableSatSun,
      holidays: updatedHolidays,
      latePenaltyPerMinute,
      earlyPenaltyPerMinute,
      logoUrl: schoolConfig.logoUrl,
      backgroundUrl: schoolConfig.backgroundUrl,
    };
    onUpdateSchoolConfig(config);
  };

  // Handle Update Spreadsheet ID
  const handleUpdateSpreadsheet = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = sheetIdInput.trim();
    if (!cleanId) return;

    try {
      localStorage.setItem('absensi_spreadsheet_id', cleanId);
      onUpdateSpreadsheetId(cleanId);
      setSheetIdSuccess('ID Spreadsheet berhasil diupdate. Memuat data baru...');
      await onRefreshData();
      setTimeout(() => setSheetIdSuccess(null), 4000);
    } catch (err: any) {
      alert('Gagal memperbarui ID Spreadsheet: ' + err.message);
    }
  };

  // Metrics calculation
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter(record => record.date === todayStr);

  const totalEmployees = employees.length;
  const loggedInToday = todayAttendance.filter(r => r.type === 'Masuk');
  
  const totalOnTime = loggedInToday.filter(r => r.status === 'Tepat Waktu').length;
  const totalLate = loggedInToday.filter(r => r.status === 'Terlambat').length;
  const totalSick = todayAttendance.filter(r => r.status === 'Sakit').length;
  const totalCuti = todayAttendance.filter(r => r.status === 'Cuti').length;
  const totalDinas = todayAttendance.filter(r => r.status === 'Dinas Luar').length;
  
  // Absent calculation
  const presentEmployeeIds = new Set(todayAttendance.map(r => r.employeeId));
  const totalAbsent = totalEmployees - presentEmployeeIds.size;

  // Filter attendance records
  const filteredAttendance = attendance.filter(record => {
    if (filterEmployeeId && record.employeeId !== filterEmployeeId) return false;
    if (filterDate && record.date !== filterDate) return false;
    if (filterStatus && record.status !== filterStatus) return false;
    return true;
  }).sort((a, b) => {
    const parseDateSafe = (dStr?: string, tStr?: string) => {
      if (!dStr) return 0;
      const cleanTime = (tStr || '00:00:00').split(' ')[0];
      if (dStr.includes('/')) {
        const parts = dStr.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          const timeParts = cleanTime.split(':').map(Number);
          const parsed = new Date(year, month, day, timeParts[0] || 0, timeParts[1] || 0, timeParts[2] || 0);
          return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
        }
      }
      const parsed = new Date(`${dStr}T${cleanTime}`);
      if (!isNaN(parsed.getTime())) return parsed.getTime();
      const parts = dStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const timeParts = cleanTime.split(':').map(Number);
        const parsed = new Date(year, month, day, timeParts[0] || 0, timeParts[1] || 0, timeParts[2] || 0);
        return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
      }
      return 0;
    };
    return parseDateSafe(b.date, b.time) - parseDateSafe(a.date, a.time);
  });

  // Print preview calculations
  const getMonthNameIndo = (mCode: string) => {
    const list: Record<string, string> = {
      '01': 'Januari', '02': 'Februari', '03': 'Maret', '04': 'April',
      '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Agustus',
      '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember',
      'all': 'Semua Bulan'
    };
    return list[mCode] || mCode;
  };

  const filteredEmployeesForRekap = rekapEmployeeId === 'all'
    ? employees
    : employees.filter(emp => emp.id === rekapEmployeeId);

  const computedRekapRows = filteredEmployeesForRekap.map((emp) => {
    const empRecords = attendance.filter(record => {
      if (record.employeeId !== emp.id) return false;
      if (!record.date) return false;
      const recYear = record.date.substring(0, 4);
      const recMonth = record.date.substring(5, 7);
      
      const matchesMonth = rekapMonth === 'all' || recMonth === rekapMonth;
      const matchesYear = rekapYear === 'all' || recYear === rekapYear;
      return matchesMonth && matchesYear;
    });

    const totalHadir = empRecords.filter(r => r.type === 'Masuk').length;
    const totalTerlambat = empRecords.filter(r => r.type === 'Masuk' && r.status === 'Terlambat').length;
    const totalTepatWaktu = empRecords.filter(r => r.type === 'Masuk' && r.status === 'Tepat Waktu').length;
    const totalSakit = empRecords.filter(r => r.status === 'Sakit').length;
    const totalCuti = empRecords.filter(r => r.status === 'Cuti').length;
    const totalDinas = empRecords.filter(r => r.status === 'Dinas Luar').length;
    
    const totalDenda = empRecords.reduce((sum, r) => {
      const matchPotongan = r.notes?.match(/Potongan:\s*Rp\s*([\d\.]+)/i);
      if (matchPotongan && matchPotongan[1]) {
        const cleanNum = matchPotongan[1].replace(/\./g, '');
        const parsed = parseInt(cleanNum, 10);
        if (!isNaN(parsed)) return sum + parsed;
      }

      const matchTerlambat = r.notes?.match(/Terlambat\s*(\d+)m/i);
      if (matchTerlambat && matchTerlambat[1]) {
        const mins = parseInt(matchTerlambat[1], 10);
        const rate = schoolConfig.latePenaltyPerMinute ?? 1000;
        return sum + (mins * rate);
      }

      const matchMendahului = r.notes?.match(/Mendahului\s*(?:Pulang\s*)?(\d+)m/i);
      if (matchMendahului && matchMendahului[1]) {
        const mins = parseInt(matchMendahului[1], 10);
        const rate = schoolConfig.earlyPenaltyPerMinute ?? 1000;
        return sum + (mins * rate);
      }

      return sum + (r.penaltyAmount || 0);
    }, 0);
    const gajiPokok = emp.baseSalary || 4000000;
    const gajiBersih = Math.max(0, gajiPokok - totalDenda);

    return {
      id: emp.id,
      name: emp.name,
      role: emp.role,
      gajiPokok,
      totalHadir,
      totalTerlambat,
      totalTepatWaktu,
      totalSakit,
      totalCuti,
      totalDinas,
      totalDenda,
      gajiBersih
    };
  });

  const filteredAttendanceForReport = attendance.filter(record => {
    if (!record.date) return false;
    if (rekapEmployeeId !== 'all' && record.employeeId !== rekapEmployeeId) return false;
    
    const recYear = record.date.substring(0, 4);
    const recMonth = record.date.substring(5, 7);
    
    const matchesMonth = rekapMonth === 'all' || recMonth === rekapMonth;
    const matchesYear = rekapYear === 'all' || recYear === rekapYear;
    return matchesMonth && matchesYear;
  });

  // Sort report attendance
  const sortedAttendanceForReport = [...filteredAttendanceForReport].sort((a, b) => {
    const dateComp = (a.date || '').localeCompare(b.date || '');
    if (dateComp !== 0) return dateComp;
    return (a.time || '').localeCompare(b.time || '');
  });

  return (
    <div className="relative overflow-hidden p-4 md:p-6 bg-slate-50 border border-slate-200 rounded-xl">
      {/* Background Motif */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-50 bg-repeat" 
        style={{ 
          backgroundImage: `url("${schoolConfig.backgroundUrl || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=1200'} ")`,
          backgroundSize: '240px'
        }}
      />

      <div className="relative z-10 space-y-6">
      
        {/* Luxury Elegant Dashboard Header */}
        <div className="bg-white/95 backdrop-blur-md border border-amber-200/80 p-5 rounded-2xl shadow-lg relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300">
          {/* Subtle gold shine effect */}
          <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-transparent via-amber-200/10 to-transparent skew-x-12 -translate-x-40 animate-pulse pointer-events-none" />
          
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl text-white shadow-md shadow-amber-500/20 shrink-0">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-black uppercase tracking-widest rounded-full border border-amber-200 shadow-xs">
                  Sistem Informasi Presensi & Payroll
                </span>
                <span className="text-[9px] font-bold text-slate-400 font-mono tracking-widest uppercase">
                  v3.5 Executive Suite
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight mt-1 flex items-center gap-2 font-sans">
                {schoolConfig.name || "SD NEGERI 7 PEDUNGAN"}
                <Sparkles className="w-5 h-5 text-amber-500 animate-bounce shrink-0" />
              </h1>
              <p className="text-[11px] text-slate-500 font-medium leading-normal mt-0.5">
                Panel Utama Administrator • Pemantauan Presensi GPS Terpadu, Persetujuan Izin Resmi & Rekapitulasi Otomatis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-amber-50/80 border border-amber-200/50 px-4 py-2.5 rounded-xl text-left shadow-2xs self-stretch md:self-auto shrink-0">
            <div className="space-y-0.5">
              <div className="text-[8px] font-bold text-amber-700 uppercase tracking-widest">Kredibilitas Portal</div>
              <div className="text-xs font-black text-slate-800 tracking-wide uppercase">SDN 7 Pedungan</div>
              <div className="text-[9px] font-bold text-slate-500">Tingkat Akurasi Geofencing Tinggi</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Menu + Theme Switcher */}
       <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-200 gap-4 pb-2">
         <div className="flex border-b border-slate-200 overflow-x-auto gap-2 no-scrollbar w-full sm:w-auto">
           {[
             { id: 'rekap', label: 'Rekap Absensi', icon: FileSpreadsheet },
             { id: 'persetujuan', label: 'Persetujuan Izin', icon: UserCheck, badge: leaveRequests.filter(req => req.status === 'Pending').length },
             { id: 'pegawai', label: 'Data Pegawai', icon: Users },
             { id: 'lokasi', label: 'Lokasi & GPS', icon: MapPin },
             { id: 'pengaturan', label: 'Pengaturan Database', icon: Settings },
           ].map(tab => {
             const Icon = tab.icon;
             const isSelected = activeTab === tab.id;
             return (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as any)}
                 className={`flex items-center gap-2 px-3 py-2.5 border-b-2 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-150 active:scale-95 active:translate-y-[1px] cursor-pointer relative ${
                   isSelected
                     ? `${currentTheme.primaryText} border-current`
                     : 'border-transparent text-slate-500 hover:text-slate-800'
                 }`}
                 id={`tab-admin-${tab.id}`}
               >
                 <Icon className="w-3.5 h-3.5" />
                 <span>{tab.label}</span>
                 {!!tab.badge && (
                   <span className="px-1.5 py-0.5 text-[8px] font-black bg-red-600 text-white rounded-full animate-pulse shrink-0">
                     {tab.badge}
                   </span>
                 )}
               </button>
             );
           })}
         </div>

         {/* Cool Theme Switcher + General Refresh Button */}
          <button
            onClick={async () => {
              setIsRefreshing(true);
              try {
                await onRefreshData();
              } catch (err) {
                console.error(err);
              } finally {
                setIsRefreshing(false);
              }
            }}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 shrink-0 mr-1"
            id="btn-admin-header-general-refresh"
            title="Refresh Data dari Google Sheets"
          >
            <RefreshCw className={`w-3 h-3 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Memuat...' : 'Refresh'}</span>
          </button>
         <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-full self-start sm:self-auto border border-slate-200/60 shadow-inner">
           <Palette className={`w-3.5 h-3.5 ${currentTheme.primaryText} ml-1`} />
           <span className="text-[10px] font-bold text-slate-500 uppercase pr-1 hidden md:inline">Tema:</span>
           {ADMIN_THEMES.map(t => (
             <button
               key={t.id}
               onClick={() => {
                 setAdminTheme(t.id);
                 localStorage.setItem('admin_portal_theme', t.id);
               }}
               title={t.name}
               className={`w-5 h-5 rounded-full transition-all duration-150 active:scale-75 border cursor-pointer ${
                 adminTheme === t.id 
                   ? 'ring-2 ring-slate-400 ring-offset-1 border-white scale-110 shadow-sm' 
                   : 'border-transparent opacity-80 hover:opacity-100 hover:scale-105'
               } ${t.previewCircle}`}
               id={`theme-btn-${t.id}`}
             />
           ))}
         </div>
       </div>

      {/* REKAP TAB */}
      {activeTab === 'rekap' && (
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <SectionHeader
            title="Rekapitulasi Absensi & Payroll Bulanan"
            subtitle="Laporan analisis kehadiran berkala, perhitungan denda keterlambatan otomatis, dan pencetakan slip gaji/KOP surat resmi."
            icon={FileSpreadsheet}
          />
          
          {/* Bento Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            
            <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm text-center">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Total Pegawai</span>
              <p className="text-xl font-black text-slate-800 mt-1">{totalEmployees}</p>
            </div>

            <div className={`p-3 ${currentTheme.lightBg} border ${currentTheme.borderCol} rounded-lg shadow-sm text-center transition-all duration-300`}>
              <span className={`text-[9px] font-bold uppercase tracking-widest ${currentTheme.accentText}`}>Hadir Tepat Waktu</span>
              <p className={`text-xl font-black ${currentTheme.primaryText} mt-1`}>{totalOnTime}</p>
            </div>

            <div className="p-3 bg-red-50/50 border border-red-200 rounded-lg shadow-sm text-center">
              <span className="text-[9px] font-bold uppercase tracking-widest text-red-600">Terlambat</span>
              <p className="text-xl font-black text-red-700 mt-1">{totalLate}</p>
            </div>

            <div className="p-3 bg-orange-50/50 border border-orange-200 rounded-lg shadow-sm text-center">
              <span className="text-[9px] font-bold uppercase tracking-widest text-orange-600">Sakit / Cuti</span>
              <p className="text-xl font-black text-orange-700 mt-1">{totalSick + totalCuti}</p>
            </div>

            <div className="p-3 bg-violet-50/50 border border-violet-200 rounded-lg shadow-sm text-center">
              <span className="text-[9px] font-bold uppercase tracking-widest text-violet-600">Dinas Luar</span>
              <p className="text-xl font-black text-violet-700 mt-1">{totalDinas}</p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg shadow-sm text-center">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Belum Hadir</span>
              <p className="text-xl font-black text-slate-600 mt-1">{totalAbsent}</p>
            </div>

          </div>

          {/* CARD CETAK REKAP BULANAN */}
          <div className={`bg-gradient-to-r ${currentTheme.gradient} text-white rounded-lg p-4 shadow-sm space-y-4 transition-all duration-300`}>
            <div className="flex items-center gap-2 border-b border-white/10 pb-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-100">Cetak Rekap Absensi & Gaji Bulanan</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Filter dan cetak laporan kehadiran serta perhitungan denda gaji pegawai</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1 pl-0.5">Pilih Bulan</label>
                <select
                  value={rekapMonth}
                  onChange={(e) => setRekapMonth(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white/10 border border-white/10 rounded text-xs text-white focus:outline-none focus:bg-slate-950 focus:border-emerald-500 cursor-pointer font-bold"
                >
                  <option value="all" className="text-slate-800 font-semibold">Semua Bulan</option>
                  <option value="01" className="text-slate-800 font-semibold">Januari</option>
                  <option value="02" className="text-slate-800 font-semibold">Februari</option>
                  <option value="03" className="text-slate-800 font-semibold">Maret</option>
                  <option value="04" className="text-slate-800 font-semibold">April</option>
                  <option value="05" className="text-slate-800 font-semibold">Mei</option>
                  <option value="06" className="text-slate-800 font-semibold">Juni</option>
                  <option value="07" className="text-slate-800 font-semibold">Juli</option>
                  <option value="08" className="text-slate-800 font-semibold">Agustus</option>
                  <option value="09" className="text-slate-800 font-semibold">September</option>
                  <option value="10" className="text-slate-800 font-semibold">Oktober</option>
                  <option value="11" className="text-slate-800 font-semibold">November</option>
                  <option value="12" className="text-slate-800 font-semibold">Desember</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1 pl-0.5">Pilih Tahun</label>
                <select
                  value={rekapYear}
                  onChange={(e) => setRekapYear(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white/10 border border-white/10 rounded text-xs text-white focus:outline-none focus:bg-slate-950 focus:border-emerald-500 cursor-pointer font-bold"
                >
                  <option value="all" className="text-slate-800 font-semibold">Semua Tahun</option>
                  {(() => {
                    const years = [];
                    for (let y = 2024; y <= 2050; y++) {
                      years.push(y.toString());
                    }
                    years.sort((a, b) => b.localeCompare(a));
                    return years.map(yr => (
                      <option key={yr} value={yr} className="text-slate-800 font-semibold">{yr}</option>
                    ));
                  })()}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1 pl-0.5">Pilih Pegawai</label>
                <select
                  value={rekapEmployeeId}
                  onChange={(e) => setRekapEmployeeId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white/10 border border-white/10 rounded text-xs text-white focus:outline-none focus:bg-slate-950 focus:border-emerald-500 cursor-pointer font-bold"
                >
                  <option value="all" className="text-slate-800 font-semibold">Semua Pegawai</option>
                  {employees.map((emp, idx) => (
                    <option key={`${emp.id}-${idx}`} value={emp.id} className="text-slate-800 font-semibold">
                      {emp.name} ({emp.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => setShowPrintPreview(true)}
                  className="w-full flex items-center justify-center gap-2 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 active:scale-95 text-white font-bold rounded text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Buka Preview & Cetak
                </button>
              </div>
            </div>

            {/* Quick Export Footer */}
            <div className="border-t border-white/10 pt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300">
              <span className="font-semibold text-[10px] uppercase tracking-wider text-slate-400">Ekspor Cepat ke Excel (Format .csv):</span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleQuickExportAttendance}
                  className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-emerald-300 hover:text-white rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border border-emerald-500/20"
                  title="Unduh daftar kehadiran untuk Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Excel Log Kehadiran</span>
                </button>
                <button
                  type="button"
                  onClick={handleQuickExportPayroll}
                  className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-emerald-300 hover:text-white rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border border-emerald-500/20"
                  title="Unduh rekapitulasi gaji untuk Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Excel Rekap Gaji</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-blue-600" />
                Filter Log Riwayat Kehadiran
              </h3>
              <button 
                onClick={onRefreshData}
                className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600 transition-all cursor-pointer"
                title="Refresh Data dari Google Sheets"
                id="btn-admin-refresh"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">Cari Pegawai</label>
                <select
                  value={filterEmployeeId}
                  onChange={(e) => setFilterEmployeeId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500"
                  id="filter-employee"
                >
                  <option value="">Semua Pegawai</option>
                  {employees.map((emp, idx) => (
                    <option key={`${emp.id}-${idx}`} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">Tanggal</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500 font-semibold"
                  id="filter-date"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">Status Kehadiran</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500"
                  id="filter-status"
                >
                  <option value="">Semua Status</option>
                  <option value="Tepat Waktu">Tepat Waktu</option>
                  <option value="Terlambat">Terlambat</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Cuti">Cuti</option>
                  <option value="Dinas Luar">Dinas Luar</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFilterEmployeeId('');
                    setFilterDate('');
                    setFilterStatus('');
                  }}
                  className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold uppercase tracking-wider cursor-pointer border border-slate-200"
                  id="btn-clear-filters"
                >
                  Reset Filter
                </button>
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Daftar Kehadiran Pegawai ({filteredAttendance.length})</h3>
              <a
                href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-blue-600 hover:text-blue-700 font-bold uppercase tracking-wider flex items-center gap-1"
                id="link-open-sheets"
              >
                Buka Google Sheets
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="px-4 py-2.5">Pegawai</th>
                    <th className="px-4 py-2.5">Tanggal & Waktu</th>
                    <th className="px-4 py-2.5">Tipe Absen</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Lokasi / Jarak</th>
                    <th className="px-4 py-2.5">Foto</th>
                    <th className="px-4 py-2.5">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {filteredAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-slate-400 font-semibold text-xs">
                        Tidak ada log riwayat absensi yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredAttendance.map((record, index) => (
                      <tr key={index} className="hover:bg-slate-50/50 transition-all text-[11px]">
                        <td className="px-4 py-2.5">
                          <p className="font-bold text-slate-800">{record.employeeName}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {record.employeeId}</p>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <p className="font-semibold">{record.date}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{record.time}</p>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            record.type === 'Masuk' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            record.type === 'Pulang' ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {record.type}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            record.status === 'Tepat Waktu' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                            record.status === 'Terlambat' ? 'bg-red-100 text-red-800 border border-red-200' :
                            record.status === 'Sakit' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                            record.status === 'Cuti' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                            'bg-violet-100 text-violet-800 border border-violet-200'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <p className="font-semibold">{record.distance}</p>
                          {record.coordinates && record.coordinates !== '-' && (
                            <p className="text-[9px] text-slate-400 font-mono mt-0.5">{record.coordinates}</p>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          {record.photo && record.photo.startsWith('data:') ? (
                            <img
                              src={record.photo}
                              alt="Verifikasi Foto"
                              className="w-10 h-10 object-cover rounded border border-slate-200 shadow-sm hover:scale-110 transition-all cursor-zoom-in"
                              onClick={() => setPreviewPhotoModal(record.photo || null)}
                              title="Klik untuk memperbesar"
                            />
                          ) : (
                            <span className="text-slate-400 italic text-[10px] pl-1">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 max-w-[250px] text-slate-500 font-medium" title={record.notes}>
                          {record.notes ? (
                            <div className="flex flex-col gap-1">
                              <span className="truncate block max-w-[200px]">
                                {record.notes.split('[')[0].trim()}
                              </span>
                              {record.notes.includes('[') && (
                                <span className="inline-block self-start text-[9px] font-bold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-100 font-mono tracking-wide">
                                  ⚠️ {record.notes.substring(record.notes.indexOf('[') + 1, record.notes.indexOf(']'))}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* PEGAWAI TAB */}
      {activeTab === 'pegawai' && (
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-12 gap-4"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div className="lg:col-span-12">
            <SectionHeader
              title="Manajemen Database Pegawai Resmi"
              subtitle="Pendaftaran staf pendidik baru, pengisian detail NIP, penentuan jabatan, koordinasi absensi, dan pengaturan gaji pokok."
              icon={Users}
            />
          </div>
          
          {/* Add Employee Form */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              Daftarkan Pegawai Baru
            </h3>

            {empSuccess && (
              <div className="p-2.5 bg-blue-50 border border-blue-100 text-blue-700 rounded text-xs font-semibold leading-normal">
                {empSuccess}
              </div>
            )}

            <form onSubmit={handleAddEmployeeSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">NIP / Nomor ID Pegawai</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 199001012020121001"
                  value={newEmpId}
                  onChange={(e) => setNewEmpId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-mono"
                  id="input-new-emp-id"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso, S.Pd."
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-semibold"
                  id="input-new-emp-name"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">Gaji Pokok Bulanan (Rupiah)</label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 4000000"
                  value={newEmpSalary}
                  onChange={(e) => setNewEmpSalary(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-mono font-bold"
                  id="input-new-emp-salary"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">Jabatan / Peran</label>
                <select
                  value={newEmpRole}
                  onChange={(e) => {
                    setNewEmpRole(e.target.value);
                    if (e.target.value === 'Lainnya') {
                      setNewEmpRoleIsCustom(true);
                    } else {
                      setNewEmpRoleIsCustom(false);
                    }
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-semibold"
                  id="input-new-emp-role"
                >
                  <option value="Kepala Sekolah">Kepala Sekolah</option>
                  <option value="Guru Kelas">Guru Kelas</option>
                  <option value="Guru Mapel">Guru Mapel</option>
                  <option value="Staf Tata Usaha">Staf Tata Usaha</option>
                  <option value="Pustakawan">Pustakawan</option>
                  <option value="Penjaga Sekolah">Penjaga Sekolah</option>
                  <option value="Lainnya">Lainnya (Input Manual...)</option>
                </select>
              </div>

              {(newEmpRole === 'Lainnya' || newEmpRoleIsCustom) && (
                <div className="animate-fade-in">
                  <label className="block text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1 pl-1">Sebutkan Jabatan Kustom</label>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan jabatan/peran manual..."
                    value={newEmpRoleCustomVal}
                    onChange={(e) => setNewEmpRoleCustomVal(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-blue-50/50 border border-blue-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-semibold placeholder:text-slate-400"
                    id="input-new-emp-role-custom"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">Email Akun Google</label>
                <input
                  type="email"
                  required
                  placeholder="Contoh: budi@gmail.com"
                  value={newEmpEmail}
                  onChange={(e) => setNewEmpEmail(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700"
                  id="input-new-emp-email"
                />
                <p className="text-[10px] text-slate-400 mt-1 pl-1">
                  * Harus sesuai dengan email akun Google yang akan digunakan pegawai saat login absensi.
                </p>
              </div>

              <button
                type="submit"
                disabled={empSubmitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-all disabled:opacity-50 cursor-pointer uppercase tracking-wider shadow-sm"
                id="btn-submit-employee"
              >
                {empSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                Daftarkan Pegawai
              </button>
            </form>
          </div>

          {/* Directory list */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              Direktori Pegawai Terdaftar ({employees.length})
            </h3>

            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto pr-1">
              {employees.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs font-semibold">
                  Belum ada pegawai terdaftar di tab "Pegawai".
                </div>
              ) : (
                 employees.map((emp, idx) => (
                  <div key={`${emp.id}-${idx}`} className="py-2.5 flex justify-between items-center text-xs gap-4 hover:bg-slate-50/50 px-1.5 rounded transition-all">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-slate-100 border border-slate-200 rounded flex items-center justify-center text-slate-600 font-bold shrink-0 uppercase">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-800 text-xs">{emp.name}</h4>
                          <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-100 font-bold px-1.5 rounded font-mono">
                            Rp {(emp.baseSalary || 4000000).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          NIP: {emp.id} • {emp.role}
                        </p>
                        {emp.checkInStart && (
                          <span className="inline-block mt-1 text-[9px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.5 rounded border border-amber-100 uppercase tracking-wide">
                            Jadwal Kustom Aktif
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-[10px] font-semibold">{emp.email}</p>
                        <p className="text-[10px] text-emerald-600 font-extrabold mt-1 font-mono">
                          Rp {(emp.baseSalary || 4000000).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <button
                        onClick={() => openEditModal(emp)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-300 rounded font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                        id={`btn-edit-emp-${emp.id}`}
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </motion.div>
      )}

      {/* LOKASI TAB */}
      {activeTab === 'lokasi' && (
        <motion.div 
          className="max-w-2xl mx-auto space-y-4"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <SectionHeader
            title="Konfigurasi Titik Lokasi & Radius GPS"
            subtitle="Atur koordinat pusat instansi, sesuaikan toleransi radius geofencing (meter), dan pastikan presensi pegawai presisi."
            icon={MapPin}
          />
          
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-4">
            
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Atur Titik GPS & Kunci Radius</h3>
          </div>

          <div className="p-3 bg-blue-50/50 text-slate-600 border border-blue-100 rounded text-[10px] leading-relaxed">
            <p className="font-bold mb-1 flex items-center gap-1 text-slate-700 uppercase tracking-wide">
              <AlertTriangle className="w-3.5 h-3.5 text-blue-600" />
              Cara Pengujian Radius di Rumah / Kelas:
            </p>
            Untuk mempermudah menguji coba fitur radius 100m dari rumah, Anda bisa memperbarui koordinat sekolah di bawah dengan mengambil koordinat lokasi Anda saat ini (dapat dilihat dari maps atau didapatkan secara otomatis pada dashboard pegawai), lalu isi koordinat tersebut di formulir ini.
          </div>

          {locSuccess && (
            <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-700 rounded text-xs font-semibold">
              {locSuccess}
            </div>
          )}

          <form onSubmit={handleUpdateLocation} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">Nama Instansi / Sekolah</label>
              <input
                type="text"
                required
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-semibold"
                id="input-school-name"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">Alamat Sekolah</label>
              <input
                type="text"
                required
                value={schoolAddress}
                onChange={(e) => setSchoolAddress(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-semibold"
                id="input-school-address"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={schoolLat}
                  onChange={(e) => setSchoolLat(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-mono font-bold"
                  id="input-school-lat"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={schoolLng}
                  onChange={(e) => setSchoolLng(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-mono font-bold"
                  id="input-school-lng"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">Radius Kunci (Meter)</label>
              <input
                type="number"
                required
                value={schoolRad}
                onChange={(e) => setSchoolRad(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-mono font-bold"
                id="input-school-radius"
              />
              <p className="text-[10px] text-slate-400 mt-1 pl-1 font-medium">
                * Secara default adalah 100 meter sesuai instruksi. Pegawai di luar jangkauan radius ini tidak akan bisa menekan tombol Absen Masuk/Pulang.
              </p>
            </div>

            {/* TIME CONFIGURATION SECTION */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest pl-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Sesi & Batas Waktu Absensi
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">Jam Mulai Absen Masuk</label>
                  <input
                    type="time"
                    required
                    value={checkInStart}
                    onChange={(e) => setCheckInStart(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">Jam Selesai Absen Masuk</label>
                  <input
                    type="time"
                    required
                    value={checkInEnd}
                    onChange={(e) => setCheckInEnd(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">Mulai Absen Pulang (Senin - Kamis)</label>
                  <input
                    type="time"
                    required
                    value={checkOutStartMonThu}
                    onChange={(e) => setCheckOutStartMonThu(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">Selesai Absen Pulang (Senin - Kamis)</label>
                  <input
                    type="time"
                    required
                    value={checkOutEndMonThu}
                    onChange={(e) => setCheckOutEndMonThu(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">Mulai Absen Pulang (Khusus Hari Jumat)</label>
                  <input
                    type="time"
                    required
                    value={checkOutStartFri}
                    onChange={(e) => setCheckOutStartFri(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">Selesai Absen Pulang (Khusus Hari Jumat)</label>
                  <input
                    type="time"
                    required
                    value={checkOutEndFri}
                    onChange={(e) => setCheckOutEndFri(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* WEEKEND AND HOLIDAY RULES SECTION */}
            <div className="border-t border-slate-100 pt-4 space-y-4">
              <h4 className="text-[10px] font-bold text-rose-600 uppercase tracking-widest pl-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Aturan Hari Kerja & Libur Nasional
              </h4>

              <div className="flex items-center gap-2 pl-1 bg-slate-50 p-2.5 rounded border border-slate-200">
                <input
                  type="checkbox"
                  id="checkbox-disable-satsun"
                  checked={disableSatSun}
                  onChange={(e) => setDisableSatSun(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="checkbox-disable-satsun" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                  Hari Sabtu & Minggu Libur (Pegawai tidak bisa absen)
                </label>
              </div>

              {/* Add Custom Holidays Form */}
              <div className="space-y-2 p-3 bg-slate-50 rounded border border-slate-200">
                <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider pl-0.5">Input Hari Besar / Tanggal Merah (Semua Pegawai Libur)</span>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="date"
                    value={newHolidayDate}
                    onChange={(e) => setNewHolidayDate(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 text-slate-700 font-bold"
                  />
                  <input
                    type="text"
                    placeholder="Contoh: Hari Raya Idul Fitri"
                    value={newHolidayLabel}
                    onChange={(e) => setNewHolidayLabel(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 text-slate-700 font-semibold"
                  />
                  <button
                    type="button"
                    onClick={handleAddHoliday}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold uppercase tracking-wider cursor-pointer transition-all"
                  >
                    Tambah Libur
                  </button>
                </div>

                {/* Holidays List */}
                {holidays.length > 0 ? (
                  <div className="mt-3 divide-y divide-slate-100 max-h-36 overflow-y-auto pr-1">
                    {holidays.map((h, idx) => (
                      <div key={`${h.date}-${idx}`} className="py-2 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded text-[10px]">
                            {h.date}
                          </span>
                          <span className="font-semibold text-slate-700">{h.label}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteHoliday(h.date)}
                          className="p-1 hover:bg-red-50 text-red-600 hover:text-red-700 rounded transition-all cursor-pointer"
                          title="Hapus Hari Libur"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1 pl-0.5 italic">Belum ada tanggal merah/hari besar yang diinput.</p>
                )}
              </div>
            </div>

            {/* PAYROLL SALARY PENALTY RATES SECTION */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest pl-1 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Denda Pemotongan Gaji Kehadiran
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">Denda Terlambat Masuk (per Menit)</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">Rp</span>
                    <input
                      type="number"
                      required
                      value={latePenaltyPerMinute}
                      onChange={(e) => setLatePenaltyPerMinute(Number(e.target.value))}
                      className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-mono font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">Denda Pulang Cepat (per Menit)</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">Rp</span>
                    <input
                      type="number"
                      required
                      value={earlyPenaltyPerMinute}
                      onChange={(e) => setEarlyPenaltyPerMinute(Number(e.target.value))}
                      className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 pl-1 leading-normal">
                * Keterlambatan masuk dihitung ketika lewat dari jam batas masuk. Mendahului pulang dihitung ketika keluar sebelum jam mulai absen pulang.
              </p>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-bold transition-all shadow-sm cursor-pointer uppercase tracking-wider"
              id="btn-save-location"
            >
              <Save className="w-3.5 h-3.5" />
              Simpan Konfigurasi Sekolah & Aturan Kerja
            </button>
          </form>
          </div>
        </motion.div>
      )}

      {/* PERSETUJUAN TAB */}
      {activeTab === 'persetujuan' && (
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <SectionHeader
            title="Persetujuan Izin Resmi & Dinas Luar"
            subtitle="Tinjau unggahan dokumen bukti surat keterangan, setujui/tolak permohonan dinas luar, cuti tahunan, atau izin sakit pegawai."
            badge={leaveRequests.filter(req => req.status === 'Pending').length ? `${leaveRequests.filter(req => req.status === 'Pending').length} Pending` : undefined}
            icon={UserCheck}
          />
          
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                  Persetujuan Dinas Luar, Cuti & Izin Sakit
                </h3>
              </div>
              <button 
                onClick={onRefreshData}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[10px] text-slate-500 hover:text-blue-600 font-bold uppercase tracking-wider transition-all cursor-pointer"
                id="btn-refresh-leave-requests"
              >
                <RefreshCw className="w-3 h-3" />
                Sinkronkan Data
              </button>
            </div>

            {leaveRequests.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Clock className="w-10 h-10 mx-auto text-slate-300 animate-pulse" />
                <p className="text-xs font-bold uppercase tracking-wider">Tidak ada data pengajuan</p>
                <p className="text-[11px]">Belum ada pegawai yang mengirimkan pengajuan izin, cuti, atau dinas luar.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200">
                      <th className="px-4 py-3">Pegawai</th>
                      <th className="px-4 py-3">Jenis</th>
                      <th className="px-4 py-3">Mulai s/d Selesai</th>
                      <th className="px-4 py-3">Durasi</th>
                      <th className="px-4 py-3">Alasan / Catatan</th>
                      <th className="px-4 py-3 text-center">Bukti</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {leaveRequests.map((req, idx) => {
                      const start = new Date(req.startDate);
                      const end = new Date(req.endDate);
                      const diffTime = Math.abs(end.getTime() - start.getTime());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                      let statusColor = 'bg-amber-50 text-amber-700 border-amber-200';
                      if (req.status === 'Disetujui') statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      if (req.status === 'Ditolak') statusColor = 'bg-rose-50 text-rose-700 border-rose-200';

                      let badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                      if (req.type === 'Sakit') badgeColor = 'bg-red-50 text-red-700 border-red-200';
                      if (req.type === 'Cuti') badgeColor = 'bg-orange-50 text-orange-700 border-orange-200';
                      if (req.type === 'Dinas Luar') badgeColor = 'bg-violet-50 text-violet-700 border-violet-200';

                      const isSubmitting = approvalSubmitting === req.id;

                      return (
                        <tr key={`${req.id || 'req'}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3.5">
                            <span className="font-bold text-slate-800 block">{req.employeeName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">NIP. {req.employeeId}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${badgeColor}`}>
                              {req.type}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-semibold text-slate-600 block">{req.startDate}</span>
                            <span className="text-[10px] text-slate-400">s/d {req.endDate}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-bold text-slate-700 font-mono">{diffDays} Hari</span>
                          </td>
                          <td className="px-4 py-3.5 max-w-[200px] truncate" title={req.reason}>
                            <span className="text-slate-500 italic font-medium">"{req.reason || '-'}"</span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {req.attachment ? (
                              <div className="flex items-center justify-center gap-1">
                                {req.attachment.startsWith('data:image/') ? (
                                  <button
                                    onClick={() => setSelectedEvidenceUrl(req.attachment)}
                                    className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer mx-auto"
                                    title="Lihat Bukti Gambar"
                                  >
                                    <Eye className="w-3 h-3" />
                                    Lihat
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = req.attachment;
                                      const extMatch = req.attachment.match(/^data:([^;]+);base64,/);
                                      const mime = extMatch ? extMatch[1] : '';
                                      let ext = 'bin';
                                      if (mime.includes('pdf')) ext = 'pdf';
                                      else if (mime.includes('word') || mime.includes('officedocument')) ext = 'docx';
                                      else if (mime.includes('excel') || mime.includes('sheet')) ext = 'xlsx';
                                      else if (mime.includes('text')) ext = 'txt';
                                      
                                      link.download = `bukti_${req.type.toLowerCase().replace(/\s+/g, '_')}_${req.employeeName.toLowerCase().replace(/\s+/g, '_')}.${ext}`;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                    }}
                                    className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer mx-auto"
                                    title="Unduh Bukti File"
                                  >
                                    <Download className="w-3 h-3" />
                                    Unduh
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Tidak ada</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${statusColor}`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            {req.status === 'Pending' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleApproveLeave(req)}
                                  disabled={!!approvalSubmitting}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1 shadow-sm"
                                  id={`btn-approve-${req.id}`}
                                >
                                  {isSubmitting ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <CheckCircle className="w-3 h-3" />
                                  )}
                                  Setujui
                                </button>
                                <button
                                  onClick={() => handleRejectLeave(req)}
                                  disabled={!!approvalSubmitting}
                                  className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1 shadow-sm"
                                  id={`btn-reject-${req.id}`}
                                >
                                  {isSubmitting ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <XCircle className="w-3 h-3" />
                                  )}
                                  Tolak
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                Sudah Diproses
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* PENGATURAN DATABASE TAB */}
      {activeTab === 'pengaturan' && (
        <motion.div 
          className="max-w-2xl mx-auto space-y-4"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <SectionHeader
            title="Integrasi Kredensial & Pengaturan Database"
            subtitle="Konfigurasi ID Google Spreadsheet cloud Anda, sinkronisasi token otentikasi Google, dan ubah pengaturan brand sekolah."
            icon={Settings}
          />
          
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-4">
            
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Settings className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ubah ID Spreadsheet Database</h3>
          </div>

          {sheetIdSuccess && (
            <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-700 rounded text-xs font-semibold">
              {sheetIdSuccess}
            </div>
          )}

          <form onSubmit={handleUpdateSpreadsheet} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">ID Google Spreadsheet Terkoneksi</label>
              <input
                type="text"
                required
                value={sheetIdInput}
                onChange={(e) => setSheetIdInput(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-mono"
                id="input-admin-spreadsheet-id"
              />
            </div>

            <button
              type="submit"
              disabled={sheetIdInput.trim() === spreadsheetId}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-bold transition-all disabled:opacity-50 cursor-pointer uppercase tracking-wider shadow-sm"
              id="btn-admin-save-sheet-id"
            >
              <Save className="w-3.5 h-3.5" />
              Hubungkan ke ID Spreadsheet Baru
            </button>
          </form>

          {/* UPLOAD LOGO SEKOLAH FORM */}
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2 pt-2">
            <Palette className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Logo Sekolah</h3>
          </div>

          <div className="space-y-3">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Unggah logo resmi sekolah untuk mengubah icon default di header dan menyisipkan logo secara otomatis pada kop surat cetak rekapitulasi absensi.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="w-16 h-16 bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                {schoolConfig.logoUrl ? (
                  <img src={schoolConfig.logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <School className="w-8 h-8 text-slate-400" />
                )}
              </div>

              <div className="space-y-1.5 flex-grow w-full">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer flex items-center gap-1 shadow-sm transition-all active:scale-95">
                    <Upload className="w-3.5 h-3.5" />
                    Pilih File Logo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 2 * 1024 * 1024) {
                            alert("Ukuran file logo maksimal adalah 2MB");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const base64String = reader.result as string;
                            const updatedConfig = {
                              ...schoolConfig,
                              logoUrl: base64String
                            };
                            onUpdateSchoolConfig(updatedConfig);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      id="input-logo-school-upload"
                    />
                  </label>

                  {schoolConfig.logoUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Apakah Anda yakin ingin menghapus logo sekolah ini?")) {
                          const updatedConfig = {
                            ...schoolConfig,
                            logoUrl: ""
                          };
                          onUpdateSchoolConfig(updatedConfig);
                        }
                      }}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[10px] font-bold uppercase tracking-wider rounded transition-all flex items-center gap-1 active:scale-95"
                      id="btn-delete-logo-school"
                    >
                      Hapus Logo
                    </button>
                  )}

                  {/* TOMBOL UNGGAH BACKGROUND SEKOLAH DI SEBELAH KANAN */}
                  <label className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white border border-slate-800 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer flex items-center gap-1 shadow-sm transition-all active:scale-95">
                    <Upload className="w-3.5 h-3.5" />
                    Upload BG (50%)
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 3 * 1024 * 1024) {
                            alert("Ukuran file background kustom maksimal adalah 3MB");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const base64String = reader.result as string;
                            const updatedConfig = {
                              ...schoolConfig,
                              backgroundUrl: base64String
                            };
                            onUpdateSchoolConfig(updatedConfig);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      id="input-bg-school-upload"
                    />
                  </label>

                  {schoolConfig.backgroundUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Apakah Anda yakin ingin menghapus background kustom dan kembali ke motif batik default?")) {
                          const updatedConfig = {
                            ...schoolConfig,
                            backgroundUrl: ""
                          };
                          onUpdateSchoolConfig(updatedConfig);
                        }
                      }}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200 text-[10px] font-bold uppercase tracking-wider rounded transition-all flex items-center gap-1 active:scale-95"
                      id="btn-delete-bg-school"
                    >
                      Reset BG
                    </button>
                  )}
                </div>
                <p className="text-[9px] text-slate-400 font-medium">Format yang didukung: PNG, JPG, JPEG, WEBP. Maks 2MB untuk Logo & 3MB untuk Background (otomatis diterapkan 50% opacity).</p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-2">
            <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">📋 Catatan Struktur Google Sheets:</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Spreadsheet Anda harus memiliki minimal dua sheet tab dengan nama:
            </p>
            <ul className="list-disc list-inside text-[11px] text-slate-500 pl-1 space-y-1 font-medium">
              <li><strong>"Pegawai"</strong>: Menampung daftar identitas pegawai (Kolom: NIP/ID, Nama Lengkap, Jabatan, Email).</li>
              <li><strong>"Absensi"</strong>: Menampung log riwayat kehadiran dan pengajuan izin/cuti.</li>
              <li><strong>"Pengajuan"</strong>: Menampung data pengajuan dinas luar/cuti/sakit.</li>
            </ul>
          </div>
          </div>
        </motion.div>
      )}

      {/* PENGATURAN FIREBASE */}
      {activeTab === 'pengaturan' && (
        <motion.div 
          className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-4 mt-4"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut', delay: 0.1 }}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Koneksi Proyek Firebase</h3>
            </div>
            {localStorage.getItem('sipeg_custom_firebase_config') ? (
              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[8px] font-black uppercase rounded border border-emerald-200 tracking-wider">
                Proyek Kustom Aktif
              </span>
            ) : (
              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[8px] font-black uppercase rounded border border-slate-200 tracking-wider">
                Sistem Default (Studio)
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Anda dapat memutuskan koneksi default <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-600 font-mono text-[10px]">yogic-zucchini-n9nlt</code> dan menghubungkan aplikasi ini ke proyek Firebase Anda sendiri (seperti <strong className="text-slate-700">absen-stupa-baru</strong>) untuk kustomisasi penuh.
          </p>

          {fbSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-xs font-semibold">
              {fbSuccess}
            </div>
          )}

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
            <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>⚡ Cara Praktis: Tempel & Ekstrak</span>
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Buka Firebase Console &gt; Project Settings &gt; Apps, lalu salin kode konfigurasi JavaScript/JSON Anda, tempel di bawah ini, dan klik tombol ekstrak:
            </p>
            <div className="space-y-2">
              <textarea
                value={fbPastedConfig}
                onChange={(e) => setFbPastedConfig(e.target.value)}
                placeholder={`const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "absen-stupa-baru.firebaseapp.com",
  projectId: "absen-stupa-baru",
  storageBucket: "absen-stupa-baru.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:12345:web:abcd"
};`}
                className="w-full h-24 p-2 bg-white border border-slate-200 rounded text-[10px] font-mono focus:outline-none focus:border-blue-500 text-slate-700"
              />
              <button
                type="button"
                onClick={handleAutoExtractFirebaseConfig}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer shadow-sm"
              >
                Ekstrak Parameter Otomatis
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveFirebaseConfig} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">Firebase Project ID</label>
                <input
                  type="text"
                  required
                  placeholder="absen-stupa-baru"
                  value={fbProjectId}
                  onChange={(e) => setFbProjectId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">API Key</label>
                <input
                  type="text"
                  required
                  placeholder="AIzaSy..."
                  value={fbApiKey}
                  onChange={(e) => setFbApiKey(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">App ID</label>
                <input
                  type="text"
                  placeholder="1:123456:web:abcd..."
                  value={fbAppId}
                  onChange={(e) => setFbAppId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">Auth Domain</label>
                <input
                  type="text"
                  placeholder="absen-stupa-baru.firebaseapp.com"
                  value={fbAuthDomain}
                  onChange={(e) => setFbAuthDomain(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">Storage Bucket</label>
                <input
                  type="text"
                  placeholder="absen-stupa-baru.firebasestorage.app"
                  value={fbStorageBucket}
                  onChange={(e) => setFbStorageBucket(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">Messaging Sender ID</label>
                <input
                  type="text"
                  placeholder="1234567890"
                  value={fbMessagingSenderId}
                  onChange={(e) => setFbMessagingSenderId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">Google OAuth Client ID (Opsional)</label>
              <input
                type="text"
                placeholder="123456-abcdef.apps.googleusercontent.com"
                value={fbOAuthClientId}
                onChange={(e) => setFbOAuthClientId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-mono text-[10px]"
              />
              <p className="text-[9px] text-slate-400 mt-1 pl-1">
                Catatan: Diperlukan untuk proses Google Sign-In jika Anda menggunakan domain hosting Anda sendiri.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-all cursor-pointer uppercase tracking-wider shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                Simpan & Hubungkan Proyek Baru
              </button>
              {localStorage.getItem('sipeg_custom_firebase_config') && (
                <button
                  type="button"
                  onClick={handleResetFirebaseConfig}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-xs font-bold transition-all cursor-pointer uppercase tracking-wider shadow-sm"
                >
                  Reset ke Default
                </button>
              )}
            </div>
          </form>
        </motion.div>
      )}

      {/* ADMIN NOTIFICATION TOAST BAR */}
      {adminNotification && (
        <div className="fixed bottom-4 right-4 z-50 animate-bounce max-w-sm">
          <div className={`p-4 rounded-lg shadow-xl border flex items-start gap-3 ${
            adminNotification.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Pemberitahuan Sistem</p>
              <p className="text-[11px] leading-relaxed mt-1 font-medium">{adminNotification.message}</p>
            </div>
            <button 
              onClick={() => setAdminNotification(null)}
              className="text-slate-400 hover:text-slate-600 font-bold text-xs shrink-0 ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR LEAVE PROCESS */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-sm w-full p-5 space-y-4 animate-scale-up">
            <div className="flex items-center gap-2.5 text-blue-600 border-b border-slate-100 pb-2">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Konfirmasi Persetujuan
              </h3>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {confirmModal.type === 'approve' ? (
                <span>Apakah Anda yakin ingin menyetujui pengajuan <strong>{confirmModal.request.type}</strong> untuk <strong>{confirmModal.request.employeeName}</strong> selama <strong>{confirmModal.diffDays} hari</strong> ({confirmModal.request.startDate} s/d {confirmModal.request.endDate})? Sistem akan secara otomatis mengisi absen masuk dan pulang pegawai bersangkutan.</span>
              ) : (
                <span>Apakah Anda yakin ingin menolak pengajuan <strong>{confirmModal.request.type}</strong> untuk <strong>{confirmModal.request.employeeName}</strong>?</span>
              )}
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => {
                  if (confirmModal.type === 'approve') {
                    executeApproveLeave(confirmModal.request);
                  } else {
                    executeRejectLeave(confirmModal.request);
                  }
                  setConfirmModal(null);
                }}
                className={`flex-1 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-white shadow ${
                  confirmModal.type === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {confirmModal.type === 'approve' ? 'Ya, Setujui' : 'Ya, Tolak'}
              </button>
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL PHOTO PREVIEW MODAL */}
      {previewPhotoModal && (
        <div 
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center z-50 p-4" 
          onClick={() => setPreviewPhotoModal(null)}
        >
          <div 
            className="bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden max-w-sm w-full animate-scale-up" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Foto Bukti Kehadiran</h3>
              <button 
                onClick={() => setPreviewPhotoModal(null)} 
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-4 bg-slate-100 flex justify-center">
              <img 
                src={previewPhotoModal} 
                alt="Bukti Absensi Selfie" 
                className="max-w-full max-h-[360px] rounded-lg shadow border border-slate-300 object-contain" 
              />
            </div>
          </div>
        </div>
      )}

      {/* EDIT EMPLOYEE MODAL */}
      {editingEmployee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="sticky top-0 bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <Edit className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800">
                  Edit Data & Jadwal Pegawai
                </h3>
              </div>
              <button
                onClick={() => setEditingEmployee(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditEmployeeSubmit} className="p-5 space-y-4">
              <div className="p-3 bg-blue-50/50 rounded border border-blue-100 text-[11px] text-slate-600 font-medium">
                Mengedit data untuk Pegawai dengan NIP: <strong className="font-mono">{editingEmployee.id}</strong>. NIP tidak dapat diubah karena merupakan kunci database.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">Nama Lengkap & Gelar</label>
                  <input
                    type="text"
                    required
                    value={editEmpName}
                    onChange={(e) => setEditEmpName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">Email Akun Google</label>
                  <input
                    type="email"
                    required
                    value={editEmpEmail}
                    onChange={(e) => setEditEmpEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">Jabatan / Peran</label>
                  <select
                    value={editEmpRole}
                    onChange={(e) => {
                      setEditEmpRole(e.target.value);
                      if (e.target.value === 'Lainnya') {
                        setEditEmpRoleIsCustom(true);
                      } else {
                        setEditEmpRoleIsCustom(false);
                      }
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-semibold"
                  >
                    <option value="Kepala Sekolah">Kepala Sekolah</option>
                    <option value="Guru Kelas">Guru Kelas</option>
                    <option value="Guru Mapel">Guru Mapel</option>
                    <option value="Staf Tata Usaha">Staf Tata Usaha</option>
                    <option value="Pustakawan">Pustakawan</option>
                    <option value="Penjaga Sekolah">Penjaga Sekolah</option>
                    <option value="Lainnya">Lainnya (Input Manual...)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">Gaji Pokok Bulanan (Rupiah)</label>
                  <input
                    type="number"
                    required
                    value={editEmpSalary}
                    onChange={(e) => setEditEmpSalary(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-mono font-bold"
                  />
                </div>
              </div>

              {(editEmpRole === 'Lainnya' || editEmpRoleIsCustom) && (
                <div className="animate-fade-in">
                  <label className="block text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1 pl-1">Sebutkan Jabatan Kustom</label>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan jabatan/peran manual..."
                    value={editEmpRoleCustomVal}
                    onChange={(e) => setEditEmpRoleCustomVal(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-blue-50/50 border border-blue-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-semibold placeholder:text-slate-400"
                  />
                </div>
              )}

              {/* OVERRIDE HOURS SECTION */}
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <h4 className="text-[10px] font-bold text-amber-600 uppercase tracking-widest pl-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Override Jam Absensi Pegawai (Opsional)
                </h4>
                <p className="text-[9px] text-slate-400 pl-1 leading-normal">
                  * Isi kolom di bawah ini hanya jika Anda ingin memberi jadwal khusus yang berbeda dengan jadwal global sekolah. Kosongkan untuk mengikuti aturan waktu sekolah.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">Mulai Absen Masuk</label>
                    <input
                      type="time"
                      value={editEmpInStart}
                      onChange={(e) => setEditEmpInStart(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">Selesai Absen Masuk</label>
                    <input
                      type="time"
                      value={editEmpInEnd}
                      onChange={(e) => setEditEmpInEnd(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">Mulai Pulang (Sen - Kam)</label>
                    <input
                      type="time"
                      value={editEmpOutStartMonThu}
                      onChange={(e) => setEditEmpOutStartMonThu(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">Selesai Pulang (Sen - Kam)</label>
                    <input
                      type="time"
                      value={editEmpOutEndMonThu}
                      onChange={(e) => setEditEmpOutEndMonThu(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">Mulai Pulang (Jumat)</label>
                    <input
                      type="time"
                      value={editEmpOutStartFri}
                      onChange={(e) => setEditEmpOutStartFri(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">Selesai Pulang (Jumat)</label>
                    <input
                      type="time"
                      value={editEmpOutEndFri}
                      onChange={(e) => setEditEmpOutEndFri(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow"
                >
                  {editSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Simpan Perubahan
                </button>
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT PREVIEW MODAL */}
      {showPrintPreview && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto print-modal-overlay">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 space-y-4 my-8 relative">
              
              {/* Modal Header Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-3 no-print">
                <div className="flex items-center gap-2 text-emerald-600">
                  <Printer className="w-5 h-5" />
                  <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-800">
                    Preview Rekap Absensi & Gaji Bulanan
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExportAttendanceToCSV(sortedAttendanceForReport)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-emerald-700 border border-slate-300 text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                    title="Ekspor daftar kehadiran ke format Excel (CSV)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Excel Kehadiran</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportPayrollToCSV(computedRekapRows)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-emerald-700 border border-slate-300 text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                    title="Ekspor rekap gaji ke format Excel (CSV)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Excel Rekap Gaji</span>
                  </button>
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-2 shadow"
                    id="btn-trigger-browser-print"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Cetak Sekarang (Print)
                  </button>
                  <button
                    type="button"
                    onClick={handleExportToPDF}
                    disabled={isGeneratingPDF}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-2 shadow"
                    title="Ekspor laporan ini ke file PDF secara otomatis"
                    id="btn-export-rekap-pdf"
                  >
                    {isGeneratingPDF ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Mengonversi...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh PDF Laporan</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowPrintPreview(false)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer"
                    id="btn-close-print-preview"
                  >
                    Tutup
                  </button>
                </div>
              </div>

              {/* Info/Warning Bar inside Preview */}
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-[11px] leading-relaxed font-medium no-print">
                💡 <strong>Tips Cetak:</strong> Jika tombol <strong>Cetak Sekarang</strong> tidak memunculkan dialog cetak karena batasan iFrame, silakan buka aplikasi ini di <strong>Tab Baru</strong> (klik tombol <strong>Buka Aplikasi / Open in new tab</strong> di pojok kanan atas) untuk mencetak secara langsung dan lancar menggunakan printer fisik atau disimpan sebagai PDF.
              </div>

              {/* Printable Report Section */}
              <div 
                id="print-section" 
                className="bg-white p-6 border border-slate-200 rounded-lg text-slate-800 space-y-6 shadow-sm overflow-x-auto"
              >
                {/* Dynamic style tag that hides everything else during native window.print() */}
                <style>{`
                  @media print {
                    html, body, #root, main, .print-modal-overlay {
                      height: auto !important;
                      overflow: visible !important;
                      position: static !important;
                      background: white !important;
                    }
                    body * {
                      visibility: hidden !important;
                    }
                    #print-section, #print-section * {
                      visibility: visible !important;
                    }
                    #print-section {
                      position: absolute !important;
                      left: 0 !important;
                      top: 0 !important;
                      width: 100% !important;
                      padding: 0 !important;
                      margin: 0 !important;
                      border: none !important;
                      box-shadow: none !important;
                      display: block !important;
                    }
                    .no-print, .no-print * {
                      display: none !important;
                      visibility: hidden !important;
                    }
                  }
                `}</style>

                {/* Report Header (KOP Surat) */}
                <div className="flex items-center gap-5 border-b-4 border-double border-slate-950 pb-3 text-left">
                  {schoolConfig.logoUrl ? (
                    <img 
                      src={schoolConfig.logoUrl} 
                      alt="Logo Sekolah" 
                      className="w-20 h-20 object-contain shrink-0" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center shrink-0">
                      <School className="w-8 h-8 text-slate-400" />
                    </div>
                  )}
                  <div className="space-y-1 text-left flex-grow">
                    <h2 className="text-[10px] font-bold tracking-wider text-slate-500 uppercase leading-none">Pemerintah Kota Denpasar</h2>
                    <h1 className="text-lg font-black uppercase tracking-tight text-slate-950 leading-tight">
                      {schoolConfig.name || "SD NEGERI 7 PEDUNGAN"}
                    </h1>
                    <p className="text-[11px] text-slate-600 font-medium leading-normal">
                      {schoolConfig.address || "Alamat belum dikonfigurasi"}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1.5 border-t border-slate-100">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block">
                        {rekapEmployeeId === 'all' 
                          ? 'Laporan Rekapitulasi Kehadiran & Payroll Bulanan' 
                          : 'Laporan Rekapitulasi Kehadiran & Payroll Individu'
                        }
                      </span>
                      <span className="text-[9px] font-bold text-slate-600 font-mono">
                        Periode: {getMonthNameIndo(rekapMonth)} {rekapYear === 'all' ? 'Semua Tahun' : rekapYear}
                      </span>
                    </div>
                  </div>
                </div>

                {/* I. DETAIL RIWAYAT KEHADIRAN (LOG ABSENSI) */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-300 pb-1 flex items-center gap-2">
                    <span className="bg-slate-900 text-white px-1.5 py-0.5 rounded text-[9px] font-black">I</span>
                    <span>Detail Riwayat Kehadiran Pegawai ({sortedAttendanceForReport.length} Log)</span>
                  </h3>
                  
                  {sortedAttendanceForReport.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic py-4 text-center border border-dashed border-slate-200 rounded">
                      Tidak ada log riwayat kehadiran untuk periode ini.
                    </p>
                  ) : (
                    <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 uppercase tracking-wide text-[9px]">
                          <th className="px-2 py-1.5 border border-slate-300 text-center w-8">No</th>
                          <th className="px-2 py-1.5 border border-slate-300 w-28">Hari / Tanggal</th>
                          <th className="px-2 py-1.5 border border-slate-300 w-16 text-center">Waktu</th>
                          <th className="px-2 py-1.5 border border-slate-300">Nama Pegawai (NIP)</th>
                          <th className="px-2 py-1.5 border border-slate-300 w-24">Tipe Absen</th>
                          <th className="px-2 py-1.5 border border-slate-300 w-24 text-center">Status</th>
                          <th className="px-2 py-1.5 border border-slate-300">Lokasi / Jarak</th>
                          <th className="px-2 py-1.5 border border-slate-300">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {sortedAttendanceForReport.map((rec, idx) => {
                          const emp = employees.find(e => e.id === rec.employeeId);
                          let statusColor = 'bg-slate-50 text-slate-700 border-slate-200';
                          if (rec.status === 'Tepat Waktu') statusColor = 'bg-emerald-50 text-emerald-800 border-emerald-100';
                          else if (rec.status === 'Terlambat') statusColor = 'bg-red-50 text-red-800 border-red-100';
                          else if (rec.status === 'Sakit') statusColor = 'bg-amber-50 text-amber-800 border-amber-100';
                          else if (rec.status === 'Cuti') statusColor = 'bg-blue-50 text-blue-800 border-blue-100';
                          else if (rec.status === 'Dinas Luar') statusColor = 'bg-violet-50 text-violet-800 border-violet-100';

                          return (
                            <tr key={`${rec.employeeId || 'rec'}-${idx}`} className="hover:bg-slate-50/50">
                              <td className="px-2 py-1 border border-slate-300 text-center font-bold">{idx + 1}</td>
                              <td className="px-2 py-1 border border-slate-300 font-medium">
                                {rec.date ? (() => {
                                  try {
                                    const d = new Date(rec.date);
                                    return d.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
                                  } catch (err) {
                                    return rec.date;
                                  }
                                })() : ''}
                              </td>
                              <td className="px-2 py-1 border border-slate-300 text-center font-mono font-bold text-slate-800">
                                {rec.time || '-'}
                              </td>
                              <td className="px-2 py-1 border border-slate-300">
                                <p className="font-bold text-slate-900">{emp?.name || rec.employeeName}</p>
                                <p className="text-[8px] text-slate-400 font-mono">NIP. {rec.employeeId}</p>
                              </td>
                              <td className="px-2 py-1 border border-slate-300 font-semibold text-slate-600">
                                {rec.type === 'Masuk' ? 'Presensi Masuk' : 'Presensi Pulang'}
                              </td>
                              <td className="px-2 py-1 border border-slate-300 text-center">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border ${statusColor}`}>
                                  {rec.status}
                                </span>
                              </td>
                              <td className="px-2 py-1 border border-slate-300 font-mono text-[9px] text-slate-500">
                                {rec.distance && rec.distance !== '-' ? `${rec.distance}m` : rec.distance || '-'}
                              </td>
                              <td className="px-2 py-1 border border-slate-300 text-slate-600 italic text-[9px]">
                                {rec.notes || '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* II. LAPORAN REKAPITULASI KEHADIRAN & PAYROLL BULANAN */}
                <div className="space-y-2 pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-300 pb-1 flex items-center gap-2">
                    <span className="bg-slate-900 text-white px-1.5 py-0.5 rounded text-[9px] font-black">II</span>
                    <span>Laporan Rekapitulasi Kehadiran & Perhitungan Gaji Bulanan</span>
                  </h3>

                  {/* Report Table */}
                  <table className="w-full text-left border-collapse border border-slate-300 text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 uppercase tracking-wide">
                        <th className="px-3 py-2 border border-slate-300 text-center">No</th>
                        <th className="px-3 py-2 border border-slate-300">Nama Pegawai (NIP)</th>
                        <th className="px-3 py-2 border border-slate-300">Jabatan</th>
                        <th className="px-3 py-2 border border-slate-300 text-right">Gaji Pokok</th>
                        <th className="px-2 py-2 border border-slate-300 text-center">Hadir</th>
                        <th className="px-2 py-2 border border-slate-300 text-center">Telat</th>
                        <th className="px-2 py-2 border border-slate-300 text-center">Izin/Sakit</th>
                        <th className="px-3 py-2 border border-slate-300 text-right">Potongan Denda</th>
                        <th className="px-3 py-2 border border-slate-300 text-right font-extrabold bg-slate-50">Gaji Bersih</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {computedRekapRows.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-3 py-6 text-center text-slate-400 font-bold">
                            Tidak ada data pegawai yang terdaftar.
                          </td>
                        </tr>
                      ) : (
                        computedRekapRows.map((row, idx) => (
                          <tr key={`${row.id || "row"}-${idx}`} className="hover:bg-slate-50/50">
                            <td className="px-3 py-2 border border-slate-300 text-center font-bold">{idx + 1}</td>
                            <td className="px-3 py-2 border border-slate-300">
                              <p className="font-bold text-slate-900">{row.name}</p>
                              <p className="text-[9px] text-slate-400 font-mono">NIP. {row.id}</p>
                            </td>
                            <td className="px-3 py-2 border border-slate-300 font-medium">{row.role}</td>
                            <td className="px-3 py-2 border border-slate-300 text-right font-mono font-semibold">
                              Rp {row.gajiPokok.toLocaleString('id-ID')}
                            </td>
                            <td className="px-2 py-2 border border-slate-300 text-center font-bold text-blue-700">{row.totalHadir}</td>
                            <td className="px-2 py-2 border border-slate-300 text-center font-bold text-red-600">{row.totalTerlambat}</td>
                            <td className="px-2 py-2 border border-slate-300 text-center font-semibold text-slate-600">
                              {row.totalSakit + row.totalCuti + row.totalDinas}
                            </td>
                            <td className="px-3 py-2 border border-slate-300 text-right font-mono font-bold text-red-600">
                              Rp {row.totalDenda.toLocaleString('id-ID')}
                            </td>
                            <td className="px-3 py-2 border border-slate-300 text-right font-mono font-black text-emerald-700 bg-emerald-50/30">
                              Rp {row.gajiBersih.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Signature Lines (Tanda Tangan) */}
                <div className="pt-8 flex justify-between items-start text-xs font-medium">
                  <div>
                    <p className="text-slate-400">Mengetahui,</p>
                    <p className="font-bold mt-1 text-slate-700">Kepala Sekolah {schoolConfig.name || ""}</p>
                    <div className="h-16"></div>
                    <p className="font-bold text-slate-900 border-b border-slate-800 w-48 pb-1 inline-block">(......................................)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-500 font-mono">Denpasar, {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    <p className="font-bold mt-1 text-slate-700">Bendahara / Staf TU</p>
                    <div className="h-16"></div>
                    <p className="font-bold text-slate-900 border-b border-slate-800 w-40 pb-1 inline-block">(......................................)</p>
                  </div>
                </div>

              </div>

              {/* Help guidelines */}
              <div className="bg-slate-50 border border-slate-200 rounded p-3 text-[10px] text-slate-500 leading-relaxed no-print">
                <strong className="text-slate-700">Tips Mencetak Laporan:</strong>
                <ul className="list-disc pl-4 mt-1 space-y-0.5">
                  <li>Aktifkan opsi <strong>"Background graphics"</strong> (Gambar Latar Belakang) di menu dialog cetak browser Anda agar warna lencana dan kolom rekap tercetak sempurna.</li>
                  <li>Atur ukuran kertas ke <strong>A4</strong> atau <strong>Letter</strong> dengan orientasi <strong>Landscape</strong> untuk menyajikan tabel rekapitulasi secara optimal.</li>
                </ul>
              </div>

            </div>
          </div>
        )
      }

      {/* Evidence Viewer Modal */}
      {selectedEvidenceUrl && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in no-print">
          <div className="bg-white rounded-xl max-w-xl w-full border border-slate-200 shadow-2xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pratinjau Bukti Pengajuan</span>
              <button
                onClick={() => setSelectedEvidenceUrl(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1 bg-slate-50 hover:bg-slate-100 rounded transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto flex items-center justify-center bg-slate-50 rounded border border-slate-200 p-2">
              <img 
                src={selectedEvidenceUrl} 
                alt="Bukti Pengajuan" 
                className="max-w-full max-h-[50vh] object-contain rounded shadow-sm"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = selectedEvidenceUrl;
                  link.download = "bukti_pengajuan.jpg";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh Gambar
              </button>
              <button
                onClick={() => setSelectedEvidenceUrl(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Kembali
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
