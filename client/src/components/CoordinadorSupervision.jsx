import React, { useState, useEffect } from 'react';
import { adminAPI } from '../api';

export default function CoordinadorSupervision() {
  const hoyStr = new Date().toISOString().split('T')[0];
  const [fecha, setFecha] = useState(hoyStr);
  const [scheduleId, setScheduleId] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unlockingId, setUnlockingId] = useState(null);

  const cargarFiltrosYRegistros = async () => {
    try {
      setLoading(true);
      setError(null);
      const [schedRes, recRes] = await Promise.all([
        adminAPI.getSchedules(),
        adminAPI.getAttendanceRecords({ date: fecha, schedule_id: scheduleId || undefined })
      ]);
      setSchedules(schedRes);
      setRecords(recRes);
    } catch (err) {
      setError(err.message || 'Error al consultar registros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarFiltrosYRegistros();
  }, [fecha, scheduleId]);

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
              Verifique los registros de cumplimiento diario, horas reportadas por actividad y gestione desbloqueos excepcionales.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-50 border border-[#D7D6D7] rounded-lg px-3 py-1.5">
              <label className="text-xs font-semibold text-gray-600">Fecha:</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="text-xs font-bold bg-transparent text-gray-800 focus:outline-none cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2 bg-gray-50 border border-[#D7D6D7] rounded-lg px-3 py-1.5">
              <label className="text-xs font-semibold text-gray-600">Jornada:</label>
              <select
                value={scheduleId}
                onChange={(e) => setScheduleId(e.target.value)}
                className="text-xs font-bold bg-transparent text-gray-800 focus:outline-none cursor-pointer"
              >
                <option value="">Todas las jornadas</option>
                {schedules.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.start_time} - {s.end_time})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={cargarFiltrosYRegistros}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors"
            >
              Refrescar
            </button>
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
          <div className="px-6 py-4 border-b border-[#D7D6D7]/60 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700">
              Registros encontrados para {fecha}: {records.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-[#D7D6D7]/60 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Docente</th>
                  <th className="py-3 px-3">Jornada</th>
                  <th className="py-3 px-3">Marcación</th>
                  <th className="py-3 px-3 text-right">Docencia</th>
                  <th className="py-3 px-3 text-right">Vinculación</th>
                  <th className="py-3 px-3 text-right">Investigación</th>
                  <th className="py-3 px-3 text-right">Gestión</th>
                  <th className="py-3 px-3 text-right font-bold">Total</th>
                  <th className="py-3 px-3 text-center">Edición</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D7D6D7]/40">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="py-8 text-center text-gray-500 text-xs font-medium">
                      No se registraron asistencias en la fecha seleccionada.
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-gray-900 block">{r.nombres} {r.apellidos}</span>
                        <span className="text-[11px] font-mono text-gray-500">CI: {r.cedula}</span>
                      </td>

                      <td className="py-3 px-3 text-xs text-gray-600 whitespace-nowrap">
                        {r.schedule_name || 'Sin asignar'}
                      </td>

                      <td className="py-3 px-3 text-xs font-mono text-gray-700 whitespace-nowrap">
                        {r.check_in_time || '--:--'} - {r.check_out_time || '--:--'}
                      </td>

                      <td className="py-3 px-3 text-xs text-right font-mono">{r.docencia_hours?.toFixed(1) || '0.0'}h</td>
                      <td className="py-3 px-3 text-xs text-right font-mono">{r.vinculacion_hours?.toFixed(1) || '0.0'}h</td>
                      <td className="py-3 px-3 text-xs text-right font-mono">{r.investigacion_hours?.toFixed(1) || '0.0'}h</td>
                      <td className="py-3 px-3 text-xs text-right font-mono">{r.gestion_hours?.toFixed(1) || '0.0'}h</td>

                      <td className="py-3 px-3 text-xs text-right font-bold font-mono">
                        <span className={r.total_hours >= 6 ? 'text-emerald-700' : 'text-[#A60809]'}>
                          {r.total_hours?.toFixed(1)}h
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {r.is_locked ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600">
                            Bloqueado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            Habilitado
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {r.is_locked ? (
                          <button
                            onClick={() => handleUnlock(r.id, `${r.nombres} ${r.apellidos}`)}
                            disabled={unlockingId === r.id}
                            className="px-2.5 py-1 text-xs font-medium text-[#A60809] bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors disabled:opacity-50"
                          >
                            {unlockingId === r.id ? 'Desbloqueando...' : 'Desbloquear'}
                          </button>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">Abierto</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
