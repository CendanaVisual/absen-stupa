import React, { useState, useEffect } from 'react';
import { 
  MapPin, Clock, Calendar, CheckCircle, AlertTriangle, FileText, Send, 
  RefreshCw, ChevronRight, User, HelpCircle, LogOut, Camera, Upload, Palette
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { Employee, AttendanceRecord, SchoolConfig } from '../types';
import { saveAttendanceRecord, saveLeaveRequest, updateEmployeePhoto } from '../lib/sheets';

const THEMES: Record<string, {
  name: string;
  bg: string;
  card: string;
  primary: string;
  primaryText: string;
  accent: string;
  badge: string;
  header: string;
  btn: string;
}> = {
  slate: {
    name: 'Slate Modern',
    bg: 'bg-slate-50',
    card: 'bg-white border-slate-200',
    primary: 'bg-slate-800',
    primaryText: 'text-slate-800',
    accent: 'text-blue-600 bg-blue-50 border-blue-100',
    badge: 'bg-slate-100 text-slate-800 border-slate-200',
    header: 'bg-slate-900 border-slate-800 text-white',
    btn: 'bg-slate-800 hover:bg-slate-900 text-white'
  },
  emerald: {
    name: 'Emerald Forest',
    bg: 'bg-emerald-50/30',
    card: 'bg-white border-emerald-100',
    primary: 'bg-emerald-800',
    primaryText: 'text-emerald-800',
    accent: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    header: 'bg-emerald-900 border-emerald-800 text-white',
    btn: 'bg-emerald-700 hover:bg-emerald-800 text-white'
  },
  royal: {
    name: 'Royal Purple',
    bg: 'bg-violet-50/20',
    card: 'bg-white border-violet-100',
    primary: 'bg-violet-800',
    primaryText: 'text-violet-800',
    accent: 'text-violet-700 bg-violet-50 border-violet-100',
    badge: 'bg-violet-50 text-violet-800 border-violet-200',
    header: 'bg-violet-900 border-violet-800 text-white',
    btn: 'bg-violet-700 hover:bg-violet-800 text-white'
  },
  amber: {
    name: 'Warm Amber',
    bg: 'bg-amber-50/30',
    card: 'bg-white border-amber-100',
    primary: 'bg-amber-800',
    primaryText: 'text-amber-900',
    accent: 'text-amber-700 bg-amber-50 border-amber-100',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    header: 'bg-amber-950 border-amber-900 text-amber-50',
    btn: 'bg-amber-700 hover:bg-amber-800 text-white'
  }
};

const MONTHS = [
  { value: 'all', label: 'Semua Bulan' },
  { value: '01', label: 'Januari' },
  { value: '02', label: 'Februari' },
  { value: '03', label: 'Maret' },
  { value: '04', label: 'April' },
  { value: '05', label: 'Mei' },
  { value: '06', label: 'Juni' },
  { value: '07', label: 'Juli' },
  { value: '08', label: 'Agustus' },
  { value: '09', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' }
];

interface EmployeeDashboardProps {
  userEmail: string;
  userName: string;
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaveRequests?: any[];
  schoolConfig: SchoolConfig;
  spreadsheetId: string;
  accessToken: string;
  onRefreshData: () => Promise<void>;
  onLogout: () => void;
  selectedEmployeeId: string;
  onSelectedEmployeeIdChange: (id: string) => void;
}

export default function EmployeeDashboard({
  userEmail,
  userName,
  employees,
  attendance,
  leaveRequests = [],
  schoolConfig,
  spreadsheetId,
  accessToken,
  onRefreshData,
  onLogout,
  selectedEmployeeId,
  onSelectedEmployeeIdChange,
}: EmployeeDashboardProps) {
  const activeEmployee = employees.find(emp => emp.id === selectedEmployeeId) || employees[0];

  // Photo Edit States
  const [showPhotoEdit, setShowPhotoEdit] = useState(false);
  const [photoInputUrl, setPhotoInputUrl] = useState('');
  const [photoSubmitting, setPhotoSubmitting] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // GPS States
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Clock in/out states
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Webcam capture states
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [useWebcam, setUseWebcam] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Dynamic scheduler clock states
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  const [currentTimeStr, setCurrentTimeStr] = useState(() => {
    return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + " WITA";
  });

  // Custom Confirmation Modal state for Employee portal (fixes iframe confirm blocks)
  const [employeeConfirmModal, setEmployeeConfirmModal] = useState<{
    isOpen: boolean;
    type: 'clock-in' | 'clock-out' | 'leave';
    title: string;
    description: string;
    action: () => void;
  } | null>(null);

  // Leave Form States
  const [leaveType, setLeaveType] = useState<'Sakit' | 'Cuti' | 'Dinas Luar'>('Sakit');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveAttachment, setLeaveAttachment] = useState<string>('');
  const [leaveAttachmentName, setLeaveAttachmentName] = useState<string>('');
  const [leaveAttachmentSize, setLeaveAttachmentSize] = useState<number>(0);
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [leaveSuccess, setLeaveSuccess] = useState<string | null>(null);

  const processUploadedFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const resultStr = event.target?.result as string;
      
      // If it's a large image, compress it to keep it reasonable
      if (file.type.startsWith('image/') && file.size > 200 * 1024) {
        const img = new Image();
        img.src = resultStr;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const maxDim = 800;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
            setLeaveAttachment(compressedBase64);
            setLeaveAttachmentName(file.name.replace(/\.[^/.]+$/, "") + ".jpg");
            setLeaveAttachmentSize(Math.round(compressedBase64.length * 0.75));
          } else {
            setLeaveAttachment(resultStr);
            setLeaveAttachmentName(file.name);
            setLeaveAttachmentSize(file.size);
          }
        };
      } else {
        setLeaveAttachment(resultStr);
        setLeaveAttachmentName(file.name);
        setLeaveAttachmentSize(file.size);
      }
    };
    reader.readAsDataURL(file);
  };

  // Month and Year filter states for Employee Portal
  const [filterMonth, setFilterMonth] = useState<string>(() => {
    return (new Date().getMonth() + 1).toString().padStart(2, '0');
  });
  const [filterYear, setFilterYear] = useState<string>(() => {
    return new Date().getFullYear().toString();
  });

  // Cleanup webcam stream
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Bind video element to media stream
  useEffect(() => {
    let active = true;
    if (useWebcam && cameraStream) {
      setTimeout(() => {
        if (!active) return;
        const video = document.getElementById('webcam-video') as HTMLVideoElement;
        if (video) {
          video.srcObject = cameraStream;
        }
      }, 150);
    }
    return () => {
      active = false;
    };
  }, [useWebcam, cameraStream]);

  // Clock updating interval
  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentTimeMinutes(d.getHours() * 60 + d.getMinutes());
      setCurrentTimeStr(d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + " WITA");
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
      setCameraStream(stream);
      setUseWebcam(true);
    } catch (err: any) {
      console.error("Camera access failed", err);
      setCameraError("Tidak dapat mengakses kamera. Silakan unggah foto dari galeri HP.");
      setUseWebcam(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setUseWebcam(false);
  };

  const capturePhoto = () => {
    const video = document.getElementById('webcam-video') as HTMLVideoElement;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      setCapturedPhoto(dataUrl);
      stopCamera();
    }
  };

  const handlePhotoUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 120;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, 160, 120);
        setCapturedPhoto(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoSubmitting(true);
    setPhotoError(null);

    try {
      const resizedBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const max_size = 120; // compact avatar size
            let width = img.width;
            let height = img.height;
            if (width > height) {
              if (width > max_size) {
                height *= max_size / width;
                width = max_size;
              }
            } else {
              if (height > max_size) {
                width *= max_size / height;
                height = max_size;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.6)); // compressed JPEG base64 string
          };
          img.onerror = () => reject(new Error('Gagal memproses gambar.'));
          img.src = event.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Gagal membaca file.'));
        reader.readAsDataURL(file);
      });

      await updateEmployeePhoto(spreadsheetId, accessToken, activeEmployee.id, resizedBase64);
      await onRefreshData();
      setShowPhotoEdit(false);
      alert('Foto profil berhasil diperbarui!');
    } catch (err: any) {
      console.error(err);
      setPhotoError(err.message || 'Gagal menyimpan foto.');
    } finally {
      setPhotoSubmitting(false);
    }
  };

  const handlePhotoUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoInputUrl.trim()) return;

    setPhotoSubmitting(true);
    setPhotoError(null);

    try {
      await updateEmployeePhoto(spreadsheetId, accessToken, activeEmployee.id, photoInputUrl.trim());
      await onRefreshData();
      setShowPhotoEdit(false);
      setPhotoInputUrl('');
      alert('Foto profil berhasil diperbarui!');
    } catch (err: any) {
      console.error(err);
      setPhotoError(err.message || 'Gagal menyimpan foto.');
    } finally {
      setPhotoSubmitting(false);
    }
  };

  // Load user geolocation
  const fetchLocation = () => {
    setGpsLoading(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('Browser Anda tidak mendukung layanan lokasi GPS.');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        
        // Calculate distance in meters using Haversine
        const dist = getDistanceInMeters(
          latitude,
          longitude,
          schoolConfig.latitude,
          schoolConfig.longitude
        );
        setDistance(dist);
        setGpsLoading(false);
      },
      (error) => {
        console.error(error);
        let errorMsg = 'Gagal mengakses GPS. Pastikan izin lokasi diaktifkan.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Izin akses lokasi GPS ditolak. Silakan aktifkan izin lokasi di browser Anda.';
        }
        setGpsError(errorMsg);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    fetchLocation();
  }, [schoolConfig]);

  // Haversine distance calculator
  const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // meters
  };

  // Check if within allowed radius
  const isWithinRadius = distance !== null && distance <= schoolConfig.radius;

  // Personal history for active employee (all records, unfiltered)
  const allPersonalHistory = attendance
    .filter(record => record.employeeId === activeEmployee?.id)
    .sort((a, b) => {
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

  // Unique years for filtering dropdown
  const availableYears = React.useMemo(() => {
    const yearsSet = new Set<string>();
    for (let y = 2024; y <= 2050; y++) {
      yearsSet.add(y.toString());
    }
    
    allPersonalHistory.forEach(r => {
      if (r.date && r.date.length >= 4) {
        yearsSet.add(r.date.substring(0, 4));
      }
    });
    
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [allPersonalHistory]);

  // Filtered personal history based on dropdown month & year
  const filteredHistory = allPersonalHistory.filter(record => {
    if (!record.date) return false;
    const recYear = record.date.substring(0, 4);
    const recMonth = record.date.substring(5, 7);
    
    const matchesMonth = filterMonth === 'all' || recMonth === filterMonth;
    const matchesYear = filterYear === 'all' || recYear === filterYear;
    
    return matchesMonth && matchesYear;
  });

  // Check if today has already clocked in/out
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = allPersonalHistory.filter(r => r.date === todayStr);
  const hasClockedIn = todayRecords.some(r => r.type === 'Masuk');
  const hasClockedOut = todayRecords.some(r => r.type === 'Pulang');

  // Theme selector state
  const [selectedTheme, setSelectedTheme] = useState<string>(() => {
    return localStorage.getItem('employee_portal_theme') || 'slate';
  });

  // Helper to convert HH:MM to minutes
  const timeToMin = (tStr?: string) => {
    if (!tStr) return 0;
    const [h, m] = tStr.split(':').map(Number);
    return h * 60 + m;
  };

  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
  const isFriday = dayOfWeek === 5;

  // Retrieve active schedule (check for custom employee overrides, fallback to school config)
  const getEmployeeSchedule = () => {
    if (!activeEmployee) {
      return {
        checkInStart: schoolConfig.checkInStart || '06:00',
        checkInEnd: schoolConfig.checkInEnd || '07:45',
        checkOutStart: isFriday 
          ? (schoolConfig.checkOutStartFri || '13:00') 
          : (schoolConfig.checkOutStartMonThu || '15:00'),
        checkOutEnd: isFriday 
          ? (schoolConfig.checkOutEndFri || '16:00') 
          : (schoolConfig.checkOutEndMonThu || '18:00')
      };
    }
    return {
      checkInStart: activeEmployee.checkInStart || schoolConfig.checkInStart || '06:00',
      checkInEnd: activeEmployee.checkInEnd || schoolConfig.checkInEnd || '07:45',
      checkOutStart: isFriday 
        ? (activeEmployee.checkOutStartFri || schoolConfig.checkOutStartFri || '13:00')
        : (activeEmployee.checkOutStartMonThu || schoolConfig.checkOutStartMonThu || '15:00'),
      checkOutEnd: isFriday
        ? (activeEmployee.checkOutEndFri || schoolConfig.checkOutEndFri || '16:00')
        : (activeEmployee.checkOutEndMonThu || schoolConfig.checkOutEndMonThu || '18:00')
    };
  };

  const sched = getEmployeeSchedule();
  const inStartMin = timeToMin(sched.checkInStart);
  const inEndMin = timeToMin(sched.checkInEnd);
  const outStartMin = timeToMin(sched.checkOutStart);
  const outEndMin = timeToMin(sched.checkOutEnd);

  // Still compute these for displaying status on current UI panel
  const isWithinCheckInTime = currentTimeMinutes >= inStartMin && currentTimeMinutes <= inEndMin;
  const isWithinCheckOutTime = currentTimeMinutes >= outStartMin && currentTimeMinutes <= outEndMin;

  // Check for weekend block
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isWeekendHoliday = isWeekend && (schoolConfig.disableSatSun !== false);

  // Check for custom holiday (red date)
  const todayCustomHoliday = schoolConfig.holidays?.find(h => h.date === todayStr);

  const holidayOrWeekendMessage = isWeekendHoliday 
    ? 'Hari Libur Sabtu & Minggu (Sistem Absensi Dinonaktifkan)' 
    : todayCustomHoliday 
    ? `Hari Libur Nasional: ${todayCustomHoliday.label} (Absensi Dinonaktifkan)`
    : null;

  // Check for approved leave for today
  const todayApprovedLeave = leaveRequests?.find(req => {
    if (req.employeeId !== activeEmployee?.id || req.status !== 'Disetujui') return false;
    
    // Parse dates
    const start = new Date(req.startDate);
    const end = new Date(req.endDate);
    
    // Use local date parts to prevent timezone offsets shifting dates
    const today = new Date();
    today.setHours(0,0,0,0);
    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);
    
    return today >= start && today <= end;
  });

  const handleClockInOrOut = async (type: 'Masuk' | 'Pulang') => {
    if (!activeEmployee) return;
    if (!isWithinRadius) {
      alert(`Anda berada di luar jangkauan radius sekolah! Jarak Anda sekarang: ${distance ? Math.round(distance) : '-'}m. Batas maksimum: ${schoolConfig.radius}m.`);
      return;
    }

    if (holidayOrWeekendMessage) {
      alert(`Absensi Ditolak! ${holidayOrWeekendMessage}`);
      return;
    }

    setSubmitting(true);
    setSubmitSuccess(null);
    try {
      const now = new Date();
      const timestamp = now.toLocaleString('id-ID', { hour12: false });
      const timeStr = now.toTimeString().split(' ')[0];

      // Determine late status or early checkout based on active sched overrides with second-level precision
      let status: 'Tepat Waktu' | 'Terlambat' | 'Sakit' | 'Cuti' | 'Dinas Luar' = 'Tepat Waktu';
      let penaltyText = "";

      const currentSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

      if (type === 'Masuk') {
        const [endHour, endMin] = sched.checkInEnd.split(':').map(Number);
        const limitSecs = endHour * 3600 + endMin * 60;
        
        if (currentSecs > limitSecs) {
          status = 'Terlambat';
          const diffSecs = currentSecs - limitSecs;
          const min = Math.floor(diffSecs / 60);
          const sec = diffSecs % 60;
          const penaltyRate = schoolConfig.latePenaltyPerMinute || 1000;
          const penaltyAmount = Math.round((diffSecs / 60) * penaltyRate);
          penaltyText = ` [Terlambat ${min}m ${sec}s - Potongan: Rp ${penaltyAmount.toLocaleString('id-ID')}]`;
        }
      } else { // Pulang
        const [startHour, startMin] = sched.checkOutStart.split(':').map(Number);
        const limitSecs = startHour * 3600 + startMin * 60;
        
        if (currentSecs < limitSecs) {
          // Early check-out
          const diffSecs = limitSecs - currentSecs;
          const min = Math.floor(diffSecs / 60);
          const sec = diffSecs % 60;
          const penaltyRate = schoolConfig.earlyPenaltyPerMinute || 1000;
          const penaltyAmount = Math.round((diffSecs / 60) * penaltyRate);
          penaltyText = ` [Mendahului Pulang ${min}m ${sec}s - Potongan: Rp ${penaltyAmount.toLocaleString('id-ID')}]`;
        }
      }

      const record: AttendanceRecord = {
        timestamp,
        employeeId: activeEmployee.id,
        employeeName: activeEmployee.name,
        type,
        date: todayStr,
        time: timeStr,
        coordinates: coords ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : '-',
        distance: distance ? `${Math.round(distance)} meter` : '-',
        status,
        notes: (notes.trim() || (type === 'Masuk' ? 'Hadir Pagi' : 'Pulang Tugas')) + penaltyText,
        photo: capturedPhoto || '-', // PASS THE CAPTURED SELFIE COMPACT JPEG BASE64 HERE
      };

      await saveAttendanceRecord(spreadsheetId, accessToken, record);
      await onRefreshData();
      
      setNotes('');
      setCapturedPhoto(null); // RESET SPECIFIC SELFIE FOR NEXT SUCCESSFUL SESSION
      setSubmitSuccess(`Berhasil melakukan Absen ${type}!${penaltyText}`);
      setTimeout(() => setSubmitSuccess(null), 10000);
    } catch (err: any) {
      console.error(err);
      alert('Gagal mengirimkan absen ke Google Sheets: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeaveRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEmployee) return;
    if (!startDate || !endDate) {
      alert('Pilih tanggal awal dan akhir pengajuan.');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    setEmployeeConfirmModal({
      isOpen: true,
      type: 'leave',
      title: 'Konfirmasi Pengajuan',
      description: `Apakah Anda yakin ingin mengirimkan pengajuan ${leaveType} untuk ${activeEmployee.name} dari tanggal ${startDate} s/d ${endDate} (${diffDays} hari)?`,
      action: async () => {
        setLeaveSubmitting(true);
        setLeaveSuccess(null);
        try {
          const leaveRequest = {
            id: 'REQ-' + Date.now(),
            employeeId: activeEmployee.id,
            employeeName: activeEmployee.name,
            type: leaveType,
            startDate,
            endDate,
            reason: leaveReason,
            status: 'Pending',
            attachment: (leaveType === 'Sakit' || leaveType === 'Dinas Luar') ? leaveAttachment : ''
          };

          await saveLeaveRequest(spreadsheetId, accessToken, leaveRequest);
          await onRefreshData();
          
          setStartDate('');
          setEndDate('');
          setLeaveReason('');
          setLeaveAttachment('');
          setLeaveAttachmentName('');
          setLeaveAttachmentSize(0);
          setLeaveSuccess(`Pengajuan ${leaveType} selama ${diffDays} hari berhasil dikirim! Menunggu persetujuan dari Kepala Sekolah / Admin.`);
          setTimeout(() => setLeaveSuccess(null), 6000);
        } catch (err: any) {
          console.error(err);
          alert('Gagal mengirim pengajuan izin: ' + err.message);
        } finally {
          setLeaveSubmitting(false);
        }
      }
    });
  };

  const currentThemeData = THEMES[selectedTheme] || THEMES.slate;

  return (
    <motion.div 
      className={`p-4 rounded-xl transition-colors duration-300 ${currentThemeData.bg} relative overflow-hidden`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* Background Motif */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-50 bg-repeat" 
        style={{ 
          backgroundImage: `url("${schoolConfig.backgroundUrl || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=1200'} ")`,
          backgroundSize: '240px'
        }}
      />

      <div className="relative z-10 space-y-4">
      
      {/* TOOLBAR ATAS: TEMA & REFRESH */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1.5">
          <Palette className="w-4 h-4 text-slate-500" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pilih Tema:</span>
          <select
            value={selectedTheme}
            onChange={(e) => {
              const nextTheme = e.target.value;
              setSelectedTheme(nextTheme);
              localStorage.setItem('employee_portal_theme', nextTheme);
            }}
            className="text-[11px] font-bold bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            id="select-theme-portal"
          >
            {Object.entries(THEMES).map(([key, value]) => (
              <option key={key} value={key}>
                {value.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
          <span>Portal Kehadiran: <strong className="font-bold text-slate-700">{currentThemeData.name}</strong></span>
          <span className="text-slate-300">|</span>
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
            className="flex items-center gap-1 px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[9px] text-slate-600 hover:text-blue-600 font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
            id="btn-employee-toolbar-refresh"
            title="Refresh Data dari Google Sheets"
          >
            <RefreshCw className={`w-2.5 h-2.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Memuat...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Employee Identity Header */}
      <div className={`${currentThemeData.header} rounded-xl p-4 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Avatar and Camera Edit Icon */}
          <div className="relative group shrink-0">
            {activeEmployee?.photoUrl ? (
              <img 
                src={activeEmployee.photoUrl} 
                alt={activeEmployee?.name || "Pegawai"}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded border-2 border-white/40 object-cover shadow-md bg-white/10"
              />
            ) : (
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded flex items-center justify-center border border-white/20 text-white font-black text-lg shadow-md uppercase">
                {activeEmployee?.name?.charAt(0) || <User className="w-6 h-6" />}
              </div>
            )}
            
            {/* Camera Trigger Badge */}
            <button
              onClick={() => setShowPhotoEdit(!showPhotoEdit)}
              className="absolute -bottom-1 -right-1 p-1 bg-white hover:bg-slate-50 text-blue-700 rounded-full border border-blue-200 shadow-md transition-transform hover:scale-105 cursor-pointer"
              title="Ubah Foto Profil"
              id="btn-trigger-edit-photo"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-blue-100 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Portal Kehadiran Pegawai
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base font-black tracking-tight">{activeEmployee ? activeEmployee.name : userName}</h1>
              {activeEmployee && (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full font-mono">
                  Gaji: Rp {(activeEmployee.baseSalary || 4000000).toLocaleString('id-ID')}
                </span>
              )}
            </div>
            <p className="text-[10px] text-blue-50/80 mt-0.5">{activeEmployee ? `${activeEmployee.role} • NIP. ${activeEmployee.id}` : userEmail}</p>
          </div>
        </div>

        {/* Demo Identity Switcher for easy testing */}
        <div className="bg-white/10 backdrop-blur-sm rounded p-2 border border-white/15 flex flex-col gap-1 self-start sm:self-auto shrink-0 w-full sm:w-auto">
          <label className="text-[9px] font-black uppercase tracking-wider text-blue-200">Ganti Akun Demo (Uji Coba)</label>
          <div className="flex items-center gap-2 justify-between">
            <select
              value={selectedEmployeeId}
              onChange={(e) => onSelectedEmployeeIdChange(e.target.value)}
              className="bg-transparent border-0 text-xs font-bold focus:ring-0 text-white cursor-pointer pr-6 py-0 outline-none max-w-[180px]"
              id="select-demo-employee"
            >
              {employees.map((emp, idx) => (
                <option key={`${emp.id}-${idx}`} value={emp.id} className="text-slate-800">
                  {emp.name} ({emp.role})
                </option>
              ))}
            </select>
            <button 
              onClick={onLogout}
              className="p-1 bg-red-600 hover:bg-red-700 rounded text-white transition-all"
              title="Keluar / Ganti Akun Google"
              id="btn-logout"
            >
              <LogOut className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Photo Edit Collapsible Section */}
      {showPhotoEdit && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-blue-600" />
              Perbarui Foto Profil ({activeEmployee?.name || ""})
            </h3>
            <button 
              onClick={() => setShowPhotoEdit(false)}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold uppercase tracking-wider"
              id="btn-close-photo-edit"
            >
              Batal
            </button>
          </div>

          {photoError && (
            <div className="p-2 bg-red-50 border border-red-200 text-red-700 rounded text-xs">
              {photoError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File Upload Option */}
            <div className="border border-dashed border-slate-200 rounded p-4 text-center space-y-2 hover:bg-slate-50/50 transition-all relative">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoFileChange}
                disabled={photoSubmitting}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                id="input-photo-file"
              />
              <Upload className="w-6 h-6 text-slate-400 mx-auto" />
              <div>
                <p className="text-xs font-bold text-slate-600">Pilih / Unggah File Foto</p>
                <p className="text-[10px] text-slate-400 mt-1">Mendukung JPG, PNG. Foto akan dikompresi otomatis agar hemat memori spreadsheet.</p>
              </div>
            </div>

            {/* URL Option */}
            <form onSubmit={handlePhotoUrlSubmit} className="space-y-3 border border-slate-100 rounded p-4 flex flex-col justify-between">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Atau Tempel URL Gambar
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/foto-saya.jpg"
                  required
                  value={photoInputUrl}
                  onChange={(e) => setPhotoInputUrl(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 text-slate-700 font-mono"
                  id="input-photo-url"
                />
              </div>

              <button
                type="submit"
                disabled={photoSubmitting || !photoInputUrl.trim()}
                className="w-full py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-bold uppercase tracking-wider disabled:opacity-50 transition-all cursor-pointer shadow-sm mt-2"
                id="btn-save-photo-url"
              >
                {photoSubmitting ? 'Menyimpan...' : 'Gunakan URL'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* LEFT COLUMN: Check-In Location Guard */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* GPS Radar Container */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status Lokasi & GPS</h2>
              </div>
              <button 
                onClick={fetchLocation}
                disabled={gpsLoading}
                className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded border border-slate-200 transition-all flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider disabled:opacity-50"
                id="btn-refresh-gps"
              >
                <RefreshCw className={`w-3 h-3 ${gpsLoading ? 'animate-spin' : ''}`} />
                Segarkan GPS
              </button>
            </div>

            {/* Target Location Card */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Pusat Lokasi Sekolah</h4>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">{schoolConfig.name}</p>
                  <p className="text-[11px] text-slate-500">{schoolConfig.address}</p>
                </div>

              </div>
              <div className="text-[10px] text-slate-400 font-mono flex gap-4 border-t border-slate-200/60 pt-1.5">
                <span>Lat: {schoolConfig.latitude.toFixed(6)}</span>
                <span>Lng: {schoolConfig.longitude.toFixed(6)}</span>
              </div>
            </div>

            {/* Radar Visual Display */}
            <div className="flex flex-col items-center py-4 text-center bg-slate-50/50 border border-slate-100 rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-blue-50/30 pointer-events-none"></div>
              {/* Grid lines to make it feel like a map */}
              <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 opacity-5 pointer-events-none">
                <div className="border-r border-b border-slate-400"></div><div className="border-r border-b border-slate-400"></div><div className="border-r border-b border-slate-400"></div><div className="border-r border-b border-slate-400"></div><div className="border-r border-b border-slate-400"></div><div className="border-r border-b border-slate-400"></div>
                <div className="border-r border-b border-slate-400"></div><div className="border-r border-b border-slate-400"></div><div className="border-r border-b border-slate-400"></div><div className="border-r border-b border-slate-400"></div><div className="border-r border-b border-slate-400"></div><div className="border-r border-b border-slate-400"></div>
              </div>

              <div className="relative w-28 h-28 flex items-center justify-center z-10">
                {/* Outer Ripple */}
                <span className={`absolute inset-0 rounded-full opacity-10 animate-ping ${
                  distance === null ? 'bg-slate-300' : isWithinRadius ? 'bg-blue-500' : 'bg-red-500'
                }`}></span>
                
                {/* Secondary ring */}
                <div className={`absolute w-24 h-24 rounded-full border border-dashed flex items-center justify-center ${
                  distance === null ? 'border-slate-200' : isWithinRadius ? 'border-blue-200 bg-blue-50/50' : 'border-red-200 bg-red-50/50'
                }`}>
                  {/* Distance Number */}
                  <div className="text-center z-10">
                    {gpsLoading ? (
                      <LoaderIcon />
                    ) : distance !== null ? (
                      <>
                        <span className="block text-2xl font-black tracking-tight text-slate-800">
                          {Math.round(distance)}
                        </span>
                        <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
                          Meter
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-400 block text-xs">Offline</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Badge & Actions */}
              <div className="mt-3 space-y-2 z-10">
                {distance !== null && !gpsError ? (
                  isWithinRadius ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      <CheckCircle className="w-3 h-3 text-blue-600" />
                      GPS Terkunci (Dalam Jangkauan)
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-red-100 text-red-800 border border-red-200 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      <AlertTriangle className="w-3 h-3 text-red-600" />
                      Di Luar Radius Kehadiran ({Math.round(distance)}m)
                    </div>
                  )
                ) : gpsError ? (
                  <div className="p-2 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[10px] font-bold max-w-sm">
                    {gpsError}
                  </div>
                ) : (
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mendeteksi lokasi Anda...</span>
                )}
              </div>
            </div>

            {/* Leave, Holiday or Schedule Notification Banner */}
            {holidayOrWeekendMessage ? (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-semibold flex items-start gap-2.5 shadow-sm">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <p className="font-bold">Hari Libur Aktif</p>
                  <p className="text-[11px] font-medium text-rose-700 mt-0.5 leading-relaxed">
                    {holidayOrWeekendMessage}. Tombol absensi dinonaktifkan sementara oleh sistem administrator.
                  </p>
                </div>
              </div>
            ) : todayApprovedLeave ? (
              <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-lg text-xs font-semibold flex items-start gap-2.5 shadow-sm">
                <CheckCircle className="w-4 h-4 shrink-0 text-indigo-600 mt-0.5" />
                <div>
                  <p className="font-bold">Hari Libur / Masa Cuti Aktif</p>
                  <p className="text-[11px] font-medium text-indigo-700 mt-0.5 leading-relaxed">
                    Hari ini Anda dibebaskan dari kewajiban absensi karena pengajuan <strong>{todayApprovedLeave.type}</strong> telah <strong>Disetujui</strong> ({todayApprovedLeave.startDate} s/d {todayApprovedLeave.endDate}). Tombol absensi dinonaktifkan.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-700 font-bold uppercase text-[9px] tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  Sistem Penjadwalan Aktif ({currentTimeStr})
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-semibold pt-1">
                  <div className={`p-2 rounded border ${isWithinCheckInTime ? 'bg-blue-50/70 border-blue-200 text-blue-700 font-bold' : 'bg-rose-50/50 border-rose-200 text-rose-700 font-medium'}`}>
                    <p className="text-[9px] uppercase tracking-wider font-bold">Absen Masuk:</p>
                    <p className="mt-0.5">{sched.checkInStart} - {sched.checkInEnd}</p>
                    <span className="text-[9px] font-normal block mt-0.5">
                      {isWithinCheckInTime ? '🟢 Sedang Berlangsung' : '⚠️ Di Luar Jadwal (Terlambat)'}
                    </span>
                  </div>
                  <div className={`p-2 rounded border ${isWithinCheckOutTime ? 'bg-slate-800 border-slate-900 text-white font-bold' : 'bg-rose-50/50 border-rose-200 text-rose-700 font-medium'}`}>
                    <p className="text-[9px] uppercase tracking-wider font-bold">Absen Pulang ({isFriday ? 'Jumat' : 'Sen-Kam'}):</p>
                    <p className="mt-0.5">
                      {isFriday 
                        ? `${sched.checkOutStart} - ${sched.checkOutEnd}` 
                        : `${sched.checkOutStart} - ${sched.checkOutEnd}`
                      }
                    </p>
                    <span className="text-[9px] font-normal block mt-0.5">
                      {isWithinCheckOutTime ? '🟢 Sedang Berlangsung' : '⚠️ Di Luar Jadwal (Mendahului)'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Attendance Photo Verification Widget */}
            {!todayApprovedLeave && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-0.5">
                  Langkah 1: Ambil Foto Selfie Kehadiran (Wajib)
                </label>

                {capturedPhoto ? (
                  <div className="relative w-36 h-28 mx-auto border-2 border-emerald-500 rounded-lg overflow-hidden shadow">
                    <img src={capturedPhoto} alt="Captured Selfie" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-[10px] uppercase tracking-wider gap-1">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      Foto Terverifikasi
                    </div>
                    <button
                      type="button"
                      onClick={() => setCapturedPhoto(null)}
                      className="absolute top-1.5 right-1.5 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-bold shadow-md cursor-pointer transition-transform hover:scale-105"
                      title="Hapus & Ambil Ulang"
                    >
                      ✕
                    </button>
                  </div>
                ) : useWebcam ? (
                  <div className="flex flex-col items-center space-y-2.5">
                    <div className="relative w-48 h-36 bg-black rounded-lg overflow-hidden border border-slate-300 shadow">
                      <video id="webcam-video" autoPlay playsInline className="w-full h-full object-cover transform -scale-x-100" />
                      {cameraError && (
                        <div className="absolute inset-0 bg-slate-900/90 flex items-center justify-center text-center p-2 text-rose-400 text-[10px] font-semibold leading-relaxed">
                          {cameraError}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-wider rounded shadow cursor-pointer flex items-center gap-1"
                      >
                        <Camera className="w-3 h-3" />
                        Jepret Selfie
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded border border-slate-300 cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center border border-dashed border-slate-300 rounded-lg py-5 bg-white space-y-2">
                    <Camera className="w-6 h-6 text-slate-400 animate-pulse" />
                    <p className="text-[10px] text-slate-500 font-semibold text-center px-4 leading-relaxed">
                      Silakan aktifkan kamera depan HP atau komputer untuk mengambil foto selfie guna memverifikasi kehadiran Anda.
                    </p>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-wider rounded shadow cursor-pointer flex items-center gap-1"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        Aktifkan Kamera
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Action Buttons for Attendance */}
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">
                  Langkah 2: Tambahkan Catatan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Ketik keterangan atau laporan kegiatan..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-700"
                  id="input-clock-notes"
                />
              </div>

              {submitSuccess && (
                <div className="p-2 bg-blue-50 border border-blue-200 text-blue-700 rounded text-xs font-semibold">
                  {submitSuccess}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleClockInOrOut('Masuk')}
                  disabled={submitting || !isWithinRadius || gpsLoading || hasClockedIn || !!todayApprovedLeave || !capturedPhoto || !!holidayOrWeekendMessage}
                  className={`py-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border shadow-sm transition-all uppercase tracking-wider cursor-pointer ${
                    hasClockedIn || holidayOrWeekendMessage
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : !capturedPhoto && !todayApprovedLeave
                      ? 'bg-amber-50 text-amber-500 border-amber-200 hover:bg-amber-100'
                      : isWithinRadius
                      ? `${currentThemeData.btn}`
                      : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                  }`}
                  id="btn-clock-in"
                  title={!capturedPhoto ? "Ambil foto selfie terlebih dahulu" : "Kirim Absen Masuk"}
                >
                  <Clock className="w-3.5 h-3.5" />
                  {hasClockedIn ? 'Sudah Absen Masuk' : !capturedPhoto && !todayApprovedLeave ? 'Ambil Foto Dulu' : 'Absen Masuk'}
                </button>

                <button
                  onClick={() => handleClockInOrOut('Pulang')}
                  disabled={submitting || !isWithinRadius || gpsLoading || !hasClockedIn || hasClockedOut || !!todayApprovedLeave || !capturedPhoto || !!holidayOrWeekendMessage}
                  className={`py-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border shadow-sm transition-all uppercase tracking-wider cursor-pointer ${
                    hasClockedOut || !hasClockedIn || holidayOrWeekendMessage
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : !capturedPhoto && !todayApprovedLeave
                      ? 'bg-amber-50 text-amber-500 border-amber-200 hover:bg-amber-100'
                      : isWithinRadius
                      ? `${currentThemeData.btn}`
                      : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                  }`}
                  id="btn-clock-out"
                  title={!capturedPhoto ? "Ambil foto selfie terlebih dahulu" : "Kirim Absen Pulang"}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {hasClockedOut ? 'Sudah Absen Pulang' : !capturedPhoto && !todayApprovedLeave ? 'Ambil Foto Dulu' : 'Absen Pulang'}
                </button>
              </div>

              <div className="text-[9px] text-slate-400 font-medium pl-1 leading-relaxed">
                * Pastikan Anda berada dalam radius 100m dari sekolah. Setelah mengambil selfie, tombol akan menyala sesuai jadwal yang ditentukan.
              </div>
            </div>
          </div>

          {/* 7-DAY ATTENDANCE TREND CHART */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Tren Kehadiran & Disiplin (7 Hari Terakhir)
              </h3>
              <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase font-mono">
                Recharts Visualizer
              </span>
            </div>

            {/* Chart Wrapper */}
            <div className="h-48 w-full text-xs font-semibold">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={(() => {
                    const data = [];
                    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

                    for (let i = 6; i >= 0; i--) {
                      const d = new Date();
                      d.setDate(d.getDate() - i);
                      const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
                      const dayLabel = `${dayNames[d.getDay()]} ${d.getDate()}`;

                      const dayRecords = allPersonalHistory.filter(r => r.date === dateStr);
                      const checkInRecord = dayRecords.find(r => r.type === 'Masuk');
                      const leaveRecord = dayRecords.find(r => ['Sakit', 'Cuti', 'Dinas Luar'].includes(r.type));

                      let score = 0;
                      let statusLabel = 'Belum Absen';
                      let fillTheme = '#e2e8f0'; // Neutral gray for absent/unrecorded

                      if (checkInRecord) {
                        if (checkInRecord.status === 'Tepat Waktu') {
                          score = 100;
                          statusLabel = 'Tepat Waktu';
                          fillTheme = selectedTheme === 'emerald' ? '#10b981' :
                                      selectedTheme === 'royal' ? '#8b5cf6' :
                                      selectedTheme === 'amber' ? '#f59e0b' :
                                      '#3b82f6';
                        } else if (checkInRecord.status === 'Terlambat') {
                          score = 65;
                          const lateMin = checkInRecord.lateMinutes || 0;
                          statusLabel = `Terlambat (${lateMin} m)`;
                          fillTheme = '#ef4444'; // Red for late check-in
                        } else if (checkInRecord.status === 'Dinas Luar') {
                          score = 100;
                          statusLabel = 'Dinas Luar';
                          fillTheme = '#06b6d4'; // Cyan for business travel
                        } else {
                          score = 80;
                          statusLabel = checkInRecord.status;
                          fillTheme = '#64748b';
                        }
                      } else if (leaveRecord) {
                        score = 50;
                        statusLabel = `Izin (${leaveRecord.type})`;
                        fillTheme = '#a855f7'; // Purple for leave requests
                      } else {
                        const dayOfWeek = d.getDay();
                        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6) && schoolConfig.disableSatSun;
                        const customHolidays = schoolConfig.holidays || [];
                        const isHoliday = customHolidays.some(h => h.date === dateStr);

                        if (isWeekend || isHoliday) {
                          score = 10; // Subtle bar for weekend
                          statusLabel = isHoliday ? 'Hari Libur' : 'Akhir Pekan';
                          fillTheme = '#cbd5e1'; // Light gray
                        } else {
                          const hasApprovedLeave = leaveRequests?.some(req => 
                            req.employeeId === activeEmployee?.id && 
                            req.status === 'Disetujui' && 
                            dateStr >= req.startDate && 
                            dateStr <= req.endDate
                          );
                          if (hasApprovedLeave) {
                            score = 50;
                            statusLabel = 'Cuti Disetujui';
                            fillTheme = '#a855f7';
                          } else {
                            score = 0;
                            statusLabel = 'Alpa / Tanpa Keterangan';
                            fillTheme = '#fda4af'; // Pinkish warning for undocumented absence
                          }
                        }
                      }

                      data.push({
                        name: dayLabel,
                        score,
                        status: statusLabel,
                        fillColor: fillTheme
                      });
                    }
                    return data;
                  })()}
                  margin={{ top: 10, right: 5, left: -25, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} 
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tickLine={false} 
                    axisLine={false} 
                    ticks={[0, 50, 100]}
                    tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 500 }} 
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-2.5 rounded-lg border border-slate-800 text-[11px] leading-relaxed shadow-lg font-sans">
                            <p className="font-extrabold text-slate-200 mb-0.5">{data.name}</p>
                            <p className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: data.fillColor }} />
                              Status: <strong className="text-white font-bold">{data.status}</strong>
                            </p>
                            <p className="text-slate-400 text-[10px] mt-0.5">Skor Disiplin: {data.score} / 100</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]} maxBarSize={32}>
                    {/* Map colors dynamically to each bar */}
                    {
                      (() => {
                        const colors = [];
                        for (let i = 6; i >= 0; i--) {
                          const d = new Date();
                          d.setDate(d.getDate() - i);
                          const dateStr = d.toISOString().split('T')[0];
                          const dayRecords = allPersonalHistory.filter(r => r.date === dateStr);
                          const checkInRecord = dayRecords.find(r => r.type === 'Masuk');
                          const leaveRecord = dayRecords.find(r => ['Sakit', 'Cuti', 'Dinas Luar'].includes(r.type));

                          let fillTheme = '#e2e8f0';
                          if (checkInRecord) {
                            if (checkInRecord.status === 'Tepat Waktu') {
                              fillTheme = selectedTheme === 'emerald' ? '#10b981' :
                                          selectedTheme === 'royal' ? '#8b5cf6' :
                                          selectedTheme === 'amber' ? '#f59e0b' :
                                          '#3b82f6';
                            } else if (checkInRecord.status === 'Terlambat') {
                              fillTheme = '#ef4444';
                            } else if (checkInRecord.status === 'Dinas Luar') {
                              fillTheme = '#06b6d4';
                            } else {
                              fillTheme = '#64748b';
                            }
                          } else if (leaveRecord) {
                            fillTheme = '#a855f7';
                          } else {
                            const dayOfWeek = d.getDay();
                            const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6) && schoolConfig.disableSatSun;
                            const customHolidays = schoolConfig.holidays || [];
                            const isHoliday = customHolidays.some(h => h.date === dateStr);

                            if (isWeekend || isHoliday) {
                              fillTheme = '#cbd5e1';
                            } else {
                              const hasApprovedLeave = leaveRequests?.some(req => 
                                req.employeeId === activeEmployee?.id && 
                                req.status === 'Disetujui' && 
                                dateStr >= req.startDate && 
                                dateStr <= req.endDate
                              );
                              if (hasApprovedLeave) {
                                fillTheme = '#a855f7';
                              } else {
                                fillTheme = '#fda4af';
                              }
                            }
                          }
                          colors.push(fillTheme);
                        }
                        return colors.map((col, idx) => (
                          <Cell key={`cell-${idx}`} fill={col} />
                        ));
                      })()
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Legend guide */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-t border-slate-100">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: selectedTheme === 'emerald' ? '#10b981' : selectedTheme === 'royal' ? '#8b5cf6' : selectedTheme === 'amber' ? '#f59e0b' : '#3b82f6' }} />
                <span>Tepat Waktu</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-red-500" />
                <span>Terlambat</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-purple-500" />
                <span>Cuti/Izin</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-slate-300" />
                <span>Akhir Pekan/Libur</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-rose-200" />
                <span>Alpa</span>
              </div>
            </div>
          </div>

          {/* ATTENDANCE HISTORY LIST */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Riwayat Kehadiran Pribadi Anda
              </h3>
            </div>

            {/* MONTH & YEAR FILTER FOR EMPLOYEES */}
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 pl-0.5">Bulan</label>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="w-full text-[11px] font-semibold bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                  id="employee-filter-month"
                >
                  {MONTHS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 pl-0.5">Tahun</label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="w-full text-[11px] font-semibold bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                  id="employee-filter-year"
                >
                  <option value="all">Semua Tahun</option>
                  {availableYears.map(yr => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-[220px] overflow-y-auto pr-1">
              {filteredHistory.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs font-semibold">
                  Belum ada riwayat kehadiran tercatat untuk filter ini.
                </div>
              ) : (
                filteredHistory.map((record, idx) => (
                  <div key={idx} className="py-2.5 flex justify-between items-center text-[11px] gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold uppercase tracking-wide text-xs ${
                          record.type === 'Masuk' ? 'text-blue-700' :
                          record.type === 'Pulang' ? 'text-slate-800' : 'text-amber-700'
                        }`}>
                          {record.type}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500 font-semibold">{record.time}</span>
                      </div>
                      <p className="text-slate-400 text-[10px] mt-0.5 font-medium">{record.date}</p>
                      {record.notes && (
                        <p className="text-slate-500 italic mt-0.5 font-sans">"{record.notes}"</p>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
                        record.status === 'Tepat Waktu' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        record.status === 'Terlambat' ? 'bg-red-50 text-red-700 border border-red-200' :
                        record.status === 'Sakit' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                        record.status === 'Cuti' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                        'bg-violet-50 text-violet-700 border border-violet-200'
                      }`}>
                        {record.status}
                      </span>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{record.distance}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Leave Request Form */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pengajuan Izin / Cuti / Dinas</h2>
            </div>

            {leaveSuccess && (
              <div className="p-3 bg-blue-50 border border-blue-100 text-blue-800 rounded-lg text-xs leading-relaxed font-semibold">
                {leaveSuccess}
              </div>
            )}

            <form onSubmit={handleLeaveRequestSubmit} className="space-y-3">
              {/* Type Selection */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 pl-1">
                  Jenis Pengajuan
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'Sakit', label: 'Sakit' },
                    { id: 'Cuti', label: 'Cuti' },
                    { id: 'Dinas Luar', label: 'Dinas Luar' },
                  ].map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setLeaveType(type.id as any)}
                      className={`py-1.5 px-2 rounded text-[11px] font-bold border text-center transition-all cursor-pointer uppercase tracking-wider ${
                        leaveType === type.id
                          ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-sm'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                      id={`btn-leave-type-${type.id}`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Ranges */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">
                    Mulai
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-semibold"
                    id="input-leave-start"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">
                    Selesai
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-semibold"
                    id="input-leave-end"
                  />
                </div>
              </div>

              {/* Reason / Notes */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">
                  Alasan & Keterangan Pengajuan
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Jelaskan alasan pengajuan secara lengkap..."
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-700"
                  id="input-leave-reason"
                />
              </div>

              {/* File Upload Section (Only for Sakit & Dinas Luar) */}
              {(leaveType === 'Sakit' || leaveType === 'Dinas Luar') && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
                    Upload Bukti Pengajuan ({leaveType}) <span className="text-red-500 font-semibold">*</span>
                  </label>
                  
                  {!leaveAttachment ? (
                    <div 
                      className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-lg p-3 text-center bg-slate-50 hover:bg-blue-50/20 transition-all cursor-pointer relative"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const file = e.dataTransfer.files?.[0];
                        if (file) {
                          processUploadedFile(file);
                        }
                      }}
                      onClick={() => document.getElementById('leave-file-input')?.click()}
                    >
                      <input 
                        type="file" 
                        id="leave-file-input" 
                        className="hidden" 
                        required
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            processUploadedFile(file);
                          }
                        }}
                      />
                      <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                      <p className="text-[10px] text-slate-600 font-medium">
                        Drag & drop file di sini, atau <span className="text-blue-600 underline font-bold">pilih file</span>
                      </p>
                      <p className="text-[9px] text-slate-400 mt-0.5">
                        Mendukung semua ekstensi file bebas (Gambar, PDF, Doc, dll.)
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        <div className="truncate text-left">
                          <p className="font-semibold text-slate-800 truncate text-[11px]">{leaveAttachmentName}</p>
                          <p className="text-[9px] text-slate-500">{(leaveAttachmentSize / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setLeaveAttachment('');
                          setLeaveAttachmentName('');
                          setLeaveAttachmentSize(0);
                        }}
                        className="text-[10px] font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-all shrink-0 cursor-pointer uppercase tracking-wider"
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={leaveSubmitting || !activeEmployee}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-bold transition-all disabled:opacity-50 shadow-sm cursor-pointer uppercase tracking-wider"
                id="btn-submit-leave"
              >
                {leaveSubmitting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Ajukan Sekarang
              </button>
            </form>

            <div className="p-3 bg-slate-50 rounded text-[10px] text-slate-500 leading-relaxed border border-slate-200">
              <p className="font-bold mb-1 text-slate-700 flex items-center gap-1 uppercase tracking-wide">
                <HelpCircle className="w-3 h-3 text-blue-600" />
                Bagaimana integrasi ini bekerja?
              </p>
              Izin yang diajukan akan otomatis digenerate dan dimasukkan ke dalam sheet absensi sebagai entri khusus untuk tanggal-tanggal yang dipilih. Hal ini memudahkan rekap otomatis tanpa perlu input manual oleh Admin.
            </div>
          </div>

        </div>

      </div>

      {/* CUSTOM EMPLOYEES PORTAL CONFIRMATION MODAL */}
      {employeeConfirmModal && employeeConfirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-sm w-full p-5 space-y-4 animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 text-blue-600 border-b border-slate-100 pb-2">
              <CheckCircle className="w-5 h-5 text-blue-600 shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                {employeeConfirmModal.title}
              </h3>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {employeeConfirmModal.description}
            </p>

            <div className="flex gap-2.5 pt-1.5">
              <button
                onClick={() => {
                  employeeConfirmModal.action();
                  setEmployeeConfirmModal(null);
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow"
              >
                Ya, Kirim Sekarang
              </button>
              <button
                onClick={() => setEmployeeConfirmModal(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </motion.div>
  );
}

function LoaderIcon() {
  return (
    <div className="flex flex-col items-center">
      <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
      <span className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-wider">GPS Mandiri...</span>
    </div>
  );
}
