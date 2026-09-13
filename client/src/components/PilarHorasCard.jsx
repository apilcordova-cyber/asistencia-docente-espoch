import React from 'react';
import { Plus, Minus } from 'lucide-react';

const colorStyles = {
  docencia: {
    border: 'border-[#A60809]/30 hover:border-[#A60809]',
    bg: 'bg-white',
    iconBg: 'bg-[#A60809]',
    text: 'text-[#810404]',
    btnBg: 'bg-white text-slate-700 border-[#D7D6D7] hover:bg-slate-50',
    btnActive: 'bg-[#A60809] text-white border-[#A60809]',
    inputBorder: 'border-[#D7D6D7] text-slate-900 focus:ring-[#A60809]'
  },
  vinculacion: {
    border: 'border-slate-300 hover:border-slate-400',
    bg: 'bg-white',
    iconBg: 'bg-slate-800',
    text: 'text-slate-800',
    btnBg: 'bg-white text-slate-700 border-[#D7D6D7] hover:bg-slate-50',
    btnActive: 'bg-slate-800 text-white border-slate-800',
    inputBorder: 'border-[#D7D6D7] text-slate-900 focus:ring-slate-800'
  },
  investigacion: {
    border: 'border-[#810404]/30 hover:border-[#810404]',
    bg: 'bg-white',
    iconBg: 'bg-[#810404]',
    text: 'text-[#810404]',
    btnBg: 'bg-white text-slate-700 border-[#D7D6D7] hover:bg-slate-50',
    btnActive: 'bg-[#810404] text-white border-[#810404]',
    inputBorder: 'border-[#D7D6D7] text-slate-900 focus:ring-[#810404]'
  },
  gestion: {
    border: 'border-slate-300 hover:border-slate-400',
    bg: 'bg-white',
    iconBg: 'bg-slate-600',
    text: 'text-slate-700',
    btnBg: 'bg-white text-slate-700 border-[#D7D6D7] hover:bg-slate-50',
    btnActive: 'bg-slate-700 text-white border-slate-700',
    inputBorder: 'border-[#D7D6D7] text-slate-900 focus:ring-slate-700'
  }
};

export default function PilarHorasCard({
  titulo,
  subtitulo,
  icon: Icon,
  color = 'blue',
  horas,
  setHoras,
  presets = [1, 2, 4]
}) {
  const styles = colorStyles[color] || colorStyles.blue;

  const ajustar = (delta) => {
    const nuevo = Math.max(0, Math.min(24, parseFloat(((horas || 0) + delta).toFixed(2))));
    setHoras(nuevo);
  };

  return (
    <div className={`p-4 rounded-xl border transition-all ${styles.border} ${styles.bg}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg text-white shadow-xs ${styles.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">{titulo}</h4>
            <p className="text-xs text-slate-500 line-clamp-1">{subtitulo}</p>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-2xl font-black ${styles.text}`}>
            {horas || 0}<span className="text-sm font-semibold ml-0.5">h</span>
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        {/* Stepper +/- */}
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => ajustar(-0.5)}
            className="w-9 h-9 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center justify-center font-bold transition-all active:scale-90 touch-manipulation cursor-pointer"
            title="Restar 0.5h"
          >
            <Minus className="w-4 h-4" />
          </button>
          <input
            type="number"
            step="0.5"
            min="0"
            max="24"
            value={horas}
            onChange={(e) => setHoras(parseFloat(e.target.value) || 0)}
            className={`w-14 sm:w-16 text-center font-black bg-white border rounded-xl py-1.5 text-sm sm:text-base focus:outline-none focus:ring-2 ${styles.inputBorder}`}
          />
          <button
            type="button"
            onClick={() => ajustar(0.5)}
            className="w-9 h-9 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center justify-center font-bold transition-all active:scale-90 touch-manipulation cursor-pointer"
            title="Sumar 0.5h"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Presets rápidos */}
        <div className="flex items-center space-x-1">
          {presets.map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setHoras(val)}
              className={`px-2.5 sm:px-3 py-1.5 text-xs rounded-xl font-bold border transition-all touch-manipulation cursor-pointer active:scale-95 ${
                horas === val ? styles.btnActive : styles.btnBg
              }`}
            >
              {val}h
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
