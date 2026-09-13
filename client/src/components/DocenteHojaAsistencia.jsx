import React, { useState, useEffect } from 'react';
import { docenteAPI } from '../api';
import { exportarHojaAsistenciaPDF, exportarHojaCSV } from '../utils/exportadorPdf';

export default function DocenteHojaAsistencia({ user }) {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const meses = [
    { num: 1, nombre: 'Enero' },
    { num: 2, nombre: 'Febrero' },
    { num: 3, nombre: 'Marzo' },
    { num: 4, nombre: 'Abril' },
    { num: 5, nombre: 'Mayo' },
    { num: 6, nombre: 'Junio' },
    { num: 7, nombre: 'Julio' },
    { num: 8, nombre: 'Agosto' },
    { num: 9, nombre: 'Septiembre' },
    { num: 10, nombre: 'Octubre' },
    { num: 11, nombre: 'Noviembre' },
    { num: 12, nombre: 'Diciembre' }
  ];

  const cargarHoja = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await docenteAPI.getHojaMensual(anio, mes);
      setData(res);
    } catch (err) {
      setError(err.message || 'Error al cargar la hoja de asistencia');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarHoja();
  }, [anio, mes]);

  const handleDescargarPDF = () => {
    if (!data) return;
    try {
      exportarHojaAsistenciaPDF(data);
    } catch (err) {
      alert('Error al generar PDF: ' + err.message);
    }
  };

  const handleDescargarCSV = () => {
    if (!data) return;
    try {
      exportarHojaCSV(data);
    } catch (err) {
      alert('Error al exportar CSV: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera y Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-[#D7D6D7]/60 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#A60809]">
              <span>Documento Oficial</span>
              <span>•</span>
              <span>Reglamento ESPOCH</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Mi Hoja Mensual de Asistencia</h1>
            <p className="text-sm text-gray-600">
              Visualice, verifique y descargue su reporte consolidado de horas y actividades con validez institucional.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-50 border border-[#D7D6D7] rounded-lg px-3 py-1.5">
              <label className="text-xs font-medium text-gray-600">Mes:</label>
              <select
                value={mes}
                onChange={(e) => setMes(Number(e.target.value))}
                className="text-sm font-semibold bg-transparent text-gray-800 focus:outline-none cursor-pointer"
              >
                {meses.map((m) => (
                  <option key={m.num} value={m.num}>
                    {m.nombre}
                  </option>
                ))}
              </select>

              <label className="text-xs font-medium text-gray-600 ml-2">Año:</label>
              <select
                value={anio}
                onChange={(e) => setAnio(Number(e.target.value))}
                className="text-sm font-semibold bg-transparent text-gray-800 focus:outline-none cursor-pointer"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleDescargarPDF}
              disabled={loading || !data}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#A60809] hover:bg-[#810404] disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Descargar PDF Oficial
            </button>

            <button
              onClick={handleDescargarCSV}
              disabled={loading || !data}
              className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 border border-[#D7D6D7] text-gray-700 text-sm font-medium rounded-lg transition-colors"
              title="Descargar datos en formato Excel/CSV"
            >
              <svg className="w-4 h-4 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Excel (CSV)
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-xl border border-[#D7D6D7]/60 p-12 text-center">
          <div className="w-10 h-10 border-4 border-[#A60809]/20 border-t-[#A60809] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium text-sm">Cargando hoja de asistencia...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-sm">
          {error}
        </div>
      )}

      {!loading && data && (
        <>
          {/* Metadatos del Docente y Jornada */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-[#D7D6D7]/60">
              <span className="text-xs font-semibold text-gray-500 uppercase">Docente</span>
              <p className="text-base font-bold text-gray-900 truncate">{data.teacher.nombres} {data.teacher.apellidos}</p>
              <p className="text-xs text-gray-500">CI: {data.teacher.cedula}</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#D7D6D7]/60">
              <span className="text-xs font-semibold text-gray-500 uppercase">Jornada Asignada</span>
              <p className="text-base font-bold text-[#A60809]">{data.teacher.schedule_name || 'Sin jornada'}</p>
              <p className="text-xs text-gray-500">Base diaria: {data.teacher.hours_per_day || 8} horas</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#D7D6D7]/60">
              <span className="text-xs font-semibold text-gray-500 uppercase">Horas Registradas</span>
              <p className="text-base font-bold text-gray-900">
                {data.totales.totalHoras.toFixed(2)}h
                <span className="text-xs font-normal text-gray-500 ml-1">
                  / {data.totales.horasEsperadas.toFixed(1)}h esperadas
                </span>
              </p>
              <p className="text-xs text-gray-500">
                {data.totales.diasLaborales} días hábiles en el mes
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#D7D6D7]/60">
              <span className="text-xs font-semibold text-gray-500 uppercase">Cumplimiento</span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xl font-black ${data.totales.porcentajeCumplimiento >= 100 ? 'text-emerald-700' : 'text-[#A60809]'}`}>
                  {data.totales.porcentajeCumplimiento.toFixed(1)}%
                </span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  data.totales.porcentajeCumplimiento >= 100
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-[#810404]'
                }`}>
                  {data.totales.porcentajeCumplimiento >= 100 ? 'Completado' : 'Pendiente'}
                </span>
              </div>
            </div>
          </div>

          {/* Desglose por Pilares ESPOCH */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-lg border-l-4 border-l-[#A60809] border border-[#D7D6D7]/60">
              <span className="text-xs text-gray-500 font-medium">Docencia</span>
              <p className="text-lg font-bold text-gray-900">{data.totales.docencia.toFixed(1)}h</p>
            </div>
            <div className="bg-white p-3 rounded-lg border-l-4 border-l-[#810404] border border-[#D7D6D7]/60">
              <span className="text-xs text-gray-500 font-medium">Vinculación</span>
              <p className="text-lg font-bold text-gray-900">{data.totales.vinculacion.toFixed(1)}h</p>
            </div>
            <div className="bg-white p-3 rounded-lg border-l-4 border-l-[#C91C1E] border border-[#D7D6D7]/60">
              <span className="text-xs text-gray-500 font-medium">Investigación</span>
              <p className="text-lg font-bold text-gray-900">{data.totales.investigacion.toFixed(1)}h</p>
            </div>
            <div className="bg-white p-3 rounded-lg border-l-4 border-l-gray-600 border border-[#D7D6D7]/60">
              <span className="text-xs text-gray-500 font-medium">Gestión Académica</span>
              <p className="text-lg font-bold text-gray-900">{data.totales.gestion.toFixed(1)}h</p>
            </div>
          </div>

          {/* Tabla de Asistencia Día por Día */}
          <div className="bg-white rounded-xl shadow-sm border border-[#D7D6D7]/60 overflow-hidden">
            <div className="px-6 py-4 border-b border-[#D7D6D7]/60 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">
                Registro Diario Detallado – {meses.find((m) => m.num === mes)?.nombre} {anio}
              </h2>
              <span className="text-xs text-gray-500">
                {data.dias.length} días en el mes
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-[#D7D6D7]/60 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-3">Estado</th>
                    <th className="py-3 px-3">Entrada / Salida</th>
                    <th className="py-3 px-3 text-right">Doc.</th>
                    <th className="py-3 px-3 text-right">Vinc.</th>
                    <th className="py-3 px-3 text-right">Inv.</th>
                    <th className="py-3 px-3 text-right">Gest.</th>
                    <th className="py-3 px-3 text-right font-bold">Total</th>
                    <th className="py-3 px-4">Observación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D7D6D7]/40">
                  {data.dias.map((d) => {
                    const isFinde = d.tipoDia === 'FIN_DE_SEMANA';
                    const isFeriado = d.tipoDia === 'FERIADO';
                    const isLaboral = d.tipoDia === 'LABORAL';
                    const tieneRegistro = Boolean(d.record);

                    let bgRow = 'hover:bg-gray-50/70 transition-colors';
                    if (isFinde) bgRow = 'bg-gray-50/50 text-gray-400';
                    if (isFeriado) bgRow = 'bg-red-50/30 text-gray-700';

                    return (
                      <tr key={d.fecha} className={bgRow}>
                        <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">
                          <span className="font-bold text-gray-900">{d.fecha}</span>
                          <span className="block text-[11px] text-gray-500 capitalize">{d.diaSemana}</span>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          {isFeriado && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-[#810404]">
                              Feriado: {d.nombreFeriado}
                            </span>
                          )}
                          {isFinde && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-500">
                              Fin de Semana
                            </span>
                          )}
                          {isLaboral && tieneRegistro && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                              Presente
                            </span>
                          )}
                          {isLaboral && !tieneRegistro && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800">
                              Sin Registro
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-xs font-mono text-gray-700 whitespace-nowrap">
                          {tieneRegistro
                            ? (d.record.check_in_time && d.record.check_in_time.includes('-')
                                ? `${d.record.check_in_time} / ${d.record.check_out_time}`
                                : `${d.record.check_in_time || '--:--'} - ${d.record.check_out_time || '--:--'}`)
                            : '--'}
                        </td>

                        <td className="py-3 px-3 text-xs text-right font-mono">
                          {d.record?.docencia_hours ? d.record.docencia_hours.toFixed(1) : '-'}
                        </td>
                        <td className="py-3 px-3 text-xs text-right font-mono">
                          {d.record?.vinculacion_hours ? d.record.vinculacion_hours.toFixed(1) : '-'}
                        </td>
                        <td className="py-3 px-3 text-xs text-right font-mono">
                          {d.record?.investigacion_hours ? d.record.investigacion_hours.toFixed(1) : '-'}
                        </td>
                        <td className="py-3 px-3 text-xs text-right font-mono">
                          {d.record?.gestion_hours ? d.record.gestion_hours.toFixed(1) : '-'}
                        </td>

                        <td className="py-3 px-3 text-xs text-right font-bold font-mono">
                          {d.record?.total_hours ? (
                            <span className={d.record.total_hours >= 8 ? 'text-emerald-700' : 'text-[#A60809]'}>
                              {d.record.total_hours.toFixed(1)}h
                            </span>
                          ) : '-'}
                        </td>

                        <td className="py-3 px-4 text-xs text-gray-500 max-w-xs truncate">
                          {d.record?.observations || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-bold text-gray-900 border-t-2 border-gray-300">
                    <td colSpan="3" className="py-3 px-4 text-right">TOTALES ACUMULADOS:</td>
                    <td className="py-3 px-3 text-right font-mono">{data.totales.docencia.toFixed(1)}h</td>
                    <td className="py-3 px-3 text-right font-mono">{data.totales.vinculacion.toFixed(1)}h</td>
                    <td className="py-3 px-3 text-right font-mono">{data.totales.investigacion.toFixed(1)}h</td>
                    <td className="py-3 px-3 text-right font-mono">{data.totales.gestion.toFixed(1)}h</td>
                    <td className="py-3 px-3 text-right font-mono text-[#A60809]">{data.totales.totalHoras.toFixed(1)}h</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Información Institucional y Firmas */}
          <div className="bg-white rounded-xl border border-[#D7D6D7]/60 p-6">
            <h3 className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-4">
              Declaración y Legalización Institucional
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              El presente reporte se genera conforme a la normativa vigente de la <strong>Escuela Superior Politécnica de Chimborazo</strong> y los lineamientos de la <strong>Carrera de Marketing</strong>. Las horas consignadas son reflejo fiel del cumplimiento de la jornada laboral de 8.0 horas diarias reglamentarias en sus componentes sustantivos.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12 pt-6 border-t border-[#D7D6D7]/60">
              <div className="text-center">
                <div className="w-48 border-b-2 border-gray-400 mx-auto mb-2"></div>
                <p className="text-xs font-bold text-gray-900">{data.teacher.nombres} {data.teacher.apellidos}</p>
                <p className="text-[11px] text-gray-500">Docente Titular / Ocasional</p>
                <p className="text-[10px] text-gray-400">CI: {data.teacher.cedula}</p>
              </div>

              <div className="text-center">
                <div className="w-48 border-b-2 border-gray-400 mx-auto mb-2"></div>
                <p className="text-xs font-bold text-gray-900">{data.settings.director_carrera || 'Ing. Coordinador de Carrera'}</p>
                <p className="text-[11px] text-gray-500">Coordinación de Carrera de Marketing</p>
                <p className="text-[10px] text-gray-400">ESPOCH - Sede Matriz Riobamba</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
