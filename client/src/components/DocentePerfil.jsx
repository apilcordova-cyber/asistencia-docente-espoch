import React, { useState, useEffect } from 'react';
import { docenteAPI, authAPI } from '../api';

export default function DocentePerfil({ user }) {
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Formulario de cambio de clave
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [passwordErr, setPasswordErr] = useState(null);

  const cargarPerfil = async () => {
    try {
      setLoading(true);
      const res = await docenteAPI.getPerfil();
      setPerfil(res);
    } catch (err) {
      setError(err.message || 'Error al cargar perfil');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPerfil();
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg(null);
    setPasswordErr(null);

    if (newPassword.length < 6) {
      setPasswordErr('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErr('La confirmación no coincide con la nueva contraseña');
      return;
    }

    try {
      setSavingPassword(true);
      await authAPI.changePassword(currentPassword, newPassword);
      setPasswordMsg('Contraseña actualizada correctamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordErr(err.message || 'Error al cambiar la contraseña');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[#D7D6D7]/60 p-12 text-center">
        <div className="w-10 h-10 border-4 border-[#A60809]/20 border-t-[#A60809] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 font-medium text-sm">Cargando perfil docente...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Cabecera de Perfil */}
      <div className="bg-white rounded-xl shadow-sm border border-[#D7D6D7]/60 overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-[#810404] via-[#A60809] to-[#C91C1E] p-6 flex items-end">
          <span className="text-white/80 text-xs font-semibold uppercase tracking-wider">
            Carrera de Marketing • ESPOCH 2026
          </span>
        </div>
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-12 mb-4 gap-4">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 rounded-xl bg-white shadow-md border-4 border-white flex items-center justify-center text-[#A60809] font-black text-2xl">
                {perfil?.nombres?.[0]}{perfil?.apellidos?.[0]}
              </div>
              <div className="pb-1">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900">
                  {perfil?.nombres} {perfil?.apellidos}
                </h1>
                <p className="text-xs text-gray-500 font-mono">CI: {perfil?.cedula}</p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 bg-[#A60809]/10 text-[#810404] px-3 py-1.5 rounded-lg border border-[#A60809]/20 self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-[#A60809] animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider">Docente Activo</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#D7D6D7]/60">
            <div>
              <span className="text-xs text-gray-500 block">Correo Institucional</span>
              <span className="text-sm font-semibold text-gray-800 break-all">{perfil?.email}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Jornada Laboral Asignada</span>
              <span className="text-sm font-semibold text-[#A60809]">{perfil?.schedule_name || 'Sin asignar'}</span>
              <span className="text-xs text-gray-500 block">{perfil?.start_time} - {perfil?.end_time}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Carga Horaria Diaria</span>
              <span className="text-sm font-semibold text-gray-800">{perfil?.hours_per_day || 8.0} horas / día</span>
              <span className="text-xs text-gray-500 block">Régimen Politécnico</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjeta de Cambio de Contraseña */}
      <div className="bg-white rounded-xl shadow-sm border border-[#D7D6D7]/60 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[#A60809]/10 text-[#A60809] flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Seguridad y Credenciales</h2>
            <p className="text-xs text-gray-500">Actualice su contraseña de acceso personal al sistema.</p>
          </div>
        </div>

        {passwordMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium">
            {passwordMsg}
          </div>
        )}

        {passwordErr && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-medium">
            {passwordErr}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Contraseña Actual
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-sm border border-[#D7D6D7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A60809]/30 focus:border-[#A60809]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nueva Contraseña
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-3 py-2 text-sm border border-[#D7D6D7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A60809]/30 focus:border-[#A60809]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Confirmar Nueva Contraseña
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita la nueva contraseña"
              className="w-full px-3 py-2 text-sm border border-[#D7D6D7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A60809]/30 focus:border-[#A60809]"
            />
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="px-5 py-2.5 bg-[#A60809] hover:bg-[#810404] disabled:opacity-50 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors"
          >
            {savingPassword ? 'Actualizando...' : 'Guardar Nueva Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
