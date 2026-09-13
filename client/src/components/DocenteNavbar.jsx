import React from 'react';
import EspochLogo from './EspochLogo';
import { ClipboardCheck, BarChart3, FileText, User, LogOut, Clock } from 'lucide-react';

export default function DocenteNavbar({ 
  currentTab, 
  setCurrentTab, 
  onSelectTab,
  user,
  usuario, 
  onLogout 
}) {
  const setTab = onSelectTab || setCurrentTab;
  const currentUser = user || usuario;
  const teacher = currentUser?.teacher;

  const displayName = currentUser?.nombres 
    ? `${currentUser.nombres} ${currentUser.apellidos || ''}`.trim()
    : (currentUser?.nombre || 'Docente');

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0])
    .join('')
    .toUpperCase() || 'DOC';

  return (
    <header className="bg-white border-b border-[#D7D6D7]/80 sticky top-0 z-30 shadow-xs select-none">
      {/* Barra superior con identidad Marketing ESPOCH */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          <EspochLogo variant="horizontal" className="h-10" />

          {/* Datos del Docente conectado */}
          <div className="flex items-center space-x-3">
            
            {/* Badge de Jornada Oficial (8 horas combinables) */}
            <div className="hidden lg:flex items-center px-3 py-1.5 rounded-xl bg-[#A60809]/10 text-[#A60809] border border-[#A60809]/20 text-xs font-bold">
              <Clock className="w-3.5 h-3.5 mr-1.5" />
              <span>Jornada 8h • Turnos Combinables (07h-13h y 15h-21h)</span>
            </div>

            {/* Perfil */}
            <div className="flex items-center bg-[#F8F9FA] border border-[#D7D6D7] rounded-xl p-1.5 px-2.5 sm:px-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#A60809] text-white flex items-center justify-center font-bold text-xs mr-2 shadow-2xs flex-shrink-0">
                {initials}
              </div>
              <div className="text-left mr-1 sm:mr-2 min-w-0">
                <div className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider hidden sm:block">Docente Titular / Ocasional</div>
                <div className="text-xs font-bold text-slate-900 truncate max-w-[110px] sm:max-w-[200px]">
                  {displayName}
                </div>
              </div>
            </div>

            {/* Botón Salir */}
            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-[#A60809] hover:bg-[#A60809]/10 rounded-xl transition-all cursor-pointer flex-shrink-0 touch-manipulation"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>

          </div>

        </div>
      </div>

      {/* Pestañas de Navegación Exclusivas del Docente */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#ECEAEB]">
        <nav className="flex space-x-1 sm:space-x-3 py-2 overflow-x-auto touch-pan-x scrollbar-none">
          <button
            type="button"
            onClick={() => setTab && setTab('registro')}
            className={`flex items-center px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'registro'
                ? 'bg-[#A60809] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#A60809] hover:bg-slate-100'
            }`}
          >
            <ClipboardCheck className="w-4 h-4 mr-2" />
            Registro Diario
          </button>

          <button
            type="button"
            onClick={() => setTab && setTab('resumen')}
            className={`flex items-center px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'resumen'
                ? 'bg-[#A60809] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#A60809] hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Mi Resumen Personal
          </button>

          <button
            type="button"
            onClick={() => setTab && setTab('hoja')}
            className={`flex items-center px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'hoja'
                ? 'bg-[#A60809] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#A60809] hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4 mr-2" />
            Mi Hoja de Asistencia (PDF)
          </button>

          <button
            type="button"
            onClick={() => setTab && setTab('perfil')}
            className={`flex items-center px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'perfil'
                ? 'bg-[#A60809] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#A60809] hover:bg-slate-100'
            }`}
          >
            <User className="w-4 h-4 mr-2" />
            Mi Perfil
          </button>
        </nav>
      </div>
    </header>
  );
}
