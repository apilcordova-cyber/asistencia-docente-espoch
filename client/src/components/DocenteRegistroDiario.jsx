import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, BookOpen, Share2, FlaskConical, Briefcase, 
  CheckCircle2, AlertTriangle, Save, Sparkles, FileEdit, History, Lock, 
  Sun, Moon, Check, ArrowRight, Layers, ChevronLeft, ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import PilarHorasCard from './PilarHorasCard';
import MedidorJornada from './MedidorJornada';
import { getDocenteAsistencias, saveDocenteAsistencia, getDocenteShiftStatus } from '../api';

function calcularHorasRango(inicio, fin) {
  if (!inicio || !fin) return 0;
  const [h1, m1] = inicio.split(':').map(Number);
  const [h2, m2] = fin.split(':').map(Number);
  let mins = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (mins < 0) mins += 24 * 60;
  return parseFloat((mins / 60).toFixed(2));
}

const getEcuadorToday = () => {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil' }).format(new Date());
  } catch (e) {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
};

export default function DocenteRegistroDiario({ user, usuario, onIrAHoja }) {
  const currentUser = user || usuario;
  const todayStr = getEcuadorToday();
  const [fecha, setFecha] = useState(todayStr);

  // Estado de activación de la jornada por el Coordinador
  const [shiftControl, setShiftControl] = useState({
    shift_morning_active: 1,
    shift_afternoon_active: 1,
    shift_mode: 'COORDINADOR',
    coordinator_activation_msg: ''
  });

  // Horarios de la jornada diaria (Franja Matutina y Franja Vespertina)
  const [mEntrada, setMEntrada] = useState('07:00');
  const [mSalida, setMSalida] = useState('13:00');
  const [tEntrada, setTEntrada] = useState('15:00');
  const [tSalida, setTSalida] = useState('17:00');

  // Distribución de las 8 Horas en los 4 Pilares
  const [docencia, setDocencia] = useState(4.0);
  const [vinculacion, setVinculacion] = useState(2.0);
  const [investigacion, setInvestigacion] = useState(1.0);
  const [gestion, setGestion] = useState(1.0);

  // Detalle de actividades realizadas
  const [detalleActividades, setDetalleActividades] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [estaBloqueado, setEstaBloqueado] = useState(false);
  const [registroExistente, setRegistroExistente] = useState(null);

  const [cargando, setCargando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const [historialReciente, setHistorialReciente] = useState([]);

  // Total de horas calculadas
  const totalHoras = parseFloat((
    (parseFloat(docencia) || 0) +
    (parseFloat(vinculacion) || 0) +
    (parseFloat(investigacion) || 0) +
    (parseFloat(gestion) || 0)
  ).toFixed(2));

  useEffect(() => {
    cargarRegistroDeFecha();
    cargarHistorial();
    cargarEstadoTurnos();
  }, [fecha]);

  const cargarEstadoTurnos = async () => {
    try {
      const st = await getDocenteShiftStatus();
      if (st) setShiftControl(st);
    } catch (e) {
      console.error('Error al cargar estado de turnos:', e);
    }
  };

  const cargarRegistroDeFecha = async () => {
    try {
      const records = await getDocenteAsistencias({ fecha });
      if (records && records.length > 0) {
        const r = records[0];
        setRegistroExistente(r);
        setEstaBloqueado(r.is_locked === 1);
        setObservaciones(r.notes || '');
        setDocencia(parseFloat(r.docencia_hours) || 0);
        setVinculacion(parseFloat(r.vinculacion_hours) || 0);
        setInvestigacion(parseFloat(r.investigacion_hours) || 0);
        setGestion(parseFloat(r.gestion_hours) || 0);
        setDetalleActividades(r.activities_detail || '');

        // Reconstruir horarios
        if (r.check_in && r.check_in.includes('-')) {
          const [mIn, mOut] = r.check_in.split('-').map(s => s.trim());
          setMEntrada(mIn || '07:00');
          setMSalida(mOut || '13:00');
        } else if (r.check_in) {
          setMEntrada(r.check_in);
          setMSalida('13:00');
        }

        if (r.check_out && r.check_out.includes('-')) {
          const [tIn, tOut] = r.check_out.split('-').map(s => s.trim());
          setTEntrada(tIn || '15:00');
          setTSalida(tOut || '17:00');
        } else if (r.check_out && r.check_out !== 'Pendiente Tarde') {
          setTEntrada('15:00');
          setTSalida(r.check_out || '17:00');
        }
      } else {
        setRegistroExistente(null);
        setEstaBloqueado(false);
        setDocencia(4.0);
        setVinculacion(2.0);
        setInvestigacion(1.0);
        setGestion(1.0);
        setDetalleActividades('');
        setObservaciones('');
        setMEntrada('07:00');
        setMSalida('13:00');
        setTEntrada('15:00');
        setTSalida('17:00');
      }
    } catch (err) {
      console.error('Error al cargar registro:', err);
    }
  };

  const cargarHistorial = async () => {
    try {
      const records = await getDocenteAsistencias();
      setHistorialReciente(records.slice(0, 5));
    } catch (err) {
      console.error('Error al cargar historial:', err);
    }
  };

  const handleGuardarAsistencia = async (e) => {
    if (e) e.preventDefault();
    setMensajeExito('');
    setMensajeError('');

    if (totalHoras !== 8.0) {
      setMensajeError(
        totalHoras < 8.0
          ? `Registro bloqueado: Debe registrar estrictamente las 8.0 horas reglamentarias (actualmente suma ${totalHoras} hrs, faltan ${(8.0 - totalHoras).toFixed(1)} hrs). Ajuste las funciones sustantivas.`
          : `Registro bloqueado: Su registro excede la jornada de 8.0 horas reglamentarias (actualmente suma ${totalHoras} hrs, sobran ${(totalHoras - 8.0).toFixed(1)} hrs). Debe registrar estrictamente 8.0 horas exactas.`
      );
      return;
    }

    setCargando(true);

    const checkInStr = `${mEntrada} - ${mSalida}`;
    const checkOutStr = `${tEntrada} - ${tSalida}`;

    const payload = {
      date: fecha,
      check_in: checkInStr,
      check_out: checkOutStr,
      docencia_hours: docencia,
      vinculacion_hours: vinculacion,
      investigacion_hours: investigacion,
      gestion_hours: gestion,
      activities_detail: detalleActividades || `Docencia: ${docencia}h | Vinculación: ${vinculacion}h | Investigación: ${investigacion}h | Gestión: ${gestion}h (Cumplimiento de Jornada 8.0h)`,
      notes: JSON.stringify({
        horario: `Mañana: ${mEntrada}-${mSalida} | Tarde: ${tEntrada}-${tSalida}`
      })
    };

    try {
      await saveDocenteAsistencia(payload);
      setMensajeExito(`¡Jornada diaria completa registrada exitosamente (8.0 horas exactas)!`);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      await cargarHistorial();
      await cargarRegistroDeFecha();
      setTimeout(() => setMensajeExito(''), 4500);
    } catch (err) {
      setMensajeError(err.message || 'Error al guardar la asistencia');
    } finally {
      setCargando(false);
    }
  };

  const cambiarDia = (delta) => {
    const d = new Date(fecha + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setFecha(`${y}-${m}-${day}`);
  };

  const isJornadaHabilitada = shiftControl.shift_mode !== 'CERRADO' && (shiftControl.shift_morning_active !== 0 || shiftControl.shift_afternoon_active !== 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      
      {/* 1. Barra de Control de Fecha y Estado de Habilitación */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-[#D7D6D7]/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Selector de fecha */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => cambiarDia(-1)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="Día anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200">
              <Calendar className="w-4 h-4 text-[#A60809]" />
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="text-xs sm:text-sm font-bold bg-transparent text-slate-800 focus:outline-none cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={() => cambiarDia(1)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="Día siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {fecha !== todayStr && (
              <button
                type="button"
                onClick={() => setFecha(todayStr)}
                className="px-3 py-1.5 rounded-xl bg-[#A60809]/10 text-[#810404] hover:bg-[#A60809]/20 text-xs font-bold transition-colors cursor-pointer"
              >
                Hoy
              </button>
            )}
          </div>

          {/* Insignia de Habilitación por el Coordinador */}
          <div className="flex items-center gap-2">
            <div className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-2xl border text-xs font-bold ${
              isJornadaHabilitada
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isJornadaHabilitada ? 'bg-emerald-600 animate-pulse' : 'bg-rose-600'}`} />
              <span>
                {isJornadaHabilitada ? 'Sistema Habilitado (8.0 Horas Reglamentarias)' : 'Registro en Pausa por Coordinación'}
              </span>
            </div>

            {estaBloqueado && (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold">
                <Lock className="w-3.5 h-3.5" />
                <span>Bloqueado</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Alertas de Éxito o Error */}
      {mensajeExito && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs sm:text-sm font-semibold flex items-center space-x-2 shadow-xs animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {mensajeError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs sm:text-sm font-semibold flex items-center space-x-2 shadow-xs animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{mensajeError}</span>
        </div>
      )}

      {/* 2. FORMULARIO UNIFICADO DE JORNADA LABORAL DIARIA (TODO EN UNO) */}
      <form onSubmit={handleGuardarAsistencia} className="space-y-6">

        {/* Tarjeta de Horario y Modalidad */}
        {/* Tarjeta de Horario de la Jornada Laboral */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#D7D6D7]/80 shadow-xs space-y-5">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-[#A60809]/10 text-[#A60809] flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Horario de la Jornada Laboral
              </h2>
              <p className="text-xs text-slate-500">
                Registra los horarios de entrada y salida de tu jornada diaria (Franja Matutina y Franja Vespertina).
              </p>
            </div>
          </div>

          {/* Inputs de Horario: Franja Matutina y Franja Vespertina */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Franja 1: Mañana */}
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sun className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Franja Matutina (07h00 - 13h00)
                  </span>
                </div>
                <span className="text-xs font-bold text-amber-800">
                  {calcularHorasRango(mEntrada, mSalida)} hrs
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Entrada Mañana</label>
                  <input
                    type="time"
                    value={mEntrada}
                    onChange={(e) => setMEntrada(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm font-bold bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A60809]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Salida Mañana</label>
                  <input
                    type="time"
                    value={mSalida}
                    onChange={(e) => setMSalida(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm font-bold bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A60809]"
                  />
                </div>
              </div>
            </div>

            {/* Franja 2: Tarde */}
            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Franja Vespertina (15h00 - 21h00)
                  </span>
                </div>
                <span className="text-xs font-bold text-indigo-800">
                  {calcularHorasRango(tEntrada, tSalida)} hrs
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Entrada Tarde</label>
                  <input
                    type="time"
                    value={tEntrada}
                    onChange={(e) => setTEntrada(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm font-bold bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A60809]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Salida Tarde</label>
                  <input
                    type="time"
                    value={tSalida}
                    onChange={(e) => setTSalida(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm font-bold bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A60809]"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 3. DISTRIBUCIÓN DE LAS 8 HORAS EN LOS 4 PILARES */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-black text-slate-900">
              Distribución de Funciones Sustantivas (Meta: 8.0 Horas)
            </h3>
            <span className="text-xs font-medium text-slate-500">
              Usa los botones + y - para ajustar tus horas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <PilarHorasCard
              titulo="Docencia"
              subtitulo="Clases, talleres y preparación"
              icon={BookOpen}
              color="docencia"
              horas={docencia}
              setHoras={setDocencia}
              presets={[2, 3, 4, 5]}
            />
            <PilarHorasCard
              titulo="Vinculación"
              subtitulo="Proyectos y convenios con la sociedad"
              icon={Share2}
              color="vinculacion"
              horas={vinculacion}
              setHoras={setVinculacion}
              presets={[1, 2, 3]}
            />
            <PilarHorasCard
              titulo="Investigación"
              subtitulo="Proyectos, papers y ponencias"
              icon={FlaskConical}
              color="investigacion"
              horas={investigacion}
              setHoras={setInvestigacion}
              presets={[1, 2, 3]}
            />
            <PilarHorasCard
              titulo="Gestión"
              subtitulo="Comisiones, reuniones y claustral"
              icon={Briefcase}
              color="gestion"
              horas={gestion}
              setHoras={setGestion}
              presets={[1, 2, 3]}
            />
          </div>
        </div>

        {/* 4. MEDIDOR DINÁMICO DE 8 HORAS EN TIEMPO REAL */}
        <MedidorJornada
          horasDocencia={docencia}
          horasVinculacion={vinculacion}
          horasInvestigacion={investigacion}
          horasGestion={gestion}
          jornadaObjetivo={8.0}
        />


        {/* 6. BOTÓN DE GUARDADO PRINCIPAL */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            {totalHoras !== 8.0 ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  {totalHoras < 8.0 
                    ? `Botón bloqueado: Faltan ${(8.0 - totalHoras).toFixed(1)} hrs para completar las 8.0 hrs exactas.` 
                    : `Botón bloqueado: Excede por ${(totalHoras - 8.0).toFixed(1)} hrs. La jornada debe ser estrictamente de 8.0 hrs.`}
                </span>
              </div>
            ) : registroExistente ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>8.0 hrs exactas cumplidas. Ya tienes un registro guardado para este día, puedes modificarlo.</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>8.0 hrs exactas cumplidas. Al guardar, tu jornada diaria quedará registrada en el servidor institucional.</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={cargando || estaBloqueado || totalHoras !== 8.0}
            title={
              totalHoras !== 8.0
                ? `El botón está bloqueado: Debe sumar estrictamente 8.0 horas exactas (actualmente: ${totalHoras} hrs)`
                : 'Guardar Asistencia de la Jornada'
            }
            className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-sm transition-all flex items-center justify-center space-x-2 ${
              totalHoras === 8.0 && !estaBloqueado && !cargando
                ? 'bg-[#A60809] hover:bg-[#810404] text-white shadow-md shadow-[#A60809]/30 cursor-pointer'
                : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none'
            }`}
          >
            {totalHoras !== 8.0 ? (
              <Lock className="w-5 h-5 text-slate-400" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            <span>
              {cargando 
                ? 'Guardando...' 
                : totalHoras !== 8.0 
                  ? `Bloqueado: Requiere 8.0 hrs exactas (${totalHoras}/8 hrs)` 
                  : 'Guardar Asistencia de la Jornada (8 hrs)'}
            </span>
          </button>
        </div>

      </form>

      {/* 7. HISTORIAL RECIENTE DE ASISTENCIAS */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#D7D6D7]/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <History className="w-5 h-5 text-[#A60809]" />
            <h4 className="text-sm font-black text-slate-900">
              Últimos Registros Guardados
            </h4>
          </div>
          {onIrAHoja && (
            <button
              type="button"
              onClick={onIrAHoja}
              className="text-xs font-bold text-[#A60809] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Ver Hoja Mensual Completa</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold">
                <th className="py-2.5 px-3">Fecha</th>
                <th className="py-2.5 px-3">Horario</th>
                <th className="py-2.5 px-2 text-center">Doc</th>
                <th className="py-2.5 px-2 text-center">Vinc</th>
                <th className="py-2.5 px-2 text-center">Inv</th>
                <th className="py-2.5 px-2 text-center">Gest</th>
                <th className="py-2.5 px-3 text-right">Total</th>
                <th className="py-2.5 px-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historialReciente.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-6 text-center text-slate-400 font-medium">
                    No tienes registros de asistencia guardados aún.
                  </td>
                </tr>
              ) : (
                historialReciente.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-bold text-slate-800">{h.date}</td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                      {h.check_in} {h.check_out && h.check_out !== 'Pendiente Tarde' ? `| ${h.check_out}` : ''}
                    </td>
                    <td className="py-2.5 px-2 text-center font-bold text-[#810404]">{h.docencia_hours || 0}</td>
                    <td className="py-2.5 px-2 text-center text-slate-600">{h.vinculacion_hours || 0}</td>
                    <td className="py-2.5 px-2 text-center text-slate-600">{h.investigacion_hours || 0}</td>
                    <td className="py-2.5 px-2 text-center text-slate-600">{h.gestion_hours || 0}</td>
                    <td className="py-2.5 px-3 text-right font-black text-slate-900">{h.total_hours}h</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        h.total_hours >= 8.0 
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {h.total_hours >= 8.0 ? '8h Completo' : `${h.total_hours}h`}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
