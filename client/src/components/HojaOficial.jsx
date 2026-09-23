import React, { useState, useEffect } from 'react';
import { 
  FileDown, 
  Table, 
  Printer, 
  Calendar, 
  CheckCircle2, 
  User, 
  Building, 
  Award,
  Sparkles,
  Clock
} from 'lucide-react';
import { getReporteMesCompleto } from '../api';
import { generarPdfOficial, exportarCsvOficial } from '../utils/exportadorPdf';

export default function HojaOficial({ profesorActivo, institucion }) {
  const currentMonthStr = (() => {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil' }).format(new Date()).substring(0, 7);
    } catch (e) {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
  })();
  const [mes, setMes] = useState(currentMonthStr);
  const [reporteData, setReporteData] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!profesorActivo?.id) return;
    cargarReporte();
  }, [profesorActivo, mes]);

  const cargarReporte = async () => {
    setCargando(true);
    try {
      const data = await getReporteMesCompleto(profesorActivo.id, mes);
      setReporteData(data);
    } catch (err) {
      console.error('Error cargando reporte oficial:', err);
    } finally {
      setCargando(false);
    }
  };

  const formatearMes = (mStr) => {
    const [y, m] = mStr.split('-');
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${meses[parseInt(m) - 1]} ${y}`;
  };

  const handleDescargarPdf = () => {
    if (reporteData) {
      generarPdfOficial(reporteData);
    }
  };

  const handleExportarCsv = () => {
    if (reporteData) {
      exportarCsvOficial(reporteData);
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      
      {/* Barra de Controles y Descargas */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              Documento Oficial Institucional
            </span>
            <span className="text-xs text-slate-500">
              Sustituto Digital de la Hoja de Firmas
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">
            Hoja Mensual de Asistencia y Distribución
          </h2>
          <p className="text-sm text-slate-600">
            Formato listo para exportación, firma digital o impresión física.
          </p>
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Selector de Mes */}
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-sm">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <input 
              type="month" 
              value={mes} 
              onChange={(e) => setMes(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer text-xs sm:text-sm"
            />
          </div>

          <button
            onClick={handleDescargarPdf}
            disabled={!reporteData || cargando}
            className="flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Descargar PDF Oficial
          </button>

          <button
            onClick={handleExportarCsv}
            disabled={!reporteData || cargando}
            className="flex items-center px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            <Table className="w-4 h-4 mr-1.5" />
            Excel / CSV
          </button>

          <button
            onClick={handleImprimir}
            className="flex items-center px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all cursor-pointer"
            title="Imprimir vista"
          >
            <Printer className="w-4 h-4" />
          </button>

        </div>
      </div>

      {cargando ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
          <Clock className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
          Generando hoja mensual de {formatearMes(mes)}...
        </div>
      ) : reporteData ? (
        <div className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200 shadow-md max-w-5xl mx-auto font-sans text-slate-800 space-y-6">
          
          {/* Membrete Institucional */}
          <div className="text-center border-b border-slate-200 pb-5 space-y-1">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
              {institucion?.nombre_institucion || 'Universidad Técnica Nacional'}
            </h1>
            <p className="text-sm font-semibold text-slate-600 uppercase">
              {institucion?.facultad || 'Facultad de Ingeniería y Ciencias Aplicadas'}
            </p>
            <p className="text-xs font-medium text-slate-500">
              {institucion?.carrera_departamento || 'Departamento de Computación y Sistemas'}
            </p>
            <div className="pt-2">
              <span className="inline-block bg-slate-100 border border-slate-300 text-slate-900 px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider">
                Control Individual de Asistencia y Jornada Laboral Docente
              </span>
            </div>
            <p className="text-xs font-bold text-indigo-700 pt-1">
              PERIODO / MES: {formatearMes(mes).toUpperCase()}
            </p>
          </div>

          {/* Cuadro de Datos del Docente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 font-medium">Nombre del Docente:</span>
              <div className="font-bold text-slate-900 text-sm">{reporteData.profesor.nombre}</div>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Cédula de Identidad / ID:</span>
              <div className="font-bold text-slate-900 text-sm">{reporteData.profesor.cedula}</div>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Departamento / Área:</span>
              <div className="font-semibold text-slate-800">{reporteData.profesor.departamento}</div>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Tipo de Dedicación:</span>
              <div className="font-semibold text-slate-800">
                {reporteData.profesor.tipo_jornada} ({reporteData.profesor.horas_diarias} hrs diarias)
              </div>
            </div>
          </div>

          {/* Tabla de Asistencia y Actividades Día por Día */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white font-bold text-center">
                  <th className="py-2 px-1.5 border border-slate-700">Día</th>
                  <th className="py-2 px-1.5 border border-slate-700">Sem</th>
                  <th className="py-2 px-2 border border-slate-700">Fecha</th>
                  <th className="py-2 px-2 border border-slate-700">Horario</th>
                  <th className="py-2 px-1.5 border border-slate-700 bg-blue-900">Doc.</th>
                  <th className="py-2 px-1.5 border border-slate-700 bg-emerald-900">Vinc.</th>
                  <th className="py-2 px-1.5 border border-slate-700 bg-purple-900">Inv.</th>
                  <th className="py-2 px-1.5 border border-slate-700 bg-amber-900">Gest.</th>
                  <th className="py-2 px-1.5 border border-slate-700 bg-slate-900 font-black">Total</th>
                  <th className="py-2 px-3 border border-slate-700 text-left">Detalle / Bitácora de Actividades</th>
                  <th className="py-2 px-2 border border-slate-700">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {reporteData.dias.map((d) => (
                  <tr 
                    key={d.dia} 
                    className={`text-center ${
                      d.esFinDeSemana 
                        ? 'bg-slate-50/80 text-slate-400' 
                        : d.registrado 
                          ? 'hover:bg-blue-50/30 text-slate-800' 
                          : 'text-slate-500'
                    }`}
                  >
                    <td className="py-2 px-1 border border-slate-200 font-bold">{d.dia}</td>
                    <td className="py-2 px-1 border border-slate-200">{d.dia_semana}</td>
                    <td className="py-2 px-1.5 border border-slate-200 whitespace-nowrap">{d.fecha}</td>
                    <td className="py-2 px-1.5 border border-slate-200 text-[11px] whitespace-nowrap font-medium">
                      {d.registrado ? `${d.hora_entrada} - ${d.hora_salida}` : (d.esFinDeSemana ? 'Descanso' : '-')}
                    </td>
                    <td className="py-2 px-1.5 border border-slate-200 font-semibold text-blue-700">
                      {d.horas_docencia > 0 ? `${d.horas_docencia}h` : '-'}
                    </td>
                    <td className="py-2 px-1.5 border border-slate-200 font-semibold text-emerald-700">
                      {d.horas_vinculacion > 0 ? `${d.horas_vinculacion}h` : '-'}
                    </td>
                    <td className="py-2 px-1.5 border border-slate-200 font-semibold text-purple-700">
                      {d.horas_investigacion > 0 ? `${d.horas_investigacion}h` : '-'}
                    </td>
                    <td className="py-2 px-1.5 border border-slate-200 font-semibold text-amber-700">
                      {d.horas_gestion > 0 ? `${d.horas_gestion}h` : '-'}
                    </td>
                    <td className="py-2 px-1.5 border border-slate-200 font-black text-slate-900 bg-slate-50">
                      {d.registrado ? `${d.total_horas}h` : '-'}
                    </td>
                    <td className="py-2 px-3 border border-slate-200 text-left text-[11px] max-w-xs truncate" title={d.detalle_actividades}>
                      {d.detalle_actividades}
                    </td>
                    <td className="py-2 px-1.5 border border-slate-200">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        d.registrado 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : d.esFinDeSemana 
                            ? 'bg-slate-100 text-slate-500' 
                            : 'bg-amber-50 text-amber-700'
                      }`}>
                        {d.registrado ? 'REGISTRADO' : (d.esFinDeSemana ? 'FIN SEM.' : 'PENDIENTE')}
                      </span>
                    </td>
                  </tr>
                ))}

                {/* Fila de Totales */}
                <tr className="bg-slate-100 font-black text-center text-xs text-slate-900 border-t-2 border-slate-400">
                  <td colSpan="4" className="py-2.5 px-3 border border-slate-300 text-right uppercase tracking-wider">
                    TOTALES ACUMULADOS EN EL MES:
                  </td>
                  <td className="py-2.5 px-1.5 border border-slate-300 text-blue-800 font-black">
                    {reporteData.totales.horas_docencia}h
                  </td>
                  <td className="py-2.5 px-1.5 border border-slate-300 text-emerald-800 font-black">
                    {reporteData.totales.horas_vinculacion}h
                  </td>
                  <td className="py-2.5 px-1.5 border border-slate-300 text-purple-800 font-black">
                    {reporteData.totales.horas_investigacion}h
                  </td>
                  <td className="py-2.5 px-1.5 border border-slate-300 text-amber-800 font-black">
                    {reporteData.totales.horas_gestion}h
                  </td>
                  <td className="py-2.5 px-1.5 border border-slate-300 text-slate-950 font-black bg-slate-200 text-sm">
                    {reporteData.totales.total_horas}h
                  </td>
                  <td colSpan="2" className="py-2.5 px-3 border border-slate-300 text-left text-xs font-semibold text-slate-600">
                    {reporteData.diasTrabajados} días registrados con éxito
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Cuadro Resumen de Porcentajes de Acreditación */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="font-bold text-slate-700">
              Distribución Porcentual del Mes:
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-blue-700 font-bold">
                Docencia: {reporteData.totales.total_horas > 0 ? Math.round((reporteData.totales.horas_docencia / reporteData.totales.total_horas) * 100) : 0}%
              </span>
              <span className="text-emerald-700 font-bold">
                Vinculación: {reporteData.totales.total_horas > 0 ? Math.round((reporteData.totales.horas_vinculacion / reporteData.totales.total_horas) * 100) : 0}%
              </span>
              <span className="text-purple-700 font-bold">
                Investigación: {reporteData.totales.total_horas > 0 ? Math.round((reporteData.totales.horas_investigacion / reporteData.totales.total_horas) * 100) : 0}%
              </span>
              <span className="text-amber-700 font-bold">
                Gestión: {reporteData.totales.total_horas > 0 ? Math.round((reporteData.totales.horas_gestion / reporteData.totales.total_horas) * 100) : 0}%
              </span>
            </div>
          </div>

          {/* Bloque de Firmas para Validez Legal/Institucional */}
          <div className="pt-10 grid grid-cols-1 sm:grid-cols-2 gap-12 text-center text-xs">
            
            <div className="space-y-1">
              <div className="border-t border-slate-400 mx-auto w-48 sm:w-64 pt-2">
                <span className="font-bold text-slate-900 block uppercase">Firma del Docente</span>
                <span className="text-slate-700 block">{reporteData.profesor.nombre}</span>
                <span className="text-slate-500 block">C.I. {reporteData.profesor.cedula}</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="border-t border-slate-400 mx-auto w-48 sm:w-64 pt-2">
                <span className="font-bold text-slate-900 block uppercase">Visto Bueno / Aprobación</span>
                <span className="text-slate-700 block">{institucion?.director_nombre || 'Director(a) de Carrera'}</span>
                <span className="text-slate-500 block">{institucion?.director_cargo || 'Gestión Académica'}</span>
              </div>
            </div>

          </div>

        </div>
      ) : null}

    </div>
  );
}
