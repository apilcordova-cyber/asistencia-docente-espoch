import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  Share2, 
  FlaskConical, 
  Briefcase, 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  Sparkles, 
  FileEdit,
  History,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import PilarHorasCard from './PilarHorasCard';
import MedidorJornada from './MedidorJornada';
import { saveAsistencia, getAsistencias } from '../api';

const getEcuadorToday = () => {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil' }).format(new Date());
  } catch (e) {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
};

export default function RegistroDiario({ profesorActivo, onRegistroGuardado }) {
  const todayStr = getEcuadorToday();
  const [fecha, setFecha] = useState(todayStr);

  const [horaEntrada, setHoraEntrada] = useState('08:00');
  const [horaSalida, setHoraSalida] = useState('16:30');
  const [horasDocencia, setHorasDocencia] = useState(4.0);
  const [horasVinculacion, setHorasVinculacion] = useState(1.0);
  const [horasInvestigacion, setHorasInvestigacion] = useState(2.0);
  const [horasGestion, setHorasGestion] = useState(1.0);
  const [detalleActividades, setDetalleActividades] = useState('');
  const [observaciones, setObservaciones] = useState('');
  
  const [cargando, setCargando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const [historialReciente, setHistorialReciente] = useState([]);

  const jornadaObjetivo = profesorActivo?.horas_diarias || 8.0;

  useEffect(() => {
    if (!profesorActivo?.id) return;
    cargarRegistroDeFecha();
    cargarHistorialReciente();
  }, [profesorActivo, fecha]);

  const cargarRegistroDeFecha = async () => {
    try {
      const records = await getAsistencias({ profesor_id: profesorActivo.id, fecha });
      if (records && records.length > 0) {
        const r = records[0];
        setHoraEntrada(r.hora_entrada);
        setHoraSalida(r.hora_salida);
        setHorasDocencia(r.horas_docencia);
        setHorasVinculacion(r.horas_vinculacion);
        setHorasInvestigacion(r.horas_investigacion);
        setHorasGestion(r.horas_gestion);
        setDetalleActividades(r.detalle_actividades || '');
        setObservaciones(r.observaciones || '');
      } else {
        const docenciaDefault = Math.min(4.0, jornadaObjetivo);
        const invDefault = Math.max(0, Math.min(2.0, jornadaObjetivo - docenciaDefault));
        const rest = Math.max(0, jornadaObjetivo - docenciaDefault - invDefault);
        const vincDefault = rest >= 1.0 ? 1.0 : 0.0;
        const gestDefault = Math.max(0, rest - vincDefault);

        setHorasDocencia(docenciaDefault);
        setHorasInvestigacion(invDefault);
        setHorasVinculacion(vincDefault);
        setHorasGestion(gestDefault);
        setDetalleActividades('');
        setObservaciones('');
      }
    } catch (err) {
      console.error('Error cargando registro:', err);
    }
  };

  const cargarHistorialReciente = async () => {
    try {
      const records = await getAsistencias({ profesor_id: profesorActivo.id });
      setHistorialReciente(records.slice(0, 5));
    } catch (err) {
      console.error('Error cargando historial:', err);
    }
  };

  const marcarHoraActual = (tipo) => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hh}:${mm}`;
    if (tipo === 'entrada') setHoraEntrada(timeStr);
    if (tipo === 'salida') setHoraSalida(timeStr);
  };

  const insertarPlantillaDetalle = () => {
    const plantilla = 
`• Docencia (${horasDocencia}h): Cátedra de [Asignatura], preparación de clases y tutorías.
• Vinculación (${horasVinculacion}h): Coordinación de actividades comunitarias / tutorías de prácticas.
• Investigación (${horasInvestigacion}h): Desarrollo de proyecto de investigación y redacción de artículo científico.
• Gestión (${horasGestion}h): Reunión de área académica y tramitación de expedientes docentes.`;
    setDetalleActividades(plantilla);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensajeExito('');
    setMensajeError('');
    setCargando(true);

    const total = parseFloat(((horasDocencia || 0) + (horasVinculacion || 0) + (horasInvestigacion || 0) + (horasGestion || 0)).toFixed(2));

    try {
      await saveAsistencia({
        profesor_id: profesorActivo.id,
        fecha,
        hora_entrada: horaEntrada,
        hora_salida: horaSalida,
        horas_docencia: horasDocencia,
        horas_vinculacion: horasVinculacion,
        horas_investigacion: horasInvestigacion,
        horas_gestion: horasGestion,
        detalle_actividades: detalleActividades,
        observaciones: observaciones
      });

      setMensajeExito('¡Registro de asistencia guardado exitosamente!');
      if (total === jornadaObjetivo) {
        confetti({
          particleCount: 65,
          spread: 60,
          origin: { y: 0.7 }
        });
      }

      await cargarHistorialReciente();
      if (onRegistroGuardado) onRegistroGuardado();
      
      setTimeout(() => setMensajeExito(''), 4000);
    } catch (err) {
      setMensajeError(err.message || 'Error al guardar la asistencia');
    } finally {
      setCargando(false);
    }
  };

  const cambiarDia = (offset) => {
    const d = new Date(fecha + 'T12:00:00');
    d.setDate(d.getDate() + offset);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setFecha(`${y}-${m}-${day}`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      
      {/* Encabezado con selector de fecha */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Módulo de Registro Diario
            </span>
            <span className="text-xs text-slate-500">
              Sustituto Oficial de Firma en Papel
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">
            Registro de Jornada y Actividades
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Docente: <strong className="text-slate-800">{profesorActivo?.nombre}</strong> — Jornada: <strong className="text-indigo-600">{jornadaObjetivo} hrs/día</strong> ({profesorActivo?.tipo_jornada})
          </p>
        </div>

        {/* Selector de Fecha */}
        <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <button 
            type="button" 
            onClick={() => cambiarDia(-1)}
            className="p-1.5 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition-all text-xs font-semibold"
            title="Día anterior"
          >
            ← Anterior
          </button>
          <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <input 
              type="date" 
              value={fecha} 
              onChange={(e) => setFecha(e.target.value)}
              className="text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer"
            />
          </div>
          <button 
            type="button" 
            onClick={() => setFecha(todayStr)}
            className="px-2.5 py-1 text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-all"
          >
            Hoy
          </button>
          <button 
            type="button" 
            onClick={() => cambiarDia(1)}
            className="p-1.5 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition-all text-xs font-semibold"
            title="Día siguiente"
          >
            Siguiente →
          </button>
        </div>
      </div>

      {/* Alertas */}
      {mensajeExito && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center space-x-2 shadow-xs animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="text-sm font-medium">{mensajeExito}</span>
        </div>
      )}
      {mensajeError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl flex items-center space-x-2 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span className="text-sm font-medium">{mensajeError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Horarios de Marcación */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 flex items-center mb-4">
            <Clock className="w-5 h-5 mr-2 text-indigo-600" />
            Horario de Asistencia
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Hora de Entrada
                </label>
                <button
                  type="button"
                  onClick={() => marcarHoraActual('entrada')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline cursor-pointer"
                >
                  Marcar ahora
                </button>
              </div>
              <input 
                type="time" 
                required
                value={horaEntrada} 
                onChange={(e) => setHoraEntrada(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-base font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Hora de Salida
                </label>
                <button
                  type="button"
                  onClick={() => marcarHoraActual('salida')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline cursor-pointer"
                >
                  Marcar ahora
                </button>
              </div>
              <input 
                type="time" 
                required
                value={horaSalida} 
                onChange={(e) => setHoraSalida(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-base font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Las 4 Funciones Sustantivas */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-amber-500" />
                Distribución de Horas por Función Sustantiva
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Reporta las horas efectivas realizadas en cada área de tu jornada laboral.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-500">Jornada esperada:</span>
              <div className="text-base font-bold text-slate-900">{jornadaObjetivo} hrs requeridas</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PilarHorasCard
              titulo="Docencia"
              subtitulo="Clases, preparación de materias, evaluaciones, tutorías"
              icon={BookOpen}
              color="blue"
              horas={horasDocencia}
              setHoras={setHorasDocencia}
              presets={[2, 4, 6]}
            />
            <PilarHorasCard
              titulo="Vinculación con la Sociedad"
              subtitulo="Proyectos comunitarios, prácticas de estudiantes, convenios"
              icon={Share2}
              color="emerald"
              horas={horasVinculacion}
              setHoras={setHorasVinculacion}
              presets={[1, 2, 3]}
            />
            <PilarHorasCard
              titulo="Investigación"
              subtitulo="Proyectos I+D, redacción de papers, semilleros de investigación"
              icon={FlaskConical}
              color="purple"
              horas={horasInvestigacion}
              setHoras={setHorasInvestigacion}
              presets={[1, 2, 4]}
            />
            <PilarHorasCard
              titulo="Gestión Académica"
              subtitulo="Claustros, comisiones, acreditación, tareas administrativas"
              icon={Briefcase}
              color="amber"
              horas={horasGestion}
              setHoras={setHorasGestion}
              presets={[1, 2, 3]}
            />
          </div>

          {/* Medidor en Vivo de Cumplimiento de Jornada */}
          <MedidorJornada
            horasDocencia={horasDocencia}
            horasVinculacion={horasVinculacion}
            horasInvestigacion={horasInvestigacion}
            horasGestion={horasGestion}
            jornadaObjetivo={jornadaObjetivo}
          />
        </div>

        {/* Bitácora de Actividades */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center">
                <FileEdit className="w-5 h-5 mr-2 text-indigo-600" />
                Detalle y Bitácora de Actividades Realizadas
              </h3>
              <p className="text-xs text-slate-500">
                Breve descripción de lo trabajado hoy. Este texto se incluirá en la hoja oficial de asistencia.
              </p>
            </div>
            <button
              type="button"
              onClick={insertarPlantillaDetalle}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all"
            >
              + Insertar Plantilla
            </button>
          </div>

          <textarea
            rows="4"
            value={detalleActividades}
            onChange={(e) => setDetalleActividades(e.target.value)}
            placeholder="Ejemplo: Docencia: Cátedra de Programación en aula 302 y tutorías. Investigación: Redacción de introducción de paper. Gestión: Comisión de evaluación curricular..."
            className="w-full border border-slate-300 rounded-xl p-3.5 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Observaciones o Novedades Opcionales:
            </label>
            <input
              type="text"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ninguna novedad reportada"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Botón de Guardado Principal */}
        <div className="flex items-center justify-end space-x-3">
          <button
            type="submit"
            disabled={cargando}
            className="flex items-center px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-md shadow-indigo-200 hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-5 h-5 mr-2" />
            {cargando ? 'Guardando...' : 'Guardar Registro de Asistencia'}
          </button>
        </div>

      </form>

      {/* Historial Reciente */}
      {historialReciente.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 flex items-center mb-4">
            <History className="w-5 h-5 mr-2 text-slate-600" />
            Tus Últimos Registros Guardados
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Horario</th>
                  <th className="py-2.5 px-3">Docencia</th>
                  <th className="py-2.5 px-3">Vinculación</th>
                  <th className="py-2.5 px-3">Investigación</th>
                  <th className="py-2.5 px-3">Gestión</th>
                  <th className="py-2.5 px-3">Total</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historialReciente.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-all">
                    <td className="py-3 px-3 font-semibold text-slate-800">{r.fecha}</td>
                    <td className="py-3 px-3 text-slate-600 text-xs">{r.hora_entrada} - {r.hora_salida}</td>
                    <td className="py-3 px-3 text-blue-700 font-medium">{r.horas_docencia}h</td>
                    <td className="py-3 px-3 text-emerald-700 font-medium">{r.horas_vinculacion}h</td>
                    <td className="py-3 px-3 text-purple-700 font-medium">{r.horas_investigacion}h</td>
                    <td className="py-3 px-3 text-amber-700 font-medium">{r.horas_gestion}h</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{r.total_horas}h</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        r.estado === 'COMPLETO' ? 'bg-emerald-100 text-emerald-800' :
                        r.estado === 'SOBRETIEMPO' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {r.estado}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setFecha(r.fecha);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs inline-flex items-center"
                      >
                        <FileEdit className="w-3.5 h-3.5 mr-1" />
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
