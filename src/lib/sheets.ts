import { Employee, AttendanceRecord, UserAccount } from '../types';

/**
 * Creates a brand new Spreadsheet in the user's Google Drive with Pegawai and Absensi sheets.
 */
export async function createSpreadsheet(accessToken: string, title: string): Promise<string> {
  if (accessToken === 'offline_token') {
    return 'offline_spreadsheet';
  }
  const url = 'https://sheets.googleapis.com/v4/spreadsheets';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: 'Pegawai',
          },
        },
        {
          properties: {
            title: 'Absensi',
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    throw new Error(err.error?.message || `Gagal membuat spreadsheet: ${response.statusText}`);
  }

  const data = await response.json();
  return data.spreadsheetId;
}

/**
 * Writes cells values in a sheet.
 */
export async function writeSheetValues(
  spreadsheetId: string,
  accessToken: string,
  range: string,
  values: any[][]
): Promise<any> {
  if (spreadsheetId === 'offline_spreadsheet' || accessToken === 'offline_token') {
    return { success: true };
  }
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range,
      majorDimension: 'ROWS',
      values,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    throw new Error(err.error?.message || `Gagal menulis data: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Appends row values to a sheet.
 */
export async function appendSheetValues(
  spreadsheetId: string,
  accessToken: string,
  range: string,
  values: any[][]
): Promise<any> {
  if (spreadsheetId === 'offline_spreadsheet' || accessToken === 'offline_token') {
    return { success: true };
  }
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range,
      majorDimension: 'ROWS',
      values,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    throw new Error(err.error?.message || `Gagal menambah baris data: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Ensures required tabs "Pegawai" and "Absensi" exist, writes default headers and sample employees if empty.
 */
export async function ensureSheetsAndHeaders(
  spreadsheetId: string,
  accessToken: string,
  userEmail: string = ''
): Promise<void> {
  if (spreadsheetId === 'offline_spreadsheet' || accessToken === 'offline_token') {
    // Initialize offline default data if not already set
    if (!localStorage.getItem('sipeg_offline_user_accounts')) {
      const defaultAccounts = [
        { username: "admin", sandi: "admin123", nip: "admin", role: "admin", name: "Administrator" },
        { username: "budi", sandi: "budi123", nip: "199001012020121001", role: "pegawai", name: "Budi Santoso, S.Pd." },
        { username: "dewi", sandi: "dewi123", nip: "198505122015042002", role: "pegawai", name: "Dewi Lestari, M.Pd." },
        { username: "wayan", sandi: "wayan123", nip: "197808202008011003", role: "pegawai", name: "I Wayan Sudiarta" },
        { username: "ketut", sandi: "ketut123", nip: "196512311988031001", role: "admin", name: "Drs. Ketut Pedungan" }
      ];
      localStorage.setItem('sipeg_offline_user_accounts', JSON.stringify(defaultAccounts));
    }
    if (!localStorage.getItem('sipeg_offline_employees')) {
      const defaultEmployees = [
        { id: "199001012020121001", name: "Budi Santoso, S.Pd.", role: "Guru Kelas IV", email: userEmail || "budi@sekolah.sch.id", baseSalary: 4500000 },
        { id: "198505122015042002", name: "Dewi Lestari, M.Pd.", role: "Guru Matematika", email: "dewi@sekolah.sch.id", baseSalary: 4800000 },
        { id: "197808202008011003", name: "I Wayan Sudiarta", role: "Staf Tata Usaha", email: "wayan@sekolah.sch.id", baseSalary: 3500000 },
        { id: "196512311988031001", name: "Drs. Ketut Pedungan", role: "Kepala Sekolah", email: "ketut@sekolah.sch.id", baseSalary: 6000000 }
      ];
      localStorage.setItem('sipeg_offline_employees', JSON.stringify(defaultEmployees));
    }
    if (!localStorage.getItem('sipeg_offline_attendance')) {
      localStorage.setItem('sipeg_offline_attendance', JSON.stringify([]));
    }
    if (!localStorage.getItem('sipeg_offline_leave_requests')) {
      localStorage.setItem('sipeg_offline_leave_requests', JSON.stringify([]));
    }
    return;
  }

  // 1. Get spreadsheet metadata
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('UNAUTHORIZED: Sesi Google Sheets Anda telah kedaluwarsa atau tidak valid. Silakan hubungkan ulang akun Google Anda.');
    }
    throw new Error(`Gagal membaca metadata Spreadsheet. Pastikan ID Spreadsheet benar dan Anda memiliki izin akses.`);
  }

  const data = await response.json();
  const sheets = data.sheets || [];
  const sheetTitles = sheets.map((s: any) => s.properties.title);

  // Check if tabs are missing
  const missingSheets: string[] = [];
  if (!sheetTitles.includes('Pegawai')) missingSheets.push('Pegawai');
  if (!sheetTitles.includes('Absensi')) missingSheets.push('Absensi');
  if (!sheetTitles.includes('Pengajuan')) missingSheets.push('Pengajuan');
  if (!sheetTitles.includes('Akun Pegawai')) missingSheets.push('Akun Pegawai');

  if (missingSheets.length > 0) {
    const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
    const requests = missingSheets.map(title => ({
      addSheet: {
        properties: { title }
      }
    }));

    const batchResponse = await fetch(batchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });

    if (!batchResponse.ok) {
      throw new Error(`Gagal membuat tab baru di spreadsheet: ${batchResponse.statusText}`);
    }
  }

  // 2. Check and initialize "Pegawai" sheet headers + samples
  const pegawaiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Pegawai!A1:Z1`;
  const pegawaiRes = await fetch(pegawaiUrl, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  const pegawaiData = await pegawaiRes.json();
  const hasPegawaiHeaders = pegawaiData.values && pegawaiData.values.length > 0;

  if (!hasPegawaiHeaders) {
    const headers = [[
      "NIP / ID", 
      "Nama Lengkap", 
      "Jabatan", 
      "Email", 
      "Foto Profil", 
      "Gaji Pokok", 
      "Jam Masuk Mulai", 
      "Jam Masuk Selesai", 
      "Jam Pulang Mulai (Sen-Kam)", 
      "Jam Pulang Selesai (Sen-Kam)", 
      "Jam Pulang Mulai (Jumat)", 
      "Jam Pulang Selesai (Jumat)"
    ]];
    const defaultRows = [
      ["199001012020121001", "Budi Santoso, S.Pd.", "Guru Kelas IV", userEmail || "budi@sekolah.sch.id", "", "4500000", "", "", "", "", "", ""],
      ["198505122015042002", "Dewi Lestari, M.Pd.", "Guru Matematika", "dewi@sekolah.sch.id", "", "4800000", "", "", "", "", "", ""],
      ["197808202008011003", "I Wayan Sudiarta", "Staf Tata Usaha", "wayan@sekolah.sch.id", "", "3500000", "", "", "", "", "", ""],
      ["196512311988031001", "Drs. Ketut Pedungan", "Kepala Sekolah", "ketut@sekolah.sch.id", "", "6000000", "", "", "", "", "", ""]
    ];
    await writeSheetValues(spreadsheetId, accessToken, 'Pegawai!A1', headers);
    await appendSheetValues(spreadsheetId, accessToken, 'Pegawai!A2', defaultRows);
  }

  // 3. Check and initialize "Absensi" sheet headers
  const absensiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Absensi!A1:Z1`;
  const absensiRes = await fetch(absensiUrl, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  const absensiData = await absensiRes.json();
  const hasAbsensiHeaders = absensiData.values && absensiData.values.length > 0;

  if (!hasAbsensiHeaders) {
    const headers = [[
      "Timestamp", 
      "NIP / ID", 
      "Nama Pegawai", 
      "Tipe Absen", 
      "Tanggal", 
      "Waktu", 
      "Koordinat GPS", 
      "Jarak (meter)", 
      "Status", 
      "Keterangan",
      "Foto"
    ]];
    await writeSheetValues(spreadsheetId, accessToken, 'Absensi!A1', headers);
  }

  // 4. Check and initialize "Pengajuan" sheet headers
  const pengajuanUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Pengajuan!A1:Z1`;
  const pengajuanRes = await fetch(pengajuanUrl, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  const pengajuanData = await pengajuanRes.json();
  const hasPengajuanHeaders = pengajuanData.values && pengajuanData.values.length > 0;

  if (!hasPengajuanHeaders) {
    const headers = [[
      "ID Pengajuan",
      "NIP / ID",
      "Nama Pegawai",
      "Jenis Izin",
      "Mulai Tanggal",
      "Selesai Tanggal",
      "Alasan",
      "Status Persetujuan",
      "Timestamp",
      "Bukti Dokumen"
    ]];
    await writeSheetValues(spreadsheetId, accessToken, 'Pengajuan!A1', headers);
  }

  // 5. Check and initialize "Akun Pegawai" sheet headers
  const akunUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent('Akun Pegawai!A1:Z1')}`;
  const akunRes = await fetch(akunUrl, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  const akunData = await akunRes.json();
  const hasAkunHeaders = akunData.values && akunData.values.length > 0;

  if (!hasAkunHeaders) {
    const headers = [[
      "Username",
      "Sandi",
      "NIP / ID",
      "Role",
      "Nama Lengkap"
    ]];
    const defaultAccounts = [
      ["admin", "admin123", "admin", "admin", "Administrator"],
      ["budi", "budi123", "199001012020121001", "pegawai", "Budi Santoso, S.Pd."],
      ["dewi", "dewi123", "198505122015042002", "pegawai", "Dewi Lestari, M.Pd."],
      ["wayan", "wayan123", "197808202008011003", "pegawai", "I Wayan Sudiarta"],
      ["ketut", "ketut123", "196512311988031001", "admin", "Drs. Ketut Pedungan"]
    ];
    await writeSheetValues(spreadsheetId, accessToken, 'Akun Pegawai!A1', headers);
    await appendSheetValues(spreadsheetId, accessToken, 'Akun Pegawai!A2', defaultAccounts);
  }
}

/**
 * Loads accounts from the "Akun Pegawai" tab.
 */
export async function loadUserAccounts(spreadsheetId: string, accessToken: string): Promise<UserAccount[]> {
  if (spreadsheetId === 'offline_spreadsheet' || accessToken === 'offline_token') {
    const data = localStorage.getItem('sipeg_offline_user_accounts');
    if (data) return JSON.parse(data);
    const defaultAccounts = [
      { username: "admin", sandi: "admin123", nip: "admin", role: "admin", name: "Administrator" },
      { username: "budi", sandi: "budi123", nip: "199001012020121001", role: "pegawai", name: "Budi Santoso, S.Pd." },
      { username: "dewi", sandi: "dewi123", nip: "198505122015042002", role: "pegawai", name: "Dewi Lestari, M.Pd." },
      { username: "wayan", sandi: "wayan123", nip: "197808202008011003", role: "pegawai", name: "I Wayan Sudiarta" },
      { username: "ketut", sandi: "ketut123", nip: "196512311988031001", role: "admin", name: "Drs. Ketut Pedungan" }
    ];
    localStorage.setItem('sipeg_offline_user_accounts', JSON.stringify(defaultAccounts));
    return defaultAccounts;
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent('Akun Pegawai!A2:E500')}`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('UNAUTHORIZED: Sesi Google Sheets Anda telah kedaluwarsa atau tidak valid. Silakan hubungkan ulang akun Google Anda.');
    }
    throw new Error('Gagal memuat data akun dari spreadsheet.');
  }

  const data = await response.json();
  const rows = data.values || [];

  return rows
    .filter((row: any[]) => row && row[0]) // ignore empty rows
    .map((row: any[]) => ({
      username: String(row[0] || '').trim(),
      sandi: String(row[1] || '').trim(),
      nip: String(row[2] || '').trim(),
      role: String(row[3] || '').trim().toLowerCase(),
      name: String(row[4] || '').trim(),
    }));
}

/**
 * Loads employee list from the "Pegawai" tab.
 */
export async function loadEmployees(spreadsheetId: string, accessToken: string): Promise<Employee[]> {
  if (spreadsheetId === 'offline_spreadsheet' || accessToken === 'offline_token') {
    const data = localStorage.getItem('sipeg_offline_employees');
    if (data) return JSON.parse(data);
    const defaultEmployees = [
      { id: "199001012020121001", name: "Budi Santoso, S.Pd.", role: "Guru Kelas IV", email: "budi@sekolah.sch.id", baseSalary: 4500000 },
      { id: "198505122015042002", name: "Dewi Lestari, M.Pd.", role: "Guru Matematika", email: "dewi@sekolah.sch.id", baseSalary: 4800000 },
      { id: "197808202008011003", name: "I Wayan Sudiarta", role: "Staf Tata Usaha", email: "wayan@sekolah.sch.id", baseSalary: 3500000 },
      { id: "196512311988031001", name: "Drs. Ketut Pedungan", role: "Kepala Sekolah", email: "ketut@sekolah.sch.id", baseSalary: 6000000 }
    ];
    localStorage.setItem('sipeg_offline_employees', JSON.stringify(defaultEmployees));
    return defaultEmployees;
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Pegawai!A2:L500`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('UNAUTHORIZED: Sesi Google Sheets Anda telah kedaluwarsa atau tidak valid. Silakan hubungkan ulang akun Google Anda.');
    }
    throw new Error('Gagal memuat data pegawai dari spreadsheet.');
  }

  const data = await response.json();
  const rows = data.values || [];

  return rows
    .filter((row: any[]) => row && row[0]) // ignore empty rows
    .map((row: any[]) => ({
      id: String(row[0] || '').trim(),
      name: String(row[1] || '').trim(),
      role: String(row[2] || '').trim(),
      email: String(row[3] || '').trim().toLowerCase(),
      photoUrl: row[4] ? String(row[4]).trim() : undefined,
      baseSalary: row[5] ? Number(row[5]) : undefined,
      checkInStart: row[6] ? String(row[6]).trim() : undefined,
      checkInEnd: row[7] ? String(row[7]).trim() : undefined,
      checkOutStartMonThu: row[8] ? String(row[8]).trim() : undefined,
      checkOutEndMonThu: row[9] ? String(row[9]).trim() : undefined,
      checkOutStartFri: row[10] ? String(row[10]).trim() : undefined,
      checkOutEndFri: row[11] ? String(row[11]).trim() : undefined,
    }));
}

