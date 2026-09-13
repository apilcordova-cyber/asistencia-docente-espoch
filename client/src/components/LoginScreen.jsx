import React, { useState } from 'react';
import { EspochLogo } from './EspochLogo';
import { login, checkActivation, activateAccount } from '../api';
import { Lock, User, KeyRound, AlertCircle, CheckCircle2, ArrowRight, ShieldCheck, Sparkles, HelpCircle } from 'lucide-react';

export default function LoginScreen({ onLoginSuccess }) {
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  // Estados del modal de activación
  const [mostrarModalActivacion, setMostrarModalActivacion] = useState(false);
  const [cedulaActivar, setCedulaActivar] = useState('');
  const [docenteParaActivar, setDocenteParaActivar] = useState(null);
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [errorActivacion, setErrorActivacion] = useState('');
  const [cargandoActivacion, setCargandoActivacion] = useState(false);

  // Modal de recuperación
  const [mostrarModalAyuda, setMostrarModalAyuda] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const data = await login(cedula, password);
      if (onLoginSuccess) onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  const handleVerificarCedula = async (e) => {
    e.preventDefault();
    setErrorActivacion('');
    setCargandoActivacion(true);

    try {
      const info = await checkActivation(cedulaActivar);
      setDocenteParaActivar(info);
    } catch (err) {
      setErrorActivacion(err.message);
    } finally {
      setCargandoActivacion(false);
    }
  };

  const handleCompletarActivacion = async (e) => {
    e.preventDefault();
    setErrorActivacion('');

    if (nuevaPassword.length < 6) {
      setErrorActivacion('La contraseña debe tener mínimo 6 caracteres');
      return;
    }
    if (nuevaPassword !== confirmarPassword) {
      setErrorActivacion('Las contraseñas no coinciden');
      return;
    }

    setCargandoActivacion(true);
    try {
      const data = await activateAccount(cedulaActivar, nuevaPassword);
      setMostrarModalActivacion(false);
      if (onLoginSuccess) onLoginSuccess(data.user);
    } catch (err) {
      setErrorActivacion(err.message);
    } finally {
      setCargandoActivacion(false);
    }
  };

  // Relleno rápido para demostración
  const llenarDemo = (tipo) => {
    setError('');
    if (tipo === 'coord') {
      setCedula('0601234567');
      setPassword('Marketing2026*');
    } else if (tipo === 'doc1') {
      setCedula('0609876543');
      setPassword('Docente2026*');
    } else if (tipo === 'activar') {
      setMostrarModalActivacion(true);
      setCedulaActivar('0605554443');
      setDocenteParaActivar(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F8F9FA] selection:bg-[#A60809] selection:text-white font-sans text-slate-800">
      
      {/* Cabecera superior mínima */}
      <header className="py-4 px-6 border-b border-[#D7D6D7]/60 bg-white shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <EspochLogo />
          <div className="text-right hidden sm:block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A60809]">
              Sistema Institucional de Control y Jornada
            </span>
            <p className="text-xs text-slate-500 font-medium">Periodo Académico 2026</p>
          </div>
        </div>
      </header>

      {/* Contenedor central del Login */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/70 border border-[#D7D6D7]/80 p-8 sm:p-10 space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#A60809]/10 text-[#A60809] flex items-center justify-center border border-[#A60809]/20 shadow-xs mb-3">
              <KeyRound className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Ingreso al Sistema
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              Control de Asistencia y Distribución de Jornada Docente
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium p-3.5 rounded-xl flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Número de Cédula
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  placeholder="Ej. 0601234567"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#F9F9FB] border border-[#D7D6D7] rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#A60809] focus:border-[#A60809] focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => setMostrarModalAyuda(true)}
                  className="text-xs text-[#A60809] hover:text-[#810404] font-semibold transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#F9F9FB] border border-[#D7D6D7] rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#A60809] focus:border-[#A60809] focus:outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-[#A60809] via-[#910607] to-[#810404] hover:from-[#C91C1E] hover:to-[#A60809] shadow-md shadow-[#A60809]/25 hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              <span>{cargando ? 'Verificando...' : 'Iniciar Sesión'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Enlace para activar cuenta por primera vez */}
          <div className="pt-2 border-t border-[#D7D6D7]/60 text-center">
            <p className="text-xs text-slate-600">
              ¿Es tu primer acceso al sistema?{' '}
              <button
                type="button"
                onClick={() => {
                  setMostrarModalActivacion(true);
                  setErrorActivacion('');
                  setDocenteParaActivar(null);
                }}
                className="font-bold text-[#A60809] hover:text-[#810404] underline ml-1 cursor-pointer"
              >
                Activar cuenta docente aquí
              </button>
            </p>
          </div>

          {/* Accesos rápidos demo para presentación */}
          <div className="bg-[#ECEAEB]/60 p-3 rounded-2xl border border-[#D7D6D7]/80 text-center space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Credenciales de Demostración:
            </span>
            <div className="flex items-center justify-center gap-1.5 flex-wrap text-[11px]">
              <button
                type="button"
                onClick={() => llenarDemo('coord')}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 rounded-lg font-bold text-[#810404] border border-[#D7D6D7] transition-all"
              >
                Coordinador
              </button>
              <button
                type="button"
                onClick={() => llenarDemo('doc1')}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 rounded-lg font-bold text-slate-800 border border-[#D7D6D7] transition-all"
              >
                Docente (Jornada 1)
              </button>
              <button
                type="button"
                onClick={() => llenarDemo('activar')}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 rounded-lg font-bold text-[#A60809] border border-[#D7D6D7] transition-all"
              >
                Probar Activación
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Pie de página institucional con autoría de Ariel Pilco */}
      <footer className="py-4 px-6 border-t border-[#D7D6D7]/60 bg-white text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Escuela Superior Politécnica de Chimborazo &bull; Carrera de Marketing</span>
          <span className="bg-[#ECEAEB] text-slate-700 font-semibold px-2.5 py-0.5 rounded-lg border border-[#D7D6D7]">
            Desarrollado por: <strong className="text-[#810404]">Ariel Pilco</strong>
          </span>
        </div>
      </footer>

      {/* MODAL: ACTIVAR CUENTA POR PRIMERA VEZ */}
      {mostrarModalActivacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-[#D7D6D7] shadow-2xl space-y-5">
            
            <div className="flex items-center justify-between border-b border-[#D7D6D7]/60 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-[#A60809] text-white">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Activación de Cuenta Docente</h3>
                  <p className="text-xs text-slate-500">Configura tu contraseña personal de acceso único</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModalActivacion(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {errorActivacion && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium p-3 rounded-xl flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{errorActivacion}</span>
              </div>
            )}

            {!docenteParaActivar ? (
              /* Paso 1: Ingresar Cédula */
              <form onSubmit={handleVerificarCedula} className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ingresa tu número de cédula registrado por la Coordinación de Carrera para verificar tu perfil:
                </p>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Cédula</label>
                  <input
                    type="text"
                    required
                    value={cedulaActivar}
                    onChange={(e) => setCedulaActivar(e.target.value)}
                    placeholder="Ej. 0605554443"
                    className="w-full px-3.5 py-2.5 bg-[#F9F9FB] border border-[#D7D6D7] rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#A60809]"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMostrarModalActivacion(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={cargandoActivacion}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#A60809] hover:bg-[#810404] transition-all"
                  >
                    {cargandoActivacion ? 'Verificando...' : 'Verificar Cédula'}
                  </button>
                </div>
              </form>
            ) : (
              /* Paso 2: Crear contraseña definitiva */
              <form onSubmit={handleCompletarActivacion} className="space-y-4">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
                  <div className="font-bold flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                    ¡Docente Encontrado!
                  </div>
                  <p><strong>Nombre:</strong> {docenteParaActivar.nombre}</p>
                  <p><strong>Correo:</strong> {docenteParaActivar.email}</p>
                  <p><strong>Jornada Asignada:</strong> {docenteParaActivar.jornada}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Crear Contraseña Personal</label>
                  <input
                    type="password"
                    required
                    value={nuevaPassword}
                    onChange={(e) => setNuevaPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-3.5 py-2.5 bg-[#F9F9FB] border border-[#D7D6D7] rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#A60809]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Confirmar Contraseña</label>
                  <input
                    type="password"
                    required
                    value={confirmarPassword}
                    onChange={(e) => setConfirmarPassword(e.target.value)}
                    placeholder="Repite tu contraseña"
                    className="w-full px-3.5 py-2.5 bg-[#F9F9FB] border border-[#D7D6D7] rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#A60809]"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDocenteParaActivar(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={cargandoActivacion}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#A60809] hover:bg-[#810404] transition-all shadow-sm"
                  >
                    {cargandoActivacion ? 'Activando...' : 'Activar Cuenta y Acceder'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* MODAL: RECUPERACIÓN / AYUDA */}
      {mostrarModalAyuda && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#D7D6D7] shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#A60809]/10 text-[#A60809] flex items-center justify-center mx-auto">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">¿Olvidaste tu contraseña?</h3>
            <p className="text-xs text-slate-600 leading-relaxed text-left">
              Por políticas de seguridad institucional de la Carrera de Marketing ESPOCH, el restablecimiento de contraseñas es gestionado por la <strong>Coordinación de Carrera</strong>.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed text-left bg-slate-50 p-3 rounded-xl border border-slate-200">
              Solicita al Coordinador que resetee tu acceso. Tu cuenta quedará temporalmente en estado <em>Pendiente de Activación</em> para que puedas ingresar una nueva clave desde <strong>"Activar cuenta docente"</strong>.
            </p>
            <button
              type="button"
              onClick={() => setMostrarModalAyuda(false)}
              className="w-full py-2.5 bg-[#A60809] text-white text-xs font-bold rounded-xl hover:bg-[#810404] transition-all"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
