/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Calendar, Landmark, AlertTriangle, KeyRound } from 'lucide-react';
import { Student } from '../data';

interface StudentCheckerProps {
  students: Student[];
  onSearch: (nisn: string, tanggalLahir: string) => void;
  foundStudent: Student | null | undefined; // undefined: not searched, null: not found
  onClear: () => void;
  isLoading: boolean;
}

export function StudentChecker({
  students,
  onSearch,
  foundStudent,
  onClear,
  isLoading
}: StudentCheckerProps) {
  const [nisnInput, setNisnInput] = useState('');
  const [birthDateInput, setBirthDateInput] = useState('');
  const [errorText, setErrorText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (!nisnInput || !birthDateInput) {
      setErrorText('Silakan isi nomor NISN dan Tanggal Lahir lengkap.');
      return;
    }

    if (nisnInput.length < 8) {
      setErrorText('NISN minimal 8-10 digit numerik.');
      return;
    }

    onSearch(nisnInput.trim(), birthDateInput);
  };

  return (
    <div className="bg-white rounded-2xl border border-emerald-100 shadow-md overflow-hidden max-w-2xl mx-auto">
      <div className="flex-1 p-6 md:p-8 space-y-6">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
            <KeyRound className="w-3.5 h-3.5" /> Portal Verifikasi Kelulusan
          </span>
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Cek Status Kelulusan Anda
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed font-sans font-light">
            Gunakan 10 digit NISN (Nomor Induk Siswa Nasional) resmi Anda serta Tanggal Lahir sesuai data Dapodik untuk melihat status kelulusan Anda secara lengkap.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label id="lbl-nisn" htmlFor="nisn" className="block text-xs font-bold text-slate-700 tracking-wide uppercase">
              NISN Siswa (10 Digit)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Landmark className="w-5 h-5" />
              </span>
              <input
                id="nisn"
                type="text"
                maxLength={12}
                placeholder="Contoh: 0051234561"
                className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-slate-200 rounded-xl text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                value={nisnInput}
                onChange={(e) => setNisnInput(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label id="lbl-bdate" htmlFor="bdate" className="block text-xs font-bold text-slate-705 tracking-wide uppercase">
              Tanggal Lahir Siswa
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Calendar className="w-5 h-5" />
              </span>
              <input
                id="bdate"
                type="date"
                className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-slate-200 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                value={birthDateInput}
                onChange={(e) => setBirthDateInput(e.target.value)}
              />
            </div>
          </div>

          {errorText && (
            <div className="flex items-start gap-2 p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-medium border border-rose-100">
              <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
              <span>{errorText}</span>
            </div>
          )}

          {foundStudent === null && !isLoading && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 text-amber-800 rounded-xl text-xs font-medium border border-amber-100">
              <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Data Tidak Ditemukan!</p>
                <p className="mt-0.5 text-slate-600 font-normal leading-relaxed">
                  Periksa kembali NISN dan Tanggal lahir. Pastikan format sudah benar atau hubungi bagian kurikulum sekolah untuk sinkronisasi Dapodik.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              id="btn-search"
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 px-4 rounded-xl text-sm transition shadow-sm shadow-emerald-100 hover:shadow active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              {isLoading ? 'Mencari Data...' : 'Verifikasi Kelulusan'}
            </button>

            {(nisnInput || birthDateInput || foundStudent !== undefined) && (
              <button
                id="btn-clear"
                type="button"
                className="border border-stone-200 hover:bg-stone-55 text-slate-700 font-semibold py-3 px-4 rounded-xl text-sm transition cursor-pointer"
                onClick={() => {
                  setNisnInput('');
                  setBirthDateInput('');
                  setErrorText('');
                  onClear();
                }}
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
