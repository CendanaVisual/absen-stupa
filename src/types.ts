export interface Employee {
  id: string; // NIP or unique ID
  name: string;
  role: string; // Jabatan (e.g., Kepala Sekolah, Guru, Staf)
  email: string; // Used to match with Google Account email
  googleEmail?: string; // Registered Google Account Email (from Column G)
  photoUrl?: string; // profile photo URL or base64 string
  baseSalary?: number; // Base monthly salary
  checkInStart?: string;    // Override HH:MM
  checkInEnd?: string;      // Override HH:MM
  checkOutStartMonThu?: string; // Override HH:MM
  checkOutEndMonThu?: string;   // Override HH:MM
  checkOutStartFri?: string;    // Override HH:MM
  checkOutEndFri?: string;      // Override HH:MM
  sandi?: string;
}

export interface AttendanceRecord {
  timestamp: string; // e.g., "12/07/2026 08:15:30"
  employeeId: string;
  employeeName: string;
  type: 'Masuk' | 'Pulang' | 'Sakit' | 'Cuti' | 'Dinas Luar';
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
  coordinates: string; // "lat, lng" or "-"
  distance: string; // in meters or "Dalam Radius" or "Dinas Luar" or "-"
  status: 'Tepat Waktu' | 'Terlambat' | 'Sakit' | 'Cuti' | 'Dinas Luar';
  notes: string;
  photo?: string; // base64 string or URL of taken photo
  lateMinutes?: number; // minutes late (if any)
  earlyMinutes?: number; // minutes checked out early (if any)
  penaltyAmount?: number; // penalty amount in Rp
}

export interface CustomHoliday {
  date: string; // YYYY-MM-DD
  label: string; // Holiday name, e.g. "Tahun Baru"
}

export interface SchoolConfig {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters, e.g. 100
  checkInStart?: string;    // HH:MM
  checkInEnd?: string;      // HH:MM
  checkOutStartMonThu?: string; // HH:MM
  checkOutEndMonThu?: string;   // HH:MM
  checkOutStartFri?: string;    // HH:MM
  checkOutEndFri?: string;      // HH:MM
  disableSatSun?: boolean;       // Weekend holiday enforcement (true by default)
  holidays?: CustomHoliday[];   // Custom holidays
  latePenaltyPerMinute?: number; // Penalty per minute of late check-in (Rp)
  earlyPenaltyPerMinute?: number; // Penalty per minute of early check-out (Rp)
  logoUrl?: string;
  backgroundUrl?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'Sakit' | 'Cuti' | 'Dinas Luar';
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string;
  status: 'Disetujui' | 'Pending' | 'Ditolak';
}

export interface UserAccount {
  username: string;
  sandi: string;
  nip: string; // NIP/ID of employee or 'admin'
  role: string; // 'admin' or 'pegawai'
  name: string; // Full Name
}

