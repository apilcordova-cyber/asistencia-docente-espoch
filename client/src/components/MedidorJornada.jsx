import React from 'react';
import { CheckCircle2, AlertTriangle, Info, Sparkles } from 'lucide-react';

export default function MedidorJornada({
  horasDocencia,
  horasVinculacion,
  horasInvestigacion,
  horasGestion,
  jornadaObjetivo = 8.0
}) {
  const totalHoras = parseFloat((
    (parseFloat(horasDocencia) || 0) +
    (parseFloat(horasVinculacion) || 0) +
    (parseFloat(horasInvestigacion) || 0) +
    (parseFloat(horasGestion) || 0)
  ).toFixed(2));

  const diferencia = parseFloat((totalHoras - jornadaObjetivo).toFixed(2));
  const porcentaje = jornadaObjetivo > 0 ? Math.round((totalHoras / jornadaObjetivo) * 100) : 100;

  const isExact = diferencia === 0;
  const isLess = diferencia < 0;
  const isOver = diferencia > 0;

  return (
    <div className={`p-4 rounded-2xl border transition-all ${
      isExact 
        ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
        : isLess 
          ? 'bg-amber-50 border-amber-300 text-amber-950' 
          : 'bg-rose-50 border-rose-300 text-rose-950'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
        <div className="flex items-center space-x-2">
          {isExact && <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
          {isLess && <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />}
          {isOver && <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />}
          <span className="font-bold text-sm">
            {isExact && `¡Jornada de ${jornadaObjetivo} hrs cumplida con exactitud! (Habilitada para guardar)`}
            {isLess && `Faltan ${Math.abs(diferencia)}h para completar tu jornada de ${jornadaObjetivo} hrs (Botón bloqueado)`}
            {isOver && `Excede por ${diferencia}h. Debe ajustar a exactamente ${jornadaObjetivo} hrs (Botón bloqueado)`}
          </span>
        </div>
        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white/90 border ${
            isExact ? 'border-emerald-300 text-emerald-800' : isLess ? 'border-amber-300 text-amber-800' : 'border-rose-300 text-rose-800'
          }`}>
            {porcentaje}%
          </span>
          <span className="text-sm font-black tracking-tight">
            {totalHoras} <span className="text-xs font-normal">/</span> {jornadaObjetivo} hrs
          </span>
        </div>
      </div>

      {/* Barra de Progreso */}
      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${
            isExact ? 'bg-emerald-500' : isLess ? 'bg-amber-500' : 'bg-rose-500'
          }`}
          style={{ width: `${Math.min(100, (totalHoras / (jornadaObjetivo || 1)) * 100)}%` }}
        />
      </div>

      {/* Mini desglose porcentual de la jornada */}
      {totalHoras > 0 && (
        <div className="mt-2 flex items-center space-x-3 text-xs opacity-90 pt-1 flex-wrap">
          <span className="inline-flex items-center">
            <span className="w-2 h-2 rounded-full bg-[#A60809] mr-1" />
            Docencia: {horasDocencia}h ({Math.round((horasDocencia / totalHoras) * 100)}%)
          </span>
          <span className="inline-flex items-center">
            <span className="w-2 h-2 rounded-full bg-slate-800 mr-1" />
            Vinculación: {horasVinculacion}h ({Math.round((horasVinculacion / totalHoras) * 100)}%)
          </span>
          <span className="inline-flex items-center">
            <span className="w-2 h-2 rounded-full bg-[#810404] mr-1" />
            Investigación: {horasInvestigacion}h ({Math.round((horasInvestigacion / totalHoras) * 100)}%)
          </span>
          <span className="inline-flex items-center">
            <span className="w-2 h-2 rounded-full bg-slate-600 mr-1" />
            Gestión: {horasGestion}h ({Math.round((horasGestion / totalHoras) * 100)}%)
          </span>
        </div>
      )}
    </div>
  );
}
