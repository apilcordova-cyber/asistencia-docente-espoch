import React, { useState, useEffect } from 'react';
import { adminAPI } from '../api';
import { exportarHojaAsistenciaPDF, exportarHojaCSV } from '../utils/exportadorPdf';

export default function CoordinadorReportes() {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [docentes, setDocentes] = useState([]);
  const [selectedDocenteId, setSelectedDocenteId] = useState('');
  const [hojaData, setHojaData] = useState(null);
  const [loadingDocentes, setLoadingDocentes] = useState(true);
  const [loadingHoja, setLoadingHoja] = useState(false);
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

  useEffect(() => {
    const cargarDocentes = async () => {
      try {
        setLoadingDocentes(true);
        const docs = await adminAPI.getDocentes();
        setDocentes(docs);
        if (docs.length > 0) {
          setSelectedDocenteId(docs[0].id);
        }
      } catch (err) {
        setError(err.message || 'Error al cargar lista de docentes');
      } finally {
        setLoadingDocentes(false);
      }
    };
    cargarDocentes();
  }, []);

  useEffect(() => {
    if (!selectedDocenteId) return;

    const cargarHoja = async () => {
      try {
        setLoadingHoja(true);
        setError(null);
        const res = await adminAPI.getHojaDocente(selectedDocenteId, anio, mes);
        setHojaData(res);
      } catch (err) {
        setError(err.message || 'Error al consultar hoja oficial');
        setHojaData(null);
      } finally {
        setLoadingHoja(false);
      }
    };

    cargarHoja();
  }, [selectedDocenteId, anio, mes]);

  const handleDescargarPDF = () => {
    if (!hojaData) return;
    try {
      exportarHojaAsistenciaPDF(hojaData);
    } catch (err) {
      alert('Error al generar PDF: ' + err.message);
    }
  };

  const handleDescargarCSV = () => {
    if (!hojaData) return;
    try {
      exportarHojaCSV(hojaData);
    } catch (err) {
      alert('Error al exportar CSV: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera y Selección */}
      <div className="bg-white rounded-xl shadow-sm border border-[#D7D6D7]/60 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#A60809]">
              <span>Generación Documental</span>
              <span>•</span>
              <span>Marketing ESPOCH</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 mt-1">Hojas y Reportes Oficiales</h1>
            <p className="text-sm text-gray-600">
              Inspección y descarga de hojas mensuales de asistencia docente y consolidación para auditoría.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Selector de Docente */}
            <div className="flex items-center gap-2 bg-gray-50 border border-[#D7D6D7] rounded-lg px-3 py-1.5">
              <label className="text-xs font-semibold text-gray-600">Docente:</label>
              <select
                value={selectedDocenteId}
                onChange={(e) => setSelectedDocenteId(e.target.value)}
                className="text-xs font-bold bg-transparent text-gray-800 focus:outline-none cursor-pointer max-w-[200px] truncate"
              >
                {docentes.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.apellidos}, {d.nombres}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de Mes / Año */}
            <div className="flex items-center gap-2 bg-gray-50 border border-[#D7D6D7] rounded-lg px-3 py-1.5">
              <label className="text-xs font-semibold text-gray-600">Período:</label>
              <select
                value={mes}
                onChange={(e) => setMes(Number(e.target.value))}
                className="text-xs font-bold bg-transparent text-gray-800 focus:outline-none cursor-pointer"
              >
                {meses.map((m) => (
                  <option key={m.num} value={m.num}>
                    {m.nombre}
                  </option>
                ))}
              </select>

              <select
                value={anio}
                onChange={(e) => setAnio(Number(e.target.value))}
                className="text-xs font-bold bg-transparent text-gray-800 focus:outline-none cursor-pointer"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Botones de Exportación */}
            <button
              onClick={handleDescargarPDF}
              disabled={loadingHoja || !hojaData}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#A60809] hover:bg-[#810404] disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Descargar PDF
            </button>

            <button
              onClick={handleDescargarCSV}
              disabled={loadingHoja || !hojaData}
              className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 border border-[#D7D6D7] text-gray-700 text-xs font-semibold rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Excel (CSV)
            </button>
          </div>
        </div>
      </div>

      {loadingHoja && (
        <div className="bg-white rounded-xl border border-[#D7D6D7]/60 p-12 text-center">
          <div className="w-10 h-10 border-4 border-[#A60809]/20 border-t-[#A60809] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium text-sm">Generando previsualización de la hoja oficial...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-sm">
          {error}
        </div>
      )}

      {!loadingHoja && hojaData && (
        <>
          {/* Ficha Resumen del Docente Inspeccionado */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-[#D7D6D7]/60">
              <span className="text-xs font-semibold text-gray-500 uppercase">Docente Inspeccionado</span>
              <p className="text-base font-bold text-gray-900 truncate">
                {hojaData.teacher.nombres} {hojaData.teacher.apellidos}
              </p>
              <p className="text-xs text-gray-500">CI: {hojaData.teacher.cedula}</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#D7D6D7]/60">
              <span className="text-xs font-semibold text-gray-500 uppercase">Jornada Registrada</span>
              <p className="text-base font-bold text-[#A60809]">{hojaData.teacher.schedule_name || 'Sin jornada'}</p>
              <p className="text-xs text-gray-500">{hojaData.teacher.start_time} - {hojaData.teacher.end_time} ({hojaData.teacher.hours_per_day || 8.0}h)</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#D7D6D7]/60">
              <span className="text-xs font-semibold text-gray-500 uppercase">Horas Reportadas</span>
              <p className="text-base font-bold text-gray-900">
                {hojaData.totales.totalHoras.toFixed(1)}h
                <span className="text-xs font-normal text-gray-500 ml-1">
                  / {hojaData.totales.horasEsperadas.toFixed(1)}h
                </span>
              </p>
              <p className="text-xs text-gray-500">{hojaData.totales.diasLaborales} días laborales</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#D7D6D7]/60">
              <span className="text-xs font-semibold text-gray-500 uppercase">Cumplimiento Mensual</span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xl font-black ${hojaData.totales.porcentajeCumplimiento >= 100 ? 'text-emerald-700' : 'text-[#A60809]'}`}>
                  {hojaData.totales.porcentajeCumplimiento.toFixed(1)}%
                </span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  hojaData.totales.porcentajeCumplimiento >= 100
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-[#810404]'
                }`}>
                  {hojaData.totales.porcentajeCumplimiento >= 100 ? 'Aprobado' : 'Pendiente'}
                </span>
              </div>
            </div>
          </div>

          {/* Tabla de Detalle */}
          <div className="bg-white rounded-xl shadow-sm border border-[#D7D6D7]/60 overflow-hidden">
            <div className="px-6 py-4 border-b border-[#D7D6D7]/60 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">
                Detalle Diario Oficial – {meses.find((m) => m.num === mes)?.nombre} {anio}
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-[#D7D6D7]/60 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-3">Estado</th>
                    <th className="py-3 px-3">Horario</th>
                    <th className="py-3 px-3 text-right">Docencia</th>
                    <th className="py-3 px-3 text-right">Vinculación</th>
                    <th className="py-3 px-3 text-right">Investigación</th>
                    <th className="py-3 px-3 text-right">Gestión</th>
                    <th className="py-3 px-3 text-right font-bold">Total</th>
                    <th className="py-3 px-4">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D7D6D7]/40">
                  {hojaData.dias.map((d) => {
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

                        <td className="py-3 px-3 whitespace-nowrap text-xs">
                          {isFeriado && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-[#810404]">
                              {d.nombreFeriado}
                            </span>
                          )}
                          {isFinde && <span className="text-gray-400">Fin de Semana</span>}
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
                            ? `${d.record.check_in_time || '--:--'} - ${d.record.check_out_time || '--:--'}`
                            : '--'}
                        </td>

                        <td className="py-3 px-3 text-xs text-right font-mono">{d.record?.docencia_hours?.toFixed(1) || '-'}</td>
                        <td className="py-3 px-3 text-xs text-right font-mono">{d.record?.vinculacion_hours?.toFixed(1) || '-'}</td>
                        <td className="py-3 px-3 text-xs text-right font-mono">{d.record?.investigacion_hours?.toFixed(1) || '-'}</td>
                        <td className="py-3 px-3 text-xs text-right font-mono">{d.record?.gestion_hours?.toFixed(1) || '-'}</td>

                        <td className="py-3 px-3 text-xs text-right font-bold font-mono">
                          {d.record?.total_hours ? `${d.record.total_hours.toFixed(1)}h` : '-'}
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
                    <td colSpan="3" className="py-3 px-4 text-right">TOTALES:</td>
                    <td className="py-3 px-3 text-right font-mono">{hojaData.totales.docencia.toFixed(1)}h</td>
                    <td className="py-3 px-3 text-right font-mono">{hojaData.totales.vinculacion.toFixed(1)}h</td>
                    <td className="py-3 px-3 text-right font-mono">{hojaData.totales.investigacion.toFixed(1)}h</td>
                    <td className="py-3 px-3 text-right font-mono">{hojaData.totales.gestion.toFixed(1)}h</td>
                    <td className="py-3 px-3 text-right font-mono text-[#A60809]">{hojaData.totales.totalHoras.toFixed(1)}h</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
