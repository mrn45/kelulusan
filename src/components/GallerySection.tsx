/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Camera, Eye, X, Award, Image as ImageIcon } from 'lucide-react';
import { DOCUMENTATION_GALLERY, GalleryItem } from '../data';

interface GallerySectionProps {
  galleryItems?: GalleryItem[];
}

export function GallerySection({ galleryItems = DOCUMENTATION_GALLERY }: GallerySectionProps) {
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-xs uppercase tracking-wider">
            <Camera className="w-4.5 h-4.5 text-emerald-650" /> Galeri Dokumentasi Sekolah
          </div>
          <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Momen & Dokumentasi Kegiatan Siswa
          </h3>
          <p className="text-xs text-slate-500">
            Kumpulan potret seremonial, akademik, serta ekstrakurikuler kelas IX jenjang akhir sekolah.
          </p>
        </div>
      </div>

      {/* Grid List representation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {galleryItems.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedItem(item)}
            className="group relative bg-white border border-stone-200 rounded-2xl shadow-sm hover:shadow-md overflow-hidden cursor-pointer transition-all duration-300 transform hover:-translate-y-1"
          >
            {/* Image Port */}
            <div className="relative h-48 bg-stone-100 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent z-10 opacity-70 group-hover:opacity-90 transition-opacity" />
              
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover scale-100 group-hover:scale-110 transition-transform duration-700 ease-out"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-tr ${item.color} flex flex-col items-center justify-center text-white p-4 text-center scale-100 group-hover:scale-110 transition-transform duration-700 ease-out`}>
                  <ImageIcon className="w-12 h-12 mb-2 opacity-80 group-hover:scale-110 transition-transform duration-500" />
                  <span className="text-xs font-bold font-mono tracking-wide">DOCUMENTATION</span>
                </div>
              )}

              {/* Float Hover Lens Button */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                <span className="bg-white/95 text-slate-900 px-4 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-md transform scale-90 group-hover:scale-100 transition-transform">
                  <Eye className="w-4 h-4 text-emerald-650" /> Perbesar Momen
                </span>
              </div>

              {/* Caption Overlay */}
              <div className="absolute bottom-3 left-4 right-4 z-15 text-white">
                <p className="font-extrabold text-sm line-clamp-1 text-slate-50 font-serif">
                  {item.title}
                </p>
                <p className="text-[10px] text-slate-300 line-clamp-1 mt-0.5 font-sans">
                  {item.description}
                </p>
              </div>
            </div>
            
            {/* Sub-card footer */}
            <div className="p-4 bg-white">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#f3f6f1] text-emerald-800 border border-emerald-100/40">
                Pelepasan Kelas XII
              </span>
              <p className="text-xxs text-slate-400 mt-2 flex items-center gap-1 font-mono">
                <Award className="w-3.5 h-3.5 text-amber-500" /> Hak Cipta Komite Alumni
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Zoom Portal Modal with no-scroll overlay */}
      {selectedItem && (
        <div id="gallery-lightbox" className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-50 animate-fade-in print-hidden">
          <div className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full relative shadow-2xl border border-stone-200">
            
            {/* Close button */}
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 bg-white/90 hover:bg-white text-slate-900 hover:text-emerald-700 p-2 rounded-full z-20 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Main Image view */}
            <div className="relative h-72 sm:h-96 bg-stone-900 overflow-hidden">
              {selectedItem.imageUrl ? (
                <img
                  src={selectedItem.imageUrl}
                  alt={selectedItem.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-tr ${selectedItem.color} flex items-center justify-center text-white`}>
                  <ImageIcon className="w-16 h-16" />
                </div>
              )}
            </div>

            {/* Modal metadata text */}
            <div className="p-6 space-y-3">
              <div className="flex gap-2">
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-xxs font-extrabold uppercase px-2.5 py-1 rounded-full">
                  Dokumentasi Resmi Sekolah
                </span>
                <span className="bg-slate-100 text-slate-600 text-xxs font-mono px-2.5 py-1 rounded-full">
                  File ID: {selectedItem.id}
                </span>
              </div>
              
              <h4 className="text-xl font-bold font-serif text-slate-900">
                {selectedItem.title}
              </h4>
              
              <p className="text-slate-600 text-xs md:text-sm leading-relaxed font-sans">
                {selectedItem.description}
              </p>
              
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xxs text-slate-400 font-mono">
                <span>Fotografer: Kurikulum & Media Dokumentasi</span>
                <span>Tahun Ajaran: Aktif Digital</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
