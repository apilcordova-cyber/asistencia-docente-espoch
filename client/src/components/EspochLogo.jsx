import React, { useState } from 'react';

export function EspochLogo({ className = 'h-10', variant = 'full', light = false }) {
  const [imgError, setImgError] = useState(false);

  // Logo oficial de la Carrera de Marketing ESPOCH (Isotipo 3D MKT o personalizable en public/brand/)
  const logoSrc = '/brand/logo-mark.jpg';

  if (variant === 'monogram') {
    return (
      <div className={`flex items-center justify-center rounded-xl overflow-hidden shadow-sm aspect-square border border-[#A60809]/30 bg-[#810404] ${className}`}>
        {!imgError ? (
          <img
            src={logoSrc}
            alt="Marketing ESPOCH"
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#A60809] to-[#810404] text-white flex items-center justify-center text-sm font-extrabold">
            M
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3 select-none ${className}`}>
      {/* Isotipo Oficial de la Carrera de Marketing ESPOCH */}
      <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shadow-[#A60809]/20 flex-shrink-0 border border-[#A60809]/30 bg-[#810404] flex items-center justify-center">
        {!imgError ? (
          <img
            src={logoSrc}
            alt="Logo Marketing ESPOCH"
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#A60809] via-[#810404] to-[#610202] p-1.5 flex items-center justify-center text-white">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 19V5l9 8 9-8v14" />
              <path d="M12 13v8" />
            </svg>
          </div>
        )}
      </div>

      {/* Denominación formal según jerarquía del Manual */}
      <div className="flex flex-col text-left leading-tight min-w-0">
        <div className="flex items-center space-x-1.5">
          <span className={`font-black tracking-wider text-sm sm:text-base uppercase ${light ? 'text-white' : 'text-[#810404]'}`}>
            ESPOCH
          </span>
          <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#A60809]/10 text-[#A60809] border border-[#A60809]/20 tracking-normal uppercase">
            FADE
          </span>
        </div>
        <span className={`text-[11px] sm:text-xs font-bold tracking-tight truncate hidden xs:inline sm:inline ${light ? 'text-slate-200' : 'text-slate-800'}`}>
          Carrera de Marketing
        </span>
      </div>
    </div>
  );
}

export default EspochLogo;
