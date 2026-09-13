import React from 'react';

export function EspochLogo({ className = 'h-10', variant = 'full', light = false }) {
  if (variant === 'monogram') {
    return (
      <div className={`flex items-center justify-center font-black rounded-xl bg-gradient-to-br from-[#A60809] to-[#810404] text-white shadow-sm aspect-square ${className}`}>
        <span className="tracking-tighter font-extrabold text-sm">M</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3 select-none ${className}`}>
      {/* Símbolo geométrico institucional de Marketing ESPOCH */}
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A60809] via-[#810404] to-[#610202] p-1.5 flex items-center justify-center text-white shadow-md shadow-[#A60809]/20 flex-shrink-0 border border-[#C91C1E]/30">
        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Geometría dinámica M + Crecimiento */}
          <path d="M3 19V5l9 8 9-8v14" />
          <path d="M12 13v8" />
        </svg>
      </div>

      {/* Denominación formal según jerarquía del Manual */}
      <div className="flex flex-col text-left leading-tight">
        <div className="flex items-center space-x-1.5">
          <span className={`font-black tracking-wider text-base uppercase ${light ? 'text-white' : 'text-[#810404]'}`}>
            ESPOCH
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#A60809]/10 text-[#A60809] border border-[#A60809]/20 tracking-normal uppercase">
            FADE
          </span>
        </div>
        <span className={`text-xs font-bold tracking-tight ${light ? 'text-slate-200' : 'text-slate-800'}`}>
          Carrera de Marketing
        </span>
      </div>
    </div>
  );
}

export default EspochLogo;
