/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Quote, Award, User, ShieldCheck } from 'lucide-react';
import { SchoolInfo } from '../data';

interface PrincipalGreetingProps {
  schoolInfo: SchoolInfo;
}

export function PrincipalGreeting({ schoolInfo }: PrincipalGreetingProps) {
  return (
    <div className="bg-white rounded-2xl border border-emerald-100 p-6 md:p-8 shadow-xs transition-all duration-300 hover:shadow-md">
      <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
        {/* Principal Portrait fallbacks & graphic decoration */}
        <div className="relative w-72 h-96 flex-shrink-0 group">
          <div className="absolute -inset-1.5 bg-gradient-to-tr from-amber-500 to-emerald-600 rounded-2xl blur-sm opacity-40 group-hover:opacity-60 transition duration-500" />
          
          {/* Main frame */}
          <div className="relative w-full h-full bg-stone-50 border-4 border-white rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between p-3 text-center">
            {/* Elegant Background Patterns representing Indonesian Siger/Batik */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:16px_16px]" />
            
            <div className="relative w-full h-72 bg-gradient-to-br from-emerald-50 to-amber-50 border border-stone-200 shadow-inner flex items-center justify-center overflow-hidden rounded-xl group-hover:scale-[1.02] transition-all duration-300">
              {schoolInfo.fotoKepalaSekolah ? (
                <img src={schoolInfo.fotoKepalaSekolah} alt={schoolInfo.kepalaSekolah} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User className="w-16 h-16 text-emerald-700" />
              )}
              {/* Badge */}
              <span className="absolute bottom-2 right-2 bg-emerald-600 text-white p-1 rounded-full border border-white">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>

            <div className="z-10 py-1.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                KEPALA SEKOLAH
              </span>
              <p className="text-xs font-extrabold text-emerald-950 mt-1 line-clamp-2 leading-tight">
                {schoolInfo.kepalaSekolah}
              </p>
              {schoolInfo.nipKepalaSekolah !== '-' ? (
                <p className="text-[10px] text-amber-600 font-medium">NIP. {schoolInfo.nipKepalaSekolah}</p>
              ) : (
                <p className="text-[10px] text-amber-600 font-medium">Terverifikasi Digital</p>
              )}
            </div>
          </div>
          
          {/* Academic Accolade Icon overlay */}
          <div className="absolute -bottom-3 -right-3 bg-white border border-stone-100 rounded-full p-2.5 shadow-sm text-amber-500 hover:scale-110 transition-all duration-200">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* Message Content */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm tracking-wide uppercase">
            <Quote className="w-5 h-5 text-emerald-650 rotate-180" />
            Sambutan Dari Kepala Sekolah
          </div>
          
          <h3 className="text-xl md:text-2xl font-bold font-serif text-emerald-950 leading-tight">
            Menyongsong Masa Depan Gemilang dengan Akhlak dan Karsa Luhur
          </h3>
          
          {/* Main paragraphs */}
          <div className="text-slate-600 text-sm md:text-base leading-relaxed space-y-3 font-sans">
            {schoolInfo.sambutanKepalaSekolah.split('\n\n').map((paragraph, index) => (
              <p key={index} className="first-letter:text-3xl first-letter:font-serif first-letter:font-bold first-letter:text-emerald-700 first-letter:float-left first-letter:mr-2 first-letter:leading-none">
                {index === 0 ? paragraph : paragraph.replace(/^[A-Za-z]/, (match) => match)}
              </p>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-bold text-slate-800 text-base font-serif">{schoolInfo.kepalaSekolah}</p>
              <p className="text-xs text-slate-500 font-mono">NIP: {schoolInfo.nipKepalaSekolah}</p>
            </div>
            
            {/* Custom stylized signature placeholder */}
            <div className="relative border border-dashed border-emerald-200 rounded-lg py-2 px-6 flex items-center justify-center bg-stone-50/50 min-w-36 overflow-hidden">
              <span className="font-serif italic text-emerald-650 text-xs tracking-wider select-none opacity-60">
                Tertanda Resmi
              </span>
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.08] text-emerald-700 scale-150 rotate-12 pointer-events-none select-none font-bold">
                VALIDAT
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
