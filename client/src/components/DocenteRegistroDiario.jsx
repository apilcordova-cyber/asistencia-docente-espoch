import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, BookOpen, Share2, FlaskConical, Briefcase, 
  CheckCircle2, AlertTriangle, Save, Sparkles, FileEdit, History, Lock, 
  Sun, Moon, Check, ArrowRight, Layers
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

export default function DocenteRegistroDiario({ user, usuario }) {
  const currentUser = user || usuario;
  const todayStr = new Date().toISOString().split('T')[0];
  const [fecha, setFecha] = useState(todayStr);

  // Estado de activación de turnos por el Coordinador
  const [shiftControl, setShiftControl] = useState({
    shift_morning_active: 1,
    shift_afternoon_active: 1,
    shift_mode: 'COORDINADOR',
    coordinator_activation_msg: ''
  });

  // Turno activo en pantalla: 'manana' | 'tarde' | 'consolidado'
  const horaActualNum = new Date().getHours();
  const [turnoActivo, setTurnoActivo] = useState(horaActualNum >= 14 ? 'tarde' : 'manana');

  // ================= TURNO 1: MATUTINO (07h00 a 13h00) =================
  const [mEntrada, setMEntrada] = useState('07:00');
  const [mSalida, setMSalida] = useState('13:00');
  const [mDocencia, setMDocencia] = useState(4.0);
  const [mVinculacion, setMVinculacion] = useState(2.0);
  const [mInvestigacion, setMInvestigacion] = useState(0.0);
  const [mGestion, setMGestion] = useState(0.0);
  const [mDetalle, setMDetalle] = useState('');
  const [mGuardado, setMGuardado] = useState(false);

  // ================= TURNO 2: VESPERTINO (15h00 a 21h00) =================
  const [tEntrada, setTEntrada] = useState('15:00');
  const [tSalida, setTSalida] = useState('17:00');
  const [tDocencia, setTDocencia] = useState(0.0);
  const [tVinculacion, setTVinculacion] = useState(0.0);
  const [tInvestigacion, setTInvestigacion] = useState(1.0);
  const [tGestion, setTGestion] = useState(1.0);
  const [tDetalle, setTDetalle] = useState('');
  const [tGuardado, setTGuardado] = useState(false);

  // Observaciones generales
  const [observaciones, setObservaciones] = useState('');
  const [estaBloqueado, setEstaBloqueado] = useState(false);

  const [cargando, setCargando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const [historialReciente, setHistorialReciente] = useState([]);

  // Cálculos de horas de cada turno
  const horasHorarioManana = calcularHorasRango(mEntrada, mSalida);
  const horasHorarioTarde = calcularHorasRango(tEntrada, tSalida);
  const totalHorasHorario = parseFloat((horasHorarioManana + horasHorarioTarde).toFixed(2));

  // Sumas de pilares por turno
  const totalPilaresManana = parseFloat((
    (parseFloat(mDocencia) || 0) +
    (parseFloat(mVinculacion) || 0) +
    (parseFloat(mInvestigacion) || 0) +
    (parseFloat(mGestion) || 0)
  ).toFixed(2));

  const totalPilaresTarde = parseFloat((
    (parseFloat(tDocencia) || 0) +
    (parseFloat(tVinculacion) || 0) +
    (parseFloat(tInvestigacion) || 0) +
    (parseFloat(tGestion) || 0)
  ).toFixed(2));

  // Totales consolidados del día
  const totalDocenciaDia = parseFloat(((parseFloat(mDocencia) || 0) + (parseFloat(tDocencia) || 0)).toFixed(2));
  const totalVinculacionDia = parseFloat(((parseFloat(mVinculacion) || 0) + (parseFloat(tVinculacion) || 0)).toFixed(2));
  const totalInvestigacionDia = parseFloat(((parseFloat(mInvestigacion) || 0) + (parseFloat(tInvestigacion) || 0)).toFixed(2));
  const totalGestionDia = parseFloat(((parseFloat(mGestion) || 0) + (parseFloat(tGestion) || 0)).toFixed(2));

  const totalHorasDia = parseFloat((
    totalDocenciaDia + totalVinculacionDia + totalInvestigacionDia + totalGestionDia
  ).toFixed(2));

  // Horas pendientes en la tarde para totalizar 8.0 horas
  const horasFaltantesPara8h = Math.max(0, parseFloat((8.0 - horasHorarioManana).toFixed(2)));

  // Catálogo de combinaciones flexibles oficiales entre franjas (07h-13h y 15h-21h)
  const COMBINACIONES_SUGERIDAS = [
    {
      id: '4m-4t',
      nombre: '4h + 4h (Equilibrada)',
      tag: '4h + 4h',
      icono: '🎯',
      desc: 'Mañana 08:00-12:00 (4h) + Tarde 15:00-19:00 (4h)',
      mIn: '08:00', mOut: '12:00', mDoc: 3.0, mVinc: 1.0, mInv: 0.0, mGest: 0.0,
      tIn: '15:00', tOut: '19:00', tDoc: 1.0, tVinc: 0.0, tInv: 2.0, tGest: 1.0
    },
    {
      id: '5m-3t',
      nombre: '5h + 3h',
      tag: '5h + 3h',
      icono: '⚡',
      desc: 'Mañana 08:00-13:00 (5h) + Tarde 15:00-18:00 (3h)',
      mIn: '08:00', mOut: '13:00', mDoc: 3.0, mVinc: 2.0, mInv: 0.0, mGest: 0.0,
      tIn: '15:00', tOut: '18:00', tDoc: 1.0, tVinc: 0.0, tInv: 1.0, tGest: 1.0
    },
    {
      id: '6m-2t',
      nombre: '6h + 2h',
      tag: '6h + 2h',
      icono: '⭐',
      desc: 'Mañana 07:00-13:00 (6h) + Tarde 15:00-17:00 (2h)',
      mIn: '07:00', mOut: '13:00', mDoc: 4.0, mVinc: 2.0, mInv: 0.0, mGest: 0.0,
      tIn: '15:00', tOut: '17:00', tDoc: 0.0, tVinc: 0.0, tInv: 1.0, tGest: 1.0
    },
    {
      id: '3m-5t',
      nombre: '3h + 5h',
      tag: '3h + 5h',
      icono: '🌙',
      desc: 'Mañana 09:00-12:00 (3h) + Tarde 15:00-20:00 (5h)',
      mIn: '09:00', mOut: '12:00', mDoc: 2.0, mVinc: 1.0, mInv: 0.0, mGest: 0.0,
      tIn: '15:00', tOut: '20:00', tDoc: 2.0, tVinc: 0.0, tInv: 2.0, tGest: 1.0
    },
    {
      id: '2m-6t',
      nombre: '2h + 6h',
      tag: '2h + 6h',
      icono: '🌟',
      desc: 'Mañana 07:00-09:00 (2h) + Tarde 15:00-21:00 (6h)',
      mIn: '07:00', mOut: '09:00', mDoc: 2.0, mVinc: 0.0, mInv: 0.0, mGest: 0.0,
      tIn: '15:00', tOut: '21:00', tDoc: 2.0, tVinc: 1.0, tInv: 2.0, tGest: 1.0
    },
    {
      id: '8m-cont',
      nombre: '8h Continua',
      tag: '8h Continua',
      icono: '☀️',
      desc: 'Jornada Continua 07:00-15:00 (8h)',
      mIn: '07:00', mOut: '15:00', mDoc: 4.0, mVinc: 2.0, mInv: 1.0, mGest: 1.0,
      tIn: '15:00', tOut: '15:00', tDoc: 0.0, tVinc: 0.0, tInv: 0.0, tGest: 0.0
    }
  ];

  const aplicarCombinacion = (cfg) => {
    setMEntrada(cfg.mIn);
    setMSalida(cfg.mOut);
    setMDocencia(cfg.mDoc);
    setMVinculacion(cfg.mVinc);
    setMInvestigacion(cfg.mInv);
    setMGestion(cfg.mGest);

    setTEntrada(cfg.tIn);
    setTSalida(cfg.tOut);
    setTDocencia(cfg.tDoc);
    setTVinculacion(cfg.tVinc);
    setTInvestigacion(cfg.tInv);
    setTGestion(cfg.tGest);

    setMensajeExito(`Combinación aplicada: ${cfg.nombre} (${cfg.desc})`);
    setTimeout(() => setMensajeExito(''), 4000);
  };

  const autoAjustarTardePara8h = () => {
    const horasRestantes = Math.max(0, Math.min(6, parseFloat((8.0 - horasHorarioManana).toFixed(2))));
    const [hIn, mIn] = tEntrada.split(':').map(Number);
    const totalMins = Math.round((hIn * 60 + mIn) + (horasRestantes * 60));
    const hOut = Math.floor(totalMins / 60);
    const mOut = totalMins % 60;
    const hOutStr = (hOut < 10 ? '0' : '') + hOut;
    const mOutStr = (mOut < 10 ? '0' : '') + mOut;
    setTSalida(`${hOutStr}:${mOutStr}`);

    // Distribuir horas en la tarde
    if (horasRestantes >= 4) {
      setTDocencia(parseFloat((horasRestantes - 3).toFixed(2)));
      setTInvestigacion(2.0);
      setTGestion(1.0);
      setTVinculacion(0.0);
    } else if (horasRestantes === 3) {
      setTDocencia(0.0);
      setTInvestigacion(1.5);
      setTGestion(1.5);
      setTVinculacion(0.0);
    } else if (horasRestantes === 2) {
      setTDocencia(0.0);
      setTInvestigacion(1.0);
      setTGestion(1.0);
      setTVinculacion(0.0);
    } else if (horasRestantes > 0) {
      setTDocencia(0.0);
      setTInvestigacion(horasRestantes);
      setTGestion(0.0);
      setTVinculacion(0.0);
    }

    setMensajeExito(`Turno Vespertino ajustado con éxito a ${horasRestantes}h (${tEntrada} a ${hOutStr}:${mOutStr}) para completar exactamente las 8.0 horas.`);
    setTimeout(() => setMensajeExito(''), 4500);
  };

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
        setEstaBloqueado(r.is_locked === 1);
        setObservaciones(r.notes || '');

        // Intentar parsear estructura guardada de tramos en notes o reconstruir
        let parseado = false;
        if (r.notes && r.notes.startsWith('{') && r.notes.endsWith('}')) {
          try {
            const dataObj = JSON.parse(r.notes);
            if (dataObj.tramo_manana) {
              setMEntrada(dataObj.tramo_manana.in || '07:00');
              setMSalida(dataObj.tramo_manana.out || '13:00');
              setMDocencia(dataObj.tramo_manana.docencia || 0);
              setMVinculacion(dataObj.tramo_manana.vinculacion || 0);
              setMInvestigacion(dataObj.tramo_manana.investigacion || 0);
              setMGestion(dataObj.tramo_manana.gestion || 0);
              setMDetalle(dataObj.tramo_manana.detail || '');
              setMGuardado(true);
            }
            if (dataObj.tramo_tarde) {
              setTEntrada(dataObj.tramo_tarde.in || '15:00');
              setTSalida(dataObj.tramo_tarde.out || '17:00');
              setTDocencia(dataObj.tramo_tarde.docencia || 0);
              setTVinculacion(dataObj.tramo_tarde.vinculacion || 0);
              setTInvestigacion(dataObj.tramo_tarde.investigacion || 0);
              setTGestion(dataObj.tramo_tarde.gestion || 0);
              setTDetalle(dataObj.tramo_tarde.detail || '');
              setTGuardado(true);
            }
            parseado = true;
          } catch (e) {
            parseado = false;
          }
        }

        if (!parseado) {
          // Si no tiene JSON en notes, deserializar desde check_in / check_out
          if (r.check_in && r.check_in.includes('-')) {
            const [cin1, cout1] = r.check_in.split('-').map(s => s.trim());
            setMEntrada(cin1 || '07:00');
            setMSalida(cout1 || '13:00');
            setMGuardado(true);
          } else {
            setMEntrada(r.check_in || '07:00');
            setMSalida('13:00');
            setMGuardado(true);
          }

          if (r.check_out && r.check_out.includes('-')) {
            const [cin2, cout2] = r.check_out.split('-').map(s => s.trim());
            setTEntrada(cin2 || '15:00');
            setTSalida(cout2 || '17:00');
            setTGuardado(true);
          } else {
            setTEntrada('15:00');
            setTSalida(r.check_out || '17:00');
            setTGuardado(r.total_hours >= 7);
          }

          setMDocencia(Math.min(4.0, r.docencia_hours || 0));
          setTDocencia(Math.max(0, (r.docencia_hours || 0) - 4.0));
          setMVinculacion(r.vinculacion_hours || 0);
          setTInvestigacion(r.investigacion_hours || 0);
          setTGestion(r.gestion_hours || 0);
          setMDetalle(r.activities_detail || '');
        }

        // Si la mañana ya está guardada y es por la tarde, abrir turno tarde
        if (horaActualNum >= 14 && (r.check_out === 'Pendiente Tarde' || (r.total_hours && r.total_hours < 8))) {
          setTurnoActivo('tarde');
        } else if (r.total_hours >= 8) {
          setTurnoActivo('consolidado');
        }
      } else {
        // Registro nuevo en blanco
        setMEntrada('07:00');
        setMSalida('13:00');
        setMDocencia(4.0);
        setMVinculacion(2.0);
        setMInvestigacion(0.0);
        setMGestion(0.0);
        setMDetalle('');
        setMGuardado(false);

        setTEntrada('15:00');
        setTSalida('17:00');
        setTDocencia(0.0);
        setTVinculacion(0.0);
        setTInvestigacion(1.0);
        setTGestion(1.0);
        setTDetalle('');
        setTGuardado(false);

        setObservaciones('');
        setEstaBloqueado(false);
        setTurnoActivo(horaActualNum >= 14 ? 'tarde' : 'manana');
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

  // Guardar Turno Matutino (Etapa 1)
  const handleGuardarManana = async () => {
    setCargando(true);
    setMensajeExito('');
    setMensajeError('');

    const jsonTramos = JSON.stringify({
      tramo_manana: {
        in: mEntrada,
        out: mSalida,
        horas: horasHorarioManana,
        docencia: mDocencia,
        vinculacion: mVinculacion,
        investigacion: mInvestigacion,
        gestion: mGestion,
        detail: mDetalle
      },
      tramo_tarde: tGuardado ? {
        in: tEntrada,
        out: tSalida,
        horas: horasHorarioTarde,
        docencia: tDocencia,
        vinculacion: tVinculacion,
        investigacion: tInvestigacion,
        gestion: tGestion,
        detail: tDetalle
      } : null
    });

    const checkInStr = `${mEntrada} - ${mSalida}`;
    const checkOutStr = tGuardado ? `${tEntrada} - ${tSalida}` : 'Pendiente Tarde';

    const totDoc = tGuardado ? totalDocenciaDia : mDocencia;
    const totVinc = tGuardado ? totalVinculacionDia : mVinculacion;
    const totInv = tGuardado ? totalInvestigacionDia : mInvestigacion;
    const totGest = tGuardado ? totalGestionDia : mGestion;

    const detalleCompleto = tGuardado 
      ? `[Mañana ${mEntrada}-${mSalida}]: ${mDetalle || 'Actividades de docencia y vinculación'} | [Tarde ${tEntrada}-${tSalida}]: ${tDetalle || 'Actividades de investigación y gestión'}`
      : `[Mañana ${mEntrada}-${mSalida} (${horasHorarioManana}h)]: ${mDetalle || 'Actividades de docencia y vinculación'}`;

    try {
      await saveDocenteAsistencia({
        date: fecha,
        check_in: checkInStr,
        check_out: checkOutStr,
        docencia_hours: totDoc,
        vinculacion_hours: totVinc,
        investigacion_hours: totInv,
        gestion_hours: totGest,
        activities_detail: detalleCompleto,
        notes: jsonTramos
      });

      setMGuardado(true);
      setMensajeExito(`¡Turno Matutino guardado con éxito (${horasHorarioManana}h registradas)! Al volver por la tarde, completa tu Turno Vespertino.`);
      await cargarHistorial();
      setTimeout(() => setMensajeExito(''), 4500);
    } catch (err) {
      setMensajeError(err.message || 'Error al guardar el Turno Matutino');
    } finally {
      setCargando(false);
    }
  };

  // Guardar Turno Vespertino y Consolidar Día (Etapa 2)
  const handleGuardarTarde = async () => {
    setCargando(true);
    setMensajeExito('');
    setMensajeError('');

    const jsonTramos = JSON.stringify({
      tramo_manana: {
        in: mEntrada,
        out: mSalida,
        horas: horasHorarioManana,
        docencia: mDocencia,
        vinculacion: mVinculacion,
        investigacion: mInvestigacion,
        gestion: mGestion,
        detail: mDetalle
      },
      tramo_tarde: {
        in: tEntrada,
        out: tSalida,
        horas: horasHorarioTarde,
        docencia: tDocencia,
        vinculacion: tVinculacion,
        investigacion: tInvestigacion,
        gestion: tGestion,
        detail: tDetalle
      }
    });

    const checkInStr = `${mEntrada} - ${mSalida}`;
    const checkOutStr = `${tEntrada} - ${tSalida}`;

    const detalleCompleto = 
      `[Mañana ${mEntrada}-${mSalida}]: ${mDetalle || 'Actividades matutinas'} | [Tarde ${tEntrada}-${tSalida}]: ${tDetalle || 'Actividades vespertinas'}`;

    try {
      await saveDocenteAsistencia({
        date: fecha,
        check_in: checkInStr,
        check_out: checkOutStr,
        docencia_hours: totalDocenciaDia,
        vinculacion_hours: totalVinculacionDia,
        investigacion_hours: totalInvestigacionDia,
        gestion_hours: totalGestionDia,
        activities_detail: detalleCompleto,
        notes: jsonTramos
      });

      setTGuardado(true);
      setMensajeExito(`¡Jornada diaria completa consolidada exitosamente! (${totalHorasDia} horas registradas en total).`);
      if (totalHorasDia === 8.0) {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.65 } });
      }
      setTurnoActivo('consolidado');
      await cargarHistorial();
      setTimeout(() => setMensajeExito(''), 5000);
    } catch (err) {
      setMensajeError(err.message || 'Error al guardar el Turno Vespertino');
    } finally {
      setCargando(false);
    }
  };

  const cambiarDia = (delta) => {
    const d = new Date(fecha + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    setFecha(d.toISOString().split('T')[0]);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      
      {/* Encabezado Principal */}
      <div className="bg-white rounded-3xl p-6 border border-[#D7D6D7]/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#A60809]/10 text-[#A60809] border border-[#A60809]/20">
              Sistema de Marcación en Dos Tiempos
            </span>
            <span className="text-xs text-slate-500 font-medium">Marketing ESPOCH 2026</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-1">
            Control Diario: Mañana y Tarde (8 Horas)
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Docente: <strong className="text-slate-900">{currentUser?.nombre || (currentUser?.nombres ? `${currentUser.nombres} ${currentUser.apellidos || ''}` : 'Docente')}</strong> — Registra tu asistencia por la mañana (07h-13h) y complétala por la tarde (15h-21h).
          </p>
        </div>

        {/* Selector de Fecha */}
        <div className="flex items-center space-x-2 bg-[#F8F9FA] p-2 rounded-2xl border border-[#D7D6D7]">
          <button 
            type="button" 
            onClick={() => cambiarDia(-1)}
            className="p-1.5 hover:bg-white rounded-xl text-slate-600 hover:text-slate-900 transition-all text-xs font-bold cursor-pointer"
          >
            ← Anterior
          </button>
          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-[#D7D6D7]">
            <Calendar className="w-4 h-4 text-[#A60809]" />
            <input 
              type="date" 
              value={fecha} 
              onChange={(e) => setFecha(e.target.value)}
              className="text-xs sm:text-sm font-bold text-slate-900 focus:outline-none cursor-pointer"
            />
          </div>
          <button 
            type="button" 
            onClick={() => setFecha(todayStr)}
            className="px-2.5 py-1 text-xs font-bold bg-[#A60809]/10 text-[#A60809] hover:bg-[#A60809]/20 rounded-xl transition-all cursor-pointer"
          >
            Hoy
          </button>
          <button 
            type="button" 
            onClick={() => cambiarDia(1)}
            className="p-1.5 hover:bg-white rounded-xl text-slate-600 hover:text-slate-900 transition-all text-xs font-bold cursor-pointer"
          >
            Siguiente →
          </button>
        </div>
      </div>

      {/* Alertas */}
      {mensajeExito && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-2xl flex items-center space-x-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="text-sm font-semibold">{mensajeExito}</span>
        </div>
      )}
      {mensajeError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 px-4 py-3 rounded-2xl flex items-center space-x-2 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span className="text-sm font-semibold">{mensajeError}</span>
        </div>
      )}
      {/* Selector de Combinaciones Flexibles (8 Horas Totales) */}
      <div className="bg-white rounded-3xl p-5 border-2 border-[#D7D6D7]/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-[#A60809]/10 text-[#A60809] font-black text-xs">
              ⚡
            </span>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Combinaciones Flexibles para Completar las 8 Horas Diarias
              </h3>
              <p className="text-[11px] text-slate-500">
                No estás obligado a cumplir 6h en la mañana. Entre las franjas <strong>07h00 a 13h00</strong> (mañana) y <strong>15h00 a 21h00</strong> (tarde) puedes elegir cualquiera de estas combinaciones o personalizar tus horas:
              </p>
            </div>
          </div>
          <span className="text-[11px] font-extrabold px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl self-start sm:self-auto">
            Meta Oficial: 8.0 Horas
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {COMBINACIONES_SUGERIDAS.map((c) => {
            const esActiva = (mEntrada === c.mIn && mSalida === c.mOut && tEntrada === c.tIn && tSalida === c.tOut);
            return (
              <button
                key={c.id}
                type="button"
                disabled={estaBloqueado}
                onClick={() => aplicarCombinacion(c)}
                className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  esActiva
                    ? 'bg-[#A60809] text-white border-[#A60809] shadow-sm ring-2 ring-[#A60809]/30'
                    : 'bg-[#F8F9FA] hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base">{c.icono}</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                    esActiva ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {c.tag}
                  </span>
                </div>
                <div className="mt-1.5">
                  <div className="text-xs font-black leading-tight">{c.nombre}</div>
                  <div className={`text-[10px] mt-0.5 leading-tight ${esActiva ? 'text-white/80' : 'text-slate-500'}`}>
                    {c.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Barra de Navegación de Doble Marcación (2 Tiempos) */}
      <div className="bg-white rounded-3xl p-3 border border-[#D7D6D7]/80 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-2">
        
        {/* BOTÓN TIEMPO 1: MAÑANA */}
        <button
          type="button"
          onClick={() => setTurnoActivo('manana')}
          className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between ${
            turnoActivo === 'manana'
              ? 'bg-[#A60809] text-white border-[#A60809] shadow-sm'
              : 'bg-[#F8F9FA] hover:bg-slate-100 text-slate-700 border-slate-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${turnoActivo === 'manana' ? 'bg-white/20' : 'bg-[#A60809]/10 text-[#A60809]'}`}>
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] uppercase font-extrabold tracking-wider opacity-90">Etapa 1 (07h-13h)</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                  shiftControl.shift_morning_active === 1 
                    ? (turnoActivo === 'manana' ? 'bg-emerald-500/40 text-white' : 'bg-emerald-100 text-emerald-800')
                    : (turnoActivo === 'manana' ? 'bg-amber-400/40 text-white' : 'bg-amber-100 text-amber-800')
                }`}>
                  {shiftControl.shift_morning_active === 1 ? '● Activo' : '🔒 Inactivo'}
                </span>
              </div>
              <div className="text-sm font-black">1. Turno Matutino</div>
              <div className="text-xs opacity-90">{mEntrada} a {mSalida} ({horasHorarioManana}h)</div>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            mGuardado 
              ? (turnoActivo === 'manana' ? 'bg-white text-emerald-800' : 'bg-emerald-100 text-emerald-800')
              : (turnoActivo === 'manana' ? 'bg-white/30 text-white' : 'bg-slate-200 text-slate-600')
          }`}>
            {mGuardado ? '✓ Guardado' : 'Pendiente'}
          </span>
        </button>

        {/* BOTÓN TIEMPO 2: TARDE */}
        <button
          type="button"
          onClick={() => setTurnoActivo('tarde')}
          className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between ${
            turnoActivo === 'tarde'
              ? 'bg-[#810404] text-white border-[#810404] shadow-sm'
              : 'bg-[#F8F9FA] hover:bg-slate-100 text-slate-700 border-slate-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${turnoActivo === 'tarde' ? 'bg-white/20' : 'bg-[#810404]/10 text-[#810404]'}`}>
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] uppercase font-extrabold tracking-wider opacity-90">Etapa 2 (15h-21h)</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                  shiftControl.shift_afternoon_active === 1 
                    ? (turnoActivo === 'tarde' ? 'bg-emerald-500/40 text-white' : 'bg-emerald-100 text-emerald-800')
                    : (turnoActivo === 'tarde' ? 'bg-amber-400/40 text-white' : 'bg-amber-100 text-amber-800')
                }`}>
                  {shiftControl.shift_afternoon_active === 1 ? '● Activo' : '🔒 Inactivo'}
                </span>
              </div>
              <div className="text-sm font-black">2. Turno Vespertino</div>
              <div className="text-xs opacity-90">{tEntrada} a {tSalida} ({horasHorarioTarde}h)</div>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            tGuardado 
              ? (turnoActivo === 'tarde' ? 'bg-white text-emerald-800' : 'bg-emerald-100 text-emerald-800')
              : (turnoActivo === 'tarde' ? 'bg-white/30 text-white' : 'bg-slate-200 text-slate-600')
          }`}>
            {tGuardado ? '✓ Guardado' : 'Pendiente'}
          </span>
        </button>

        {/* BOTÓN RESUMEN DEL DÍA */}
        <button
          type="button"
          onClick={() => setTurnoActivo('consolidado')}
          className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between ${
            turnoActivo === 'consolidado'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-[#F8F9FA] hover:bg-slate-100 text-slate-700 border-slate-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${turnoActivo === 'consolidado' ? 'bg-white/20' : 'bg-slate-200 text-slate-800'}`}>
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-extrabold tracking-wider opacity-90">Consolidado 8 Horas</div>
              <div className="text-sm font-black">Resumen del Día</div>
              <div className="text-xs opacity-90">Total: {totalHorasDia} / 8.0 hrs</div>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            totalHorasDia >= 8.0 
              ? 'bg-emerald-100 text-emerald-800' 
              : 'bg-amber-100 text-amber-800'
          }`}>
            {totalHorasDia >= 8.0 ? '8h Completo' : `${totalHorasDia}h / 8h`}
          </span>
        </button>

      </div>

      {/* ========================================================================= */}
      {/* VISTA 1: REGISTRO DE TURNO MATUTINO (07h00 a 13h00)                      */}
      {/* ========================================================================= */}
      {turnoActivo === 'manana' && (
        <div className="space-y-6">
          
          {/* Banner de Estado de Activación por Coordinación */}
          {shiftControl.shift_morning_active !== 1 ? (
            <div className="bg-amber-50 border-2 border-amber-300 text-amber-900 rounded-3xl p-5 shadow-xs flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-[#A60809]/10 text-[#A60809] mt-0.5">
                <Lock className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-[#A60809]">
                    Turno Matutino Inactivo • Requiere Activación del Coordinador
                  </span>
                  <button
                    type="button"
                    onClick={cargarEstadoTurnos}
                    className="text-xs font-bold text-[#A60809] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Comprobar estado</span> 🔄
                  </button>
                </div>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  El registro para el Turno Matutino se encuentra temporalmente cerrado. El Coordinador de Carrera debe activar este turno desde su panel para habilitar la recepción de marcaciones.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-2xs">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span className="text-xs font-bold">Turno Matutino Habilitado por Coordinación de Carrera</span>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 bg-emerald-200 text-emerald-900 rounded-full">
                Abierto para Registro
              </span>
            </div>
          )}

          {/* Horario de la Mañana */}
          <div className="bg-white rounded-3xl p-6 border-2 border-[#A60809]/30 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-[#A60809]/10 text-[#A60809] flex items-center justify-center font-black text-sm">
                  ☀️
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Horario del Turno Matutino (Franja 07h00 a 13h00)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Declara tu horario matutino (2h a 6h). Las horas restantes para alcanzar las 8.0h oficiales las completarás en la tarde.
                  </p>
                </div>
              </div>
              <span className="text-xs font-black px-3 py-1 bg-[#A60809]/10 text-[#A60809] rounded-xl self-start sm:self-auto">
                Subtotal Mañana: {horasHorarioManana} hrs
              </span>
            </div>

            {/* Presets rápidos mañana */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Rápido:</span>
              <button
                type="button"
                disabled={estaBloqueado}
                onClick={() => { setMEntrada('08:00'); setMSalida('12:00'); }}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  mEntrada === '08:00' && mSalida === '12:00' ? 'bg-[#A60809] text-white border-[#A60809]' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                08:00 a 12:00 (4.0 hrs — Equilibrada)
              </button>
              <button
                type="button"
                disabled={estaBloqueado}
                onClick={() => { setMEntrada('07:00'); setMSalida('11:00'); }}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  mEntrada === '07:00' && mSalida === '11:00' ? 'bg-[#A60809] text-white border-[#A60809]' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                07:00 a 11:00 (4.0 hrs)
              </button>
              <button
                type="button"
                disabled={estaBloqueado}
                onClick={() => { setMEntrada('08:00'); setMSalida('13:00'); }}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  mEntrada === '08:00' && mSalida === '13:00' ? 'bg-[#A60809] text-white border-[#A60809]' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                08:00 a 13:00 (5.0 hrs)
              </button>
              <button
                type="button"
                disabled={estaBloqueado}
                onClick={() => { setMEntrada('07:00'); setMSalida('12:00'); }}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  mEntrada === '07:00' && mSalida === '12:00' ? 'bg-[#A60809] text-white border-[#A60809]' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                07:00 a 12:00 (5.0 hrs)
              </button>
              <button
                type="button"
                disabled={estaBloqueado}
                onClick={() => { setMEntrada('07:00'); setMSalida('13:00'); }}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  mEntrada === '07:00' && mSalida === '13:00' ? 'bg-[#A60809] text-white border-[#A60809]' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                07:00 a 13:00 (6.0 hrs)
              </button>
              <button
                type="button"
                disabled={estaBloqueado}
                onClick={() => { setMEntrada('09:00'); setMSalida('12:00'); }}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  mEntrada === '09:00' && mSalida === '12:00' ? 'bg-[#A60809] text-white border-[#A60809]' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                09:00 a 12:00 (3.0 hrs)
              </button>
              <button
                type="button"
                disabled={estaBloqueado}
                onClick={() => { setMEntrada('07:00'); setMSalida('09:00'); }}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  mEntrada === '07:00' && mSalida === '09:00' ? 'bg-[#A60809] text-white border-[#A60809]' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                07:00 a 09:00 (2.0 hrs)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-[#D7D6D7]">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Hora Entrada Matutina
                </label>
                <input
                  type="time"
                  required
                  disabled={estaBloqueado}
                  value={mEntrada}
                  onChange={(e) => setMEntrada(e.target.value)}
                  className="w-full bg-white border border-[#D7D6D7] rounded-xl px-3 py-2 text-base font-bold text-slate-900 focus:ring-2 focus:ring-[#A60809] focus:outline-none"
                />
              </div>

              <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-[#D7D6D7]">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Hora Salida Matutina
                </label>
                <input
                  type="time"
                  required
                  disabled={estaBloqueado}
                  value={mSalida}
                  onChange={(e) => setMSalida(e.target.value)}
                  className="w-full bg-white border border-[#D7D6D7] rounded-xl px-3 py-2 text-base font-bold text-slate-900 focus:ring-2 focus:ring-[#A60809] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Pilares dedicados a la mañana */}
          <div className="bg-white rounded-3xl p-6 border border-[#D7D6D7]/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center">
                  <Sparkles className="w-4 h-4 mr-2 text-[#A60809]" />
                  Distribución de Horas Realizadas en la Mañana
                </h3>
                <p className="text-xs text-slate-500">
                  Indica cuántas horas dedicaste a cada actividad durante este turno matutino.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-600">Total Mañana:</span>
                <div className="text-base font-black text-[#A60809]">{totalPilaresManana} hrs</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PilarHorasCard
                titulo="Docencia (Mañana)"
                subtitulo="Cátedra, preparación y tutorías matutinas"
                icon={BookOpen}
                color="docencia"
                horas={mDocencia}
                setHoras={setMDocencia}
                presets={[2, 3, 4, 5]}
              />
              <PilarHorasCard
                titulo="Vinculación (Mañana)"
                subtitulo="Seguimiento a estudiantes y proyectos comunitarios"
                icon={Share2}
                color="vinculacion"
                horas={mVinculacion}
                setHoras={setMVinculacion}
                presets={[1, 1.5, 2]}
              />
              <PilarHorasCard
                titulo="Investigación (Mañana)"
                subtitulo="Redacción de papers y semilleros formativos"
                icon={FlaskConical}
                color="investigacion"
                horas={mInvestigacion}
                setHoras={setMInvestigacion}
                presets={[0, 1, 2]}
              />
              <PilarHorasCard
                titulo="Gestión (Mañana)"
                subtitulo="Reuniones de área, comisiones y juntas de carrera"
                icon={Briefcase}
                color="gestion"
                horas={mGestion}
                setHoras={setMGestion}
                presets={[0, 1, 2]}
              />
            </div>
          </div>

          {/* Detalle y Botón de Guardado del Turno Matutino */}
          <div className="bg-white rounded-3xl p-6 border border-[#D7D6D7]/80 shadow-xs space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Detalle de Actividades Desarrolladas en la Mañana
              </label>
              <textarea
                rows={3}
                disabled={estaBloqueado}
                value={mDetalle}
                onChange={(e) => setMDetalle(e.target.value)}
                placeholder="Ej: Clases de Marketing Estratégico de 07:00 a 11:00 en aula 204. Tutoría de vinculación de 11:00 a 13:00..."
                className="w-full bg-[#F8F9FA] border border-[#D7D6D7] rounded-2xl p-3 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-[#A60809] focus:outline-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                <span>Horario matutino: <strong>{horasHorarioManana}h</strong></span>
                <span className="mx-2">•</span>
                <span>Actividades reportadas: <strong>{totalPilaresManana}h</strong></span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={cargando || estaBloqueado || shiftControl.shift_morning_active !== 1}
                  onClick={handleGuardarManana}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#A60809] hover:bg-[#810404] text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {shiftControl.shift_morning_active !== 1 
                      ? '🔒 Inactivo (Requiere Activación del Coordinador)' 
                      : (cargando ? 'Guardando...' : `Guardar Turno Matutino (${horasHorarioManana}h)`)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTurnoActivo('tarde')}
                  className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center space-x-1 cursor-pointer"
                >
                  <span>Ir a Tarde</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: REGISTRO DE TURNO VESPERTINO (15h00 a 21h00)                    */}
      {/* ========================================================================= */}
      {turnoActivo === 'tarde' && (
        <div className="space-y-6">
          
          {/* Banner Inteligente de Complemento para 8 Horas */}
          <div className="bg-white border-2 border-[#810404]/20 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-black text-lg flex-shrink-0">
                ☀️
              </div>
              <div>
                <div className="text-xs font-black text-slate-900 flex items-center gap-2">
                  <span>Turno Matutino: {horasHorarioManana} hrs ({mEntrada} a {mSalida})</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    mGuardado ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {mGuardado ? '✓ Guardado' : 'Sin guardar'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {horasFaltantesPara8h > 0 ? (
                    <>
                      Para cumplir exactamente la meta oficial de <strong>8.0 horas</strong>, necesitas registrar <strong>{horasFaltantesPara8h} hrs</strong> en este turno de la tarde.
                    </>
                  ) : (
                    <>
                      ¡Ya registraste <strong>{horasHorarioManana} hrs</strong> en la mañana! Cumples con la jornada reglamentaria.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {horasFaltantesPara8h > 0 && (
                <button
                  type="button"
                  disabled={estaBloqueado}
                  onClick={autoAjustarTardePara8h}
                  className="px-3.5 py-2 bg-[#810404] hover:bg-[#A60809] text-white rounded-xl text-xs font-black shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
                  title="Ajusta automáticamente la hora de salida de la tarde y los pilares para completar las 8 horas exactas"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Auto-completar 8.0h (+{horasFaltantesPara8h}h tarde)</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setTurnoActivo('manana')}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Revisar Mañana
              </button>
            </div>
          </div>

          {/* Banner de Estado de Activación por Coordinación */}
          {shiftControl.shift_afternoon_active !== 1 ? (
            <div className="bg-amber-50 border-2 border-amber-300 text-amber-900 rounded-3xl p-5 shadow-xs flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-[#810404]/10 text-[#810404] mt-0.5">
                <Lock className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-[#810404]">
                    Turno Vespertino Inactivo • Requiere Activación del Coordinador
                  </span>
                  <button
                    type="button"
                    onClick={cargarEstadoTurnos}
                    className="text-xs font-bold text-[#810404] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Comprobar estado</span> 🔄
                  </button>
                </div>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  El registro para el Turno Vespertino se encuentra temporalmente cerrado. El Coordinador de Carrera debe activar este turno desde su panel para habilitar la consolidación de las 8 horas.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-2xs">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span className="text-xs font-bold">Turno Vespertino Habilitado por Coordinación de Carrera</span>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 bg-emerald-200 text-emerald-900 rounded-full">
                Abierto para Consolidar 8h
              </span>
            </div>
          )}

          {/* Horario de la Tarde */}
          <div className="bg-white rounded-3xl p-6 border-2 border-[#810404]/30 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-[#810404]/10 text-[#810404] flex items-center justify-center font-black text-sm">
                  🌙
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Horario del Turno Vespertino (Franja 15h00 a 21h00)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Declara tu horario de la tarde (2h a 6h) para completar las 8.0 horas reglamentarias con la mañana.
                  </p>
                </div>
              </div>
              <span className="text-xs font-black px-3 py-1 bg-[#810404]/10 text-[#810404] rounded-xl self-start sm:self-auto">
                Subtotal Tarde: {horasHorarioTarde} hrs
              </span>
            </div>

            {/* Presets rápidos tarde */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Rápido:</span>
              <button
                type="button"
                disabled={estaBloqueado}
                onClick={() => { setTEntrada('15:00'); setTSalida('19:00'); }}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  tEntrada === '15:00' && tSalida === '19:00' ? 'bg-[#810404] text-white border-[#810404]' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                15:00 a 19:00 (4.0 hrs — Si mañana fue 4h)
              </button>
              <button
                type="button"
                disabled={estaBloqueado}
                onClick={() => { setTEntrada('15:00'); setTSalida('18:00'); }}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  tEntrada === '15:00' && tSalida === '18:00' ? 'bg-[#810404] text-white border-[#810404]' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                15:00 a 18:00 (3.0 hrs — Si mañana fue 5h)
              </button>
              <button
                type="button"
                disabled={estaBloqueado}
                onClick={() => { setTEntrada('15:00'); setTSalida('17:00'); }}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  tEntrada === '15:00' && tSalida === '17:00' ? 'bg-[#810404] text-white border-[#810404]' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                15:00 a 17:00 (2.0 hrs — Si mañana fue 6h)
              </button>
              <button
                type="button"
                disabled={estaBloqueado}
                onClick={() => { setTEntrada('15:00'); setTSalida('20:00'); }}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  tEntrada === '15:00' && tSalida === '20:00' ? 'bg-[#810404] text-white border-[#810404]' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                15:00 a 20:00 (5.0 hrs — Si mañana fue 3h)
              </button>
              <button
                type="button"
                disabled={estaBloqueado}
                onClick={() => { setTEntrada('15:00'); setTSalida('21:00'); }}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  tEntrada === '15:00' && tSalida === '21:00' ? 'bg-[#810404] text-white border-[#810404]' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                15:00 a 21:00 (6.0 hrs — Si mañana fue 2h)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-[#D7D6D7]">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Hora Entrada Vespertina
                </label>
                <input
                  type="time"
                  required
                  disabled={estaBloqueado}
                  value={tEntrada}
                  onChange={(e) => setTEntrada(e.target.value)}
                  className="w-full bg-white border border-[#D7D6D7] rounded-xl px-3 py-2 text-base font-bold text-slate-900 focus:ring-2 focus:ring-[#810404] focus:outline-none"
                />
              </div>

              <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-[#D7D6D7]">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Hora Salida Vespertina
                </label>
                <input
                  type="time"
                  required
                  disabled={estaBloqueado}
                  value={tSalida}
                  onChange={(e) => setTSalida(e.target.value)}
                  className="w-full bg-white border border-[#D7D6D7] rounded-xl px-3 py-2 text-base font-bold text-slate-900 focus:ring-2 focus:ring-[#810404] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Pilares dedicados a la tarde */}
          <div className="bg-white rounded-3xl p-6 border border-[#D7D6D7]/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center">
                  <Sparkles className="w-4 h-4 mr-2 text-[#810404]" />
                  Distribución de Horas Realizadas en la Tarde
                </h3>
                <p className="text-xs text-slate-500">
                  Indica las horas dedicadas a investigación, gestión académica o docencia vespertina.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-600">Total Tarde:</span>
                <div className="text-base font-black text-[#810404]">{totalPilaresTarde} hrs</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PilarHorasCard
                titulo="Docencia (Tarde)"
                subtitulo="Clases nocturnas o preparación vespertina"
                icon={BookOpen}
                color="docencia"
                horas={tDocencia}
                setHoras={setTDocencia}
                presets={[0, 1, 2]}
              />
              <PilarHorasCard
                titulo="Vinculación (Tarde)"
                subtitulo="Gestión con empresas y convenios institucionales"
                icon={Share2}
                color="vinculacion"
                horas={tVinculacion}
                setHoras={setTVinculacion}
                presets={[0, 1, 2]}
              />
              <PilarHorasCard
                titulo="Investigación (Tarde)"
                subtitulo="Avance de proyectos I+D, redacción y análisis de datos"
                icon={FlaskConical}
                color="investigacion"
                horas={tInvestigacion}
                setHoras={setTInvestigacion}
                presets={[1, 1.5, 2]}
              />
              <PilarHorasCard
                titulo="Gestión Académica (Tarde)"
                subtitulo="Comisiones, juntas de carrera y acreditación FADE"
                icon={Briefcase}
                color="gestion"
                horas={tGestion}
                setHoras={setTGestion}
                presets={[1, 1.5, 2]}
              />
            </div>
          </div>

          {/* Detalle y Botón de Guardado del Turno Vespertino */}
          <div className="bg-white rounded-3xl p-6 border border-[#D7D6D7]/80 shadow-xs space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Detalle de Actividades Desarrolladas en la Tarde
              </label>
              <textarea
                rows={3}
                disabled={estaBloqueado}
                value={tDetalle}
                onChange={(e) => setTDetalle(e.target.value)}
                placeholder="Ej: Avance de análisis cuantitativo del proyecto de investigación. Revisión de carpetas de acreditación de la Carrera..."
                className="w-full bg-[#F8F9FA] border border-[#D7D6D7] rounded-2xl p-3 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-[#810404] focus:outline-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                <span>Horario tarde: <strong>{horasHorarioTarde}h</strong></span>
                <span className="mx-2">•</span>
                <span>Actividades reportadas: <strong>{totalPilaresTarde}h</strong></span>
                <span className="mx-2">•</span>
                <span className="font-bold text-emerald-800">Total Día: {totalHorasDia} / 8.0h</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={cargando || estaBloqueado || shiftControl.shift_afternoon_active !== 1}
                  onClick={handleGuardarTarde}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#810404] hover:bg-[#A60809] text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {shiftControl.shift_afternoon_active !== 1 
                      ? '🔒 Inactivo (Requiere Activación del Coordinador)' 
                      : (cargando ? 'Consolidando...' : `Completar Día y Guardar (${totalHorasDia}h)`)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTurnoActivo('consolidado')}
                  className="px-4 py-3 rounded-2xl bg-slate-900 text-white font-bold text-xs hover:bg-black transition-all flex items-center space-x-1 cursor-pointer"
                >
                  <span>Ver Resumen Día</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 3: RESUMEN CONSOLIDADO DEL DÍA (8 HORAS TOTALES)                   */}
      {/* ========================================================================= */}
      {turnoActivo === 'consolidado' && (
        <div className="space-y-6">
          
          <div className="bg-white rounded-3xl p-6 border border-[#D7D6D7]/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  Consolidación de Jornada Completa
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  Resumen de los Dos Turnos ({fecha})
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTurnoActivo('manana')}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Editar Mañana
                </button>
                <button
                  type="button"
                  onClick={() => setTurnoActivo('tarde')}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Editar Tarde
                </button>
              </div>
            </div>

            {/* Dos Fichas: Mañana y Tarde */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Tarjeta Mañana */}
              <div className="p-4 rounded-2xl bg-[#A60809]/5 border-2 border-[#A60809]/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-[#A60809] flex items-center">
                    <Sun className="w-4 h-4 mr-1" />
                    Turno Matutino (07h - 13h)
                  </span>
                  <span className="text-xs font-black bg-white px-2 py-0.5 rounded border border-[#A60809]/20 text-[#A60809]">
                    {horasHorarioManana} hrs
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-700 font-bold">
                  Horario: {mEntrada} a {mSalida}
                </p>
                <div className="text-xs text-slate-600">
                  Docencia: <strong>{mDocencia}h</strong> | Vinculación: <strong>{mVinculacion}h</strong> | Inv: <strong>{mInvestigacion}h</strong> | Gest: <strong>{mGestion}h</strong>
                </div>
                {mDetalle && (
                  <p className="text-[11px] text-slate-500 italic bg-white p-2 rounded-xl border border-slate-100">
                    "{mDetalle}"
                  </p>
                )}
              </div>

              {/* Tarjeta Tarde */}
              <div className="p-4 rounded-2xl bg-[#810404]/5 border-2 border-[#810404]/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-[#810404] flex items-center">
                    <Moon className="w-4 h-4 mr-1" />
                    Turno Vespertino (15h - 21h)
                  </span>
                  <span className="text-xs font-black bg-white px-2 py-0.5 rounded border border-[#810404]/20 text-[#810404]">
                    {horasHorarioTarde} hrs
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-700 font-bold">
                  Horario: {tEntrada} a {tSalida}
                </p>
                <div className="text-xs text-slate-600">
                  Docencia: <strong>{tDocencia}h</strong> | Vinculación: <strong>{tVinculacion}h</strong> | Inv: <strong>{tInvestigacion}h</strong> | Gest: <strong>{tGestion}h</strong>
                </div>
                {tDetalle && (
                  <p className="text-[11px] text-slate-500 italic bg-white p-2 rounded-xl border border-slate-100">
                    "{tDetalle}"
                  </p>
                )}
              </div>

            </div>

            {/* Medidor consolidado de 8 horas */}
            <MedidorJornada
              horasDocencia={totalDocenciaDia}
              horasVinculacion={totalVinculacionDia}
              horasInvestigacion={totalInvestigacionDia}
              horasGestion={totalGestionDia}
              jornadaObjetivo={8.0}
            />

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-slate-800 block">Horario Combinado Declarado:</span>
                <span className="font-mono text-[#A60809] font-bold">
                  {mEntrada}-{mSalida} ({horasHorarioManana}h) + {tEntrada}-{tSalida} ({horasHorarioTarde}h) = {totalHorasHorario}h
                </span>
              </div>
              
              <button
                type="button"
                disabled={cargando || estaBloqueado || (shiftControl.shift_morning_active !== 1 && shiftControl.shift_afternoon_active !== 1)}
                onClick={handleGuardarTarde}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {(shiftControl.shift_morning_active !== 1 && shiftControl.shift_afternoon_active !== 1) ? '🔒 Turnos Inactivos en Coordinación' : 'Actualizar Consolidado Completo (8h)'}
              </button>
            </div>

          </div>

        </div>
      )}

      {/* Historial Reciente */}
      {historialReciente.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-[#D7D6D7]/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#ECEAEB] pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center">
              <History className="w-4 h-4 mr-2 text-[#A60809]" />
              Tus Últimas Jornadas Registradas
            </h3>
            <span className="text-xs text-slate-500">Historial reciente</span>
          </div>

          <div className="divide-y divide-slate-100">
            {historialReciente.map((h) => (
              <div key={h.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black text-slate-900">{h.date}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      h.status === 'COMPLETO' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {h.status === 'COMPLETO' ? '✓ 8h Completo' : h.status}
                    </span>
                    {h.is_locked === 1 && (
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                        Bloqueado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate max-w-lg">
                    {h.check_in && h.check_in.includes('-') 
                      ? `Turno 1: ${h.check_in} | Turno 2: ${h.check_out}` 
                      : `Horario: ${h.check_in} a ${h.check_out}`} — {h.activities_detail}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-[#A60809]">{h.total_hours}h</span>
                  <div className="text-[10px] text-slate-400">
                    Doc: {h.docencia_hours}h | Vinc: {h.vinculacion_hours}h | Inv: {h.investigacion_hours}h | Gest: {h.gestion_hours}h
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
