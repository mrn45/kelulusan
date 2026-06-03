/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Student {
  nisn: string;
  nama: string;
  tanggalLahir: string; // YYYY-MM-DD
  tempatLahir: string;
  nomorPeserta: string;
  kelas: string;
  status: 'LULUS' | 'TIDAK_LULUS' | 'DITUNDA';
  predikat: string;
  nilai: {
    'Bahasa Indonesia': number;
    'Matematika': number;
    'Bahasa Inggris': number;
    'Pendidikan Agama Islam': number;
  };
  catatan: string;
  fotoSiswa?: string; // photo/link URL
}

export const INITIAL_STUDENTS: Student[] = [];

export function getStoredStudents(): Student[] {
  if (typeof window === 'undefined') return INITIAL_STUDENTS;
  const data = localStorage.getItem('school_students_data');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      return INITIAL_STUDENTS;
    }
  }
  localStorage.setItem('school_students_data', JSON.stringify(INITIAL_STUDENTS));
  return INITIAL_STUDENTS;
}

export function saveStudents(students: Student[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('school_students_data', JSON.stringify(students));
}

export interface SchoolInfo {
  namaSekolah: string;
  npsn: string;
  akreditasi: string;
  kepalaSekolah: string;
  nipKepalaSekolah: string;
  sambutanKepalaSekolah: string;
  alamat: string;
  tahunAjaran: string;
  tanggalPengumuman: string;
  fotoKepalaSekolah?: string;
  logoSekolah?: string;
  namaYayasan?: string;
  templateSklPembuka?: string;
  templateSklPenutup?: string;
}

export const SCHOOL_INFO_KEY = 'school_info_data';

export const DEFAULT_SCHOOL_INFO: SchoolInfo = {
  namaSekolah: "SMP ISLAM ASSYAFIIYAH",
  npsn: "20103284",
  akreditasi: "B",
  kepalaSekolah: "MAIMUN, S.Pd.I",
  nipKepalaSekolah: "-",
  alamat: "Jl. Barkah No. 17, RT.3/RW.3, Tebet Barat, Kec. Tebet, Kota Jakarta Selatan, DKI Jakarta 12810",
  tahunAjaran: "2025/2026",
  tanggalPengumuman: "2026-06-02",
  sambutanKepalaSekolah: "Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\nAlhamdulillahi rabbil 'alamin, puji dan syukur senantiasa kita panjatkan kehadirat Allah SWT atas segala limpahan rahmat, hidayah, dan karunia-Nya. Shalawat serta salam semoga senantiasa tercurah kepada junjungan kita, Baginda Nabi Agung Muhammad SAW, keluarga, sahabat, serta para pengikutnya yang setia hingga akhir zaman.\n\nHari ini merupakan momen bersejarah dan penuh kesyukuran yang kita nanti-nantikan bersama. Pengumuman kelulusan ini adalah buah dari perjuangan, kesabaran, dan ketekunan anak-anakku sekalian selama tiga tahun menempuh pendidikan di SMP Islam Assyafiiyah. Prestasi ini tidak luput dari doa ikhlas orang tua serta bimbingan penuh kasih dari bapak dan ibu guru.\n\nKelulusan tingkat SMP bukanlah akhir dari perjalanan menuntut ilmu, melainkan gerbang awal untuk melangkah ke jenjang pendidikan yang lebih tinggi. Jagalah selalu shalatmu, implementasikan akhlakul karimah yang telah ditanamkan di sekolah ini, serta jadilah insan yang jujur, berkarakter mulia, dan bermanfaat bagi agama, nusa, dan bangsa.\n\nSelamat atas kelulusan kalian, anak-anakku tercinta. Teruslah bersemangat dalam menuntut ilmu, raihlah cita-citamu setinggi langit, dan buatlah orang tuamu bangga di dunia dan akhirat. Barakallahu fiikum.\n\nWassalamu'alaikum Warahmatullahi Wabarakatuh.",
  fotoKepalaSekolah: "https://kommodo.ai/i/l6gVIqIAq2RzvrUupqxb",
  logoSekolah: "",
  namaYayasan: "YAYASAN ASSYAFIIYAH",
  templateSklPembuka: "Yang bertanda tangan di bawah ini, Kepala {namaSekolah} menerangkan bahwa siswa berikut ini:",
  templateSklPenutup: "Surat Keterangan Kelulusan ini berlaku sementara sampai dengan diterbitkannya Ijazah asli siswa. Lembar pengumuman kelulusan digital ini terintegrasi langsung dengan database resmi Dapodik pendidikan sekolah {tahunAjaran}."
};

export function getStoredSchoolInfo(): SchoolInfo {
  if (typeof window === 'undefined') return DEFAULT_SCHOOL_INFO;
  const data = localStorage.getItem(SCHOOL_INFO_KEY);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      // Auto-migrate if it has the older principal's or school's info cached in the user's browser
      if (parsed.kepalaSekolah.includes("Ahmad Fauzi") || parsed.namaSekolah !== DEFAULT_SCHOOL_INFO.namaSekolah || parsed.fotoKepalaSekolah === "/kepsek.png" || parsed.fotoKepalaSekolah === "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop") {
        const merged = { ...parsed, fotoKepalaSekolah: DEFAULT_SCHOOL_INFO.fotoKepalaSekolah };
        localStorage.setItem(SCHOOL_INFO_KEY, JSON.stringify(merged));
        return merged;
      }
      // Fill missing template fields for backward compatibility
      if (!parsed.hasOwnProperty('templateSklPembuka') || !parsed.hasOwnProperty('namaYayasan') || !parsed.hasOwnProperty('akreditasi')) {
        const merged = { ...DEFAULT_SCHOOL_INFO, ...parsed, akreditasi: parsed.akreditasi || DEFAULT_SCHOOL_INFO.akreditasi };
        localStorage.setItem(SCHOOL_INFO_KEY, JSON.stringify(merged));
        return merged;
      }
      return parsed;
    } catch (e) {
      return DEFAULT_SCHOOL_INFO;
    }
  }
  localStorage.setItem(SCHOOL_INFO_KEY, JSON.stringify(DEFAULT_SCHOOL_INFO));
  return DEFAULT_SCHOOL_INFO;
}

