import React, { useState, useEffect } from 'react';
import { adminAPI } from '../api';

export default function CoordinadorConfiguracion() {
  const [activeSubtab, setActiveSubtab] = useState('institucion'); // 'institucion' | 'feriados' | 'auditoria'
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [error, setError] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(null);

  // Nuevo feriado
  const [nuevoFeriado, setNuevoFeriado] = useState({ date: '', name: '' });
  const [guardandoFeriado, setGuardandoFeriado] = useState(false);

  const cargarTodo = async () => {
    try {
      setLoading(true);
      setError(null);
      const [settRes, holRes, logsRes] = await Promise.all([
        adminAPI.getSettings(),
        adminAPI.getHolidays(),
        adminAPI.getAuditLogs()
      ]);
      setSettings(settRes);
      setHolidays(holRes);
      setAuditLogs(logsRes);
    } catch (err) {
      setError(err.message || 'Error al cargar configuraciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTodo();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      setSettingsSuccess(null);
      const updated = await adminAPI.updateSettings(settings);
      setSettings(updated);
      setSettingsSuccess('Configuración institucional guardada exitosamente.');
    } catch (err) {
      alert('Error al guardar configuración: ' + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!nuevoFeriado.date || !nuevoFeriado.name.trim()) return;
    try {
      setGuardandoFeriado(true);
      await adminAPI.createHoliday(nuevoFeriado);
      setNuevoFeriado({ date: '', name: '' });
      const updated = await adminAPI.getHolidays();
      setHolidays(updated);
    } catch (err) {
      alert('Error al registrar feriado: ' + err.message);
    } finally {
      setGuardandoFeriado(false);
    }
  };

  const handleDeleteHoliday = async (id, name) => {
    if (!window.confirm(`¿Eliminar el feriado "${name}" del calendario institucional?`)) return;
    try {
      await adminAPI.deleteHoliday(id);
      setHolidays(holidays.filter((h) => h.id !== id));
    } catch (err) {
      alert('Error al eliminar feriado: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[#D7D6D7]/60 p-12 text-center">
        <div className="w-10 h-10 border-4 border-[#A60809]/20 border-t-[#A60809] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 font-medium text-sm">Cargando parámetros institucionales...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="bg-white rounded-xl shadow-sm border border-[#D7D6D7]/60 p-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#A60809]">
          <span>Gobernanza y Parámetros</span>
          <span>•</span>
          <span>Marketing ESPOCH 2026</span>
        </div>
        <h1 className="text-2xl font-black text-gray-900 mt-1">Configuración del Sistema</h1>
        <p className="text-sm text-gray-600">
          Personalización institucional, calendario de feriados no laborables y bitácora de auditoría.
        </p>

        {/* Subtabs */}
        <div className="flex items-center gap-2 mt-6 border-b border-gray-100 pb-2">
          <button
            onClick={() => setActiveSubtab('institucion')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              activeSubtab === 'institucion'
                ? 'bg-[#A60809] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Parámetros Institucionales
          </button>
          <button
            onClick={() => setActiveSubtab('feriados')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              activeSubtab === 'feriados'
                ? 'bg-[#A60809] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Calendario de Feriados ({holidays.length})
          </button>
          <button
            onClick={() => setActiveSubtab('auditoria')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              activeSubtab === 'auditoria'
                ? 'bg-[#A60809] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Bitácora de Auditoría ({auditLogs.length})
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-sm">
          {error}
        </div>
      )}

      {/* SUBTAB 1: PARÁMETROS INSTITUCIONALES */}
      {activeSubtab === 'institucion' && settings && (
        <div className="bg-white rounded-xl shadow-sm border border-[#D7D6D7]/60 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Datos Oficiales para Hojas de Asistencia</h2>

          {settingsSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium">
              {settingsSuccess}
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre de la Institución</label>
                <input
                  type="text"
                  value={settings.institution_name}
                  onChange={(e) => setSettings({ ...settings, institution_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#A60809]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Facultad</label>
                <input
                  type="text"
                  value={settings.faculty_name}
                  onChange={(e) => setSettings({ ...settings, faculty_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#A60809]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Carrera</label>
                <input
                  type="text"
                  value={settings.carrera_name}
                  onChange={(e) => setSettings({ ...settings, carrera_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#A60809]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Período Académico</label>
                <input
                  type="text"
                  value={settings.periodo_academico}
                  onChange={(e) => setSettings({ ...settings, periodo_academico: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#A60809]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Director / Coordinador de Carrera</label>
                <input
                  type="text"
                  value={settings.director_carrera}
                  onChange={(e) => setSettings({ ...settings, director_carrera: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#A60809]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Días de Gracia para Edición</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={settings.grace_period_days}
                  onChange={(e) => setSettings({ ...settings, grace_period_days: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#A60809]"
                />
                <span className="text-[10px] text-gray-400 mt-0.5 block">
                  Pasado este tiempo, el registro diario se bloquea automáticamente.
                </span>
              </div>
            </div>

            <div className="pt-4 border-t flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Los cambios se reflejarán inmediatamente en todas las hojas PDF oficiales.
              </span>
              <button
                type="submit"
                disabled={savingSettings}
                className="px-5 py-2.5 bg-[#A60809] hover:bg-[#810404] text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-colors"
              >
                {savingSettings ? 'Guardando...' : 'Guardar Parámetros'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUBTAB 2: FERIADOS */}
      {activeSubtab === 'feriados' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-[#D7D6D7]/60 p-6">
            <h2 className="text-base font-bold text-gray-900 mb-2">Agregar Día Festivo Institucional</h2>
            <p className="text-xs text-gray-500 mb-4">
              Los días registrados como feriado no exigirán horas de trabajo y se catalogarán como "NO LABORAL".
            </p>

            <form onSubmit={handleAddHoliday} className="flex flex-wrap items-center gap-3">
              <input
                type="date"
                required
                value={nuevoFeriado.date}
                onChange={(e) => setNuevoFeriado({ ...nuevoFeriado, date: e.target.value })}
                className="px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#A60809]"
              />
              <input
                type="text"
                required
                placeholder="Nombre del feriado (Ej: Independencia de Cuenca)"
                value={nuevoFeriado.name}
                onChange={(e) => setNuevoFeriado({ ...nuevoFeriado, name: e.target.value })}
                className="flex-1 min-w-[250px] px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#A60809]"
              />
              <button
                type="submit"
                disabled={guardandoFeriado}
                className="px-4 py-2 bg-[#A60809] hover:bg-[#810404] text-white text-xs font-semibold rounded-lg disabled:opacity-50"
              >
                {guardandoFeriado ? 'Guardando...' : 'Agregar Feriado'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-[#D7D6D7]/60 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-[#D7D6D7]/60 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Motivo / Descripción</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {holidays.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-xs font-bold text-gray-900">{h.date}</td>
                    <td className="py-3 px-4 text-xs text-gray-700">{h.name}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteHoliday(h.id, h.name)}
                        className="text-xs text-red-600 hover:text-red-800 font-semibold"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: BITÁCORA DE AUDITORÍA */}
      {activeSubtab === 'auditoria' && (
        <div className="bg-white rounded-xl shadow-sm border border-[#D7D6D7]/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-[#D7D6D7]/60 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Registro Histórico de Auditoría (Trazabilidad)</h2>
              <p className="text-xs text-gray-500">Eventos de seguridad, reseteos de clave, desbloqueos y cambios de jornada</p>
            </div>
            <button
              onClick={cargarTodo}
              className="text-xs font-semibold text-[#A60809] hover:underline"
            >
              Actualizar Bitácora
            </button>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-gray-50">
                <tr className="border-b border-[#D7D6D7]/60 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Fecha / Hora</th>
                  <th className="py-2.5 px-3">Usuario</th>
                  <th className="py-2.5 px-3">Acción</th>
                  <th className="py-2.5 px-4">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-gray-400">
                      No hay registros en la bitácora todavía.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/70">
                      <td className="py-2.5 px-4 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                        {log.created_at}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-gray-800">
                        {log.nombres ? `${log.nombres} ${log.apellidos}` : 'Sistema / Auto'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#A60809]/10 text-[#810404] uppercase">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-gray-600 font-mono text-[11px] max-w-md truncate" title={log.details}>
                        {log.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Marca de autor y créditos */}
      <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-[#D7D6D7] text-center text-xs text-gray-500">
        <p className="font-semibold text-gray-700">Sistema de Control de Asistencia y Reporte de Jornada Laboral Docente</p>
        <p className="text-[11px] text-gray-500 mt-0.5">
          Carrera de Marketing • Escuela Superior Politécnica de Chimborazo (ESPOCH 2026)
        </p>
        <p className="text-[11px] font-medium text-[#A60809] mt-1">
          Diseñado y Desarrollado por: <span className="font-bold underline">Ariel Pilco</span>
        </p>
      </div>
    </div>
  );
}
