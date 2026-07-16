import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  School, GraduationCap, MapPin, FileSpreadsheet, Lock, RefreshCw, 
  Settings, UserCheck, LogOut, CheckCircle, Info, Loader2, Compass
} from 'lucide-react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logout, setAccessToken } from './lib/firebase';
import { loadEmployees, loadAttendance, ensureSheetsAndHeaders, loadLeaveRequests } from './lib/sheets';
import { Employee, AttendanceRecord, SchoolConfig } from './types';
import SetupSpreadsheet from './components/SetupSpreadsheet';
import EmployeeDashboard from './components/EmployeeDashboard';
import AdminDashboard from './components/AdminDashboard';

const DEFAULT_SCHOOL_CONFIG: SchoolConfig = {
  name: "SD Negeri 7 Pedungan",
  address: "Jl. Pulau Moyo No. 63, Pedungan, Denpasar Selatan, Bali",
  latitude: -8.697424,
  longitude: 115.207122,
  radius: 100, // meters
  checkInStart: "06:00",
  checkInEnd: "07:45",
  checkOutStartMonThu: "15:00",
  checkOutEndMonThu: "18:00",
  checkOutStartFri: "13:00",
  checkOutEndFri: "16:00",
};

export default function App() {
  // Auth states
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  // App configurations
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(() => {
    return localStorage.getItem('absensi_spreadsheet_id');
  });

  const [schoolConfig, setSchoolConfig] = useState<SchoolConfig>(() => {
    const saved = localStorage.getItem('school_config');
    if (saved) {
      try {
        return {
          ...DEFAULT_SCHOOL_CONFIG,
          ...JSON.parse(saved),
        };
      } catch (e) {
        return DEFAULT_SCHOOL_CONFIG;
      }
    }
    return DEFAULT_SCHOOL_CONFIG;
  });

  // Data loaded from sheets
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // Active Selected Employee ID (shared for testing / photo upload)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  // Navigation: 'employee' | 'admin'
  const [portalType, setPortalType] = useState<'employee' | 'admin'>('employee');

  // Initialize auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessTokenState(token);
        setAccessToken(token); // set in memory cache
        setNeedsAuth(false);
        setAuthChecking(false);
      },
      () => {
        setUser(null);
        setAccessTokenState(null);
        setNeedsAuth(true);
        setAuthChecking(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch data when sheet ID and token are available
  const fetchAllData = async () => {
    if (!spreadsheetId || !accessToken) return;
    setDataLoading(true);
    setDataError(null);
    try {
      // First make sure spreadsheets have correct tables & sample data
      await ensureSheetsAndHeaders(spreadsheetId, accessToken, user?.email || '');
      
      const [empList, attList, leaveList] = await Promise.all([
        loadEmployees(spreadsheetId, accessToken),
        loadAttendance(spreadsheetId, accessToken),
        loadLeaveRequests(spreadsheetId, accessToken)
      ]);
      setEmployees(empList);
      setAttendance(attList);
      setLeaveRequests(leaveList);
    } catch (err: any) {
      console.error(err);
      setDataError(err.message || 'Gagal memuat data dari Google Sheets. Pastikan ID Spreadsheet valid.');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (spreadsheetId && accessToken) {
      fetchAllData();
    }
  }, [spreadsheetId, accessToken]);

  // Sync selected employee state
  useEffect(() => {
    if (employees.length > 0 && !selectedEmployeeId) {
      const matched = employees.find(emp => emp.email === user?.email?.toLowerCase());
      setSelectedEmployeeId(matched?.id || employees[0].id);
    }
  }, [employees, user]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setAccessTokenState(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err: any) {
      console.error(err);
      alert('Login Gagal: ' + err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    const confirmLogout = window.confirm('Apakah Anda yakin ingin keluar dari aplikasi?');
    if (!confirmLogout) return;

    try {
      await logout();
      setUser(null);
      setAccessTokenState(null);
      setNeedsAuth(true);
      setEmployees([]);
      setAttendance([]);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleUpdateSchoolConfig = (newConfig: SchoolConfig) => {
    setSchoolConfig(newConfig);
    localStorage.setItem('school_config', JSON.stringify(newConfig));
  };

  const handleUpdateSpreadsheetId = (id: string) => {
    setSpreadsheetId(id);
  };

  // Loading screen during initialization check
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="text-xs font-semibold text-slate-500 mt-4">Memeriksa Sesi Pengguna...</span>
      </div>
    );
  }

  // LOGIN PAGE (If not logged in)
  if (needsAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
        
        {/* Left pane: Branding & Concept */}
        <div className="lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-800 text-white p-12 lg:p-24 flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center border border-white/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-sm tracking-wider uppercase">SIPEG SDN 7 PEDUNGAN</span>
          </div>

          <div className="my-12 lg:my-0 space-y-6">
            <h1 className="text-3xl lg:text-4xl font-black leading-tight tracking-tight">
              Sistem Absensi Digital Pegawai Sekolah
            </h1>
            <p className="text-blue-100 text-xs max-w-md leading-relaxed">
              Solusi kehadiran pegawai sekolah yang modern dengan verifikasi GPS radius 100m dan integrasi langsung ke Google Sheets secara transparan dan aman.
            </p>

            <div className="pt-4 space-y-3">
              {[
                { title: 'Kunci GPS Radius 100m', desc: 'Mencegah manipulasi lokasi, pegawai wajib berada di sekitar area sekolah.' },
                { title: 'Google Sheets Sinkron', desc: 'Semua rekap kehadiran tersimpan otomatis dan permanen di Google Drive Anda.' },
                { title: 'Pengajuan Izin Mandiri', desc: 'Sakit, Cuti, dan Dinas Luar terintegrasi otomatis ke dalam riwayat absensi.' }
              ].map((feat, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-5 h-5 rounded bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">✓</div>
                  <div>
                    <h4 className="font-bold text-xs text-white">{feat.title}</h4>
                    <p className="text-[11px] text-blue-200/80 mt-0.5">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-blue-200/60 uppercase tracking-wider font-semibold">
            © 2026 SD Negeri 7 Pedungan. Hak Cipta Dilindungi.
          </p>
        </div>

        {/* Right pane: Action */}
        <div className="lg:w-1/2 p-8 lg:p-24 flex flex-col justify-center bg-white items-center">
          <div className="max-w-sm w-full space-y-8">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Selamat Datang</h2>
              <p className="text-xs text-slate-500 mt-2">
                Silakan masuk menggunakan akun Google sekolah atau akun pribadi Anda yang terdaftar di sistem.
              </p>
            </div>

            {/* Official GSI Styled Button */}
            <button 
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="gsi-material-button w-full cursor-pointer shadow-sm border border-slate-200 hover:border-slate-300 transition-all rounded-xl py-1"
              id="btn-google-signin"
            >
              <div className="gsi-material-button-state"></div>
              <div className="gsi-material-button-content-wrapper flex items-center justify-center gap-3">
                <div className="gsi-material-button-icon">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: "block", width: "24px", height: "24px" }}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span className="gsi-material-button-contents text-slate-700 font-semibold text-xs">Masuk dengan Google</span>
              </div>
            </button>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2 text-xs text-slate-500">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
              <span>Aplikasi memerlukan izin akses baca & tulis Google Sheets Anda untuk mengunduh daftar pegawai dan menyimpan rekap absensi.</span>
            </div>
          </div>
        </div>

      </div>
    );
  }

  // NO SPREADSHEET CONFIGURATION (Needs to connect sheet first)
  if (!spreadsheetId) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col justify-between">
        <header className="max-w-6xl mx-auto w-full flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-slate-800 text-xs tracking-wider uppercase">SDN 7 Pedungan Absen</span>
          </div>
          <button 
            onClick={handleLogout}
            className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1"
            id="btn-logout-setup"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar
          </button>
        </header>

        <main className="flex-grow flex items-center justify-center py-12">
          <SetupSpreadsheet
            accessToken={accessToken!}
            userEmail={user!.email!}
            onSpreadsheetConfigured={handleUpdateSpreadsheetId}
          />
        </main>

        <footer className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          Sistem Absensi Digital • SDN 7 Pedungan, Denpasar Selatan
        </footer>
      </div>
    );
  }

  // MAIN PORTAL APPLICATION
  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      
      {/* Top Application Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-50 rounded flex items-center justify-center text-blue-600 border border-blue-100">
              <School className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-800 text-xs tracking-tight uppercase">{schoolConfig.name}</span>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">SISTEM ABSENSI PEGAWAI</p>
            </div>
          </div>

          {/* Quick Tab Switcher between Employee and Admin */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded self-start sm:self-auto">
            <button
              onClick={() => setPortalType('employee')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all duration-150 active:scale-95 active:translate-y-[0.5px] flex items-center gap-1.5 ${
                portalType === 'employee'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              id="tab-toggle-employee"
            >
              <Compass className="w-3.5 h-3.5" />
              Portal Pegawai
            </button>
            <button
              onClick={() => setPortalType('admin')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all duration-150 active:scale-95 active:translate-y-[0.5px] flex items-center gap-1.5 ${
                portalType === 'admin'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              id="tab-toggle-admin"
            >
              <Settings className="w-3.5 h-3.5" />
              Portal Admin / Kepsek
            </button>
          </div>
        </div>
      </header>

      {/* Main Body Layout */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
        
        {/* Sync loading indicators or errors */}
        {dataLoading && (
          <div className="mb-4 p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3 text-xs text-slate-600 shadow-sm">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span className="font-semibold text-slate-500">Menskronkan database Google Sheets secara real-time...</span>
          </div>
        )}

        {dataError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-800 shadow-sm">
            <Info className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Gagal Sinkronisasi Database</p>
              <p>{dataError}</p>
              <button 
                onClick={fetchAllData}
                className="mt-1.5 px-3 py-1 bg-red-600 text-white rounded font-semibold text-xs"
                id="btn-retry-sync"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        )}

        {/* Dashboard Rendering based on Portal Switch */}
        <motion.div
          key={portalType}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          {(() => {
            const activeEmployee = employees.find(emp => emp.id === selectedEmployeeId) || employees[0];
            const isAdmin = (user?.email?.toLowerCase() === 'sdn7pedungan63@gmail.com') || (activeEmployee && (
              activeEmployee.role === 'Kepala Sekolah' ||
              activeEmployee.role === 'Staf / Operator' ||
              activeEmployee.role.toLowerCase().includes('admin') ||
              activeEmployee.role.toLowerCase().includes('operator')
            ));

            if (portalType === 'employee') {
              return (
                <EmployeeDashboard
                  userEmail={user!.email!}
                  userName={user!.displayName || 'Pegawai SDN 7'}
                  employees={employees}
                  attendance={attendance}
                  leaveRequests={leaveRequests}
                  schoolConfig={schoolConfig}
                  spreadsheetId={spreadsheetId}
                  accessToken={accessToken!}
                  onRefreshData={fetchAllData}
                  onLogout={handleLogout}
                  selectedEmployeeId={selectedEmployeeId}
                  onSelectedEmployeeIdChange={setSelectedEmployeeId}
                />
              );
            } else if (!isAdmin) {
              return (
                <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-lg p-6 shadow-sm text-center space-y-4 my-12 animate-fade-in">
                  <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-100">
                    <Lock className="w-8 h-8" />
                  </div>
                  <div className="space-y-1.5">
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Akses Terbatas: Hanya Admin / Kepsek</h2>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Maaf, akun Anda ({activeEmployee?.name || user?.email}) tercatat sebagai <strong className="text-slate-700">{activeEmployee?.role || 'Pegawai'}</strong>. Hanya Kepala Sekolah atau Staf Operator yang diizinkan masuk ke panel kontrol.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-500 text-left space-y-1">
                    <span className="font-bold text-slate-700 uppercase tracking-wide block">Cara menguji akses admin:</span>
                    <p>Gunakan opsi <strong className="text-blue-600">Ganti Akun Demo (Uji Coba)</strong> di Portal Pegawai untuk memilih akun <strong>Kepala Sekolah</strong> (Drs. Ketut Pedungan) atau <strong>Staf Tata Usaha</strong> (I Wayan Sudiarta).</p>
                  </div>
                  <button
                    onClick={() => setPortalType('employee')}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer transition-all"
                    id="btn-return-to-employee"
                  >
                    Kembali ke Portal Kehadiran Pegawai
                  </button>
                </div>
              );
            } else {
              return (
                <AdminDashboard
                  employees={employees}
                  attendance={attendance}
                  leaveRequests={leaveRequests}
                  schoolConfig={schoolConfig}
                  spreadsheetId={spreadsheetId}
                  accessToken={accessToken!}
                  onUpdateSchoolConfig={handleUpdateSchoolConfig}
                  onRefreshData={fetchAllData}
                  onUpdateSpreadsheetId={handleUpdateSpreadsheetId}
                />
              );
            }
          })()}
        </motion.div>

      </main>

    </div>
  );
}
