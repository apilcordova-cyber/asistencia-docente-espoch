import React from 'react';
import { 
  ClipboardCheck, 
  BarChart3, 
  FileText, 
  Settings, 
  UserCheck, 
  Clock, 
  Building2,
  ChevronDown
} from 'lucide-react';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  profesores, 
  profesorActivo, 
  setProfesorActivo, 
  institucion 
}) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Barra superior con identidad institucional y selector de docente */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo y Nombre del Sistema */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-slate-900">
                  Asistencia<span className="text-indigo-600">Docente</span>
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                  4 Funciones Sustantivas
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block truncate max-w-xs md:max-w-md">
                {institucion?.nombre_institucion || 'Sistema de Control de Jornada Académica'}
              </p>
            </div>
          </div>

          {/* Selector de Profesor Activo */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1.5 px-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm mr-2.5">
                {profesorActivo?.nombre ? profesorActivo.nombre.substring(0, 2).toUpperCase() : 'PR'}
              </div>
              <div className="text-left mr-2">
                <div className="text-xs text-slate-400 font-medium">Docente Activo</div>
                <select 
                  value={profesorActivo?.id || ''} 
                  onChange={(e) => {
                    const selected = profesores.find(p => p.id === parseInt(e.target.value));
                    if (selected) setProfesorActivo(selected);
                  }}
                  aria-label="Seleccionar docente activo"
                  className="bg-transparent text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer pr-4"
                >
                  {profesores.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({p.horas_diarias}h/día)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Badge de Jornada */}
            {profesorActivo && (
              <div className="hidden lg:flex items-center px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-100 text-xs font-medium">
                <Clock className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                <span>{profesorActivo.tipo_jornada}</span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Barra de pestañas de navegación principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100">
        <nav className="flex space-x-1 sm:space-x-4 py-2 overflow-x-auto">
          <button
            onClick={() => setCurrentTab('registro')}
            className={`flex items-center px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              currentTab === 'registro'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-4 h-4 mr-2" />
            Registro Diario
          </button>

          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`flex items-center px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              currentTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Mi Dashboard y Resumen
          </button>

          <button
            onClick={() => setCurrentTab('hoja-oficial')}
            className={`flex items-center px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              currentTab === 'hoja-oficial'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4 mr-2" />
            Hoja Oficial (Firmas & PDF)
          </button>

          <button
            onClick={() => setCurrentTab('gestion')}
            className={`flex items-center px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              currentTab === 'gestion'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-4 h-4 mr-2" />
            Gestión Docente & Institución
          </button>
        </nav>
      </div>
    </header>
  );
}
