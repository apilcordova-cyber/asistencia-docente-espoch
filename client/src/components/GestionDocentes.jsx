import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Building, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Save, 
  Clock, 
  ShieldCheck,
  Edit2
} from 'lucide-react';
import { createProfesor, updateInstitucion, deleteProfesor } from '../api';

export default function GestionDocentes({ 
  profesores, 
  setProfesores, 
  institucion, 
  setInstitucion, 
  onProfesorActualizado 
}) {
  // Formulario nuevo docente
  const [cedula, setCedula] = useState('');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [departamento, setDepartamento] = useState('Sistemas y Software');
  const [tipoJornada, setTipoJornada] = useState('Tiempo Completo (8h)');
  const [horasDiarias, setHorasDiarias] = useState(8.0);

  // Formulario de institución
  const [nombreInst, setNombreInst] = useState(institucion?.nombre_institucion || '');
  const [facultad, setFacultad] = useState(institucion?.facultad || '');
  const [carrera, setCarrera] = useState(institucion?.carrera_departamento || '');
  const [directorNombre, setDirectorNombre] = useState(institucion?.director_nombre || '');
  const [directorCargo, setDirectorCargo] = useState(institucion?.director_cargo || '');

  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [guardandoDocente, setGuardandoDocente] = useState(false);
  const [guardandoInst, setGuardandoInst] = useState(false);

  const handleCrearProfesor = async (e) => {
    e.preventDefault();
    setMensaje('');
    setError('');
    setGuardandoDocente(true);

    try {
      const nuevo = await createProfesor({
        cedula,
        nombre,
        email,
        departamento,
        tipo_jornada: tipoJornada,
        horas_diarias: parseFloat(horasDiarias)
      });

      setProfesores(prev => [...prev, nuevo]);
      setMensaje(`¡Profesor ${nombre} agregado exitosamente!`);
      setCedula('');
      setNombre('');
      setEmail('');
      if (onProfesorActualizado) onProfesorActualizado();
      setTimeout(() => setMensaje(''), 4000);
    } catch (err) {
      setError(err.message || 'Error al registrar profesor');
    } finally {
      setGuardandoDocente(false);
    }
  };

  const handleGuardarInstitucion = async (e) => {
    e.preventDefault();
    setMensaje('');
    setError('');
    setGuardandoInst(true);

    try {
      const updated = await updateInstitucion({
        nombre_institucion: nombreInst,
        facultad,
        carrera_departamento: carrera,
        director_nombre: directorNombre,
        director_cargo: directorCargo
      });

      setInstitucion(updated);
      setMensaje('¡Datos institucionales actualizados correctamente para las hojas oficiales!');
      setTimeout(() => setMensaje(''), 4000);
    } catch (err) {
      setError(err.message || 'Error al actualizar datos institucionales');
    } finally {
      setGuardandoInst(false);
    }
  };

  const handleEliminarProfesor = async (id, nombreP) => {
    if (!window.confirm(`¿Estás seguro de desactivar al docente ${nombreP}?`)) return;
    try {
      await deleteProfesor(id);
      setProfesores(prev => prev.filter(p => p.id !== id));
      setMensaje(`Docente ${nombreP} desactivado`);
      if (onProfesorActualizado) onProfesorActualizado();
    } catch (err) {
      setError(err.message || 'Error al eliminar profesor');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      
      {/* Encabezado */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">
          Administración de Docentes y Parámetros Institucionales
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Configura los profesores habilitados para reportar horas y los datos que aparecen en el membrete y firmas de las hojas oficiales.
        </p>
      </div>

      {mensaje && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center space-x-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="text-sm font-medium">{mensaje}</span>
        </div>
      )}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl flex items-center space-x-2 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Formulario: Agregar Nuevo Profesor */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-indigo-600 font-bold text-lg border-b border-slate-100 pb-3">
            <UserPlus className="w-5 h-5" />
            <h3>Registrar Nuevo Docente</h3>
          </div>

          <form onSubmit={handleCrearProfesor} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cédula / Identificación</label>
              <input
                type="text"
                required
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                placeholder="Ej. 1712345678"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre Completo y Título</label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Mgs. Carlos Andrés Paredes"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Correo Institucional</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="carlos.paredes@universidad.edu"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Departamento / Carrera</label>
              <input
                type="text"
                required
                value={departamento}
                onChange={(e) => setDepartamento(e.target.value)}
                placeholder="Ej. Sistemas e Informática"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Dedicación</label>
                <select
                  value={tipoJornada}
                  onChange={(e) => {
                    setTipoJornada(e.target.value);
                    if (e.target.value.includes('8h')) setHorasDiarias(8.0);
                    if (e.target.value.includes('4h')) setHorasDiarias(4.0);
                    if (e.target.value.includes('6h')) setHorasDiarias(6.0);
                  }}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Tiempo Completo (8h)">Tiempo Completo (8h)</option>
                  <option value="Medio Tiempo (4h)">Medio Tiempo (4h)</option>
                  <option value="Tiempo Parcial (6h)">Tiempo Parcial (6h)</option>
                  <option value="Por Horas">Personalizado / Por Horas</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Horas Diarias</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="12"
                  value={horasDiarias}
                  onChange={(e) => setHorasDiarias(parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={guardandoDocente}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center cursor-pointer"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {guardandoDocente ? 'Guardando...' : 'Crear Docente'}
            </button>
          </form>
        </div>

        {/* Formulario: Configuración Institucional y Firmas */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-slate-800 font-bold text-lg border-b border-slate-100 pb-3">
            <Building className="w-5 h-5 text-indigo-600" />
            <h3>Datos Institucionales y Firmas Oficiales</h3>
          </div>

          <form onSubmit={handleGuardarInstitucion} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre de la Institución / Universidad</label>
              <input
                type="text"
                required
                value={nombreInst}
                onChange={(e) => setNombreInst(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Facultad</label>
              <input
                type="text"
                required
                value={facultad}
                onChange={(e) => setFacultad(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Carrera / Departamento</label>
              <input
                type="text"
                required
                value={carrera}
                onChange={(e) => setCarrera(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre de la Autoridad que Firma (Decano/Director)</label>
              <input
                type="text"
                required
                value={directorNombre}
                onChange={(e) => setDirectorNombre(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cargo Oficial de la Autoridad</label>
              <input
                type="text"
                required
                value={directorCargo}
                onChange={(e) => setDirectorCargo(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={guardandoInst}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center cursor-pointer"
            >
              <Save className="w-4 h-4 mr-2" />
              {guardandoInst ? 'Guardando...' : 'Actualizar Membrete y Firmas'}
            </button>
          </form>
        </div>

      </div>

      {/* Lista de Profesores Activos */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2 text-indigo-600" />
          Plantilla Docente Activa ({profesores.length} profesores)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                <th className="py-2.5 px-3">Docente</th>
                <th className="py-2.5 px-3">Cédula</th>
                <th className="py-2.5 px-3">Departamento</th>
                <th className="py-2.5 px-3">Jornada Diaria</th>
                <th className="py-2.5 px-3">Correo</th>
                <th className="py-2.5 px-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {profesores.map(p => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-semibold text-slate-900">{p.nombre}</td>
                  <td className="py-3 px-3 text-slate-600 font-mono text-xs">{p.cedula}</td>
                  <td className="py-3 px-3 text-slate-700 text-xs">{p.departamento}</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                      <Clock className="w-3 h-3 mr-1" />
                      {p.horas_diarias} hrs/día
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-500 text-xs">{p.email || '-'}</td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleEliminarProfesor(p.id, p.nombre)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                      title="Desactivar docente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
