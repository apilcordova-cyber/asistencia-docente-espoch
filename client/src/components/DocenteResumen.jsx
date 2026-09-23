import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle2, BookOpen, Share2, FlaskConical, Briefcase, TrendingUp, AlertCircle, FileText } from 'lucide-react';
import { getDocenteResumen } from '../api';

export default function DocenteResumen({ usuario, onIrAHoja }) {
  const currentMonthStr = (() => {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil' }).format(new Date()).substring(0, 7);
    } catch (e) {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
  })();
  const [mes, setMes] = useState(currentMonthStr);
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarResumen();
  }, [mes]);

  const cargarResumen = async () => {
    setCargando(true);
    try {
      const data = await getDocenteResumen(mes);
      setResumen(data);
    } catch (err) {
      console.error('Error al cargar resumen personal:', err);
    } finally {
      setCargando(false);
    }
  };

  const formatearMes = (mStr) => {
    const [y, m] = mStr.split('-');
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${meses[parseInt(m) - 1]} ${y}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      
      {/* Cabecera */}
      <div className="bg-white rounded-3xl p-6 border border-[#D7D6D7]/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#A60809]/10 text-[#A60809] border border-[#A60809]/20">
              Mi Resumen de Jornada
            </span>
            <span className="text-xs text-slate-500 font-medium">Marketing ESPOCH</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-1">
            Cumplimiento y Analítica Personal
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Docente: <strong className="text-slate-900">{usuario?.nombre}</strong> — Jornada: <strong className="text-[#A60809] font-bold">{usuario?.teacher?.schedule_name}</strong>
          </p>
        </div>

        {/* Selector de Mes */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-[#F8F9FA] border border-[#D7D6D7] px-3 py-1.5 rounded-2xl">
            <Calendar className="w-4 h-4 text-[#A60809]" />
            <input 
              type="month" 
              value={mes} 
              onChange={(e) => setMes(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-bold text-slate-900 focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={onIrAHoja}
            className="flex items-center px-4 py-2 bg-[#A60809]/10 hover:bg-[#A60809]/20 text-[#A60809] rounded-2xl text-xs font-bold transition-all border border-[#A60809]/20"
          >
            <FileText className="w-4 h-4 mr-1.5" />
            Ver mi Hoja Oficial
          </button>
        </div>
      </div>

      {cargando ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-3xl border border-[#D7D6D7]">
          <Clock className="w-8 h-8 animate-spin mx-auto text-[#A60809] mb-2" />
          Cargando indicadores de {formatearMes(mes)}...
        </div>
      ) : (
        <>
          {/* Tarjetas KPI Superiores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 rounded-3xl border border-[#D7D6D7]/80 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Total Horas</span>
                <Clock className="w-4 h-4 text-[#A60809]" />
              </div>
              <div className="text-3xl font-black text-slate-900">
                {resumen?.totalHoras || 0} <span className="text-sm font-semibold text-slate-400">hrs</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Horas en {formatearMes(mes)}</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#D7D6D7]/80 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Días Registrados</span>
                <Calendar className="w-4 h-4 text-slate-700" />
              </div>
              <div className="text-3xl font-black text-slate-900">
                {resumen?.diasRegistrados || 0} <span className="text-sm font-semibold text-slate-400">días</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Jornadas laborales reportadas</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#D7D6D7]/80 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Promedio Diario</span>
                <TrendingUp className="w-4 h-4 text-[#810404]" />
              </div>
              <div className="text-3xl font-black text-slate-900">
                {resumen?.promedioDiario || 0} <span className="text-sm font-semibold text-slate-400">hrs/día</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Meta diaria: {resumen?.expectedHoursDaily} hrs</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#D7D6D7]/80 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Cumplimiento</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-black text-emerald-700">
                {resumen?.porcentajeCumplimiento || 0}%
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {resumen?.diasRegistrados > 0 ? `${resumen.totalHoras}h de ${resumen.diasRegistrados * resumen.expectedHoursDaily}h esperadas` : 'Sin registros'}
              </p>
            </div>

          </div>

          {/* Distribución por las 4 Funciones Sustantivas */}
          <div className="bg-white rounded-3xl p-6 border border-[#D7D6D7]/80 shadow-xs space-y-5">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Distribución de Tiempo por Función Sustantiva
              </h3>
              <p className="text-xs text-slate-500">
                Porcentajes de dedicación en docencia, vinculación, investigación y gestión académica.
              </p>
            </div>

            {/* Barra horizontal en escala sobria ESPOCH */}
            <div className="w-full bg-[#ECEAEB] h-6 rounded-2xl overflow-hidden flex shadow-inner">
              <div 
                style={{ width: `${resumen?.totalesPorFuncion?.pctDocencia || 0}%` }} 
                className="bg-[#A60809] h-full flex items-center justify-center text-white text-[10px] font-bold"
                title={`Docencia: ${resumen?.totalesPorFuncion?.pctDocencia}%`}
              >
                {resumen?.totalesPorFuncion?.pctDocencia > 10 && `Doc: ${resumen?.totalesPorFuncion?.pctDocencia}%`}
              </div>
              <div 
                style={{ width: `${resumen?.totalesPorFuncion?.pctVinculacion || 0}%` }} 
                className="bg-slate-800 h-full flex items-center justify-center text-white text-[10px] font-bold"
                title={`Vinculación: ${resumen?.totalesPorFuncion?.pctVinculacion}%`}
              >
                {resumen?.totalesPorFuncion?.pctVinculacion > 8 && `Vinc: ${resumen?.totalesPorFuncion?.pctVinculacion}%`}
              </div>
              <div 
                style={{ width: `${resumen?.totalesPorFuncion?.pctInvestigacion || 0}%` }} 
                className="bg-[#810404] h-full flex items-center justify-center text-white text-[10px] font-bold"
                title={`Investigación: ${resumen?.totalesPorFuncion?.pctInvestigacion}%`}
              >
                {resumen?.totalesPorFuncion?.pctInvestigacion > 8 && `Inv: ${resumen?.totalesPorFuncion?.pctInvestigacion}%`}
              </div>
              <div 
                style={{ width: `${resumen?.totalesPorFuncion?.pctGestion || 0}%` }} 
                className="bg-slate-600 h-full flex items-center justify-center text-white text-[10px] font-bold"
                title={`Gestión: ${resumen?.totalesPorFuncion?.pctGestion}%`}
              >
                {resumen?.totalesPorFuncion?.pctGestion > 8 && `Gest: ${resumen?.totalesPorFuncion?.pctGestion}%`}
              </div>
            </div>

            {/* Tarjetas de las 4 funciones */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              
              <div className="p-4 rounded-2xl border border-[#A60809]/20 bg-[#A60809]/5">
                <div className="flex items-center space-x-2 text-[#810404] font-bold text-xs mb-1">
                  <BookOpen className="w-3.5 h-3.5 text-[#A60809]" />
                  <span>Docencia</span>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {resumen?.totalesPorFuncion?.docencia || 0} <span className="text-xs font-bold text-slate-400">hrs</span>
                </div>
                <div className="text-xs font-semibold text-[#A60809] mt-1">
                  {resumen?.totalesPorFuncion?.pctDocencia || 0}% de tu tiempo
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-300 bg-[#F8F9FA]">
                <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs mb-1">
                  <Share2 className="w-3.5 h-3.5 text-slate-800" />
                  <span>Vinculación</span>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {resumen?.totalesPorFuncion?.vinculacion || 0} <span className="text-xs font-bold text-slate-400">hrs</span>
                </div>
                <div className="text-xs font-semibold text-slate-700 mt-1">
                  {resumen?.totalesPorFuncion?.pctVinculacion || 0}% de tu tiempo
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-[#810404]/20 bg-[#810404]/5">
                <div className="flex items-center space-x-2 text-[#810404] font-bold text-xs mb-1">
                  <FlaskConical className="w-3.5 h-3.5 text-[#810404]" />
                  <span>Investigación</span>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {resumen?.totalesPorFuncion?.investigacion || 0} <span className="text-xs font-bold text-slate-400">hrs</span>
                </div>
                <div className="text-xs font-semibold text-[#810404] mt-1">
                  {resumen?.totalesPorFuncion?.pctInvestigacion || 0}% de tu tiempo
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-300 bg-[#F8F9FA]">
                <div className="flex items-center space-x-2 text-slate-700 font-bold text-xs mb-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-600" />
                  <span>Gestión</span>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {resumen?.totalesPorFuncion?.gestion || 0} <span className="text-xs font-bold text-slate-400">hrs</span>
                </div>
                <div className="text-xs font-semibold text-slate-600 mt-1">
                  {resumen?.totalesPorFuncion?.pctGestion || 0}% de tu tiempo
                </div>
              </div>

            </div>
          </div>

          {/* Tabla de registros del mes */}
          <div className="bg-white rounded-3xl p-6 border border-[#D7D6D7]/80 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Bitácora de Asistencias de {formatearMes(mes)}
            </h3>

            {resumen?.asistencias && resumen.asistencias.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#D7D6D7] text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Fecha</th>
                      <th className="py-2.5 px-3">Horario</th>
                      <th className="py-2.5 px-3">Docencia</th>
                      <th className="py-2.5 px-3">Vinculación</th>
                      <th className="py-2.5 px-3">Investigación</th>
                      <th className="py-2.5 px-3">Gestión</th>
                      <th className="py-2.5 px-3">Total</th>
                      <th className="py-2.5 px-3">Actividades Reportadas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ECEAEB]">
                    {resumen.asistencias.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/80 transition-all">
                        <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">{a.date}</td>
                        <td className="py-3 px-3 text-slate-600 text-xs font-mono whitespace-nowrap">{a.check_in} - {a.check_out}</td>
                        <td className="py-3 px-3 font-bold text-[#A60809]">{a.docencia_hours}h</td>
                        <td className="py-3 px-3 font-semibold text-slate-700">{a.vinculacion_hours}h</td>
                        <td className="py-3 px-3 font-semibold text-[#810404]">{a.investigacion_hours}h</td>
                        <td className="py-3 px-3 font-semibold text-slate-600">{a.gestion_hours}h</td>
                        <td className="py-3 px-3 font-black text-slate-900">{a.total_hours}h</td>
                        <td className="py-3 px-3 text-xs text-slate-600 max-w-xs truncate" title={a.activities_detail}>
                          {a.activities_detail || 'Sin descripción'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center bg-[#F8F9FA] rounded-2xl border border-dashed border-[#D7D6D7]">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No hay registros de asistencia para {formatearMes(mes)}</p>
                <p className="text-xs text-slate-500 mt-1">Registra tu primera asistencia desde la pestaña "Registro Diario".</p>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
}
