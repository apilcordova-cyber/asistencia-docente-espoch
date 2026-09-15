import React, { useState, useEffect } from 'react';
import { docenteAPI, authAPI } from '../api';
import { User, Mail, GraduationCap, Phone, Lock, Save, CheckCircle2, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function DocentePerfil({ user }) {
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Formulario de edición de datos personales
  const [formNombre, setFormNombre] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTitulo, setFormTitulo] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [savingPerfil, setSavingPerfil] = useState(false);
  const [perfilMsg, setPerfilMsg] = useState(null);
  const [perfilErr, setPerfilErr] = useState(null);

  // Formulario de cambio de clave
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [passwordErr, setPasswordErr] = useState(null);

  const cargarPerfil = async () => {
    try {
      setLoading(true);
      const res = await docenteAPI.getPerfil();
      setPerfil(res);
      setFormNombre(res.nombre || `${res.nombres || ''} ${res.apellidos || ''}`.trim());
      setFormEmail(res.email_institucional || res.email || '');
      setFormTitulo(res.titulo_academico || '');
      setFormTelefono(res.telefono || '');
    } catch (err) {
      setError(err.message || 'Error al cargar perfil');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPerfil();
  }, []);

  const handleUpdatePerfil = async (e) => {
    e.preventDefault();
    setPerfilMsg(null);
    setPerfilErr(null);

    if (!formNombre.trim()) {
      setPerfilErr('El nombre completo no puede estar vacío');
      return;
    }

    try {
      setSavingPerfil(true);
      const updated = await docenteAPI.updatePerfil({
        nombre: formNombre.trim(),
        email_institucional: formEmail.trim(),
        titulo_academico: formTitulo.trim(),
        telefono: formTelefono.trim()
      });
      setPerfil(updated);
      setPerfilMsg('Información personal y de contacto actualizada exitosamente');
    } catch (err) {
      setPerfilErr(err.message || 'Error al actualizar información');
    } finally {
      setSavingPerfil(false);
    }
  };

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

  const nombreDisplay = perfil?.nombre || `${perfil?.nombres || ''} ${perfil?.apellidos || ''}`.trim() || 'Docente';
  const initials = nombreDisplay
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0])
    .join('')
    .toUpperCase() || 'DOC';

  return (
    <div className="max-w-4xl mx-auto space-y-6 select-none">
      
      {/* Cabecera de Perfil */}
      <div className="bg-white rounded-3xl shadow-sm border border-[#D7D6D7]/80 overflow-hidden">
        <div className="h-28 sm:h-32 bg-gradient-to-r from-[#810404] via-[#A60809] to-[#C91C1E] p-4 sm:p-6 flex items-end">
          <span className="text-white/90 text-[11px] sm:text-xs font-bold uppercase tracking-wider">
            Carrera de Marketing &bull; ESPOCH 2026
          </span>
        </div>
        <div className="px-4 sm:px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-10 sm:-mt-12 mb-4 gap-3">
            <div className="flex items-end gap-3 sm:gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white shadow-md border-4 border-white flex items-center justify-center text-[#A60809] font-black text-2xl sm:text-3xl flex-shrink-0">
                {initials}
              </div>
              <div className="pb-1 min-w-0">
                <h1 className="text-lg sm:text-2xl font-black text-slate-900 truncate">
                  {nombreDisplay}
                </h1>
                <p className="text-xs text-slate-500 font-mono">CI: {perfil?.cedula}</p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 bg-[#A60809]/10 text-[#810404] px-3 py-1.5 rounded-xl border border-[#A60809]/20 self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-[#A60809] animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider">Docente Activo</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-4 border-t border-[#ECEAEB]">
            <div className="bg-[#F8F9FA] p-3 rounded-xl border border-[#D7D6D7]/50">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Correo Institucional</span>
              <span className="text-xs sm:text-sm font-bold text-slate-800 break-all">
                {perfil?.email_institucional || perfil?.email || 'Sin correo registrado'}
              </span>
            </div>
            <div className="bg-[#F8F9FA] p-3 rounded-xl border border-[#D7D6D7]/50">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Jornada Laboral Asignada</span>
              <span className="text-xs sm:text-sm font-bold text-[#A60809] block">
                {perfil?.schedule_name || 'Jornada Combinable 8h'}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {perfil?.start_time || '07:00'} - {perfil?.end_time || '21:00'}
              </span>
            </div>
            <div className="bg-[#F8F9FA] p-3 rounded-xl border border-[#D7D6D7]/50">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Carga Horaria Diaria</span>
              <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                {perfil?.hours_per_day || 8.0} horas / día
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Régimen Politécnico</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjeta 1: Actualizar Información Personal e Institucional */}
      <div className="bg-white rounded-3xl shadow-sm border border-[#D7D6D7]/80 p-5 sm:p-7 space-y-4">
        <div className="flex items-center gap-3 border-b border-[#ECEAEB] pb-4">
          <div className="w-10 h-10 rounded-xl bg-[#A60809]/10 text-[#A60809] flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Modificar Datos Personales e Institucionales</h2>
            <p className="text-xs text-slate-500">
              Personaliza tus nombres oficiales, correo institucional (@espoch.edu.ec), título y teléfono de contacto.
            </p>
          </div>
        </div>

        {perfilMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{perfilMsg}</span>
          </div>
        )}

        {perfilErr && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{perfilErr}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePerfil} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Cédula (Solo Lectura) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Número de Cédula (Identificador Único)
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled
                  value={perfil?.cedula || ''}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-mono font-bold cursor-not-allowed"
                />
                <span className="absolute right-3 top-2.5 text-[10px] uppercase font-bold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Bloqueado
                </span>
              </div>
            </div>

            {/* Nombres y Apellidos */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Nombres y Apellidos Completos *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  placeholder="Ej. Ing. Ariel Enrique Pilco Cordova"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F9F9FB] border border-[#D7D6D7] rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A60809] focus:border-[#A60809] transition-all"
                />
              </div>
            </div>

            {/* Correo Institucional */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Correo Institucional ESPOCH
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="ejemplo@espoch.edu.ec"
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-[#F9F9FB] border border-[#D7D6D7] rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A60809] focus:border-[#A60809] transition-all"
                />
              </div>
            </div>

            {/* Título Académico */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Título Profesional / Grado Académico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  placeholder="Ej. Magíster en Marketing Digital"
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-[#F9F9FB] border border-[#D7D6D7] rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A60809] focus:border-[#A60809] transition-all"
                />
              </div>
            </div>

            {/* Teléfono / Celular */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Teléfono Celular de Contacto
              </label>
              <div className="relative sm:max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={formTelefono}
                  onChange={(e) => setFormTelefono(e.target.value)}
                  placeholder="Ej. 0991234567"
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-[#F9F9FB] border border-[#D7D6D7] rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A60809] focus:border-[#A60809] transition-all"
                />
              </div>
            </div>

          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingPerfil}
              className="px-6 py-2.5 bg-[#A60809] hover:bg-[#810404] disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{savingPerfil ? 'Guardando Cambios...' : 'Guardar Información de Perfil'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Tarjeta 2: Cambio de Contraseña */}
      <div className="bg-white rounded-3xl shadow-sm border border-[#D7D6D7]/80 p-5 sm:p-7 space-y-4">
        <div className="flex items-center gap-3 border-b border-[#ECEAEB] pb-4">
          <div className="w-10 h-10 rounded-xl bg-[#A60809]/10 text-[#A60809] flex items-center justify-center flex-shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Seguridad y Credenciales</h2>
            <p className="text-xs text-slate-500">Actualice su contraseña de acceso personal al sistema.</p>
          </div>
        </div>

        {passwordMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{passwordMsg}</span>
          </div>
        )}

        {passwordErr && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{passwordErr}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Contraseña Actual
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Ingresa tu contraseña actual"
                className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-[#F9F9FB] border border-[#D7D6D7] rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A60809] focus:border-[#A60809]"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                title={showCurrentPassword ? 'Ocultar' : 'Mostrar'}
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Nueva Contraseña
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-[#F9F9FB] border border-[#D7D6D7] rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A60809] focus:border-[#A60809]"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                title={showNewPassword ? 'Ocultar' : 'Mostrar'}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Confirmar Nueva Contraseña
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita la nueva contraseña"
                className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-[#F9F9FB] border border-[#D7D6D7] rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A60809] focus:border-[#A60809]"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                title={showConfirmPassword ? 'Ocultar' : 'Mostrar'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="px-6 py-2.5 bg-[#A60809] hover:bg-[#810404] disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{savingPassword ? 'Actualizando...' : 'Guardar Nueva Contraseña'}</span>
          </button>
        </form>
      </div>

    </div>
  );
}