/**
 * Saves a new employee to the "Pegawai" tab.
 */
export async function addEmployee(spreadsheetId: string, accessToken: string, employee: Employee): Promise<any> {
  if (spreadsheetId === 'offline_spreadsheet' || accessToken === 'offline_token') {
    const current = await loadEmployees(spreadsheetId, accessToken);
    current.push(employee);
    localStorage.setItem('sipeg_offline_employees', JSON.stringify(current));

    // Auto-create a local user account for them as well
    const accounts = await loadUserAccounts(spreadsheetId, accessToken);
    const firstName = employee.name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const username = firstName + Math.floor(Math.random() * 100);
    const isAdm = employee.role.toLowerCase().includes('kepala') || employee.role.toLowerCase().includes('admin') || employee.role.toLowerCase().includes('operator');
    accounts.push({
      username,
      sandi: firstName + '123',
      nip: employee.id,
      role: isAdm ? 'admin' : 'pegawai',
      name: employee.name
    });
    localStorage.setItem('sipeg_offline_user_accounts', JSON.stringify(accounts));
    return { success: true };
  }

  const row = [[
    employee.id, 
    employee.name, 
    employee.role, 
    employee.email, 
    employee.photoUrl || '',
    employee.baseSalary || 0,
    employee.checkInStart || '',
    employee.checkInEnd || '',
    employee.checkOutStartMonThu || '',
    employee.checkOutEndMonThu || '',
    employee.checkOutStartFri || '',
    employee.checkOutEndFri || '',
  ]];
  return await appendSheetValues(spreadsheetId, accessToken, 'Pegawai!A:L', row);
}

