import React, { useState, useEffect } from 'react';
import { Sun, Moon, CheckCircle2, AlertTriangle, ShieldCheck, Clock, Lock, RefreshCw } from 'lucide-react';
import { adminAPI } from '../api';

export default function CoordinadorDashboard({ onNavigateTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Control de Activación de Turnos (Mañana y Tarde)
  const [shiftControl, setShiftControl] = useState({
    shift_morning_active: 1,
    shift_afternoon_active: 1,
    shift_mode: 'COORDINADOR',
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
        const shiftNombre = shift === 'morning' ? 'Turno Matutino' : 'Turno Vespertino';
        setShiftMsg(`¡${shiftNombre} ${active ? 'activado' : 'cerrado'} exitosamente por Coordinación!`);
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

  const { kpis, desglosePilares, distribucionJornadas, docentesSinRegistroHoy } = data;

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
              onClick={cargarDashboard}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-[#D7D6D7] rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Actualizar Indicadores
            </button>
          </div>
        </div>
      </div>

      {/* PANEL DE CONTROL MAESTRO: ACTIVACIÓN DE TURNOS POR EL COORDINADOR */}
      <div className="bg-white rounded-2xl border-2 border-[#A60809]/30 shadow-sm p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#A60809] text-white">
                Activación por el Coordinador
              </span>
              <span className="text-xs text-gray-500 font-medium">Control en Tiempo Real</span>
            </div>
            <h2 className="text-xl font-black text-gray-900 mt-1">
              Control de Habilitación de Turnos (Mañana / Tarde)
            </h2>
            <p className="text-xs text-gray-600 mt-0.5">
              Como Coordinador de Carrera, tú tienes la llave de activación para permitir que los docentes registren su jornada en cada franja horaria.
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* CONTROL TURNO MATUTINO */}
          <div className={`p-4 rounded-xl border-2 transition-all ${
            shiftControl.shift_morning_active === 1
              ? 'bg-emerald-50/50 border-emerald-300 shadow-xs'
              : 'bg-gray-50 border-gray-200 opacity-90'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className={`p-2.5 rounded-xl ${
                  shiftControl.shift_morning_active === 1 ? 'bg-emerald-600 text-white shadow-xs' : 'bg-gray-300 text-gray-600'
                }`}>
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500">Franja 07h00 a 13h00</span>
                  <h3 className="text-base font-black text-gray-900">1. Turno Matutino</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      shiftControl.shift_morning_active === 1
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}>
                      {shiftControl.shift_morning_active === 1 ? '● ACTIVADO POR COORDINACIÓN' : '○ CERRADO / INACTIVO'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggleShift('morning', shiftControl.shift_morning_active !== 1)}
                disabled={togglingShift === 'morning'}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer ${
                  shiftControl.shift_morning_active === 1
                    ? 'bg-rose-700 hover:bg-rose-800 text-white'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                }`}
              >
                {togglingShift === 'morning' ? 'Procesando...' : (shiftControl.shift_morning_active === 1 ? 'Cerrar Turno' : 'Activar Turno')}
              </button>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-200/60 flex items-center justify-between text-[11px] text-gray-500">
              <span>Habilita a los docentes a registrar su jornada matutina (franja 07h00 a 13h00, combinable con la tarde).</span>
              {shiftControl.last_activation_morning && (
                <span>Último cambio: {new Date(shiftControl.last_activation_morning).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              )}
            </div>
          </div>

          {/* CONTROL TURNO VESPERTINO */}
          <div className={`p-4 rounded-xl border-2 transition-all ${
            shiftControl.shift_afternoon_active === 1
              ? 'bg-emerald-50/50 border-emerald-300 shadow-xs'
              : 'bg-gray-50 border-gray-200 opacity-90'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className={`p-2.5 rounded-xl ${
                  shiftControl.shift_afternoon_active === 1 ? 'bg-indigo-600 text-white shadow-xs' : 'bg-gray-300 text-gray-600'
                }`}>
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500">Franja 15h00 a 21h00</span>
                  <h3 className="text-base font-black text-gray-900">2. Turno Vespertino</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      shiftControl.shift_afternoon_active === 1
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}>
                      {shiftControl.shift_afternoon_active === 1 ? '● ACTIVADO POR COORDINACIÓN' : '○ CERRADO / INACTIVO'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggleShift('afternoon', shiftControl.shift_afternoon_active !== 1)}
                disabled={togglingShift === 'afternoon'}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer ${
                  shiftControl.shift_afternoon_active === 1
                    ? 'bg-rose-700 hover:bg-rose-800 text-white'
                    : 'bg-indigo-700 hover:bg-indigo-800 text-white'
                }`}
              >
                {togglingShift === 'afternoon' ? 'Procesando...' : (shiftControl.shift_afternoon_active === 1 ? 'Cerrar Turno' : 'Activar Turno')}
              </button>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-200/60 flex items-center justify-between text-[11px] text-gray-500">
              <span>Habilita a los docentes a completar sus horas vespertinas (franja 15h00 a 21h00) y consolidar las 8h.</span>
              {shiftControl.last_activation_afternoon && (
                <span>Último cambio: {new Date(shiftControl.last_activation_afternoon).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              )}
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
            <span>En jornada combinable</span>
            <span className="font-semibold text-gray-700">8.0h reglamentarias</span>
          </div>
        </div>

        {/* KPI 2: Asistencia Hoy */}
        <div className="bg-white rounded-xl p-5 border border-[#D7D6D7]/60 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-emerald-600" />
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Asistencia Registrada Hoy</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-gray-900">{kpis.asistenciasHoy}</span>
            <span className="text-xs text-gray-500">de {kpis.totalDocentes} docentes</span>
          </div>
          <div className="mt-3 text-xs flex items-center justify-between border-t pt-2 border-gray-100">
            <span className="text-gray-500">Sin registro hoy:</span>
            <span className={`font-bold ${docentesSinRegistroHoy.length > 0 ? 'text-[#A60809]' : 'text-emerald-700'}`}>
              {docentesSinRegistroHoy.length} docentes
            </span>
          </div>
        </div>

        {/* KPI 3: Horas Totales Mes */}
        <div className="bg-white rounded-xl p-5 border border-[#D7D6D7]/60 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-[#810404]" />
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Horas Reportadas Mes</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-gray-900">
              {kpis.horasMes.toFixed(1)}<span className="text-lg font-normal text-gray-600">h</span>
            </span>
          </div>
          <div className="mt-3 text-xs text-gray-500 flex items-center justify-between border-t pt-2 border-gray-100">
            <span>Total acumulado carrera</span>
            <span className="font-semibold text-gray-700">Mes actual</span>
          </div>
        </div>

        {/* KPI 4: Tasa de Cumplimiento Promedio */}
        <div className="bg-white rounded-xl p-5 border border-[#D7D6D7]/60 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-[#C91C1E]" />
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cumplimiento Global</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-[#A60809]">
              {kpis.tasaCumplimiento.toFixed(1)}%
            </span>
          </div>
          <div className="mt-3 text-xs text-gray-500 flex items-center justify-between border-t pt-2 border-gray-100">
            <span>Base reglamentaria:</span>
            <span className="font-semibold text-gray-700">8.0h / día</span>
          </div>
        </div>
      </div>

      {/* Distribución por Funciones Sustantivas y Jornadas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Desglose de Horas del Mes */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#D7D6D7]/60 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Distribución de Horas por Función Sustantiva</h2>
              <p className="text-xs text-gray-500">Consolidado general de horas docentes en el período activo</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
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

        {/* Jornadas Oficiales Marketing */}
        <div className="bg-white rounded-xl border border-[#D7D6D7]/60 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Jornadas Institucionales</h2>
            <p className="text-xs text-gray-500 mb-4">Estructura horaria de Marketing ESPOCH</p>

            <div className="space-y-3">
              {distribucionJornadas.map((j) => (
                <div key={j.id} className="p-3 rounded-lg border border-[#D7D6D7]/60 bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900">{j.name}</span>
                    <span className="text-xs font-bold text-[#A60809] px-2 py-0.5 bg-[#A60809]/10 rounded">
                      {j.count} docentes
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1 flex items-center justify-between">
                    <span>Horario: {j.start_time} - {j.end_time}</span>
                    <span>{j.hours_per_day} horas base</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <button
              onClick={() => onNavigateTab && onNavigateTab('docentes')}
              className="text-xs font-bold text-[#A60809] hover:underline"
            >
              Administrar Asignaciones de Jornada &rarr;
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
                  <h3 className="text-sm font-bold text-gray-900">{doc.nombres} {doc.apellidos}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <span className="font-mono">CI: {doc.cedula}</span>
                    <span>•</span>
                    <span>{doc.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 font-semibold rounded-md border border-gray-200">
                    {doc.schedule_name || 'Sin Jornada'} ({doc.start_time || '07:00'} - {doc.end_time || '13:00'})
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
