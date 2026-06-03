/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  Settings, 
  Plus, 
  RotateCcw, 
  ShieldAlert, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Lock, 
  LogIn, 
  LogOut, 
  Download, 
  Upload, 
  Image as ImageIcon, 
  FileText, 
  Camera, 
  HelpCircle,
  CheckCircle,
  Cloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Student, SchoolInfo, GalleryItem } from '../data';
import { GoogleSheetsSync } from './GoogleSheetsSync';
import { getAccessToken, googleSignIn } from '../lib/firebase';

function parseExcelDate(val: any): string {
  if (!val) return '';
  if (val instanceof Date) {
    try {
      return val.toISOString().split('T')[0];
    } catch (_) {
      return '';
    }
  }
  if (typeof val === 'number') {
    try {
      // Excel base date is 1899-12-30
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      return date.toISOString().split('T')[0];
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

interface AdminPanelProps {
  students: Student[];
  schoolInfo: SchoolInfo;
  galleryItems: GalleryItem[];
  onUpdateStudents: (updated: Student[]) => void;
  onUpdateSchoolInfo: (updated: SchoolInfo) => void;
  onUpdateGallery: (updated: GalleryItem[]) => void;
}

export function AdminPanel({
  students,
  schoolInfo,
  galleryItems,
  onUpdateStudents,
  onUpdateSchoolInfo,
  onUpdateGallery
}: AdminPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'siswa' | 'sekolah' | 'data_io' | 'dokumentasi'>('siswa');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3550);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Admin Login Session State
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem('admin_logged_in') === 'true';
  });
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (usernameInput.trim() === 'admin' && passwordInput === '51001n') {
      setIsLoggedIn(true);
      sessionStorage.setItem('admin_logged_in', 'true');
      setLoginError('');
      setUsernameInput('');
      setPasswordInput('');
    } else {
      setLoginError('Nama pengguna atau kata sandi Anda salah!');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('admin_logged_in');
  };

  // Add Student State Form
  const [newNama, setNewNama] = useState('');
  const [newNisn, setNewNisn] = useState('');
  const [newTglLahir, setNewTglLahir] = useState('');
  const [newTempatLahir, setNewTempatLahir] = useState('');
  const [newKelas, setNewKelas] = useState('IX');
  const [newStatus, setNewStatus] = useState<'LULUS' | 'TIDAK_LULUS' | 'DITUNDA'>('LULUS');
  const [newPredikat, setNewPredikat] = useState('Sangat Memuaskan');
  const [valIndo, setValIndo] = useState<number>(85);
  const [valMat, setValMat] = useState<number>(85);
  const [valIng, setValIng] = useState<number>(85);
  const [valKeahlian, setValKeahlian] = useState<number>(85);
  const [newCatatan, setNewCatatan] = useState('Selamat atas kelulusanmu! Semangat menerjang rintangan baru dengan akhlak mulia.');
  const [newFotoSiswa, setNewFotoSiswa] = useState('');
  const [submitMsg, setSubmitMsg] = useState('');

  // School Update Form State
  const [schNama, setSchNama] = useState(schoolInfo.namaSekolah);
  const [schNpsn, setSchNpsn] = useState(schoolInfo.npsn);
  const [schAkreditasi, setSchAkreditasi] = useState(schoolInfo.akreditasi);
  const [schKepala, setSchKepala] = useState(schoolInfo.kepalaSekolah);
  const [schNip, setSchNip] = useState(schoolInfo.nipKepalaSekolah);
  const [schAlamat, setSchAlamat] = useState(schoolInfo.alamat);
  const [schSambutan, setSchSambutan] = useState(schoolInfo.sambutanKepalaSekolah);
  const [schFotoKepala, setSchFotoKepala] = useState(schoolInfo.fotoKepalaSekolah || '');
  const [schLogoSekolah, setSchLogoSekolah] = useState(schoolInfo.logoSekolah || '');
  const [schNamaYayasan, setSchNamaYayasan] = useState(schoolInfo.namaYayasan || 'YAYASAN ASSYAFIIYAH');
  const [schTemplatePembuka, setSchTemplatePembuka] = useState(schoolInfo.templateSklPembuka || '');
  const [schTemplatePenutup, setSchTemplatePenutup] = useState(schoolInfo.templateSklPenutup || '');

  // Add Documentation State Form
  const [galTitle, setGalTitle] = useState('');
  const [galDescription, setGalDescription] = useState('');
  const [galImageUrl, setGalImageUrl] = useState('');
  const [galMsg, setGalMsg] = useState('');

  // Data Import / Export States
  const [importMsg, setImportMsg] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMsg('');

    if (!newNama || !newNisn || !newTglLahir || !newTempatLahir) {
      setSubmitMsg('Silakan lengkapi nama, NISN, tanggal lahir, dan tempat lahir.');
      return;
    }

    if (newNisn.length < 5) {
      setSubmitMsg('NISN harus minimal 5 digit.');
      return;
    }

    // Check conflict
    if (students.some((s) => s.nisn === newNisn)) {
      setSubmitMsg('NISN tersebut sudah terdaftar di database.');
      return;
    }

    const newStudent: Student = {
      nama: newNama,
      nisn: newNisn,
      tanggalLahir: newTglLahir,
      tempatLahir: newTempatLahir,
      nomorPeserta: `SKL-2026-IX-${String(students.length + 1).padStart(3, '0')}`,
      kelas: newKelas,
      status: newStatus,
      predikat: newPredikat,
      nilai: {
        'Bahasa Indonesia': Number(valIndo),
        'Matematika': Number(valMat),
        'Bahasa Inggris': Number(valIng),
        'Pendidikan Agama Islam': Number(valKeahlian)
      },
      catatan: newCatatan,
      fotoSiswa: newFotoSiswa || undefined
    };

    onUpdateStudents([newStudent, ...students]);
    setSubmitMsg(`Siswa ${newNama} berhasil didaftarkan!`);
    showToast(`Registrasi siswa ${newNama} berhasil!`, 'success');
    
    // Clear Form inputs
    setNewNama('');
    setNewNisn('');
    setNewTglLahir('');
    setNewTempatLahir('');
    setNewCatatan('Selamat atas kelulusanmu! Semangat menerjang rintangan baru.');
    setNewFotoSiswa('');
  };

  const handleSaveSchoolInfo = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedInfo: SchoolInfo = {
      namaSekolah: schNama,
      npsn: schNpsn,
      akreditasi: schAkreditasi,
      kepalaSekolah: schKepala,
      nipKepalaSekolah: schNip,
      alamat: schAlamat,
      tahunAjaran: schoolInfo.tahunAjaran,
      tanggalPengumuman: schoolInfo.tanggalPengumuman,
      sambutanKepalaSekolah: schSambutan,
      fotoKepalaSekolah: schFotoKepala,
      logoSekolah: schLogoSekolah,
      namaYayasan: schNamaYayasan,
      templateSklPembuka: schTemplatePembuka,
      templateSklPenutup: schTemplatePenutup
    };
    onUpdateSchoolInfo(updatedInfo);
    showToast('Pengaturan profil sekolah berhasil disimpan!', 'success');
  };

  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);

  const handleBackupToGoogleDrive = async () => {
    try {
      setIsUploadingToDrive(true);
      
      let currentToken = await getAccessToken();
      
      if (!currentToken) {
        const result = await googleSignIn();
        if (result && result.accessToken) {
          currentToken = result.accessToken;
        } else {
          throw new Error('Gagal autentikasi Google, coba kembali.');
        }
      }

      const dataToExport = students.map((st) => ({
        'NISN': st.nisn,
        'Nama Lengkap': st.nama,
        'Kelas': st.kelas,
        'Tempat Lahir': st.tempatLahir,
        'Tanggal Lahir (YYYY-MM-DD)': st.tanggalLahir,
        'Nomor Peserta': st.nomorPeserta,
        'Status Kelulusan': st.status,
        'Predikat': st.predikat,
        'Foto Siswa (Link URL)': st.fotoSiswa || '',
        'Nilai Bahasa Indonesia': st.nilai['Bahasa Indonesia'] || 0,
        'Nilai Matematika': st.nilai['Matematika'] || 0,
        'Nilai Bahasa Inggris': st.nilai['Bahasa Inggris'] || 0,
        'Nilai Pendidikan Agama Islam': st.nilai['Pendidikan Agama Islam'] || 0,
        'Catatan Kelulusan': st.catatan || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);

      const max_width = [
        { wch: 15 }, { wch: 25 }, { wch: 10 }, { wch: 15 }, { wch: 25 }, { wch: 20 },
        { wch: 15 }, { wch: 20 }, { wch: 40 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
        { wch: 25 }, { wch: 40 }
      ];
      worksheet['!cols'] = max_width;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Daftar Siswa Kelulusan");

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      // Build multipart request
      const metadata = {
        name: `Backup_Kelulusan_${schoolInfo.namaSekolah}_${new Date().toISOString().split('T')[0]}.xlsx`,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', blob);

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentToken}`
        },
        body: form
      });

      if (!res.ok) {
        throw new Error(`Drive API Error: ${res.statusText}`);
      }
      
      const fileIdInfo = await res.json();
      showToast(`Backup sukses! File tersimpan di Google Drive Anda.`, 'success');

    } catch (err: any) {
      console.error(err);
      showToast(`Gagal backup ke Drive: ${err.message}`, 'error');
    } finally {
      setIsUploadingToDrive(false);
    }
  };

  const handleDownloadTemplateExcel = () => {
    try {
      const templateData = [{
        'NISN': '1234567890',
        'Nama Lengkap': 'John Doe',
        'Kelas': 'IX-A',
        'Tempat Lahir': 'Jakarta',
        'Tanggal Lahir (YYYY-MM-DD)': '2011-05-20',
        'Nomor Peserta': 'SKL-2026-IX-001',
        'Status Kelulusan': 'LULUS',
        'Predikat': 'Sangat Memuaskan',
        'Foto Siswa (Link URL)': 'https://images.unsplash.com/photo-1...',
        'Nilai Bahasa Indonesia': 90,
        'Nilai Matematika': 85,
        'Nilai Bahasa Inggris': 88,
        'Nilai Pendidikan Agama Islam': 95,
        'Catatan Kelulusan': 'Selamat atas kelulusanmu!'
      }];

      const worksheet = XLSX.utils.json_to_sheet(templateData);

      const max_width = [
        { wch: 15 }, // NISN
        { wch: 25 }, // Nama Lengkap
        { wch: 10 }, // Kelas
        { wch: 15 }, // Tempat Lahir
        { wch: 25 }, // Tanggal Lahir (YYYY-MM-DD)
        { wch: 20 }, // Nomor Peserta
        { wch: 15 }, // Status Kelulusan
        { wch: 20 }, // Predikat
        { wch: 30 }, // Foto Siswa (Link URL)
        { wch: 22 }, // Nilai Bahasa Indonesia
        { wch: 18 }, // Nilai Matematika
        { wch: 18 }, // Nilai Bahasa Inggris
        { wch: 25 }, // Nilai Pendidikan Agama Islam
        { wch: 40 }  // Catatan Kelulusan
      ];
      worksheet['!cols'] = max_width;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Template Data Siswa");

      XLSX.writeFile(workbook, `TEMPLATE_SISWA_${schoolInfo.namaSekolah.replace(/\s+/g, '_').toUpperCase()}_2026.xlsx`);
    } catch (error) {
      console.error("Gagal mendownload template Excel:", error);
      alert("Gagal mendownload template Excel.");
    }
  };

  const handleDownloadExcel = () => {
    try {
      const dataToExport = students.map((st) => ({
        'NISN': st.nisn,
        'Nama Lengkap': st.nama,
        'Kelas': st.kelas,
        'Tempat Lahir': st.tempatLahir,
        'Tanggal Lahir (YYYY-MM-DD)': st.tanggalLahir,
        'Nomor Peserta': st.nomorPeserta,
        'Status Kelulusan': st.status,
        'Predikat': st.predikat,
        'Foto Siswa (Link URL)': st.fotoSiswa || '',
        'Nilai Bahasa Indonesia': st.nilai['Bahasa Indonesia'] || 0,
        'Nilai Matematika': st.nilai['Matematika'] || 0,
        'Nilai Bahasa Inggris': st.nilai['Bahasa Inggris'] || 0,
        'Nilai Pendidikan Agama Islam': st.nilai['Pendidikan Agama Islam'] || 0,
        'Catatan Kelulusan': st.catatan || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);

      const max_width = [
        { wch: 15 }, // NISN
        { wch: 25 }, // Nama Lengkap
        { wch: 10 }, // Kelas
        { wch: 15 }, // Tempat Lahir
        { wch: 25 }, // Tanggal Lahir (YYYY-MM-DD)
        { wch: 20 }, // Nomor Peserta
        { wch: 15 }, // Status Kelulusan
        { wch: 20 }, // Predikat
        { wch: 30 }, // Foto Siswa (Link URL)
        { wch: 22 }, // Nilai Bahasa Indonesia
        { wch: 18 }, // Nilai Matematika
        { wch: 18 }, // Nilai Bahasa Inggris
        { wch: 25 }, // Nilai Pendidikan Agama Islam
        { wch: 40 }  // Catatan Kelulusan
      ];
      worksheet['!cols'] = max_width;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Daftar Siswa Kelulusan");

      XLSX.writeFile(workbook, `TAMPILAN_PROFIL_SISWA_${schoolInfo.namaSekolah.replace(/\s+/g, '_').toUpperCase()}_2026.xlsx`);
    } catch (error) {
      console.error("Gagal mendownload template Excel:", error);
      alert("Gagal mendownload template Excel.");
    }
  };

  const handleUploadExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (!Array.isArray(rawRows) || rawRows.length === 0) {
          setImportMsg('Gagal mengimpor: Berkas Excel kosong atau tidak terbaca.');
          return;
        }

        const formattedStudents: Student[] = [];

        for (let i = 0; i < rawRows.length; i++) {
          const row = rawRows[i];

          const getVal = (keyList: string[]) => {
            for (const key of keyList) {
              const foundKey = Object.keys(row).find(
                k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === key.toLowerCase().replace(/[^a-z0-9]/g, '')
              );
              if (foundKey) return row[foundKey];
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
          onUpdateStudents(formattedStudents);
          setImportMsg(`Unggahan EXCEL Berhasil! Memuat ${formattedStudents.length} siswa baru.`);
          showToast(`Berhasil mengimpor ${formattedStudents.length} data siswa!`, 'success');
        } else {
          setImportMsg('Gagal memproses data Excel. Pastikan baris memiliki kolom NISN dan Nama Lengkap.');
        }
      } catch (err) {
        console.error(err);
        setImportMsg('Gagal membaca berkas Excel. Pastikan file tidak terkunci atau corrupt.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUpdateStudentStatus = (nisnToUpdate: string, newStatus: 'LULUS' | 'TIDAK_LULUS' | 'DITUNDA') => {
    const updated = students.map((s) => {
      if (s.nisn === nisnToUpdate) {
        return { ...s, status: newStatus };
      }
      return s;
    });
    onUpdateStudents(updated);
    showToast('Status kelulusan berhasil diubah!', 'success');
  };

  const handleDeleteStudent = (nisnToDelete: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data siswa ini?')) {
      const updated = students.filter((s) => s.nisn !== nisnToDelete);
      onUpdateStudents(updated);
      showToast('Data siswa berhasil dihapus!', 'success');
    }
  };

  const handleResetDefault = () => {
    if (confirm('Setel ulang semua database ke data contoh default awal?')) {
      localStorage.removeItem('school_students_data');
      localStorage.removeItem('school_info_data');
      localStorage.removeItem('school_gallery_data');
      window.location.reload();
    }
  };

  return (
    <div className="bg-stone-50/60 rounded-2xl border border-emerald-100 p-5 md:p-6 space-y-4 print-hidden relative">
      {/* Toast Notification Container with motion */}
      <div className="fixed top-24 right-6 z-50 pointer-events-none">
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15 } }}
              className="pointer-events-auto bg-slate-900/95 backdrop-blur-md text-white px-5 py-3.5 rounded-2xl shadow-xl border border-slate-800 flex items-center gap-3 max-w-sm"
            >
              {toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-rose-500 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-[180px]">
                <p className="text-xs font-bold text-slate-100">{toast.message}</p>
              </div>
              <button 
                onClick={() => setToast(null)} 
                className="text-slate-400 hover:text-white transition cursor-pointer text-sm font-bold pl-1.5"
              >
                &times;
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-700 animate-spin-slow" />
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm tracking-wide uppercase">
              Simulator & Panel Admin Kelulusan
            </h4>
            <p className="text-xxs text-slate-500">
              Khusus penguji: Mengedit identitas sekolah, download/upload data siswa serta galeri dokumentasi.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-stone-200 hover:bg-[#f3f6f1] transition text-slate-700 flex items-center gap-1.5 shadow-3xs cursor-pointer"
        >
          {isOpen ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {isOpen ? 'Sembunyikan Panel' : 'Buka Pengaturan'}
        </button>
      </div>

      {isOpen && !isLoggedIn && (
        <div className="pt-4 border-t border-slate-200/60 flex justify-center py-6">
          <form onSubmit={handleLogin} className="w-full max-w-md bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="space-y-1.5 text-center">
              <div className="inline-flex p-3 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                <Lock className="w-6 h-6 animate-pulse" />
              </div>
              <h5 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">Autentikasi Admin</h5>
              <p className="text-xxs text-slate-500">Silakan masukkan nama pengguna dan kata sandi untuk mengelola data kelulusan.</p>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-50 border border-rose-100/60 rounded-xl flex items-center gap-2 text-rose-700 font-semibold text-xxs">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-600 tracking-wide uppercase">Nama Pengguna (Username)</label>
              <input
                type="text"
                placeholder="Masukkan username"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-600 tracking-wide uppercase">Kata Sandi (Password)</label>
              <input
                type="password"
                placeholder="Masukkan password"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-md shadow-emerald-200 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              Masuk Ke Sistem
            </button>
          </form>
        </div>
      )}

      {isOpen && isLoggedIn && (
        <div className="pt-4 border-t border-slate-200/60 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Navigation Controls */}
          <div className="lg:col-span-3 space-y-2.5">
            <button
              onClick={() => setActiveTab('siswa')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'siswa'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white border border-stone-200 text-slate-655 hover:bg-stone-50'
              }`}
            >
              <Plus className="w-4 h-4 text-emerald-600" /> 1. Input & Daftar Siswa
            </button>
            <button
              onClick={() => setActiveTab('data_io')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'data_io'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white border border-stone-200 text-slate-655 hover:bg-stone-50'
              }`}
            >
              <Download className="w-4 h-4 text-emerald-600" /> 2. Download & Upload Siswa (Excel/JSON)
            </button>
            <button
              onClick={() => setActiveTab('sekolah')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'sekolah'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white border border-stone-200 text-slate-655 hover:bg-stone-50'
              }`}
            >
              <Settings className="w-4 h-4 text-emerald-600" /> 3. Profil & Media Sekolah
            </button>
            <button
              onClick={() => setActiveTab('dokumentasi')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'dokumentasi'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white border border-stone-200 text-slate-655 hover:bg-stone-50'
              }`}
            >
              <Camera className="w-4 h-4 text-emerald-600" /> 4. Dokumentasi Kegiatan
            </button>


            <div className="pt-2 border-t border-slate-100 space-y-2">
              <button
                onClick={handleResetDefault}
                className="w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100/40"
              >
                <RotateCcw className="w-4 h-4" /> Setel Ulang Database
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
              >
                <LogOut className="w-4 h-4" /> Logout Admin
              </button>
            </div>

            <div className="p-3.5 bg-emerald-50 border border-emerald-100/40 rounded-xl space-y-1.5 text-xxs leading-relaxed">
              <span className="font-extrabold text-emerald-855 uppercase flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-emerald-650" /> Database Mandiri
              </span>
              <p className="text-slate-600">
                Penyimpanan luring (offline storage) browser aktif. Seluruh perubahan langsung dapat diverifikasi instan pada halaman utama.
              </p>
            </div>
          </div>

          {/* Form views */}
          <div className="lg:col-span-9 bg-white rounded-2xl border border-emerald-100/40 p-5 md:p-6 shadow-2xs space-y-6">
            
            {/* TAB 1: MANAJEMEN SISWA */}
            {activeTab === 'siswa' && (
              <div className="space-y-6">
                <div>
                  <h5 className="font-extrabold text-slate-850 text-sm">Pendaftaran Siswa Baru & Nilai</h5>
                  <p className="text-xxs text-slate-400 mt-0.5">Daftarkan peserta didik kelas IX secara personal ke dalam database.</p>
                </div>

                <form onSubmit={handleAddStudent} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2 space-y-1">
                      <label className="block text-[10px] font-bold text-slate-600">Nama Lengkap Siswa</label>
                      <input
                        type="text"
                        placeholder="Contoh: Muhammad Akhyar"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                        value={newNama}
                        onChange={(e) => setNewNama(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-600">NISN (Numerik Unik)</label>
                      <input
                        type="text"
                        placeholder="Contoh: 0059992211"
                        maxLength={12}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                        value={newNisn}
                        onChange={(e) => setNewNisn(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-600">Tanggal Lahir</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                        value={newTglLahir}
                        onChange={(e) => setNewTglLahir(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-600">Tempat Lahir</label>
                      <input
                        type="text"
                        placeholder="Yogyakarta"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                        value={newTempatLahir}
                        onChange={(e) => setNewTempatLahir(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-600">Kelas / Jurusan</label>
                      <select
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700"
                        value={newKelas}
                        onChange={(e) => setNewKelas(e.target.value)}
                      >
                        <option>IX</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-600">Status Kelulusan</label>
                      <select
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-850 font-bold"
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as any)}
                      >
                        <option value="LULUS">LULUS</option>
                        <option value="TIDAK_LULUS">TIDAK LULUS</option>
                        <option value="DITUNDA">DITUNDA</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-600">Predikat</label>
                      <input
                        type="text"
                        placeholder="Dengan Pujian"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                        value={newPredikat}
                        onChange={(e) => setNewPredikat(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-600">Foto Siswa (Link URL format .png/.jpg/.jpeg)</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-example... (Kosongkan bila tidak ada)"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono text-emerald-800"
                      value={newFotoSiswa}
                      onChange={(e) => setNewFotoSiswa(e.target.value)}
                    />
                  </div>

                  {/* Subject Scores */}
                  <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wide">Input Nilai Ujian Sekolah:</span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-500">Bahasa Indonesia</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white text-xs font-mono font-bold"
                          value={valIndo}
                          onChange={(e) => setValIndo(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500">Matematika</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white text-xs font-mono font-bold"
                          value={valMat}
                          onChange={(e) => setValMat(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500">Bahasa Inggris</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white text-xs font-mono font-bold"
                          value={valIng}
                          onChange={(e) => setValIng(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500">Pendidikan Agama Islam</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white text-xs font-mono font-bold"
                          value={valKeahlian}
                          onChange={(e) => setValKeahlian(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-600">Pesan Catatan Kepala Sekolah untuk Siswa</label>
                    <textarea
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                      value={newCatatan}
                      onChange={(e) => setNewCatatan(e.target.value)}
                    />
                  </div>

                  {submitMsg && (
                    <p className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg animate-fade-in">
                      {submitMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-md shadow-emerald-250/20 cursor-pointer"
                  >
                    + Daftarkan Siswa Baru
                  </button>
                </form>

                {/* Database Table view for removal */}
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <h6 className="font-bold text-xs text-slate-850">Daftar Seluruh Siswa Terdaftar ({students.length})</h6>
                  <div className="overflow-x-auto text-[10px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-bold">
                          <th className="p-2">Nama</th>
                          <th className="p-2">NISN</th>
                          <th className="p-2">Foto Siswa (Link)</th>
                          <th className="p-2">Tanggal Lahir</th>
                          <th className="p-2">Status</th>
                          <th className="p-2 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((st) => (
                          <tr key={st.nisn} className="border-b border-slate-100 last:border-b-0">
                            <td className="p-2 font-bold text-slate-800">{st.nama}</td>
                            <td className="p-2 font-mono text-slate-600">{st.nisn}</td>
                            <td className="p-2 font-mono text-slate-500 overflow-hidden text-ellipsis max-w-[120px]" title={st.fotoSiswa}>
                              {st.fotoSiswa ? (
                                <a href={st.fotoSiswa} target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline">
                                  Lihat (.jpg/.png)
                                </a>
                              ) : (
                                "No Photo"
                              )}
                            </td>
                            <td className="p-2 font-mono text-slate-600">{st.tanggalLahir}</td>
                            <td className="p-2 font-semibold">
                              <select
                                value={st.status}
                                onChange={(e) => handleUpdateStudentStatus(st.nisn, e.target.value as any)}
                                className={`px-1.5 py-1 rounded text-[10px] font-bold border-0 cursor-pointer outline-none ${
                                  st.status === 'LULUS'
                                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                    : st.status === 'DITUNDA'
                                      ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                }`}
                              >
                                <option value="LULUS">LULUS</option>
                                <option value="TIDAK_LULUS">TIDAK LULUS</option>
                                <option value="DITUNDA">DITUNDA</option>
                              </select>
                            </td>
                            <td className="p-2 text-center">
                              <button
                                onClick={() => handleDeleteStudent(st.nisn)}
                                className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition cursor-pointer"
                                title="Hapus Siswa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: PROFIL & MEDIA SEKOLAH */}
            {activeTab === 'sekolah' && (
              <form onSubmit={handleSaveSchoolInfo} className="space-y-4">
                <div>
                  <h5 className="font-extrabold text-slate-800 text-sm">Informasi & Profil Lembaga Sekolah</h5>
                  <p className="text-xxs text-slate-400 mt-0.5">Edit dan sesuaikan identitas, info yayasan, logo, serta foto kepala sekolah.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-600">Nama Sekolah (HURUF KAPITAL)</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                      value={schNama}
                      onChange={(e) => setSchNama(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-600">NPSN</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                      value={schNpsn}
                      onChange={(e) => setSchNpsn(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-600">Akreditasi</label>
                    <input
                      type="text"
                      placeholder="A, B, C, dsb."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                      value={schAkreditasi}
                      onChange={(e) => setSchAkreditasi(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-600">Nama Kepala Sekolah beserta Gelar</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                      value={schKepala}
                      onChange={(e) => setSchKepala(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-600">NIP Kepala Sekolah</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                      value={schNip}
                      onChange={(e) => setSchNip(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-600">Nama Yayasan Pengampu</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                      value={schNamaYayasan}
                      onChange={(e) => setSchNamaYayasan(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-600">Alamat Sekolah Lengkap</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                      value={schAlamat}
                      onChange={(e) => setSchAlamat(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-600">Logo Sekolah (Link URL format .png/.jpg)</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... (Emblem) atau kosongkan"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono text-emerald-700"
                      value={schLogoSekolah}
                      onChange={(e) => setSchLogoSekolah(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-600">Foto Kepala Sekolah (Link URL format .png/.jpg)</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... (Portrait) atau kosongkan"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono text-emerald-700"
                      value={schFotoKepala}
                      onChange={(e) => setSchFotoKepala(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-600">Teks Lengkap Sambutan Kepala Sekolah</label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-sans leading-relaxed"
                    value={schSambutan}
                    onChange={(e) => setSchSambutan(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition shadow-md shadow-emerald-250/20 cursor-pointer"
                >
                  Simpan Profil Sekolah
                </button>
              </form>
            )}

            {/* TAB 3: DOWNLOAD & UPLOAD DATA SISWA */}
            {activeTab === 'data_io' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h5 className="font-extrabold text-slate-800 text-sm">Download & Upload Sinkronisasi Siswa</h5>
                  <p className="text-xxs text-slate-450 mt-0.5">Lakukan ekspor-impor data siswa, nilai mata pelajaran, dan link foto siswa menggunakan Excel Spreadsheet (.xlsx) atau file cadangan JSON.</p>
                </div>

                {/* MAIN EXCEL COMPONENT SECTION */}
                <div className="p-5 bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 rounded-2xl border border-emerald-100 outline-1 outline-emerald-50 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-sm">
                        <FileText className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h6 className="font-extrabold text-slate-850 text-xs uppercase tracking-wide">Opsi Utama: Sinkronisasi Excel (.xlsx)</h6>
                        <span className="text-[10px] text-emerald-700 font-bold text-xxs">Template Excel Otomatis Terintegrasi Foto & Nilai</span>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <button
                        onClick={handleDownloadTemplateExcel}
                        className="flex-1 md:flex-none justify-center bg-stone-100 hover:bg-stone-200 text-slate-700 font-extrabold py-2 px-3.5 rounded-xl text-xxs transition shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-500" /> Template (.xlsx)
                      </button>
                      <button
                        onClick={handleDownloadExcel}
                        className="flex-1 md:flex-none justify-center bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold py-2 px-3.5 rounded-xl text-xxs transition shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5" /> Data Saat Ini (.xlsx)
                      </button>
                      <button
                        onClick={handleBackupToGoogleDrive}
                        disabled={isUploadingToDrive}
                        className="flex-1 md:flex-none justify-center bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2 px-3.5 rounded-xl text-xxs transition shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Cloud className="w-3.5 h-3.5" /> 
                        {isUploadingToDrive ? 'Mengunggah...' : 'Backup ke Drive (.xlsx)'}
                      </button>
                    </div>
                  </div>

                  <p className="text-xxs text-slate-600 leading-relaxed font-sans">
                    Unduh file Excel berisi seluruh baris siswa aktif sebagai acuan. Anda dapat mengubah, menyunting nilai, merevisi nama, menambah NISN, dan langsung menempelkan url link <strong>Foto Siswa (Link URL)</strong>. Berkas modifikasi kemudian diunggah di panel bawah ini untuk memperbarui database seketika.
                  </p>

                  <div 
                    className={`border-2 border-dashed ${
                      dragActive ? 'border-emerald-600 bg-emerald-50/50' : 'border-stone-300 bg-white'
                    } hover:border-emerald-500 rounded-xl p-6 text-center cursor-pointer relative transition-all shadow-xs`}
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragActive(false);
                      const files = e.dataTransfer.files;
                      if (files && files.length > 0) {
                        const file = files[0];
                        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                          handleUploadExcel(file);
                        } else if (file.name.endsWith('.json')) {
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            try {
                              const parsed = JSON.parse(evt.target?.result as string);
                              if (Array.isArray(parsed)) {
                                onUpdateStudents(parsed);
                                setImportMsg(`Unggahan JSON berhasil! Memuat ${parsed.length} siswa baru.`);
                              } else {
                                setImportMsg('Format tidak valid. Harus berupa array JSON.');
                              }
                            } catch (_) {
                              setImportMsg('Gagal membaca JSON.');
                            }
                          };
                          reader.readAsText(file);
                        } else {
                          setImportMsg('Format berkas salah. Gunakan file spreadsheet format (.xlsx / .xls)');
                        }
                      }
                    }}
                  >
                    <input
                      type="file"
                      accept=".xlsx, .xls, .json"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const target = e.target;
                        if (target.files && target.files.length > 0) {
                          const file = target.files[0];
                          if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                            handleUploadExcel(file);
                          } else if (file.name.endsWith('.json')) {
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              try {
                                const parsed = JSON.parse(evt.target?.result as string);
                                if (Array.isArray(parsed)) {
                                  onUpdateStudents(parsed);
                                  setImportMsg(`Unggahan JSON berhasil! Memuat ${parsed.length} siswa baru.`);
                                } else {
                                  setImportMsg('Format tidak valid. Harus berupa array JSON.');
                                }
                              } catch (_) {
                                  setImportMsg('Gagal membaca JSON.');
                              }
                            };
                            reader.readAsText(file);
                          } else {
                            setImportMsg('Format berkas salah. Gunakan (.xlsx / .xls / .json)');
                          }
                        }
                      }}
                    />
                    <div className="bg-emerald-100/50 p-2 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                      <Upload className="w-6 h-6 text-emerald-600 animate-bounce" />
                    </div>
                    <span className="text-xs text-slate-800 block font-extrabold">Upload Data Siswa & Link Foto (Excel/JSON)</span>
                    <span className="text-[10px] text-slate-500 block mt-1">Tarik & Lepas File Excel Template di Sini</span>
                    <span className="text-[10px] text-emerald-600 font-bold block mt-1 underline">atau ketuk untuk menyeleksi dari perangkat</span>
                  </div>

                  {importMsg && (
                    <div className="text-[10px] bg-slate-900 text-emerald-400 font-mono font-bold p-3 rounded-lg border border-slate-800 shadow-sm flex items-center justify-between">
                      <span>{importMsg}</span>
                      <button onClick={() => setImportMsg('')} className="text-slate-400 hover:text-white transition font-sans text-xs px-1 cursor-pointer">×</button>
                    </div>
                  )}
                </div>

                <GoogleSheetsSync onUpdateStudents={onUpdateStudents} showToast={showToast} />


                {/* HELPFUL INFORMATION REGARDING PHOTO LINK & STUDENT DATA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-stone-200 bg-white shadow-3xs rounded-xl space-y-2 text-xxs text-slate-600">
                    <div className="flex items-center gap-1.5 font-extrabold uppercase text-slate-800">
                      <HelpCircle className="w-4 h-4 text-emerald-600" /> Panduan Kolom Foto Siswa (Link URL)
                    </div>
                    <ul className="list-disc list-inside space-y-1.5 pl-1 leading-normal font-sans text-[10px] text-slate-500">
                      <li>Gunakan url foto publik berformat <strong>PNG, JPG, atau JPEG</strong> yang bisa diakses langsung via peramban.</li>
                      <li>Anda dapat menggunakan gratis image-hosting terpercaya (misal: Unsplash, Imgur, Postimages, dll).</li>
                      <li>Bila dari <strong>Google Drive</strong>, pastikan file di-share publik dan diubah menjadi link direct-download: <code>https://drive.google.com/uc?export=download&id=ID_FILE</code>.</li>
                      <li>Jika kolom Foto dikosongkan, sistem akan otomatis merender inisial siswa elegan bercorak dinamis pada lembar cetak SKL digital.</li>
                    </ul>
                  </div>

                  <div className="p-4 border border-stone-200 bg-white shadow-3xs rounded-xl space-y-2 text-xxs text-slate-600">
                    <div className="flex items-center gap-1.5 font-extrabold uppercase text-slate-800">
                      <HelpCircle className="w-4 h-4 text-emerald-650" /> Panduan Pengisian Format Nilai & Tanggal
                    </div>
                    <ul className="list-disc list-inside space-y-1.5 pl-1 leading-normal font-sans text-[10px] text-slate-500">
                      <li><strong>Tanggal Lahir</strong> harus bertipe teks/tanggal dengan susunan <code>YYYY-MM-DD</code> (contoh: <code>2010-08-17</code>).</li>
                      <li>Sistem pintar kami toleran terhadap berbagai parsing format tanggal Excel bawaan secara otomatis.</li>
                      <li><strong>Format Nilai</strong> harus berupa desimal/bulat range 0 s.d 100 (contoh: <code>85</code>, <code>92.5</code>).</li>
                      <li><strong>Status Kelulusan</strong> diisi dengan string <code>LULUS</code> atau <code>TIDAK LULUS</code> atau <code>DITUNDA</code> secara jelas.</li>
                    </ul>
                  </div>
                </div>

                {/* BACKUP JSON ACCORDION FOR SECONDARY OPERATION */}
                <div className="p-4 border border-slate-200 bg-slate-50 rounded-xl space-y-3">
                  <div className="flex justify-between items-center col-span-2">
                    <div>
                      <h6 className="font-extrabold text-[11px] text-slate-800 uppercase">File Cadangan Tambahan (.json)</h6>
                      <p className="text-[10px] text-slate-400 font-sans">Bila Anda lebih menyukai ekspor/impor cadangan penuh raw format JSON.</p>
                    </div>
                    <button
                      onClick={() => {
                        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(students, null, 2));
                        const downloadAnchor = document.createElement('a');
                        downloadAnchor.setAttribute("href", dataStr);
                        downloadAnchor.setAttribute("download", `data_siswa_backup_${schoolInfo.namaSekolah.replace(/\s+/g, '_').toLowerCase()}.json`);
                        document.body.appendChild(downloadAnchor);
                        downloadAnchor.click();
                        downloadAnchor.remove();
                      }}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-1.5 px-3 rounded-lg text-[10px] transition cursor-pointer active:scale-95"
                    >
                      Export JSON
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: TAMBAH DOKUMENTASI KEGIATAN */}
            {activeTab === 'dokumentasi' && (
              <div className="space-y-6">
                <div>
                  <h5 className="font-extrabold text-slate-800 text-sm">Dokumentasi & Galeri Kegiatan Sekolah</h5>
                  <p className="text-xxs text-slate-400 mt-0.5">Tambahkan foto seremonial dan aktivitas sekolah yang langsung tampil pada section galeri kegiatan.</p>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  setGalMsg('');
                  if (!galTitle || !galDescription) {
                    setGalMsg('Nama kegiatan dan deskripsi kegiatan wajib diisi.');
                    return;
                  }
                  const newItem: GalleryItem = {
                    id: `gal-${Date.now()}`,
                    title: galTitle,
                    description: galDescription,
                    fallbackIcon: "Camera",
                    color: "from-emerald-500 to-teal-600",
                    imageUrl: galImageUrl || undefined
                  };
                  onUpdateGallery([newItem, ...galleryItems]);
                  setGalTitle('');
                  setGalDescription('');
                  setGalImageUrl('');
                  setGalMsg('Momen dokumentasi baru berhasil didaftarkan!');
                  showToast('Dokumentasi baru berhasil didaftarkan!', 'success');
                }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-600">Nama / Judul Kegiatan</label>
                      <input
                        type="text"
                        placeholder="Contoh: Rapat Pleno Kelulusan"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                        value={galTitle}
                        onChange={(e) => setGalTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-600">Alamat URL Foto Kegiatan</label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/photo-xxx..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono text-emerald-700"
                        value={galImageUrl}
                        onChange={(e) => setGalImageUrl(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-600">Deskripsi singkat Kegiatan</label>
                    <textarea
                      rows={2}
                      placeholder="Menerangkan detail upacara, istighosah, atau serah terima raport siswa..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-sans leading-relaxed"
                      value={galDescription}
                      onChange={(e) => setGalDescription(e.target.value)}
                    />
                  </div>

                  {galMsg && (
                    <p className="text-xs font-bold text-emerald-850 bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg animate-fade-in">
                      {galMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 px-4 rounded-xl text-xs transition shadow-md shadow-emerald-250/20 cursor-pointer"
                  >
                    + Daftarkan Dokumentasi Baru
                  </button>
                </form>

                {/* Existing Gallery list representation */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h6 className="font-bold text-xs text-slate-800 uppercase tracking-wide">Daftar Dokumentasi Aktif ({galleryItems.length})</h6>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {galleryItems.map((item) => (
                      <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex gap-3 relative group">
                        <div className="w-16 h-16 rounded-md bg-slate-200 overflow-hidden flex-shrink-0">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-emerald-700 text-white font-black text-xs">IMG</div>
                          )}
                        </div>
                        <div className="space-y-0.5 text-xxs">
                          <h6 className="font-black text-slate-800 line-clamp-1">{item.title}</h6>
                          <p className="text-slate-500 line-clamp-2 leading-relaxed">{item.description}</p>
                        </div>
                        <button
                          onClick={() => {
                            if (confirm('Hapus foto dokumentasi ini?')) {
                              onUpdateGallery(galleryItems.filter(p => p.id !== item.id));
                              showToast('Foto dokumentasi berhasil dihapus!', 'success');
                            }
                          }}
                          className="absolute top-2 right-2 p-1 text-rose-500 hover:text-white bg-white hover:bg-rose-500 rounded border border-rose-100 shadow-3xs cursor-pointer opacity-80 group-hover:opacity-100 transition"
                          title="Hapus foto"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}



          </div>
        </div>
      )}
    </div>
  );
}
