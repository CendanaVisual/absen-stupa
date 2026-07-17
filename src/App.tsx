import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  School, GraduationCap, MapPin, FileSpreadsheet, Lock, RefreshCw, 
  Settings, UserCheck, LogOut, CheckCircle, Info, Loader2, Compass, KeyRound,
  Copy, Check, Eye, EyeOff
} from 'lucide-react';
import { User } from 'firebase/auth';
import firebaseConfigDefault from '../firebase-applet-config.json';
import { initAuth, googleSignIn, logout, setAccessToken, auth } from './lib/firebase';
import { loadEmployees, loadAttendance, ensureSheetsAndHeaders, loadLeaveRequests, loadUserAccounts } from './lib/sheets';
import { Employee, AttendanceRecord, SchoolConfig, UserAccount } from './types';
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
  const [accessToken, setAccessTokenState] = useState<string | null>(() => {
    return localStorage.getItem('sipeg_google_access_token');
  });
  const [loggedInAccount, setLoggedInAccount] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('sipeg_logged_in_account');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [needsAuth, setNeedsAuth] = useState<boolean>(() => {
    const saved = localStorage.getItem('sipeg_logged_in_account');
    return saved ? false : true;
  });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  // Custom login credentials state
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState<string | null>(null);

  // App configurations
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(() => {
    const saved = localStorage.getItem('absensi_spreadsheet_id');
    if (!saved) {
      localStorage.setItem('absensi_spreadsheet_id', '1o9UXa4QZiQAJer-uFsxMXlTCaZkNjhQHNqW_AQWOqgc');
      return '1o9UXa4QZiQAJer-uFsxMXlTCaZkNjhQHNqW_AQWOqgc';
    }
    return saved;
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
    const savedToken = localStorage.getItem('sipeg_google_access_token');
    if (savedToken) {
      setAccessToken(savedToken);
    }
    setAuthChecking(false);
  }, []);

  // Fetch data when sheet ID and token are available
  const fetchAllData = async () => {
    if (!spreadsheetId || !accessToken) return;
    setDataLoading(true);
    setDataError(null);
    try {
      // First make sure spreadsheets have correct tables & sample data
      await ensureSheetsAndHeaders(spreadsheetId, accessToken, 'sdn7pedungan63@gmail.com');
      
      const [empList, attList, leaveList] = await Promise.all([
        loadEmployees(spreadsheetId, accessToken),
        loadAttendance(spreadsheetId, accessToken),
        loadLeaveRequests(spreadsheetId, accessToken)
      ]);
      setEmployees(empList);
      setAttendance(attList);
      setLeaveRequests(leaveList);
    } catch (err: any) {
      console.warn(err);
      const isUnauthorized = String(err.message || '').includes('UNAUTHORIZED');
      if (isUnauthorized) {
        setAccessTokenState(null);
        localStorage.removeItem('sipeg_google_access_token');
        setLoggedInAccount(null);
        localStorage.removeItem('sipeg_logged_in_account');
        setNeedsAuth(true);
        setLoginError('Sesi Google Sheets Anda telah kedaluwarsa atau tidak valid. Silakan hubungkan ulang akun Google Anda.');
      } else {
        setDataError(err.message || 'Gagal memuat data dari Google Sheets. Pastikan ID Spreadsheet valid.');
      }
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
    if (employees.length > 0 && loggedInAccount) {
      const matched = employees.find(emp => emp.id === loggedInAccount.nip);
      if (matched) {
        setSelectedEmployeeId(matched.id);
        if (loggedInAccount.role === 'admin' || loggedInAccount.nip === 'admin') {
          setPortalType('admin');
        } else {
          setPortalType('employee');
        }
      } else if (!selectedEmployeeId) {
        setSelectedEmployeeId(employees[0].id);
      }
    }
  }, [employees, loggedInAccount]);

  const handleGoogleConnect = async () => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        const targetToken = result.accessToken;
        const targetId = spreadsheetId || '1o9UXa4QZiQAJer-uFsxMXlTCaZkNjhQHNqW_AQWOqgc';
        const userEmail = (result.user.email || '').trim().toLowerCase();

        // Load employees to verify registered Google email in Column G
        let empList: Employee[] = [];
        try {
          await ensureSheetsAndHeaders(targetId, targetToken, 'sdn7pedungan63@gmail.com');
          empList = await loadEmployees(targetId, targetToken);
        } catch (loadErr: any) {
          console.error("Gagal membaca database saat memverifikasi akun Google:", loadErr);
          await logout();
          throw new Error('Gagal menghubungkan: ID Spreadsheet tidak valid atau Anda tidak memiliki izin akses.');
        }

        const isMasterAdmin = userEmail === 'sdn7pedungan63@gmail.com';
        const matchedEmp = empList.find(emp => {
          const colG = (emp.googleEmail || emp.checkInStart || '').trim().toLowerCase();
          const colD = (emp.email || '').trim().toLowerCase();
          return colG === userEmail || colD === userEmail;
        });

        if (!isMasterAdmin && !matchedEmp) {
          await logout();
          throw new Error(`Gagal Menghubungkan: Akun Google Anda (${userEmail}) belum terdaftar pada sheet Pegawai Kolom G. Silakan hubungi operator sekolah untuk mendaftarkan email Google Anda.`);
        }

        let loggedInAcc: UserAccount;
        if (isMasterAdmin) {
          const ketutEmp = empList.find(emp => emp.role.toLowerCase().includes('kepala'));
          loggedInAcc = {
            username: userEmail,
            sandi: '',
            nip: ketutEmp ? ketutEmp.id : 'admin',
            role: 'admin',
            name: ketutEmp ? ketutEmp.name : 'Administrator Sekolah'
          };
        } else if (matchedEmp) {
          const isAdm = matchedEmp.role.toLowerCase().includes('kepala') || 
                        matchedEmp.role.toLowerCase().includes('admin') || 
                        matchedEmp.role.toLowerCase().includes('operator');
          loggedInAcc = {
            username: userEmail,
            sandi: '',
            nip: matchedEmp.id,
            role: isAdm ? 'admin' : 'pegawai',
            name: matchedEmp.name
          };
        } else {
          await logout();
          throw new Error('Gagal mengidentifikasi data pegawai Anda.');
        }

        // Save state on success
        setSpreadsheetId(targetId);
        localStorage.setItem('absensi_spreadsheet_id', targetId);
        setAccessTokenState(targetToken);
        localStorage.setItem('sipeg_google_access_token', targetToken);
        setUser(result.user);
        setEmployees(empList);
        setLoggedInAccount(loggedInAcc);
        localStorage.setItem('sipeg_logged_in_account', JSON.stringify(loggedInAcc));
        setNeedsAuth(false);

        // Clear any old UNAUTHORIZED error
        if (dataError?.includes('UNAUTHORIZED')) {
          setDataError(null);
        }
      } else {
        throw new Error('Otorisasi Google diperlukan untuk masuk ke aplikasi.');
      }
    } catch (err: any) {
      console.error(err);
      const errStr = String(err.message || err.code || err);
      if (errStr.includes('unauthorized-domain') || err.code === 'auth/unauthorized-domain') {
        setLoginError('auth/unauthorized-domain');
      } else if (errStr.includes('configuration-not-found') || err.code === 'auth/configuration-not-found') {
        setLoginError('auth/configuration-not-found');
      } else if (errStr.includes('popup-closed-by-user') || err.code === 'auth/popup-closed-by-user') {
        setLoginError('Proses masuk dibatalkan karena jendela pilihan akun Google ditutup sebelum selesai. Silakan hubungkan kembali akun Google Anda.');
      } else if (errStr.includes('popup-blocked') || err.code === 'auth/popup-blocked') {
        setLoginError('Jendela login Google diblokir oleh browser Anda. Harap izinkan popup pada browser Anda untuk dapat masuk.');
      } else {
        setLoginError(err.message || 'Gagal terhubung dengan akun Google Anda. Pastikan Anda mendaftarkan email Anda di spreadsheet.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleEnableOfflineMode = () => {
    setAccessTokenState('offline_token');
    localStorage.setItem('sipeg_google_access_token', 'offline_token');
    setSpreadsheetId('offline_spreadsheet');
    localStorage.setItem('absensi_spreadsheet_id', 'offline_spreadsheet');
    
    // Pre-initialize local data to storage
    const defaultAccounts = [
      { username: "admin", sandi: "admin123", nip: "admin", role: "admin", name: "Administrator" },
      { username: "budi", sandi: "budi123", nip: "199001012020121001", role: "pegawai", name: "Budi Santoso, S.Pd." },
      { username: "dewi", sandi: "dewi123", nip: "198505122015042002", role: "pegawai", name: "Dewi Lestari, M.Pd." },
      { username: "wayan", sandi: "wayan123", nip: "197808202008011003", role: "pegawai", name: "I Wayan Sudiarta" },
      { username: "ketut", sandi: "ketut123", nip: "196512311988031001", role: "admin", name: "Drs. Ketut Pedungan" }
    ];
    localStorage.setItem('sipeg_offline_user_accounts', JSON.stringify(defaultAccounts));
    
    const defaultEmployees = [
      { id: "199001012020121001", name: "Budi Santoso, S.Pd.", role: "Guru Kelas IV", email: "budi@sekolah.sch.id", baseSalary: 4500000 },
      { id: "198505122015042002", name: "Dewi Lestari, M.Pd.", role: "Guru Matematika", email: "dewi@sekolah.sch.id", baseSalary: 4800000 },
      { id: "197808202008011003", name: "I Wayan Sudiarta", role: "Staf Tata Usaha", email: "wayan@sekolah.sch.id", baseSalary: 3500000 },
      { id: "196512311988031001", name: "Drs. Ketut Pedungan", role: "Kepala Sekolah", email: "ketut@sekolah.sch.id", baseSalary: 6000000 }
    ];
    localStorage.setItem('sipeg_offline_employees', JSON.stringify(defaultEmployees));
    
    if (!localStorage.getItem('sipeg_offline_attendance')) {
      localStorage.setItem('sipeg_offline_attendance', JSON.stringify([]));
    }
    if (!localStorage.getItem('sipeg_offline_leave_requests')) {
      localStorage.setItem('sipeg_offline_leave_requests', JSON.stringify([]));
    }
    
    setLoginError(null);
  };

  const handleSelectOfflineAccount = (acc: UserAccount) => {
    setLoggedInAccount(acc);
    localStorage.setItem('sipeg_logged_in_account', JSON.stringify(acc));
    setNeedsAuth(false);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const executeLogout = async () => {
    try {
      await logout();
      setUser(null);
      setAccessTokenState(null);
      setLoggedInAccount(null);
      localStorage.removeItem('sipeg_google_access_token');
      localStorage.removeItem('sipeg_logged_in_account');
      setNeedsAuth(true);
      setEmployees([]);
      setAttendance([]);
      setLeaveRequests([]);
      setShowLogoutConfirm(false);
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

  const renderLoginError = () => {
    if (!loginError) return null;

    const isUnauthorizedDomain = loginError === 'auth/unauthorized-domain' || loginError.includes('auth/unauthorized-domain') || loginError.includes('unauthorized-domain');
    const isConfigNotFound = loginError === 'auth/configuration-not-found' || loginError.includes('auth/configuration-not-found') || loginError.includes('configuration-not-found');

    if (isUnauthorizedDomain) {
      const currentHost = window.location.hostname;
      const baseDomains = [
        'localhost',
        'ais-dev-5qxghdxyd7susqfihin7rw-260640031552.asia-southeast1.run.app',
        'ais-pre-5qxghdxyd7susqfihin7rw-260640031552.asia-southeast1.run.app'
      ];
      if (currentHost && !baseDomains.includes(currentHost)) {
        baseDomains.push(currentHost);
      }

      return (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-[11px] leading-relaxed space-y-3 shadow-sm" id="firebase-unauthorized-domain-card">
          <div className="flex items-start gap-2 text-amber-800">
            <Info className="w-4.5 h-4.5 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <span className="font-bold block text-xs">Domain Belum Diizinkan (Firebase)</span>
              <p className="mt-1 text-[11px]">
                Domain website ini belum terdaftar sebagai Authorized Domain di proyek Firebase Anda. Google Sign-In diblokir sebelum domain ini ditambahkan.
              </p>
            </div>
          </div>

          <div className="bg-white border border-amber-100 rounded-lg p-3 space-y-2.5">
            <span className="font-bold text-[10px] text-amber-800 uppercase tracking-wider block">
              Salin Domain di Bawah Ini:
            </span>
            <div className="space-y-1.5 font-mono text-[10px] text-slate-700">
              {baseDomains.map((dom) => {
                const isCopied = copiedDomain === dom;
                return (
                  <div key={dom} className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-md">
                    <span className="break-all">{dom}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(dom);
                        setCopiedDomain(dom);
                        setTimeout(() => setCopiedDomain(null), 2000);
                      }}
                      className={`shrink-0 px-2 py-1 rounded text-[9px] font-sans font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        isCopied 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-2.5 h-2.5" />
                          <span>Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-2.5 h-2.5" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5 text-slate-600 text-[10.5px]">
            <span className="font-bold text-[10px] text-slate-700 uppercase tracking-wider block">
              Cara Memperbaiki di Firebase Console:
            </span>
            <ol className="list-decimal list-inside pl-1 space-y-1 leading-relaxed">
              <li>Masuk ke <strong>Firebase Console</strong> proyek Anda.</li>
              <li>Buka menu <strong>Authentication</strong> &gt; tab <strong>Settings</strong> (Setelan) &gt; bagian <strong>Authorized Domains</strong> (Domain Terotorisasi).</li>
              <li>Klik <strong>Add Domain</strong>, lalu masukkan domain di atas satu per satu dan klik simpan.</li>
              <li>Setelah ditambahkan, <strong>refresh</strong> halaman ini dan coba hubungkan kembali akun Google Anda.</li>
            </ol>
          </div>
        </div>
      );
    }

    if (isConfigNotFound) {
      const currentProjId = firebaseConfigDefault.projectId || 'cendanavisual-5aa8e';
      return (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-[11px] leading-relaxed space-y-3 shadow-sm" id="firebase-config-not-found-card">
          <div className="flex items-start gap-2 text-amber-800">
            <Info className="w-4.5 h-4.5 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <span className="font-bold block text-xs">Metode Login Google Belum Aktif (Firebase)</span>
              <p className="mt-1 text-[11px]">
                Proyek Firebase Anda (<strong>{currentProjId}</strong>) belum mengaktifkan penyedia masuk (Sign-In Provider) <strong>Google</strong>. Google Sign-In diblokir oleh Firebase sebelum Anda mengaktifkannya.
              </p>
            </div>
          </div>

          <div className="space-y-1.5 text-slate-600 text-[10.5px]">
            <span className="font-bold text-[10px] text-slate-700 uppercase tracking-wider block">
              Cara Mengaktifkan di Firebase Console:
            </span>
            <ol className="list-decimal list-inside pl-1 space-y-1 leading-relaxed">
              <li>Buka <strong><a href={`https://console.firebase.google.com/project/${currentProjId}/authentication/providers`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-bold">Firebase Console &gt; Authentication</a></strong> untuk proyek Anda.</li>
              <li>Masuk ke tab <strong>Sign-in method</strong> (Metode Masuk).</li>
              <li>Klik tombol <strong>Add new provider</strong> (Tambahkan penyedia baru) dan pilih <strong>Google</strong>.</li>
              <li>Aktifkan sakelar (toggle) ke posisi <strong>Enable</strong>, pilih <strong>Project support email</strong> (Email dukungan proyek), lalu klik <strong>Save</strong> (Simpan).</li>
              <li>Setelah berhasil disimpan, silakan <strong>refresh halaman ini</strong> dan coba hubungkan kembali akun Google Anda!</li>
            </ol>
          </div>
        </div>
      );
    }

    return (
      <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[11px] font-semibold leading-relaxed flex items-start gap-2">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
        <span>{loginError}</span>
      </div>
    );
  };

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
            <span className="font-bold text-sm tracking-wider uppercase">SISTEM ABSENSI PEGAWAI</span>
          </div>

          <div className="my-12 lg:my-0 space-y-6">
            <h1 className="text-3xl lg:text-4xl font-black leading-tight tracking-tight">
              Sistem Absensi Digital Pegawai Sekolah
            </h1>
            <p className="text-blue-100 text-xs max-w-md leading-relaxed">
              Solusi kehadiran pegawai sekolah yang modern dengan verifikasi GPS dan integrasi langsung ke Google Sheets secara transparan dan aman.
            </p>

            <div className="pt-4 space-y-3">
              {[
                { title: 'Kunci GPS', desc: 'Mencegah manipulasi lokasi, pegawai wajib berada di sekitar area sekolah.' },
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
            © 2026 Cendana Visual. Hak Cipta Dilindungi.
          </p>
        </div>

        {/* Right pane: Action */}
        <div className="lg:w-1/2 p-8 lg:p-24 flex flex-col justify-center bg-white items-center">
          <div className="max-w-sm w-full space-y-8">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Login Pegawai</h2>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Masuk ke dalam aplikasi secara instan dan aman menggunakan Akun Google Anda yang telah terdaftar di database sekolah.
              </p>
            </div>

            {!accessToken ? (
              <div className="space-y-4 w-full">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-2 text-slate-600">
                  <span className="font-bold text-xs text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-blue-600" />
                    Otorisasi Google Diperlukan
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    Sistem Absensi SDN 7 Pedungan terintegrasi langsung dengan database Google Sheets. Silakan hubungkan akun Google Anda terlebih dahulu untuk mengotorisasi akses baca-tulis spreadsheet secara aman.
                  </p>
                </div>

                {renderLoginError()}
                
                <button
                  type="button"
                  onClick={handleGoogleConnect}
                  disabled={isLoggingIn}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-sm active:scale-[0.98]"
                  id="btn-connect-google"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menghubungkan ke Google...</span>
                    </>
                  ) : (
                    <>
                      <Compass className="w-4 h-4" />
                      <span>Hubungkan Akun Google</span>
                    </>
                  )}
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-4 text-slate-400 text-[9px] font-bold uppercase tracking-wider">Atau</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <button
                  type="button"
                  onClick={handleEnableOfflineMode}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                  id="btn-enable-offline"
                >
                  <FileSpreadsheet className="w-4 h-4 text-slate-600" />
                  <span>Gunakan Mode Tanpa Google (Lokal)</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4 w-full">
                {accessToken === 'offline_token' && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl space-y-1.5 text-slate-600" id="offline-mode-indicator-card">
                    <span className="font-bold text-[11px] text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Mode Tanpa Google Aktif
                    </span>
                    <p className="text-[11px] leading-relaxed text-slate-600">
                      Silakan pilih akun di bawah ini untuk masuk ke portal:
                    </p>
                  </div>
                )}

                {accessToken === 'offline_token' ? (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {[
                      { username: "ketut", sandi: "", nip: "196512311988031001", role: "admin", name: "Drs. Ketut Pedungan", desc: "Kepala Sekolah (Admin)" },
                      { username: "budi", sandi: "", nip: "199001012020121001", role: "pegawai", name: "Budi Santoso, S.Pd.", desc: "Guru Kelas IV (Pegawai)" },
                      { username: "dewi", sandi: "", nip: "198505122015042002", role: "pegawai", name: "Dewi Lestari, M.Pd.", desc: "Guru Matematika (Pegawai)" },
                      { username: "wayan", sandi: "", nip: "197808202008011003", role: "pegawai", name: "I Wayan Sudiarta", desc: "Staf Tata Usaha (Pegawai)" }
                    ].map((acc, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectOfflineAccount(acc)}
                        className="w-full text-left p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer hover:border-blue-300 hover:shadow-sm flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-xs text-slate-800">{acc.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{acc.desc}</p>
                        </div>
                        <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded font-bold uppercase text-slate-600">
                          {acc.role}
                        </span>
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        setAccessTokenState(null);
                        setSpreadsheetId(null);
                        localStorage.removeItem('sipeg_google_access_token');
                        localStorage.removeItem('absensi_spreadsheet_id');
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer block text-center w-full pt-2"
                    >
                      Hubungkan Kembali ke Google
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between text-xs text-blue-800 shadow-sm" id="google-connected-badge">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
                        <div className="overflow-hidden">
                          <p className="font-extrabold text-[10px] uppercase tracking-wide text-blue-900">Google Terhubung</p>
                          <p className="text-[10px] text-slate-500 truncate max-w-[200px]" title={auth.currentUser?.email || user?.email || ''}>
                            {auth.currentUser?.email || user?.email || 'Akun Google Aktif'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await logout();
                          setAccessTokenState(null);
                          setSpreadsheetId(null);
                          localStorage.removeItem('sipeg_google_access_token');
                          localStorage.removeItem('absensi_spreadsheet_id');
                        }}
                        className="px-2 py-1 text-[10px] bg-white hover:bg-red-50 text-red-600 hover:text-red-700 font-bold rounded-lg transition-colors border border-red-200 cursor-pointer shrink-0 active:scale-95"
                        id="btn-disconnect-google-form"
                      >
                        Putuskan
                      </button>
                    </div>

                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-950 space-y-1">
                      <p className="font-bold">Menghubungkan Akun Pegawai...</p>
                      <p className="text-[11px] leading-relaxed text-slate-600">
                        Sistem sedang memverifikasi email Google Anda dan mencocokkannya dengan database pegawai. Mohon tunggu sejenak.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-100 flex flex-col gap-1.5 text-[11px] leading-relaxed text-slate-500">
              <span className="font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                💡 Petunjuk Akses:
              </span>
              <p>
                Sistem absensi ini tidak lagi membutuhkan username & password. Pegawai cukup menekan tombol <strong>Hubungkan Akun Google</strong> menggunakan email yang telah didaftarkan operator sekolah di sheet Pegawai Kolom G.
              </p>
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
            userEmail={loggedInAccount?.username || 'admin'}
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
            <div className="w-8 h-8 bg-blue-50 rounded flex items-center justify-center text-blue-600 border border-blue-100 overflow-hidden shrink-0">
              {schoolConfig.logoUrl ? (
                <img src={schoolConfig.logoUrl} alt="Logo Sekolah" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              ) : (
                <School className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-800 text-xs tracking-tight uppercase">{schoolConfig.name}</span>
                {accessToken === 'offline_token' && (
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[8px] font-black uppercase rounded border border-emerald-200 tracking-wider">
                    Lokal (Offline)
                  </span>
                )}
              </div>
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
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-800 shadow-sm" id="sync-error-banner">
            <Info className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <div className="space-y-1.5 w-full">
              <p className="font-bold">Gagal Sinkronisasi Database</p>
              <p className="text-red-700 leading-relaxed">{dataError}</p>
              
              <div className="p-3 bg-white border border-red-100 rounded-lg text-[11px] leading-relaxed text-slate-500 space-y-1 mt-1">
                <span className="font-bold text-slate-700 uppercase tracking-wide block">💡 Mengapa ini terjadi?</span>
                <p>Sinkronisasi gagal karena ID Spreadsheet salah, spreadsheet telah dihapus, akun Google Anda tidak memiliki akses ke file tersebut, atau konfigurasi Firebase telah berubah.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                {dataError.includes('UNAUTHORIZED') ? (
                  <button 
                    onClick={handleGoogleConnect}
                    disabled={isLoggingIn}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                    id="btn-reauth-google"
                  >
                    {isLoggingIn ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Sedang Menghubungkan...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-pulse" />
                        Masuk Ulang Google
                      </>
                    )}
                  </button>
                ) : (
                  <button 
                    onClick={fetchAllData}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-xs cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                    id="btn-retry-sync"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Coba Lagi
                  </button>
                )}
                
                <button 
                  onClick={() => {
                    localStorage.removeItem('absensi_spreadsheet_id');
                    setSpreadsheetId(null);
                    setDataError(null);
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-xs cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                  id="btn-reset-spreadsheet-id"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Ganti / Reset Spreadsheet
                </button>

                <button 
                  onClick={handleEnableOfflineMode}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                  id="btn-switch-to-offline"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Masuk Mode Offline
                </button>

                {localStorage.getItem('sipeg_custom_firebase_config') && (
                  <button 
                    onClick={() => {
                      localStorage.removeItem('sipeg_custom_firebase_config');
                      window.location.reload();
                    }}
                    className="px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded font-bold text-xs cursor-pointer transition-all active:scale-95"
                    id="btn-reset-firebase-config"
                  >
                    Reset Config Firebase
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-bold text-xs cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                  id="btn-logout-sync-error"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Keluar Akun
                </button>
              </div>
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
            const isAdmin = loggedInAccount?.role === 'admin' || (activeEmployee && (
              activeEmployee.role === 'Kepala Sekolah' ||
              activeEmployee.role === 'Staf / Operator' ||
              activeEmployee.role.toLowerCase().includes('admin') ||
              activeEmployee.role.toLowerCase().includes('operator')
            ));

            if (portalType === 'employee') {
              return (
                <EmployeeDashboard
                  userEmail={loggedInAccount?.username || 'admin'}
                  userName={loggedInAccount?.name || 'Pegawai SDN 7'}
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
                      Maaf, akun Anda ({activeEmployee?.name || loggedInAccount?.username}) tercatat sebagai <strong className="text-slate-700">{activeEmployee?.role || 'Pegawai'}</strong>. Hanya Kepala Sekolah atau Staf Operator yang diizinkan masuk ke panel kontrol.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-500 text-left space-y-1">
                    <span className="font-bold text-slate-700 uppercase tracking-wide block">Cara menguji akses admin:</span>
                    <p>Silakan hubungi Administrator Sekolah, atau gunakan tombol <strong className="text-red-600">Keluar</strong> di Portal Pegawai untuk masuk kembali menggunakan akun Google yang memiliki hak akses administrator.</p>
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

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="modal-logout-confirm">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center border border-red-100">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Konfirmasi Keluar</h3>
                <p className="text-[11px] text-slate-500">Apakah Anda yakin ingin keluar dari aplikasi?</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Anda perlu menghubungkan ulang akun Google dan login kembali dengan Username/NIP Anda untuk masuk ke sistem di lain waktu.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                id="btn-cancel-logout"
              >
                Batal
              </button>
              <button
                onClick={executeLogout}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                id="btn-confirm-logout"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
