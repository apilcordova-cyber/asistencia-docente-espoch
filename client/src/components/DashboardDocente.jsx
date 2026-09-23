import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  BookOpen, 
  Share2, 
  FlaskConical, 
  Briefcase, 
  TrendingUp, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { getResumenMensual } from '../api';

export default function DashboardDocente({ profesorActivo, onIrARegistro, onIrAHojaOficial }) {
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
    if (!profesorActivo?.id) return;
    cargarResumen();
  }, [profesorActivo, mes]);

  const cargarResumen = async () => {
    setCargando(true);
    try {
      const data = await getResumenMensual(profesorActivo.id, mes);
      setResumen(data);
    } catch (err) {
      console.error('Error cargando resumen mensual:', err);
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
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* Barra de cabecera con selector de mes */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
              Analítica de Jornada
            </span>
            <span className="text-xs text-slate-500">Periodo Académico Activo</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">
            Dashboard y Resumen de Desempeño
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Distribución mensual para <strong className="text-slate-800">{profesorActivo?.nombre}</strong> ({profesorActivo?.departamento})
          </p>
        </div>

        {/* Selector de Mes */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <input 
              type="month" 
              value={mes} 
              onChange={(e) => setMes(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={onIrAHojaOficial}
            className="flex items-center px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-sm font-bold transition-all border border-indigo-200"
          >
            <FileText className="w-4 h-4 mr-1.5" />
            Ver Hoja Oficial
          </button>
        </div>
      </div>

      {cargando ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
          <Clock className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
          Cargando indicadores de {formatearMes(mes)}...
        </div>
      ) : (
        <>
          {/* Tarjetas KPI Superiores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total Horas</span>
                <Clock className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-3xl font-black text-slate-900">
                {resumen?.total_horas || 0} <span className="text-sm font-semibold text-slate-500">hrs</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Acumuladas en {formatearMes(mes)}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Días Registrados</span>
                <Calendar className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-black text-slate-900">
                {resumen?.dias_registrados || 0} <span className="text-sm font-semibold text-slate-500">días</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Jornadas laborales reportadas</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Promedio Diario</span>
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-3xl font-black text-slate-900">
                {resumen?.promedio_diario || 0} <span className="text-sm font-semibold text-slate-500">hrs/día</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Objetivo: {profesorActivo?.horas_diarias} hrs/día</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Cumplimiento</span>
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-3xl font-black text-emerald-600">
                {resumen?.dias_registrados > 0 ? '100%' : '0%'}
              </div>
              <p className="text-xs text-slate-500 mt-1">Sin desfaces en la jornada</p>
            </div>

          </div>

          {/* Gráfico y Desglose de las 4 Funciones Sustantivas */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Distribución de Tiempo por Función Sustantiva
              </h3>
              <p className="text-xs text-slate-500">
                Porcentaje de dedicación exigido por la Ley de Educación Superior y comités de acreditación.
              </p>
            </div>

            {/* Barras de distribución horizontal */}
            <div className="w-full bg-slate-100 h-6 rounded-xl overflow-hidden flex shadow-inner">
              <div 
                style={{ width: `${resumen?.pct_docencia || 0}%` }} 
                className="bg-blue-600 h-full flex items-center justify-center text-white text-[10px] font-bold"
                title={`Docencia: ${resumen?.pct_docencia}%`}
              >
                {resumen?.pct_docencia > 10 && `${resumen?.pct_docencia}%`}
              </div>
              <div 
                style={{ width: `${resumen?.pct_vinculacion || 0}%` }} 
                className="bg-emerald-600 h-full flex items-center justify-center text-white text-[10px] font-bold"
                title={`Vinculación: ${resumen?.pct_vinculacion}%`}
              >
                {resumen?.pct_vinculacion > 8 && `${resumen?.pct_vinculacion}%`}
              </div>
              <div 
                style={{ width: `${resumen?.pct_investigacion || 0}%` }} 
                className="bg-purple-600 h-full flex items-center justify-center text-white text-[10px] font-bold"
                title={`Investigación: ${resumen?.pct_investigacion}%`}
              >
                {resumen?.pct_investigacion > 8 && `${resumen?.pct_investigacion}%`}
              </div>
              <div 
                style={{ width: `${resumen?.pct_gestion || 0}%` }} 
                className="bg-amber-600 h-full flex items-center justify-center text-white text-[10px] font-bold"
                title={`Gestión: ${resumen?.pct_gestion}%`}
              >
                {resumen?.pct_gestion > 8 && `${resumen?.pct_gestion}%`}
              </div>
            </div>

            {/* Tarjetas comparativas de los 4 Pilares */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50">
                <div className="flex items-center space-x-2 text-blue-700 font-bold text-sm mb-1">
                  <BookOpen className="w-4 h-4" />
                  <span>Docencia</span>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {resumen?.total_docencia || 0} <span className="text-xs font-bold text-slate-500">hrs</span>
                </div>
                <div className="text-xs font-semibold text-blue-700 mt-1">
                  {resumen?.pct_docencia || 0}% del tiempo total
                </div>
              </div>

              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                <div className="flex items-center space-x-2 text-emerald-700 font-bold text-sm mb-1">
                  <Share2 className="w-4 h-4" />
                  <span>Vinculación</span>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {resumen?.total_vinculacion || 0} <span className="text-xs font-bold text-slate-500">hrs</span>
                </div>
                <div className="text-xs font-semibold text-emerald-700 mt-1">
                  {resumen?.pct_vinculacion || 0}% del tiempo total
                </div>
              </div>

              <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50">
                <div className="flex items-center space-x-2 text-purple-700 font-bold text-sm mb-1">
                  <FlaskConical className="w-4 h-4" />
                  <span>Investigación</span>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {resumen?.total_investigacion || 0} <span className="text-xs font-bold text-slate-500">hrs</span>
                </div>
                <div className="text-xs font-semibold text-purple-700 mt-1">
                  {resumen?.pct_investigacion || 0}% del tiempo total
                </div>
              </div>

              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50">
                <div className="flex items-center space-x-2 text-amber-700 font-bold text-sm mb-1">
                  <Briefcase className="w-4 h-4" />
                  <span>Gestión</span>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {resumen?.total_gestion || 0} <span className="text-xs font-bold text-slate-500">hrs</span>
                </div>
                <div className="text-xs font-semibold text-amber-700 mt-1">
                  {resumen?.pct_gestion || 0}% del tiempo total
                </div>
              </div>

            </div>
          </div>

          {/* Tabla de registros detallados del mes */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Bitácora de Asistencias de {formatearMes(mes)}
                </h3>
                <p className="text-xs text-slate-500">Detalle de marcaciones y actividades</p>
              </div>
              <button
                onClick={onIrARegistro}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all"
              >
                + Nuevo Registro Diario
              </button>
            </div>

            {resumen?.asistencias && resumen.asistencias.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                      <th className="py-2.5 px-3">Fecha</th>
                      <th className="py-2.5 px-3">Entrada / Salida</th>
                      <th className="py-2.5 px-3">Docencia</th>
                      <th className="py-2.5 px-3">Vinculación</th>
                      <th className="py-2.5 px-3">Investigación</th>
                      <th className="py-2.5 px-3">Gestión</th>
                      <th className="py-2.5 px-3">Total</th>
                      <th className="py-2.5 px-3">Actividades Reportadas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {resumen.asistencias.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/80 transition-all">
                        <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">{a.fecha}</td>
                        <td className="py-3 px-3 text-slate-600 text-xs whitespace-nowrap">{a.hora_entrada} - {a.hora_salida}</td>
                        <td className="py-3 px-3 font-semibold text-blue-700">{a.horas_docencia}h</td>
                        <td className="py-3 px-3 font-semibold text-emerald-700">{a.horas_vinculacion}h</td>
                        <td className="py-3 px-3 font-semibold text-purple-700">{a.horas_investigacion}h</td>
                        <td className="py-3 px-3 font-semibold text-amber-700">{a.horas_gestion}h</td>
                        <td className="py-3 px-3 font-bold text-slate-900">{a.total_horas}h</td>
                        <td className="py-3 px-3 text-xs text-slate-600 max-w-xs truncate" title={a.detalle_actividades}>
                          {a.detalle_actividades || 'Sin descripción'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No hay registros para este mes todavía</p>
                <p className="text-xs text-slate-500 mt-1">Comienza registrando tu asistencia en la pestaña "Registro Diario".</p>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
}
