import React, { useState } from 'react';
import { FileSpreadsheet, Plus, ArrowRight, Loader2, Info } from 'lucide-react';
import { createSpreadsheet, ensureSheetsAndHeaders } from '../lib/sheets';

interface SetupSpreadsheetProps {
  accessToken: string;
  userEmail: string;
  onSpreadsheetConfigured: (id: string) => void;
}

export default function SetupSpreadsheet({
  accessToken,
  userEmail,
  onSpreadsheetConfigured,
}: SetupSpreadsheetProps) {
  const [spreadsheetInput, setSpreadsheetInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractId = (input: string): string => {
    const match = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : input.trim();
  };

  const handleConnectExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractId(spreadsheetInput);
    if (!id) {
      setError('Silakan masukkan ID atau URL Spreadsheet yang valid.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Ensure the tabs and headers exist in the connected spreadsheet
      await ensureSheetsAndHeaders(id, accessToken, userEmail);
      localStorage.setItem('absensi_spreadsheet_id', id);
      onSpreadsheetConfigured(id);
    } catch (err: any) {
      console.error(err);
      setError(
        err.message ||
          'Gagal menghubungkan spreadsheet. Pastikan URL/ID benar dan akun Google Anda memiliki akses edit.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async () => {
    setLoading(true);
    setError(null);
    try {
      const title = 'Absensi Digital Sekolah (SDN 7 Pedungan)';
      const id = await createSpreadsheet(accessToken, title);
      await ensureSheetsAndHeaders(id, accessToken, userEmail);
      localStorage.setItem('absensi_spreadsheet_id', id);
      onSpreadsheetConfigured(id);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal membuat spreadsheet baru di Google Drive Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-6 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-12 h-12 bg-blue-50 rounded flex items-center justify-center text-blue-600 mb-3 border border-blue-100">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight uppercase">
          Hubungkan Database Absensi
        </h2>
        <p className="text-slate-500 text-xs mt-1 max-w-sm">
          Aplikasi ini menyimpan seluruh data pegawai dan riwayat kehadiran secara real-time langsung ke Google Sheets Anda.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Option A: Create New Spreadsheet */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between hover:border-blue-300 transition-all">
          <div>
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
              <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">1</span>
              Buat Spreadsheet Baru (Rekomendasi)
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 pl-6">
              Membuat file Google Spreadsheet baru di Google Drive Anda secara otomatis lengkap dengan tab <strong>"Pegawai"</strong> dan <strong>"Absensi"</strong> serta beberapa data contoh.
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            disabled={loading}
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-sm"
            id="btn-create-new-sheet"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            Buat & Hubungkan Otomatis
          </button>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-3 text-slate-400 text-[10px] font-bold">ATAU</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {/* Option B: Connect Existing */}
        <form onSubmit={handleConnectExisting} className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 pl-1">
              Masukkan ID atau URL Google Spreadsheet Anda
            </label>
            <input
              type="text"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={spreadsheetInput}
              onChange={(e) => setSpreadsheetInput(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-700"
              required
              id="input-spreadsheet-url"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !spreadsheetInput.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            id="btn-connect-sheet"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ArrowRight className="w-3.5 h-3.5" />
            )}
            Hubungkan Spreadsheet Tersebut
          </button>
        </form>

        <div className="p-3.5 bg-blue-50/50 rounded border border-blue-100 text-[10px] leading-relaxed text-slate-500">
          <p className="font-bold text-slate-700 uppercase tracking-wide mb-1">💡 Catatan Keamanan:</p>
          Data Anda disimpan di Google Drive Anda sendiri. Aplikasi ini berkomunikasi langsung dengan Google API dari browser Anda secara aman tanpa server perantara pihak ketiga.
        </div>
      </div>
    </div>
  );
}
