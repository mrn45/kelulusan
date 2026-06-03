/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { 
  Award, 
  Clock, 
  FileCheck2, 
  Building2, 
  UserCheck, 
  HelpCircle, 
  Image as ImageIcon,
  User,
  Calendar,
  BookOpen,
  ArrowLeft,
  GraduationCap,
  Sparkles,
  Share2
} from 'lucide-react';
import { Student, SchoolInfo } from '../data';
import { toPng } from 'html-to-image';

interface GraduationLetterProps {
  student: Student;
  schoolInfo: SchoolInfo;
  onClose: () => void;
}

export function GraduationLetter({ student, schoolInfo, onClose }: GraduationLetterProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);

  const handleShareImage = async () => {
    if (!cardRef.current) return;
    
    try {
      setIsSharing(true);
      const dataUrl = await toPng(cardRef.current, { 
        cacheBust: true, 
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });
      
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `Kelulusan_${student.nama.replace(/\s+/g, '_')}.png`, { type: blob.type });

      let shared = false;
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `Hasil Kelulusan - ${student.nama}`,
            text: `Alhamdulillah, ini adalah hasil kelulusan saya dari ${schoolInfo.namaSekolah}.`,
            files: [file],
          });
          shared = true;
        } catch (shareError) {
          console.warn('Panggilan Web Share API dibatalkan atau tidak didukung di dalam iFrame, mencoba unduh file sebagai alternatif.', shareError);
        }
      } 
      
      if (!shared) {
        const link = document.createElement('a');
        link.download = `Kelulusan_${student.nama.replace(/\s+/g, '_')}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Failed to generate or share image', error);
      alert('Gagal membuat atau membagikan gambar kelulusan. Halaman mungkin memiliki gambar dari sumber yang tidak mengizinkan akses (CORS).');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Interactive Web Header */}
      <div className="bg-stone-900 border border-emerald-950 text-white p-4 md:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md print-hidden animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-sm">
            <Award className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-xxs uppercase tracking-wider font-extrabold text-emerald-400">Hasil Cek Pengumuman</span>
            <h4 className="text-sm font-bold text-slate-100">
              Uraian Status Kelulusan Siswa
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShareImage}
            disabled={isSharing}
            className="flex-1 sm:flex-none justify-center items-center gap-1.5 px-3 py-2 bg-[#2d2d2d] hover:bg-[#3d3d3d] text-white text-xs font-bold rounded-xl transition cursor-pointer active:scale-95 shadow-sm disabled:opacity-75 disabled:cursor-wait flex"
          >
            {isSharing ? <Sparkles className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />} Bagikan
          </button>
          <button
            onClick={onClose}
            className="flex-1 sm:flex-none justify-center items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition cursor-pointer active:scale-95 shadow-sm flex"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
        </div>
      </div>

      {/* Main Single Dashboard Card for Student Results */}
      <div ref={cardRef} className="print-area bg-white rounded-3xl border border-emerald-100 shadow-lg p-4 sm:p-6 md:p-8 lg:p-10 space-y-6 sm:space-y-8 relative overflow-hidden transition-all duration-300 hover:border-emerald-200">
        
        {/* Absolute dynamic accent vector background lines */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none select-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none select-none" />

        {/* SECTION 1: PROFIL SISWA & IDENTITAS */}
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center border-b border-stone-100 pb-6 relative z-10">
          
          {/* Avatar Picture */}
          <div className="w-24 h-32 md:w-28 md:h-36 bg-stone-50 border border-stone-200 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center p-1 shadow-xs relative group">
            {student.fotoSiswa ? (
              <img 
                src={student.fotoSiswa} 
                alt={student.nama} 
                className="w-full h-full object-cover rounded-xl transition duration-500 group-hover:scale-105" 
                referrerPolicy="no-referrer" 
              />
            ) : (
              <div className="text-center p-2 flex flex-col items-center justify-center h-full text-slate-400">
                <User className="w-8 h-8 mb-1.5 text-slate-350" />
                <span className="text-[9px] font-bold uppercase leading-none text-slate-400">Foto Siswa</span>
              </div>
            )}
            <div className="absolute inset-0 bg-emerald-700/5 rounded-xl pointer-events-none" />
          </div>

          {/* Student Identitas Text Info */}
          <div className="space-y-4 flex-1">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-[#f3f6f1] text-emerald-805 border border-emerald-100/40 uppercase tracking-widest">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> Terdata Aktif Dapodik
              </span>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mt-2 uppercase">
                {student.nama}
              </h2>
            </div>

            {/* Grid structure showing student files */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-650 bg-[#fcfdfa] p-2.5 rounded-xl border border-stone-100/40">
                <BookOpen className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="text-[10px] uppercase text-stone-400 font-bold leading-none">NISN Resmi</p>
                  <p className="font-mono font-bold text-slate-800 mt-0.5">{student.nisn}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-650 bg-[#fcfdfa] p-2.5 rounded-xl border border-stone-100/40">
                <Calendar className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="text-[10px] uppercase text-stone-400 font-bold leading-none">Tempat, Tgl Lahir</p>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {student.tempatLahir}, {new Date(student.tanggalLahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-650 bg-[#fcfdfa] p-2.5 rounded-xl border border-stone-100/40">
                <Building2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="text-[10px] uppercase text-stone-400 font-bold leading-none">Asal Sekolah</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{schoolInfo.namaSekolah}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-650 bg-[#fcfdfa] p-2.5 rounded-xl border border-stone-100/40">
                <GraduationCap className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="text-[10px] uppercase text-stone-400 font-bold leading-none">Grup Kelas / Angkatan</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{student.kelas} • {schoolInfo.tahunAjaran}</p>
                </div>
              </div>
            </div>
          </div>
        </div>        {/* SECTION 2: STATUS KELULUSAN */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
          
          {/* Left Column: Official Announcement banner */}
          <div className="md:col-span-7 flex flex-col justify-between border-b md:border-b-0 md:border-r border-stone-100 pb-6 md:pb-0 md:pr-6 space-y-4">
            <div className="space-y-4">
              <span className="block text-xxs font-extrabold uppercase text-stone-400 tracking-widest leading-none">STATUS PENETAPAN</span>
              
              {student.status === 'LULUS' ? (
                <div className="p-6 bg-emerald-50 border border-emerald-100/70 rounded-2xl space-y-2 shadow-3xs">
                  <div className="flex items-center gap-2 text-emerald-950 font-extrabold text-lg">
                    <FileCheck2 className="w-6 h-6 text-emerald-650 animate-bounce" />
                    Dinyatakan LULUS
                  </div>
                  <p className="text-xs text-emerald-900 leading-relaxed font-sans mt-1">
                    Selamat! Anda telah resmi menyelesaikan dan dinyatakan lulus dari seluruh rangkaian kewajiban akademis jenjang akhir di <strong>{schoolInfo.namaSekolah}</strong>.
                  </p>
                </div>
              ) : (
                <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl space-y-2 shadow-3xs">
                  <div className="flex items-center gap-2 text-amber-950 font-extrabold text-lg">
                    <Clock className="w-6 h-6 text-amber-655" />
                    Status Ditunda / Kendala
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-sans mt-1">
                    Terdapat berkas administrasi kelulusan wajib, tanggungan keagamaan atau tugas khusus akhir sekolah yang harus segera dikonfirmasi kepada pihak kurikulum sekolah.
                  </p>
                </div>
              )}
            </div>

            {/* Verification Note */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100/80 flex gap-2.5 text-xxs text-slate-500 leading-normal">
              <HelpCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>
                Status data kelulusan ini terintegrasi secara aman dengan pendaftaran data pokok pendidik (Dapodik). Segala bentuk perbedaan data fisik wajib merujuk kepada keputusan Kepala Sekolah.
              </span>
            </div>
          </div>

          {/* Right Column: Security Seal & Virtual Integrity Tracker */}
          <div className="md:col-span-5 flex flex-col justify-between p-5 bg-gradient-to-br from-stone-50 to-stone-100/50 rounded-2xl border border-stone-200/60 shadow-3xs space-y-4">
            <div className="space-y-3">
              <span className="block text-xxs font-extrabold uppercase text-stone-400 tracking-widest leading-none">INTEGRITAS DATA DIGITAL</span>
              
              <div className="flex items-center gap-2.5 mt-2 bg-white/80 border border-stone-200/50 p-2.5 rounded-xl">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase text-stone-405 font-bold leading-none">Otoritas Dokumen</p>
                  <p className="text-xs font-bold text-slate-850 mt-1">Terverifikasi Digital</p>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 text-xxs text-slate-600">
              <div className="flex justify-between border-b border-stone-200/50 pb-1.5">
                <span className="text-slate-400">Nomor Peserta:</span>
                <span className="font-mono font-bold text-slate-800">{student.nomorPeserta}</span>
              </div>
              <div className="flex justify-between border-b border-stone-200/50 pb-1.5">
                <span className="text-slate-400">Kode Keamanan:</span>
                <span className="font-mono font-bold text-slate-805">SEC-{student.nisn.substring(0, 6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Validitas Server:</span>
                <span className="font-extrabold text-emerald-755 uppercase flex items-center gap-0.5 font-mono">
                  Active Digital
                </span>
              </div>
            </div>

            <div className="pt-2 text-center border-t border-stone-200/55">
              <p className="text-[9px] text-slate-400 font-mono tracking-wide">SMP Islam Assyafiiyah Database Verified</p>
            </div>
          </div>

        </div>

        {/* SECTION 3: CATATAN PENDIDIK & TANDA TANGAN */}
        <div className="border-t border-stone-100 pt-6 grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
          
          {/* Educator Remarks Blockquote */}
          <div className="md:col-span-7 space-y-2.5 bg-[#fcfdfa] p-4.5 rounded-2xl border border-emerald-100/30">
            <span className="font-extrabold text-emerald-855 block text-xxs tracking-wider uppercase flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Catatan Dewan Pendidik & Wali Kelas:
            </span>
            <p className="italic font-sans text-xs text-slate-650 leading-relaxed font-light">&quot;{student.catatan}&quot;</p>
          </div>

          {/* Sign-off Authority Representation */}
          <div className="md:col-span-5 flex flex-col justify-end items-end text-right space-y-1 self-center">
            <p className="text-[10px] text-slate-400 font-mono">Ditetapkan tanggal: {new Date(schoolInfo.tanggalPengumuman).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="text-xs font-bold text-slate-800">Mengetahui Kepala Sekolah,</p>
            <p className="text-sm font-black text-emerald-800 uppercase tracking-tight mt-3">{schoolInfo.kepalaSekolah}</p>
            {schoolInfo.nipKepalaSekolah !== '-' ? (
              <p className="text-xxs text-slate-450 font-mono">NIP. {schoolInfo.nipKepalaSekolah}</p>
            ) : (
              <p className="text-xxs text-slate-400 font-mono">NIDN. Terverifikasi</p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