/**
 * Updates an existing employee in the "Pegawai" tab.
 */
export async function updateEmployee(
  spreadsheetId: string,
  accessToken: string,
  employee: Employee
): Promise<any> {
  if (spreadsheetId === 'offline_spreadsheet' || accessToken === 'offline_token') {
    const current = await loadEmployees(spreadsheetId, accessToken);
    const updated = current.map(emp => emp.id === employee.id ? employee : emp);
    localStorage.setItem('sipeg_offline_employees', JSON.stringify(updated));

    // Sync changes to the local user account
    const accounts = await loadUserAccounts(spreadsheetId, accessToken);
    const isAdm = employee.role.toLowerCase().includes('kepala') || employee.role.toLowerCase().includes('admin') || employee.role.toLowerCase().includes('operator');
    const updatedAccounts = accounts.map(acc => {
      if (acc.nip === employee.id) {
        return {
          ...acc,
          name: employee.name,
          role: isAdm ? 'admin' : 'pegawai'
        };
      }
      return acc;
    });
    localStorage.setItem('sipeg_offline_user_accounts', JSON.stringify(updatedAccounts));
    return { success: true };
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Pegawai!A:D`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Gagal memuat data pegawai untuk diperbarui.');
  }

  const data = await response.json();
  const rows = data.values || [];

  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === employee.id) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error(`Pegawai dengan ID ${employee.id} tidak ditemukan.`);
  }

  const range = `Pegawai!A${rowIndex}:L${rowIndex}`;
  const row = [[
    employee.id,
    employee.name,
    employee.role,
    employee.email,
    employee.photoUrl || '',
    employee.baseSalary || 0,
    employee.checkInStart || '',
    employee.checkInEnd || '',
    employee.checkOutStartMonThu || '',
    employee.checkOutEndMonThu || '',
    employee.checkOutStartFri || '',
    employee.checkOutEndFri || '',
  ]];
  return await writeSheetValues(spreadsheetId, accessToken, range, row);
}

/**
 * Loads attendance records from the "Absensi" tab.
 */
export async function loadAttendance(spreadsheetId: string, accessToken: string): Promise<AttendanceRecord[]> {
  if (spreadsheetId === 'offline_spreadsheet' || accessToken === 'offline_token') {
    const data = localStorage.getItem('sipeg_offline_attendance');
    if (data) return JSON.parse(data);
    localStorage.setItem('sipeg_offline_attendance', JSON.stringify([]));
    return [];
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Absensi!A2:Z2000`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('UNAUTHORIZED: Sesi Google Sheets Anda telah kedaluwarsa atau tidak valid. Silakan hubungkan ulang akun Google Anda.');
    }
    throw new Error('Gagal memuat riwayat absensi dari spreadsheet.');
  }

  const data = await response.json();
  const rows = data.values || [];

  return rows
    .filter((row: any[]) => row && row[0] && row[1]) // must have timestamp and id
    .map((row: any[]) => ({
      timestamp: String(row[0] || ''),
      employeeId: String(row[1] || ''),
      employeeName: String(row[2] || ''),
      type: String(row[3] || '') as any,
      date: String(row[4] || ''),
      time: String(row[5] || ''),
      coordinates: String(row[6] || ''),
      distance: String(row[7] || ''),
      status: String(row[8] || '') as any,
      notes: String(row[9] || ''),
      photo: String(row[10] || ''),
    }));
}

