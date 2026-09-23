import React, { useState, useEffect } from 'react';
import { adminAPI } from '../api';
import { CheckCircle2, AlertTriangle, Clock, Calendar, Filter, RefreshCw, Lock, Unlock } from 'lucide-react';

const getEcuadorToday = () => {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil' }).format(new Date());
  } catch (e) {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
};

export default function CoordinadorSupervision() {
  const hoyStr = getEcuadorToday();
  const [fecha, setFecha] = useState(hoyStr);
  const [filtroCumplimiento, setFiltroCumplimiento] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unlockingId, setUnlockingId] = useState(null);

  const formatHoraRegistro = (timestamp) => {
    if (!timestamp) return '--:--';
    try {
      let iso = timestamp;
      if (typeof timestamp === 'string') {
        if (!timestamp.includes('T')) {
          iso = timestamp.replace(' ', 'T') + 'Z';
        } else if (!timestamp.endsWith('Z')) {
          iso = timestamp + 'Z';
        }
      }
      const d = new Date(iso);
      if (isNaN(d.getTime())) return timestamp;

      const hoyEcuador = getEcuadorToday();
      const fechaRegistro = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil' }).format(d);
      const horaStr = d.toLocaleTimeString('es-EC', { timeZone: 'America/Guayaquil', hour: '2-digit', minute: '2-digit', hour12: false });

      if (fechaRegistro === hoyEcuador) {
        return `Hoy ${horaStr}`;
      } else {
        const [, m, dia] = fechaRegistro.split('-');
        return `${dia}/${m} a las ${horaStr}`;
      }
    } catch (e) {
      return timestamp;
    }
  };

  const cargarFiltrosYRegistros = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { fecha, date: fecha };
      if (filtroCumplimiento) {
        params.status = filtroCumplimiento;
      }
      const recRes = await adminAPI.getAttendanceRecords(params);
      setRecords(recRes || []);
    } catch (err) {
      setError(err.message || 'Error al consultar registros de asistencia');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarFiltrosYRegistros();
  }, [fecha, filtroCumplimiento]);

  const handleUnlock = async (id, teacherName) => {
    if (!window.confirm(`¿Habilitar edición para el registro de ${teacherName}? Se otorgarán 48 horas adicionales para corrección.`)) {
      return;
    }
    try {
      setUnlockingId(id);
      await adminAPI.unlockAttendance(id);
      alert(`Registro desbloqueado con éxito para ${teacherName}`);
      cargarFiltrosYRegistros();
    } catch (err) {
      alert('Error al desbloquear registro: ' + err.message);
    } finally {
      setUnlockingId(null);
    }
  };

  const totalRegistrados = records.length;
  const completosCount = records.filter(r => (parseFloat(r.total_hours) || 0) >= 8.0).length;
  const incompletosCount = records.filter(r => (parseFloat(r.total_hours) || 0) < 8.0).length;

  return (
    <div className="space-y-6">
      {/* Cabecera y Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-[#D7D6D7]/60 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#A60809]">
              <span>Fiscalización Diaria</span>
              <span>•</span>
              <span>Marketing ESPOCH</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 mt-1">Supervisión y Control de Asistencia</h1>
            <p className="text-sm text-gray-600">
              Verifique los horarios reportados, cumplimiento de las 8.0 horas diarias y gestione desbloqueos excepcionales.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-50 border border-[#D7D6D7] rounded-lg px-3 py-1.5">
              <Calendar className="w-4 h-4 text-gray-500" />
              <label className="text-xs font-semibold text-gray-600">Fecha:</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="text-xs font-bold bg-transparent text-gray-800 focus:outline-none cursor-pointer"
              />
            </div>

            {/* Filtro por Cumplimiento de Horas (reemplaza a Jornada) */}
            <div className="flex items-center gap-2 bg-gray-50 border border-[#D7D6D7] rounded-lg px-3 py-1.5">
              <Filter className="w-4 h-4 text-gray-500" />
              <label className="text-xs font-semibold text-gray-600">Horas:</label>
              <select
                value={filtroCumplimiento}
                onChange={(e) => setFiltroCumplimiento(e.target.value)}
                className="text-xs font-bold bg-transparent text-gray-800 focus:outline-none cursor-pointer"
              >
                <option value="">Todas las marcaciones</option>
                <option value="COMPLETO">8.0h Completas ✅</option>
                <option value="INCOMPLETO">Horas Incompletas (&lt; 8.0h) ⚠️</option>
              </select>
            </div>

            <button
              type="button"
              onClick={cargarFiltrosYRegistros}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refrescar</span>
            </button>
          </div>
        </div>

        {/* Resumen Métrico Rápido de Cumplimiento */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-gray-100">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase">Docentes Registrados</span>
              <p className="text-xl font-black text-slate-900">{totalRegistrados}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-700 uppercase">Con 8.0h Completas</span>
              <p className="text-xl font-black text-emerald-900">{completosCount}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-200 flex items-center justify-center text-emerald-800">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-amber-700 uppercase">Con Horas Incompletas</span>
              <p className="text-xl font-black text-amber-900">{incompletosCount}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-200 flex items-center justify-center text-amber-800">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-xl border border-[#D7D6D7]/60 p-12 text-center">
          <div className="w-10 h-10 border-4 border-[#A60809]/20 border-t-[#A60809] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium text-sm">Consultando registros de asistencia...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-sm">
          {error}
        </div>
      )}

      {!loading && (
        <div className="bg-white rounded-xl shadow-sm border border-[#D7D6D7]/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-[#D7D6D7]/60 flex items-center justify-between bg-gray-50/50">
            <span className="text-xs font-bold text-gray-700">
              Registros encontrados para la fecha ({fecha}): <span className="text-[#A60809] font-black">{records.length}</span>
            </span>
            <span className="text-xs text-gray-500">
              Criterio oficial: 8.0 horas diarias
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-[#D7D6D7]/60 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Docente</th>
                  <th className="py-3 px-3">Horario Marcado</th>
                  <th className="py-3 px-3 text-right">Docencia</th>
                  <th className="py-3 px-3 text-right">Vinculación</th>
                  <th className="py-3 px-3 text-right">Investigación</th>
                  <th className="py-3 px-3 text-right">Gestión</th>
                  <th className="py-3 px-3 text-right font-bold">Total</th>
                  <th className="py-3 px-3 text-center">Cumplimiento</th>
                  <th className="py-3 px-3 text-center">Edición</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D7D6D7]/40">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="py-10 text-center text-gray-500 text-xs font-medium">
                      No se encontraron registros de asistencia para la fecha seleccionada ({fecha}).
                    </td>
                  </tr>
                ) : (
                  records.map((r) => {
                    const total = parseFloat(r.total_hours) || 0;
                    const esCompleto = total >= 8.0;
                    const faltante = (8.0 - total).toFixed(1);

                    return (
                      <tr key={r.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-gray-900 block">
                            {r.nombre || r.teacher_nombre || r.nombres || 'Docente'}
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="text-[11px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                              CI: {r.cedula || r.teacher_cedula || '--'}
                            </span>
                            {(r.created_at || r.updated_at) && (
                              <span 
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#810404] bg-[#A60809]/10 px-2 py-0.5 rounded border border-[#A60809]/20"
                                title={`Registrado en sistema: ${r.created_at || r.updated_at}`}
                              >
                                <Clock className="w-3 h-3 text-[#A60809]" />
                                <span>Registrado a las: {formatHoraRegistro(r.created_at || r.updated_at)}</span>
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-xs font-mono text-gray-700 whitespace-nowrap">
                          {r.check_in_time || r.check_in || '--:--'} {r.check_out_time || r.check_out ? `a ${r.check_out_time || r.check_out}` : ''}
                        </td>

                        <td className="py-3 px-3 text-xs text-right font-mono">{r.docencia_hours?.toFixed(1) || '0.0'}h</td>
                        <td className="py-3 px-3 text-xs text-right font-mono">{r.vinculacion_hours?.toFixed(1) || '0.0'}h</td>
                        <td className="py-3 px-3 text-xs text-right font-mono">{r.investigacion_hours?.toFixed(1) || '0.0'}h</td>
                        <td className="py-3 px-3 text-xs text-right font-mono">{r.gestion_hours?.toFixed(1) || '0.0'}h</td>

                        <td className="py-3 px-3 text-xs text-right font-black font-mono">
                          <span className={esCompleto ? 'text-emerald-700 font-bold' : 'text-[#A60809] font-bold'}>
                            {total.toFixed(1)}h
                          </span>
                        </td>

                        {/* Cumplimiento de 8.0 horas */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {esCompleto ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Completo (8.0h)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                              <span>Faltan {faltante}h</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          {r.is_locked ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600">
                              <Lock className="w-3 h-3" />
                              <span>Bloqueado</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              <Unlock className="w-3 h-3" />
                              <span>Habilitado</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {r.is_locked ? (
                            <button
                              type="button"
                              onClick={() => handleUnlock(r.id, r.nombre || r.teacher_nombre || 'Docente')}
                              disabled={unlockingId === r.id}
                              className="px-2.5 py-1 text-xs font-medium text-[#A60809] bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {unlockingId === r.id ? 'Desbloqueando...' : 'Desbloquear'}
                            </button>
                          ) : (
                            <span className="text-[11px] text-gray-400 italic">Abierto</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
