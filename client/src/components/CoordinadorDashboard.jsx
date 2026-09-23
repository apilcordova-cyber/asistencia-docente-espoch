import React, { useState, useEffect } from 'react';
import { Sun, CheckCircle2, AlertTriangle, Clock, RefreshCw, Award, Users, BookOpen } from 'lucide-react';
import { adminAPI } from '../api';

export default function CoordinadorDashboard({ onNavigateTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Control de Activación Permanente del Sistema
  const [shiftControl, setShiftControl] = useState({
    shift_morning_active: 1,
    shift_afternoon_active: 1,
    shift_mode: 'LIBRE',
    last_activation_morning: null,
    last_activation_afternoon: null
  });
  const [togglingShift, setTogglingShift] = useState(null);
  const [shiftMsg, setShiftMsg] = useState('');
  const [approvingAll, setApprovingAll] = useState(false);

  const cargarDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const [resDash, resShift] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getShiftControl().catch(() => null)
      ]);
      setData(resDash);
      if (resShift) setShiftControl(resShift);
    } catch (err) {
      setError(err.message || 'Error al cargar el dashboard general');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleShift = async (shift, active) => {
    setTogglingShift(shift);
    setShiftMsg('');
    try {
      const res = await adminAPI.toggleShift(shift, active);
      if (res && res.settings) {
        setShiftControl(res.settings);
        const estadoTxt = active ? 'habilitado permanentemente' : 'pausado temporalmente';
        setShiftMsg(`¡Sistema de registro ${estadoTxt} por Coordinación!`);
        setTimeout(() => setShiftMsg(''), 4500);
      }
    } catch (err) {
      setShiftMsg(`Error: ${err.message}`);
    } finally {
      setTogglingShift(null);
    }
  };

  const handleApproveAllToday = async () => {
    if (!confirm('¿Deseas validar y activar oficialmente todas las asistencias registradas en el día de hoy?')) return;
    setApprovingAll(true);
    setShiftMsg('');
    try {
      const res = await adminAPI.approveAllToday();
      setShiftMsg(res.message || 'Asistencias validadas exitosamente por Coordinación');
      await cargarDashboard();
      setTimeout(() => setShiftMsg(''), 4500);
    } catch (err) {
      setShiftMsg(`Error: ${err.message}`);
    } finally {
      setApprovingAll(false);
    }
  };

  useEffect(() => {
    cargarDashboard();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[#D7D6D7]/60 p-12 text-center">
        <div className="w-10 h-10 border-4 border-[#A60809]/20 border-t-[#A60809] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 font-medium text-sm">Cargando indicadores institucionales...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-sm">
        {error}
      </div>
    );
  }

  const { kpis, desglosePilares, docentesSinRegistroHoy } = data;
  const isSystemActive = shiftControl.shift_mode !== 'CERRADO' && (shiftControl.shift_morning_active !== 0 || shiftControl.shift_afternoon_active !== 0);

  const completados = kpis.completadosHoy || 0;
  const incompletos = kpis.incompletosHoy || 0;
  const pendientes = kpis.sinRegistroHoy || (kpis.docentesActivos - kpis.asistenciasHoy);

  return (
    <div className="space-y-6">
      {/* Bienvenida y fecha */}
      <div className="bg-white rounded-xl shadow-sm border border-[#D7D6D7]/60 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#A60809]">
              <span>Gestión Estratégica</span>
              <span>•</span>
              <span>Marketing ESPOCH 2026</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 mt-1">Supervisión y Control Académico</h1>
            <p className="text-sm text-gray-600">
              Monitoreo en tiempo real de cumplimiento horario, jornadas de 8.0 horas y distribución de funciones sustantivas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('asistencia')}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-white bg-[#A60809] hover:bg-[#810404] rounded-lg shadow-sm transition-colors cursor-pointer"
              title="Registrar mi jornada laboral de 8 horas reglamentarias"
            >
              <Clock className="w-3.5 h-3.5" />
              Registrar Mi Asistencia
            </button>
            <button
              onClick={cargarDashboard}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-[#D7D6D7] rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Actualizar Indicadores
            </button>
          </div>
        </div>
      </div>

      {/* PANEL DE CONTROL: ESTADO DEL SISTEMA Y VALIDACIÓN */}
      <div className="bg-white rounded-2xl border-2 border-[#A60809]/30 shadow-sm p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-700 text-white">
                Sistema Abierto 24/7
              </span>
              <span className="text-xs text-gray-500 font-medium">Sin necesidad de habilitación diaria manual</span>
            </div>
            <h2 className="text-xl font-black text-gray-900 mt-1">
              Registro Continuo de Jornada Docente (8.0 Horas)
            </h2>
            <p className="text-xs text-gray-600 mt-0.5">
              El sistema se mantiene activo permanentemente. Los docentes pueden ingresar y registrar sus 8 horas reglamentarias con total libertad.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApproveAllToday}
              disabled={approvingAll}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{approvingAll ? 'Validando...' : '✓ Validar y Activar Asistencias de Hoy'}</span>
            </button>
          </div>
        </div>

        {shiftMsg && (
          <div className="mt-4 p-3 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{shiftMsg}</span>
          </div>
        )}

        {/* TARJETA DE ESTADO AUTOMÁTICO */}
        <div className={`p-5 rounded-2xl border-2 transition-all mt-4 ${
          isSystemActive
            ? 'bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-white border-emerald-300 shadow-xs'
            : 'bg-rose-50/60 border-rose-200'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                isSystemActive ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'bg-rose-600 text-white'
              }`}>
                <Sun className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase ${
                    isSystemActive
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}>
                    {isSystemActive ? '● REGISTRO HABILITADO AUTOMÁTICAMENTE (TODO EL DÍA)' : '○ REGISTRO EN PAUSA'}
                  </span>
                </div>
                <h3 className="text-base font-black text-gray-900 mt-1">
                  Acceso Total para la Planta Docente
                </h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  Los docentes pueden ingresar en cualquier momento y reportar su distribución de funciones sustantivas hasta completar 8.0 horas.
                </p>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => handleToggleShift('daily', !isSystemActive)}
                disabled={togglingShift === 'daily'}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                  isSystemActive
                    ? 'bg-gray-100 hover:bg-rose-50 text-gray-700 hover:text-rose-700 border border-gray-200'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                }`}
              >
                {togglingShift === 'daily' 
                  ? 'Procesando...' 
                  : (isSystemActive ? 'Pausar Registro Temporalmente' : '✓ Reanudar Registro')}
              </button>
              <span className="text-[11px] text-emerald-800 font-bold">
                Operación continua sin bloqueos
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 KPIs Clave */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Docentes */}
        <div className="bg-white rounded-xl p-5 border border-[#D7D6D7]/60 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-[#A60809]" />
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Plantilla Docente</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-gray-900">{kpis.totalDocentes}</span>
            <span className="text-xs text-gray-500">profesores activos</span>
          </div>
          <div className="mt-3 text-xs text-gray-500 flex items-center justify-between border-t pt-2 border-gray-100">
            <span>Jornada diaria</span>
            <span className="font-semibold text-gray-700">8.0h reglamentarias</span>
          </div>
        </div>

        {/* KPI 2: Asistencia Hoy */}
        <div className="bg-white rounded-xl p-5 border border-[#D7D6D7]/60 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-emerald-600" />
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Asistencias Registradas Hoy</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-gray-900">{kpis.asistenciasHoy}</span>
            <span className="text-xs text-gray-500">de {kpis.totalDocentes} docentes</span>
          </div>
          <div className="mt-3 text-xs flex items-center justify-between border-t pt-2 border-gray-100">
            <span className="text-gray-500">Sin registro hoy:</span>
            <span className={`font-bold ${pendientes > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {pendientes} pendientes
            </span>
          </div>
        </div>

        {/* KPI 3: Horas Mes */}
        <div className="bg-white rounded-xl p-5 border border-[#D7D6D7]/60 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-[#810404]" />
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Horas Mes</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-gray-900">{kpis.horasMes.toFixed(1)}</span>
            <span className="text-xs text-gray-500">horas acumuladas</span>
          </div>
          <div className="mt-3 text-xs text-gray-500 flex items-center justify-between border-t pt-2 border-gray-100">
            <span>Promedio por docente:</span>
            <span className="font-semibold text-gray-700">
              {kpis.totalDocentes > 0 ? (kpis.horasMes / kpis.totalDocentes).toFixed(1) : 0}h
            </span>
          </div>
        </div>

        {/* KPI 4: Cumplimiento */}
        <div className="bg-white rounded-xl p-5 border border-[#D7D6D7]/60 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-[#C91C1E]" />
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cumplimiento Global</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-gray-900">{kpis.tasaCumplimiento}%</span>
            <span className="text-xs text-gray-500">del objetivo</span>
          </div>
          <div className="mt-3 text-xs text-gray-500 flex items-center justify-between border-t pt-2 border-gray-100">
            <span>Fórmula:</span>
            <span className="font-semibold text-gray-700">8.0h x 20 días</span>
          </div>
        </div>
      </div>

      {/* Distribución por Funciones Sustantivas y Cumplimiento de Horas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pilares Académicos */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#D7D6D7]/60 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Distribución por Funciones Sustantivas</h2>
              <p className="text-xs text-gray-500">Horas acumuladas reportadas en el mes actual</p>
            </div>
            <span className="text-xs font-bold text-[#A60809] bg-[#A60809]/10 px-2.5 py-1 rounded-full">
              4 Pilares ESPOCH
            </span>
          </div>

          {/* Tarjetas de Pilares */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 rounded-full bg-[#A60809]" />
                <span className="text-xs font-bold text-gray-700">Docencia</span>
              </div>
              <p className="text-2xl font-black text-gray-900">{desglosePilares.docencia.toFixed(1)}h</p>
              <span className="text-[11px] text-gray-500">
                {kpis.horasMes > 0 ? ((desglosePilares.docencia / kpis.horasMes) * 100).toFixed(1) : 0}% del total
              </span>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 rounded-full bg-[#810404]" />
                <span className="text-xs font-bold text-gray-700">Vinculación</span>
              </div>
              <p className="text-2xl font-black text-gray-900">{desglosePilares.vinculacion.toFixed(1)}h</p>
              <span className="text-[11px] text-gray-500">
                {kpis.horasMes > 0 ? ((desglosePilares.vinculacion / kpis.horasMes) * 100).toFixed(1) : 0}% del total
              </span>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 rounded-full bg-[#C91C1E]" />
                <span className="text-xs font-bold text-gray-700">Investigación</span>
              </div>
              <p className="text-2xl font-black text-gray-900">{desglosePilares.investigacion.toFixed(1)}h</p>
              <span className="text-[11px] text-gray-500">
                {kpis.horasMes > 0 ? ((desglosePilares.investigacion / kpis.horasMes) * 100).toFixed(1) : 0}% del total
              </span>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-600" />
                <span className="text-xs font-bold text-gray-700">Gestión Acad.</span>
              </div>
              <p className="text-2xl font-black text-gray-900">{desglosePilares.gestion.toFixed(1)}h</p>
              <span className="text-[11px] text-gray-500">
                {kpis.horasMes > 0 ? ((desglosePilares.gestion / kpis.horasMes) * 100).toFixed(1) : 0}% del total
              </span>
            </div>
          </div>

          {/* Barra de Distribución Proporcional */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-gray-600">Balance Proporcional de Carga Horaria</span>
            <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex">
              {kpis.horasMes > 0 ? (
                <>
                  <div
                    style={{ width: `${(desglosePilares.docencia / kpis.horasMes) * 100}%` }}
                    className="bg-[#A60809] h-full"
                    title={`Docencia: ${desglosePilares.docencia.toFixed(1)}h`}
                  />
                  <div
                    style={{ width: `${(desglosePilares.vinculacion / kpis.horasMes) * 100}%` }}
                    className="bg-[#810404] h-full"
                    title={`Vinculación: ${desglosePilares.vinculacion.toFixed(1)}h`}
                  />
                  <div
                    style={{ width: `${(desglosePilares.investigacion / kpis.horasMes) * 100}%` }}
                    className="bg-[#C91C1E] h-full"
                    title={`Investigación: ${desglosePilares.investigacion.toFixed(1)}h`}
                  />
                  <div
                    style={{ width: `${(desglosePilares.gestion / kpis.horasMes) * 100}%` }}
                    className="bg-gray-600 h-full"
                    title={`Gestión: ${desglosePilares.gestion.toFixed(1)}h`}
                  />
                </>
              ) : (
                <div className="w-full bg-gray-200 h-full" />
              )}
            </div>
          </div>
        </div>

        {/* ESTADO DE CUMPLIMIENTO DE HORAS (8.0H) HOY (Reemplaza a Jornadas) */}
        <div className="bg-white rounded-xl border border-[#D7D6D7]/60 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-gray-900">Cumplimiento de Horas Hoy</h2>
              <span className="text-xs font-bold text-[#A60809] bg-[#A60809]/10 px-2.5 py-0.5 rounded-full">
                Meta: 8.0 hrs
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-4">Verificación del cumplimiento de la jornada laboral diaria</p>

            <div className="space-y-3">
              {/* Con 8.0h completadas */}
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-950 block">Jornadas Completas (8.0h)</span>
                    <span className="text-[11px] text-emerald-700 font-medium">Cumplimiento reglamentario</span>
                  </div>
                </div>
                <span className="text-lg font-black text-emerald-900 font-mono">
                  {completados}
                </span>
              </div>

              {/* Con horas incompletas */}
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-amber-950 block">Horas Incompletas (&lt; 8.0h)</span>
                    <span className="text-[11px] text-amber-700 font-medium">Reportaron menos de 8 horas</span>
                  </div>
                </div>
                <span className="text-lg font-black text-amber-900 font-mono">
                  {incompletos}
                </span>
              </div>

              {/* Pendientes de registrar hoy */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center font-bold">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Pendientes de Registrar</span>
                    <span className="text-[11px] text-slate-500 font-medium">Docentes activos sin registro</span>
                  </div>
                </div>
                <span className="text-lg font-black text-slate-900 font-mono">
                  {pendientes}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <button
              onClick={() => onNavigateTab && onNavigateTab('supervision')}
              className="text-xs font-bold text-[#A60809] hover:underline cursor-pointer flex items-center justify-center gap-1 mx-auto"
            >
              <span>Ver Detalle en Supervisión Diaria</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alerta de Docentes Sin Asistencia Hoy */}
      <div className="bg-white rounded-xl border border-[#D7D6D7]/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#D7D6D7]/60 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <h2 className="text-sm font-bold text-gray-900">
              Docentes Sin Registro en la Jornada de Hoy ({docentesSinRegistroHoy.length})
            </h2>
          </div>
          <span className="text-xs text-gray-500">
            Supervisión diaria automática
          </span>
        </div>

        {docentesSinRegistroHoy.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-xs font-medium">
            ¡Excelente! Todos los docentes han completado su registro de asistencia de hoy.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {docentesSinRegistroHoy.map((doc) => (
              <div key={doc.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 transition-colors">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{doc.nombres || doc.nombre} {doc.apellidos || ''}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <span className="font-mono">CI: {doc.cedula}</span>
                    <span>•</span>
                    <span>{doc.email || doc.email_institucional}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 font-semibold rounded-md border border-gray-200 font-mono">
                    Horario: {doc.start_time || '07:00'} a {doc.end_time || '15:00'} (8.0h)
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded">
                    Pendiente
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