/**
 * Appends a new attendance record (or leave record) to the "Absensi" tab.
 */
export async function saveAttendanceRecord(
  spreadsheetId: string,
  accessToken: string,
  record: AttendanceRecord
): Promise<any> {
  if (spreadsheetId === 'offline_spreadsheet' || accessToken === 'offline_token') {
    const current = await loadAttendance(spreadsheetId, accessToken);
    current.push(record);
    localStorage.setItem('sipeg_offline_attendance', JSON.stringify(current));
    return { success: true };
  }

  const row = [[
    record.timestamp,
    record.employeeId,
    record.employeeName,
    record.type,
    record.date,
    record.time,
    record.coordinates,
    record.distance,
    record.status,
    record.notes,
    record.photo || '',
  ]];
  return await appendSheetValues(spreadsheetId, accessToken, 'Absensi!A:K', row);
}

/**
 * Loads leave requests from the "Pengajuan" tab.
 */
export async function loadLeaveRequests(spreadsheetId: string, accessToken: string): Promise<any[]> {
  if (spreadsheetId === 'offline_spreadsheet' || accessToken === 'offline_token') {
    const data = localStorage.getItem('sipeg_offline_leave_requests');
    if (data) return JSON.parse(data);
    localStorage.setItem('sipeg_offline_leave_requests', JSON.stringify([]));
    return [];
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Pengajuan!A2:J1000`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  const rows = data.values || [];

  return rows
    .filter((row: any[]) => row && row[0])
    .map((row: any[]) => ({
      id: String(row[0] || '').trim(),
      employeeId: String(row[1] || '').trim(),
      employeeName: String(row[2] || '').trim(),
      type: String(row[3] || '') as any,
      startDate: String(row[4] || '').trim(),
      endDate: String(row[5] || '').trim(),
      reason: String(row[6] || '').trim(),
      status: String(row[7] || 'Pending').trim() as any,
      timestamp: String(row[8] || '').trim(),
      attachment: String(row[9] || '').trim(),
    }));
}

/**
 * Saves a new leave request to the "Pengajuan" tab.
 */
export async function saveLeaveRequest(
  spreadsheetId: string,
  accessToken: string,
  request: any
): Promise<any> {
  if (spreadsheetId === 'offline_spreadsheet' || accessToken === 'offline_token') {
    const current = await loadLeaveRequests(spreadsheetId, accessToken);
    current.push({
      ...request,
      timestamp: new Date().toLocaleString('id-ID', { hour12: false })
    });
    localStorage.setItem('sipeg_offline_leave_requests', JSON.stringify(current));
    return { success: true };
  }

  const row = [[
    request.id,
    request.employeeId,
    request.employeeName,
    request.type,
    request.startDate,
    request.endDate,
    request.reason,
    request.status,
    new Date().toLocaleString('id-ID', { hour12: false }),
    request.attachment || ''
  ]];
  return await appendSheetValues(spreadsheetId, accessToken, 'Pengajuan!A:J', row);
}

/**
 * Updates status of a leave request in the "Pengajuan" tab.
 */
export async function updateLeaveRequestStatus(
  spreadsheetId: string,
  accessToken: string,
  requestId: string,
  newStatus: 'Disetujui' | 'Ditolak'
): Promise<any> {
  if (spreadsheetId === 'offline_spreadsheet' || accessToken === 'offline_token') {
    const current = await loadLeaveRequests(spreadsheetId, accessToken);
    const updated = current.map(req => req.id === requestId ? { ...req, status: newStatus } : req);
    localStorage.setItem('sipeg_offline_leave_requests', JSON.stringify(updated));
    return { success: true };
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Pengajuan!A:H`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Gagal memuat data pengajuan untuk update status.');
  }

  const data = await response.json();
  const rows = data.values || [];

  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === requestId) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error(`Data pengajuan dengan ID ${requestId} tidak ditemukan.`);
  }

  const range = `Pengajuan!H${rowIndex}`;
  return await writeSheetValues(spreadsheetId, accessToken, range, [[newStatus]]);
}

/**
 * Updates profile photo of an employee in the "Pegawai" tab.
 */
export async function updateEmployeePhoto(
  spreadsheetId: string,
  accessToken: string,
  employeeId: string,
  photoUrl: string
): Promise<any> {
  if (spreadsheetId === 'offline_spreadsheet' || accessToken === 'offline_token') {
    const current = await loadEmployees(spreadsheetId, accessToken);
    const updated = current.map(emp => emp.id === employeeId ? { ...emp, photoUrl } : emp);
    localStorage.setItem('sipeg_offline_employees', JSON.stringify(updated));
    return { success: true };
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Pegawai!A1:L500`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Gagal memuat data pegawai untuk update foto.');
  }

  const data = await response.json();
  const rows = data.values || [];

  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0] || '').trim() === String(employeeId).trim()) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error(`Pegawai dengan ID ${employeeId} tidak ditemukan.`);
  }

  const range = `Pegawai!E${rowIndex}`;
  return await writeSheetValues(spreadsheetId, accessToken, range, [[photoUrl]]);
}
