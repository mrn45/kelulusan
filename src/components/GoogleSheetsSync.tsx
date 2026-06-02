import React, { useState, useEffect } from 'react';
import { Database, LogIn, LogOut, Download, AlertCircle, CheckCircle, RefreshCcw } from 'lucide-react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, getAccessToken, logout } from '../lib/firebase';
import { Student } from '../data';

// Same parsing logic for dates as AdminPanel
function parseExcelDate(val: any): string {
  if (!val) return '';
  if (val instanceof Date) {
    try {
      return val.toISOString().split('T')[0];
    } catch (_) {
      return '';
    }
  }
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const partsVal = str.split(/[-/]/);
  if (partsVal.length === 3) {
    if (partsVal[0].length === 4) {
      return `${partsVal[0]}-${partsVal[1].padStart(2, '0')}-${partsVal[2].padStart(2, '0')}`;
    } else if (partsVal[2].length === 4) {
      return `${partsVal[2]}-${partsVal[1].padStart(2, '0')}-${partsVal[0].padStart(2, '0')}`;
    }
  }
  return str;
}

interface GoogleSheetsSyncProps {
  onUpdateStudents: (updated: Student[]) => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

export function GoogleSheetsSync({ onUpdateStudents, showToast }: GoogleSheetsSyncProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [range, setRange] = useState('Daftar Siswa Kelulusan!A1:N');
  
  useEffect(() => {
    const unsubscribe = initAuth(
      (u, t) => {
        setUser(u);
        setToken(t);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        showToast('Berhasil terhubung dengan akun Google', 'success');
      }
    } catch (err) {
      console.error('Login failed:', err);
      showToast('Gagal login Google. Pastikan popup tidak diblokir.', 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const extractSpreadsheetId = (url: string) => {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : url; // If no match, maybe they pasted the ID directly
  };

  const handleSync = async () => {
    if (!spreadsheetUrl || !range) {
      showToast('Harap masukkan URL Google Sheets dan Nama Range/Sheet', 'error');
      return;
    }
    
    if (!token) {
      showToast('Token tidak tersedia. Harap login kembali.', 'error');
      return;
    }

    const spreadsheetId = extractSpreadsheetId(spreadsheetUrl);
    setIsSyncing(true);

    try {
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        throw new Error(`Google Sheets API Error: ${res.statusText}`);
      }

      const data = await res.json();
      if (!data.values || data.values.length === 0) {
        showToast('Data kosong atau range tidak ditemukan.', 'error');
        setIsSyncing(false);
        return;
      }

      const headers = data.values[0];
      const rows = data.values.slice(1);
      
      const formattedStudents: Student[] = [];

      for (let i = 0; i < rows.length; i++) {
        const rowData = rows[i];
        
        // Helper to get value
        const getVal = (keyList: string[]) => {
          for (const key of keyList) {
            const index = headers.findIndex((h: string) => 
               h.toLowerCase().replace(/[^a-z0-9]/g, '') === key.toLowerCase().replace(/[^a-z0-9]/g, '')
            );
            if (index !== -1 && rowData[index] !== undefined) {
               return rowData[index];
            }
          }
          return undefined;
        };

        const rawNisn = getVal(['nisn', 'nomorinduksiswanasional']);
        const rawNama = getVal(['namalengkap', 'nama', 'fullname']);
        const rawKelas = getVal(['kelas', 'class']);
        const rawTempatLahir = getVal(['tempatlahir', 'tempat']);
        const rawTanggalLahir = getVal(['tanggallahir', 'tgllahir', 'birthdate', 'tanggallahiryyyymmdd']);
        const rawNomorPeserta = getVal(['nomorpeserta', 'nopeserta', 'no_peserta']);
        const rawStatus = getVal(['statuskelulusan', 'status', 'kelulusan']);
        const rawPredikat = getVal(['predikat', 'grade']);
        const rawFotoSiswa = getVal(['fotosiswalinkurl', 'fotosiswa', 'foto', 'linkfoto', 'urlfoto', 'fotossw']);
        const rawBIndo = getVal(['nilaibahasaindonesia', 'bahasaindonesia', 'indo', 'indonesia']);
        const rawMtk = getVal(['nilaimatematika', 'matematika', 'mtk']);
        const rawBIng = getVal(['nilaibahasainggris', 'bahasainggris', 'inggris', 'ing']);
        const rawPai = getVal(['nilaipendidikanagamaislam', 'pendidikanagamaislam', 'agama', 'pai']);
        const rawCatatan = getVal(['catatankelulusan', 'catatan', 'keterangan']);

        if (!rawNisn || !rawNama) {
          continue;
        }

        const nisnVal = String(rawNisn).trim();
        const namaVal = String(rawNama).trim().toUpperCase();
        const tanggalLahirVal = rawTanggalLahir ? parseExcelDate(rawTanggalLahir) : '2011-01-01';
        const kelasVal = String(rawKelas || 'IX').trim().toUpperCase();
        const tempatLahirVal = String(rawTempatLahir || 'Jakarta').trim();
        const nomorPesertaVal = String(rawNomorPeserta || `SKL-2026-IX-${String(i+1).padStart(3, '0')}`).trim().toUpperCase();
        
        let statusVal: 'LULUS' | 'TIDAK_LULUS' | 'DITUNDA' = 'LULUS';
        const normalizedStatus = String(rawStatus || '').toUpperCase();
        if (normalizedStatus.includes('TIDAK') || normalizedStatus.includes('NOT')) {
          statusVal = 'TIDAK_LULUS';
        } else if (normalizedStatus.includes('TUNDA') || normalizedStatus.includes('DITUNDA') || normalizedStatus.includes('PENDING')) {
          statusVal = 'DITUNDA';
        }

        const predikatVal = String(rawPredikat || 'Sangat Memuaskan').trim();
        const fotoSiswaVal = rawFotoSiswa ? String(rawFotoSiswa).trim() : undefined;
        const bIndoVal = Number(rawBIndo) || 0;
        const mtkVal = Number(rawMtk) || 0;
        const bIngVal = Number(rawBIng) || 0;
        const paiVal = Number(rawPai) || 0;
        const catatanVal = rawCatatan ? String(rawCatatan).trim() : 'Selamat atas kelulusanmu! Teruslah belajar dan berprestasi.';

        formattedStudents.push({
          nisn: nisnVal,
          nama: namaVal,
          kelas: kelasVal,
          tempatLahir: tempatLahirVal,
          tanggalLahir: tanggalLahirVal,
          nomorPeserta: nomorPesertaVal,
          status: statusVal,
          predikat: predikatVal,
          fotoSiswa: fotoSiswaVal || undefined,
          nilai: {
            'Bahasa Indonesia': bIndoVal,
            'Matematika': mtkVal,
            'Bahasa Inggris': bIngVal,
            'Pendidikan Agama Islam': paiVal
          },
          catatan: catatanVal
        });
      }

      if (formattedStudents.length > 0) {
        // Confirmation before proceeding destructive change
        const confirmed = window.confirm(
          `Apakah Anda yakin ingin menimpa database dengan ${formattedStudents.length} baris data dari Google Sheets ini? Tindakan ini akan menggantikan data siswa saat ini.`
        );
        if (confirmed) {
          onUpdateStudents(formattedStudents);
          showToast(`Berhasil mengimpor ${formattedStudents.length} data siswa dari Google Sheets!`, 'success');
        }
      } else {
        showToast('Gagal memproses data Google Sheets. Pastikan baris memiliki kolom NISN dan Nama Lengkap.', 'error');
      }
    } catch (err: any) {
      console.error('Sync Error:', err);
      showToast(`Gagal membaca Google Sheets. Periksa akses dokumen Anda. (${err.message})`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="p-5 bg-gradient-to-br from-blue-50/50 to-blue-100/30 rounded-2xl border border-blue-100 outline-1 outline-blue-50 space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-sm">
            <Database className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h6 className="font-extrabold text-slate-850 text-xs uppercase tracking-wide">Cloud Sync: Google Sheets</h6>
            <span className="text-[10px] text-blue-700 font-bold text-xxs">Tarik Data Langsung Lewat Google Workspace API</span>
          </div>
        </div>

        {user ? (
          <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-full border border-blue-200 text-[10px] text-slate-700 font-bold shadow-xs">
             <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden border border-blue-200">
               {user.photoURL ? <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" /> : <div className="text-blue-700">{user.email?.charAt(0).toUpperCase()}</div>}
             </div>
             <span className="truncate max-w-[120px]">{user.email}</span>
             <button onClick={logout} className="text-rose-500 hover:text-rose-700 p-1 flex items-center justify-center" aria-label="Logout">
               <LogOut className="w-3.5 h-3.5" />
             </button>
          </div>
        ) : (
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full sm:w-auto bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isLoggingIn ? (
              <RefreshCcw className="w-4 h-4 animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
            )}
            Sambungkan Akun Google
          </button>
        )}
      </div>
      
      {!user ? (
        <div className="flex items-center gap-2 p-3 bg-blue-50/80 rounded-xl text-blue-800 text-xs mt-2 border border-blue-100">
           <AlertCircle className="w-4 h-4 flex-shrink-0" />
           <p>Masuk dengan Google untuk langsung menarik daftar siswa dari file Spreadsheet secara otomatis.</p>
        </div>
      ) : (
        <div className="bg-white border text-left border-blue-100 p-4 rounded-xl shadow-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-600">Link URL Spreadsheet Anda</label>
              <input
                type="text"
                placeholder="https://docs.google.com/spreadsheets/d/...."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                value={spreadsheetUrl}
                onChange={(e) => setSpreadsheetUrl(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-600">Nama Tab/Sheet & Range</label>
              <input
                type="text"
                placeholder="Daftar Siswa Kelulusan!A1:N"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                title="Sesuai dengan nama tab dan rentang data di Spreadsheet, contoh: Sheet1!A1:N"
                value={range}
                onChange={(e) => setRange(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={handleSync}
            disabled={isSyncing || !spreadsheetUrl}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-md shadow-blue-200 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSyncing ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Tarik Data dari Spreadsheet Ke Database
          </button>
        </div>
      )}
    </div>
  );
}