export function saveSchoolInfo(info: SchoolInfo) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SCHOOL_INFO_KEY, JSON.stringify(info));
}

// Custom mock gallery data specifically representing Indonesian high school activity & graduation
export interface GalleryItem {
  id: string;
  title: string;
  description: string;
  fallbackIcon: string;
  color: string;
  imageUrl?: string;
}

export const DOCUMENTATION_GALLERY: GalleryItem[] = [
  {
    id: "gal-1",
    title: "Upacara Pelepasan Siswa",
    description: "Momen pelepasan dan pengembalian siswa kelas IX secara formal kepada pihak orang tua/wali murid.",
    fallbackIcon: "GraduationCap",
    color: "from-emerald-500 to-emerald-700",
    imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: "gal-2",
    title: "Doa Bersama & Istighosah",
    description: "Kegiatan istighosah doa bersama keluarga besar SMP Islam Assyafiiyah demi kemantapan batin alumni.",
    fallbackIcon: "Users",
    color: "from-emerald-500 to-teal-600",
    imageUrl: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: "gal-3",
    title: "Pentas Seni & Kreasi Siswa",
    description: "Pengekspresian bakat seni Islami, budaya nusantara, dan ketangkasan olahraga menjelang kelulusan.",
    fallbackIcon: "Sparkles",
    color: "from-amber-500 to-rose-600",
    imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: "gal-4",
    title: "Foto Bersama Dewan Pendidik",
    description: "Penanaman ikatan kekeluargaan seumur hidup bersama bapak dan ibu guru pembimbing SMP Islam Assyafiiyah.",
    fallbackIcon: "Heart",
    color: "from-purple-500 to-pink-600",
    imageUrl: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=800&auto=format&fit=crop"
  }
];

export const GALLERY_INFO_KEY = 'school_gallery_data';

export function getStoredGallery(): GalleryItem[] {
  if (typeof window === 'undefined') return DOCUMENTATION_GALLERY;
  const data = localStorage.getItem(GALLERY_INFO_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      return DOCUMENTATION_GALLERY;
    }
  }
  localStorage.setItem(GALLERY_INFO_KEY, JSON.stringify(DOCUMENTATION_GALLERY));
  return DOCUMENTATION_GALLERY;
}

export function saveGallery(gallery: GalleryItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GALLERY_INFO_KEY, JSON.stringify(gallery));
}
