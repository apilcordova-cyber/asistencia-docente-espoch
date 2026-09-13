import React, { useState, useEffect } from 'react';
import { adminAPI } from '../api';

export default function CoordinadorDocentes() {
  const [docentes, setDocentes] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal para Crear Docente
  const [showModalCrear, setShowModalCrear] = useState(false);
  const [nuevoDocente, setNuevoDocente] = useState({
    cedula: '',
    nombres: '',
    apellidos: '',
    email: '',
    password: ''
  });
  const [guardando, setGuardando] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Modal para Resetear Clave
  const [docenteReset, setDocenteReset] = useState(null);
  const [nuevaClave, setNuevaClave] = useState('');
  const [reseteando, setReseteando] = useState(false);

  // Modal para Cambiar Jornada
  const [docenteJornada, setDocenteJornada] = useState(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [cambiandoJornada, setCambiandoJornada] = useState(false);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      const [docsRes, schedRes] = await Promise.all([
        adminAPI.getDocentes(),
        adminAPI.getSchedules()
      ]);
      setDocentes(docsRes);
      setSchedules(schedRes);
    } catch (err) {
      setError(err.message || 'Error al cargar plantilla docente');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleCrearDocente = async (e) => {
    e.preventDefault();
    setModalError(null);

    if (!/^\d{10}$/.test(nuevoDocente.cedula.trim())) {
      setModalError('La cédula debe contener exactamente 10 dígitos numéricos');
      return;
    }

    try {
      setGuardando(true);
      await adminAPI.crearDocente({
        ...nuevoDocente,
        schedule_id: schedules[0]?.id || 1
      });
      setShowModalCrear(false);
      setNuevoDocente({
        cedula: '',
        nombres: '',
        apellidos: '',
        email: '',
        password: ''
      });
      await cargarDatos();
    } catch (err) {
      setModalError(err.message || 'Error al registrar docente');
    } finally {
      setGuardando(false);
    }
  };

  const handleResetPassword = async () => {
    if (!docenteReset) return;
    try {
      setReseteando(true);
      await adminAPI.resetPassword(docenteReset.user_id, nuevaClave.trim() || undefined);
      alert('Contraseña reseteada exitosamente. El docente podrá activar su cuenta o usar la nueva clave.');
      setDocenteReset(null);
      setNuevaClave('');
      cargarDatos();
    } catch (err) {
      alert('Error al resetear contraseña: ' + err.message);
    } finally {
      setReseteando(false);
    }
  };

  const handleGuardarCambioJornada = async () => {
    if (!docenteJornada || !selectedScheduleId) return;
    try {
      setCambiandoJornada(true);
      await adminAPI.updateDocente(docenteJornada.id, { schedule_id: selectedScheduleId });
      setDocenteJornada(null);
      cargarDatos();
    } catch (err) {
      alert('Error al cambiar jornada: ' + err.message);
    } finally {
      setCambiandoJornada(false);
    }
  };

  const filteredDocentes = docentes.filter((d) => {
    const term = searchTerm.toLowerCase();
    const fullName = `${d.nombres} ${d.apellidos}`.toLowerCase();
    return fullName.includes(term) || d.cedula.includes(term) || (d.email && d.email.toLowerCase().includes(term));
  });

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="bg-white rounded-xl shadow-sm border border-[#D7D6D7]/60 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#A60809]">
              <span>Administración de Talento Humano</span>
              <span>•</span>
              <span>Marketing ESPOCH</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 mt-1">Plantilla de Docentes</h1>
            <p className="text-sm text-gray-600">
              Gestione cuentas, asigne jornadas laborales oficiales y supervise credenciales de acceso.
            </p>
          </div>

          <button
            onClick={() => setShowModalCrear(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#A60809] hover:bg-[#810404] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors self-start sm:self-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Registrar Nuevo Docente
          </button>
        </div>

        {/* Buscador */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por cédula o nombre del profesor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-[#D7D6D7] rounded-lg focus:outline-none focus:border-[#A60809]"
            />
          </div>
          <span className="text-xs text-gray-500 font-medium">
            {filteredDocentes.length} de {docentes.length} docentes
          </span>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-xl border border-[#D7D6D7]/60 p-12 text-center">
          <div className="w-10 h-10 border-4 border-[#A60809]/20 border-t-[#A60809] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium text-sm">Cargando nómina docente...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-sm">
          {error}
        </div>
      )}

      {/* Tabla de Docentes */}
      {!loading && (
        <div className="bg-white rounded-xl shadow-sm border border-[#D7D6D7]/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-[#D7D6D7]/60 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Docente</th>
                  <th className="py-3.5 px-3">Cédula</th>
                  <th className="py-3.5 px-3">Correo Institucional</th>
                  <th className="py-3.5 px-3">Jornada Asignada</th>
                  <th className="py-3.5 px-3">Estado Cuenta</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D7D6D7]/40">
                {filteredDocentes.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#A60809]/10 text-[#A60809] font-bold text-xs flex items-center justify-center">
                          {d.nombres[0]}{d.apellidos[0]}
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 block">{d.nombres} {d.apellidos}</span>
                          <span className="text-[11px] text-gray-400">Marketing ESPOCH</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-mono text-xs font-semibold text-gray-700">
                      {d.cedula}
                    </td>

                    <td className="py-3.5 px-3 text-xs text-gray-600">
                      {d.email}
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
                        {d.schedule_name || 'Sin jornada'} ({d.start_time || '07:00'}-{d.end_time || '13:00'})
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      {d.status === 'ACTIVO' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800">
                          Pendiente Activación
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {/* Activar cuenta directamente por el Coordinador si está pendiente */}
                        {d.user_status === 'PENDIENTE_ACTIVACION' && (
                          <button
                            onClick={async () => {
                              if (!confirm(`¿Deseas activar inmediatamente la cuenta de ${d.nombre}?`)) return;
                              try {
                                setLoading(true);
                                await adminAPI.activateDocenteDirect(d.id);
                                await cargarDatos();
                              } catch (err) {
                                alert(`Error: ${err.message}`);
                              } finally {
                                setLoading(false);
                              }
                            }}
                            className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded transition-colors shadow-2xs cursor-pointer"
                            title="Activar cuenta de docente directamente"
                          >
                            ✓ Activar Docente
                          </button>
                        )}

                        {/* Cambiar jornada */}
                        <button
                          onClick={() => {
                            setDocenteJornada(d);
                            setSelectedScheduleId(d.schedule_id || schedules[0]?.id || '');
                          }}
                          className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors"
                          title="Cambiar jornada de trabajo"
                        >
                          Jornada
                        </button>

                        {/* Resetear clave */}
                        <button
                          onClick={() => {
                            setDocenteReset(d);
                            setNuevaClave('');
                          }}
                          className="px-2.5 py-1 text-xs font-medium text-[#A60809] bg-[#A60809]/5 hover:bg-[#A60809]/15 border border-[#A60809]/20 rounded transition-colors"
                          title="Restablecer clave o enviar a activación"
                        >
                          Reset Clave
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL CREAR DOCENTE */}
      {showModalCrear && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-gray-900">Registrar Nuevo Docente</h2>
              <button
                onClick={() => setShowModalCrear(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCrearDocente} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Cédula de Identidad (10 dígitos)*</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={nuevoDocente.cedula}
                  onChange={(e) => setNuevoDocente({ ...nuevoDocente, cedula: e.target.value.replace(/\D/g, '') })}
                  placeholder="Ej: 0601234567"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#A60809] font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nombres*</label>
                  <input
                    type="text"
                    required
                    value={nuevoDocente.nombres}
                    onChange={(e) => setNuevoDocente({ ...nuevoDocente, nombres: e.target.value })}
                    placeholder="Ej: Carlos Alberto"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#A60809]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Apellidos*</label>
                  <input
                    type="text"
                    required
                    value={nuevoDocente.apellidos}
                    onChange={(e) => setNuevoDocente({ ...nuevoDocente, apellidos: e.target.value })}
                    placeholder="Ej: Silva Ramos"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#A60809]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Correo Institucional ESPOCH*</label>
                <input
                  type="email"
                  required
                  value={nuevoDocente.email}
                  onChange={(e) => setNuevoDocente({ ...nuevoDocente, email: e.target.value })}
                  placeholder="nombre.apellido@espoch.edu.ec"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#A60809]"
                />
              </div>


              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Contraseña Inicial (Opcional)</label>
                <input
                  type="password"
                  value={nuevoDocente.password}
                  onChange={(e) => setNuevoDocente({ ...nuevoDocente, password: e.target.value })}
                  placeholder="Dejar vacío para que el docente active su clave"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#A60809]"
                />
                <span className="text-[10px] text-gray-400 mt-0.5 block">
                  Si se deja vacío, la cuenta se creará como PENDIENTE_ACTIVACION.
                </span>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModalCrear(false)}
                  className="px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 bg-[#A60809] hover:bg-[#810404] text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Crear Docente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CAMBIAR JORNADA */}
      {docenteJornada && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-sm w-full p-6 space-y-4">
            <h2 className="text-base font-bold text-gray-900">Reasignar Jornada Laboral</h2>
            <p className="text-xs text-gray-600">
              Docente: <strong>{docenteJornada.nombres} {docenteJornada.apellidos}</strong>
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Seleccionar Nueva Jornada:</label>
              <select
                value={selectedScheduleId}
                onChange={(e) => setSelectedScheduleId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#A60809]"
              >
                {schedules.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.start_time} - {s.end_time}, {s.hours_per_day}h)
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-3 border-t flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDocenteJornada(null)}
                className="px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={cambiandoJornada}
                onClick={handleGuardarCambioJornada}
                className="px-4 py-2 bg-[#A60809] hover:bg-[#810404] text-white text-xs font-semibold rounded-lg disabled:opacity-50"
              >
                {cambiandoJornada ? 'Guardando...' : 'Actualizar Jornada'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RESETEAR CONTRASEÑA */}
      {docenteReset && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-sm w-full p-6 space-y-4">
            <h2 className="text-base font-bold text-gray-900">Restablecer Contraseña</h2>
            <p className="text-xs text-gray-600">
              Docente: <strong>{docenteReset.nombres} {docenteReset.apellidos}</strong> (CI: {docenteReset.cedula})
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Nueva Contraseña Personalizada (Opcional):
              </label>
              <input
                type="password"
                value={nuevaClave}
                onChange={(e) => setNuevaClave(e.target.value)}
                placeholder="Dejar vacío para enviar a Primer Acceso"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#A60809]"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                Si deja este campo vacío, la cuenta pasará a estado <strong>PENDIENTE_ACTIVACION</strong> y el docente definirá su contraseña ingresando su cédula.
              </span>
            </div>

            <div className="pt-3 border-t flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDocenteReset(null)}
                className="px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={reseteando}
                onClick={handleResetPassword}
                className="px-4 py-2 bg-[#A60809] hover:bg-[#810404] text-white text-xs font-semibold rounded-lg disabled:opacity-50"
              >
                {reseteando ? 'Procesando...' : 'Confirmar Restablecimiento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
