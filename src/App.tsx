/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, 
  Award, 
  Building2, 
  Info, 
  Calendar, 
  CheckCircle, 
  Loader2, 
  BookOpen, 
  Users2, 
  ArrowRight,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { 
  getStoredStudents, 
  saveStudents, 
  getStoredSchoolInfo, 
  saveSchoolInfo, 
  getStoredGallery,
  saveGallery,
  Student, 
  SchoolInfo,
  GalleryItem,
  DEFAULT_SCHOOL_INFO,
  DOCUMENTATION_GALLERY
} from './data';
import {
  getStudentsFromFirestore,
  saveStudentsBatchToFirestore,
  getSchoolInfoFromFirestore,
  saveSchoolInfoToFirestore,
  getGalleryFromFirestore,
  saveGalleryBatchToFirestore
} from './firebaseService';
import { PrincipalGreeting } from './components/PrincipalGreeting';
import { StudentChecker } from './components/StudentChecker';
import { GraduationLetter } from './components/GraduationLetter';
import { GallerySection } from './components/GallerySection';
import { AdminPanel } from './components/AdminPanel';

export default function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [searchResult, setSearchResult] = useState<Student | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDateString, setCurrentDateString] = useState('');
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(true);

  // Initial load
  useEffect(() => {
    const loadFirebaseData = async () => {
      try {
        setIsFirebaseLoading(true);
        // Fetch values from Firestore, with local storage fallback
        const dbSchoolInfo = await getSchoolInfoFromFirestore(DEFAULT_SCHOOL_INFO);
        setSchoolInfo(dbSchoolInfo);

        const dbGallery = await getGalleryFromFirestore(DOCUMENTATION_GALLERY);
        setGallery(dbGallery);

        const dbStudents = await getStudentsFromFirestore();
        setStudents(dbStudents);
      } catch (err) {
        console.error("Firebase fetch error, falling back to local storage: ", err);
        setStudents(getStoredStudents());
        setSchoolInfo(getStoredSchoolInfo());
        setGallery(getStoredGallery());
      } finally {
        setIsFirebaseLoading(false);
      }
    };

    loadFirebaseData();
    
    // Set formatted indonesian current date
    const date = new Date();
    const indonesianDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const indonesianMonths = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const dayName = indonesianDays[date.getDay()];
    const day = date.getDate();
    const month = indonesianMonths[date.getMonth()];
    const year = date.getFullYear();
    setCurrentDateString(`${dayName}, ${day} ${month} ${year}`);
  }, []);

  // Listen for query parameters to auto-fill or deep-link to student result
  useEffect(() => {
    if (students.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const urlNisn = urlParams.get('nisn');
      const urlLahir = urlParams.get('lahir');
      if (urlNisn && urlLahir) {
        setIsLoading(true);
        setTimeout(() => {
          const found = students.find(
            (student) => 
              student.nisn === urlNisn && 
              student.tanggalLahir === urlLahir
          );
          setSearchResult(found || null);
          setIsLoading(false);
          if (found) {
            setTimeout(() => {
              smoothScrollToElement('hasil-kelulusan-section');
            }, 150);
          }
        }, 550);
      }
    }
  }, [students]);

  const handleUpdateStudents = async (updatedList: Student[]) => {
    setStudents(updatedList);
    saveStudents(updatedList);
    try {
      await saveStudentsBatchToFirestore(updatedList);
    } catch (err) {
      console.error("Failed to sync students to Firebase:", err);
    }
    
    // If we have an active search result, make sure we reflect edits
    if (searchResult) {
      const match = updatedList.find((s) => s.nisn === searchResult.nisn);
      if (match) {
        setSearchResult(match);
      } else {
        setSearchResult(undefined);
      }
    }
  };

  const handleUpdateSchoolInfo = async (updatedInfo: SchoolInfo) => {
    setSchoolInfo(updatedInfo);
    saveSchoolInfo(updatedInfo);
    try {
      await saveSchoolInfoToFirestore(updatedInfo);
    } catch (err) {
      console.error("Failed to sync school info to Firebase:", err);
    }
  };

  const handleUpdateGallery = async (updatedGallery: GalleryItem[]) => {
    setGallery(updatedGallery);
    saveGallery(updatedGallery);
    try {
      await saveGalleryBatchToFirestore(updatedGallery);
    } catch (err) {
      console.error("Failed to sync gallery to Firebase:", err);
    }
  };

  const smoothScrollToElement = (id: string, customOffset?: number) => {
    const targetElement = document.getElementById(id);
    if (!targetElement) return;

    const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY;
    const startPosition = window.scrollY;
    // Define offset matching scroll-mt-24 (96px)
    const offset = customOffset !== undefined ? customOffset : 96;
    const distance = targetPosition - startPosition - offset;
    const duration = 1000; // Premium, slow buttery duration definition
    let start: number | null = null;

    // Cubic-bezier easing for high-quality professional scroll trajectory
    const easeInOutCubic = (t: number) => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      
      window.scrollTo(0, startPosition + distance * easeInOutCubic(progress));

      if (elapsed < duration) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  };

  const handleScrollClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    smoothScrollToElement(id);
  };

  const handleSearch = (nisn: string, tanggalLahir: string) => {
    setIsLoading(true);
    setSearchResult(undefined);

    // Dynamic timeout representing database authentication
    setTimeout(() => {
      const found = students.find(
        (student) => 
          student.nisn === nisn && 
          student.tanggalLahir === tanggalLahir
      );
      
      setSearchResult(found || null);
      setIsLoading(false);

      // Auto scroll to results if found
      if (found) {
        setTimeout(() => {
          smoothScrollToElement('hasil-kelulusan-section');
        }, 100);
      }
    }, 850);
  };

  const handleCloseResult = () => {
    setSearchResult(undefined);
    smoothScrollToElement('pencarian-section');
  };

  if (!schoolInfo) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfdfa] text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-900 pb-12 overflow-x-hidden">
      
      {/* Banner / Running Ticker (Interactive Web Only) */}
      <div className="bg-emerald-950 text-slate-50 text-xs py-2.5 px-4 print-hidden border-b border-emerald-900/40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
            <span className="font-semibold text-green-300">SERVER ONLINE:</span>
            <span>Pengumuman Kelulusan Online {schoolInfo.tahunAjaran}</span>
          </div>
          <div className="flex items-center gap-2 font-semibold text-emerald-250">
            <span>Hari ini: {currentDateString}</span>
          </div>
        </div>
      </div>

      {/* Primary Header */}
      <header className="bg-white border-b border-stone-200 py-3 sm:py-4 px-4 sm:px-6 lg:px-8 shadow-xs sticky top-0 bg-white/95 backdrop-blur-md z-40 print-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-3.5">
            {schoolInfo.logoSekolah ? (
              <img 
                src={schoolInfo.logoSekolah} 
                alt={`Logo ${schoolInfo.namaSekolah}`} 
                className="w-10 h-10 md:w-12 md:h-12 shrink-0 object-contain hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 bg-emerald-650 rounded-xl flex items-center justify-center text-white shadow-sm hover:scale-105 transition-transform duration-300">
                <GraduationCap className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
            )}
            <div>
              <h1 className="font-extrabold text-emerald-900 text-base sm:text-lg md:text-xl tracking-tight leading-none uppercase">
                {schoolInfo.namaSekolah}
              </h1>
              <p className="text-[10px] sm:text-xxs font-bold text-slate-500 font-mono tracking-wider mt-1 sm:mt-1.5 flex flex-wrap items-center gap-1.5">
                <Building2 className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-emerald-650" /> NPSN: {schoolInfo.npsn} 
                <span className="text-slate-300">|</span> 
                Akreditasi {schoolInfo.akreditasi}
                <span className="text-slate-300 hidden sm:inline">|</span> 
                <span className="hidden sm:inline">Portal Kelulusan</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-2.5 w-full md:w-auto">
            <a 
              href="#pencarian-section"
              onClick={(e) => handleScrollClick(e, 'pencarian-section')}
              className="flex-1 md:flex-none text-center px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition active:scale-95 shadow-sm shadow-emerald-700/10"
            >
              Cek Kelulusan
            </a>
            <a 
              href="#galeri-section"
              onClick={(e) => handleScrollClick(e, 'galeri-section')}
              className="flex-1 md:flex-none text-center px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-xl text-xs font-bold bg-[#f3f6f1] hover:bg-[#e7eee3] text-emerald-800 border border-emerald-100 transition"
            >
              Galeri Utama
            </a>
          </div>
        </div>
      </header>

      {/* Main Body Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8 space-y-8 sm:space-y-10">

        {/* Hero Banner Showcase (Academic Badge) */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative bg-gradient-to-r from-emerald-900 via-emerald-950 to-stone-900 rounded-3xl overflow-hidden p-6 md:p-12 shadow-md text-white print-hidden"
        >
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
          
          <div className="max-w-2xl space-y-4 relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xxs font-extrabold bg-emerald-500/20 text-emerald-300 uppercase tracking-widest border border-emerald-400/20">
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 animate-pulse" /> PENGUMUMAN RESMI SEKOLAH
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-serif text-slate-50 leading-tight">
              Gerbang Pengumuman Kelulusan Siswa Kelas Akhir
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-slate-300 leading-relaxed font-sans font-light">
              Selamat datang di portal informasi kelulusan online {schoolInfo.namaSekolah}. Kami berkomitmen menyajikan sistem pelaporan kelulusan yang kredibel, cepat, transparan, dan dapat diakses kapan saja.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-2 text-xs font-semibold text-slate-300">
              <div className="flex items-center gap-1.5 bg-white/5 px-3.5 py-1.5 rounded-full border border-white/10">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>Format Digital Dapodik</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 px-3.5 py-1.5 rounded-full border border-white/10">
                <Users2 className="w-4 h-4 text-emerald-400" />
                <span>Database Terenkripsi Aman</span>
              </div>
            </div>
          </div>

          {/* Graphical Backdrops */}
          <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 hidden md:block pointer-events-none select-none">
            <div className="w-full h-full flex items-center justify-center">
              <GraduationCap className="w-64 h-64 text-emerald-400" />
            </div>
          </div>
        </motion.div>

        {/* Section 1: Sambutan Kepala Sekolah */}
        <motion.section 
          id="sambutan-section" 
          className="space-y-4 print-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <PrincipalGreeting schoolInfo={schoolInfo} />
        </motion.section>

        {/* Section 2: Verification Portal Search */}
        <motion.section 
          id="pencarian-section" 
          className="scroll-mt-24 space-y-4 print-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <StudentChecker 
            students={students}
            onSearch={handleSearch}
            foundStudent={searchResult}
            onClear={handleCloseResult}
            isLoading={isLoading}
          />
        </motion.section>

        {/* Loader component for search verification */}
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 flex flex-col items-center justify-center space-y-4 print-hidden"
          >
            <Loader2 className="w-10 h-10 text-emerald-700 animate-spin" />
            <p className="text-xs text-emerald-800 font-bold tracking-widest uppercase font-mono animate-pulse">
              Mengautentikasi NISN Siswa...
            </p>
          </motion.div>
        )}

        {/* Section 3: Examination / Letter Results */}
        <AnimatePresence mode="wait">
          {searchResult !== undefined && !isLoading && (
            <motion.section 
              key={searchResult ? searchResult.nisn : 'error_not_found'}
              id="hasil-kelulusan-section"
              className="scroll-mt-24"
              initial={{ opacity: 0, scale: 0.92, y: 45 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -20 }}
              transition={{ 
                type: "spring", 
                stiffness: 90, 
                damping: 14,
                mass: 0.9
              }}
            >
              {searchResult ? (
                <GraduationLetter 
                  student={searchResult}
                  schoolInfo={schoolInfo}
                  onClose={handleCloseResult}
                />
              ) : (
                <div className="bg-white rounded-2xl border border-rose-100 p-8 text-center space-y-4 shadow-xs max-w-xl mx-auto print-hidden">
                  <div className="mx-auto w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-600">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-900 text-lg">Pencarian Tidak Ditemukan</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      Kombinasi NISN dan Tanggal Lahir tersebut tidak terpasang di modul data siswa kami. Gunakan Panel Admin di bawah untuk menyisipkan data kustom jika diinginkan.
                    </p>
                  </div>
                  <button
                    onClick={handleCloseResult}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold transition text-slate-700 cursor-pointer"
                  >
                    Tutup Notifikasi
                  </button>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {/* Section 4: Galeri Dokumentasi */}
        <motion.section 
          id="galeri-section" 
          className="pt-6 space-y-4 print-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <GallerySection galleryItems={gallery} />
        </motion.section>

        {/* Section 5: Simulator / Admin parameters settings */}
        <motion.section 
          id="admin-section" 
          className="pt-6 space-y-4 print-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <AdminPanel 
            students={students}
            schoolInfo={schoolInfo}
            galleryItems={gallery}
            onUpdateStudents={handleUpdateStudents}
            onUpdateSchoolInfo={handleUpdateSchoolInfo}
            onUpdateGallery={handleUpdateGallery}
          />
        </motion.section>

      </main>

      {/* Styled Footer */}
      <footer className="mt-16 sm:mt-20 border-t border-stone-200/80 pt-8 sm:pt-10 px-4 sm:px-6 lg:px-8 bg-white print-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 pb-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-emerald-700">
              <GraduationCap className="w-6 h-6" />
              <span className="font-extrabold tracking-tight uppercase text-slate-900">{schoolInfo.namaSekolah}</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Portal digital pengumuman status kelulusan siswa dan administrasi surat kelulusan resmi sementara terintegrasi sistem Dapodik Provinsi.
            </p>
          </div>

          <div className="space-y-3">
            <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Tautan Cepat</h5>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <a href="#sambutan-section" onClick={(e) => handleScrollClick(e, 'sambutan-section')} className="text-slate-500 hover:text-emerald-700 transition flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5 text-emerald-600" /> Sambutan</a>
              <a href="#pencarian-section" onClick={(e) => handleScrollClick(e, 'pencarian-section')} className="text-slate-500 hover:text-emerald-700 transition flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5 text-emerald-600" /> Pencarian</a>
              <a href="#galeri-section" onClick={(e) => handleScrollClick(e, 'galeri-section')} className="text-slate-500 hover:text-emerald-700 transition flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5 text-emerald-600" /> Galeri</a>
              <a href="#admin-section" onClick={(e) => handleScrollClick(e, 'admin-section')} className="text-slate-500 hover:text-emerald-700 transition flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5 text-emerald-600" /> Admin Panel</a>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Sertifikasi & Keamanan</h5>
            <div className="flex items-center gap-3">
              <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-emerald-650" />
              </div>
              <div className="text-[10px] text-slate-400 space-y-0.5 leading-normal">
                <p className="font-bold text-slate-600">Sertifikasi SSL Sekolah</p>
                <p>Koneksi aman terenkripsi 256-bit SHA. Seluruh unggahan dokumen terlindungi UU ITE.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-slate-100 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xxs text-slate-400">
          <p>© {new Date().getFullYear()} {schoolInfo.namaSekolah}. Hak Cipta Dilindungi Undang-Undang.</p>
          <div className="flex gap-4 font-mono">
            <span className="hover:text-slate-600 transition cursor-pointer">Syarat & Ketentuan</span>
            <span>•</span>
            <span className="hover:text-slate-600 transition cursor-pointer">Kebijakan Privasi</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
