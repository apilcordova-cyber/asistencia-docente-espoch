import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generarPdfOficial(data) {
  const institucion = data.institucion || data.settings || {};
  const prof = data.docente || data.teacher || data.profesor || {};
  const mes = data.mes || (data.anio && data.mes ? `${data.anio}-${data.mes < 10 ? '0' + data.mes : data.mes}` : '2026-09');
  const totales = data.totales || {};
  const dias = data.dias || [];

  const nombreCompleto = prof.nombre || `${prof.nombres || ''} ${prof.apellidos || ''}`.trim() || 'Docente';
  const cedulaDocente = prof.cedula || '';
  const jornadaNombre = prof.schedule_name || prof.tipo_jornada || 'Jornada Asignada (6h)';

  const doc = new jsPDF('p', 'mm', 'a4'); // A4 retrato: 210mm ancho x 297mm alto

  let mesNombre = mes;
  try {
    const parts = mes.split('-');
    const y = parts[0];
    const m = parseInt(parts[1], 10);
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    if (m >= 1 && m <= 12) {
      mesNombre = `${meses[m - 1]} ${y}`;
    }
  } catch (e) {
    // fallback
  }

  // Encabezado institucional Marketing ESPOCH
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(129, 4, 4); // #810404 Rojo Profundo
  doc.text(institucion?.institution_name || 'ESCUELA SUPERIOR POLITÉCNICA DE CHIMBORAZO - ESPOCH', 105, 13, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text(institucion?.faculty_name || 'FACULTAD DE ADMINISTRACIÓN DE EMPRESAS - FADE', 105, 17.5, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(166, 8, 9); // #A60809 Rojo ESPOCH
  doc.text(institucion?.carrera_name || institucion?.career_name || 'CARRERA DE MARKETING', 105, 22, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('HOJA INDIVIDUAL DE CONTROL DE ASISTENCIA Y JORNADA DOCENTE', 105, 27.5, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`PERIODO ACADÉMICO / MES: ${mesNombre.toUpperCase()}`, 105, 31.5, { align: 'center' });

  // Línea divisoria superior en Rojo ESPOCH
  doc.setDrawColor(166, 8, 9);
  doc.setLineWidth(0.6);
  doc.line(14, 34, 196, 34);

  // Cuadro de datos del profesor
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Docente:', 14, 39);
  doc.setFont('helvetica', 'normal');
  doc.text(nombreCompleto, 30, 39);

  doc.setFont('helvetica', 'bold');
  doc.text('Cédula:', 125, 39);
  doc.setFont('helvetica', 'normal');
  doc.text(cedulaDocente, 140, 39);

  doc.setFont('helvetica', 'bold');
  doc.text('Carrera:', 14, 43.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Marketing (FADE)', 28, 43.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Jornada:', 125, 43.5);
  doc.setFont('helvetica', 'normal');
  doc.text(jornadaNombre, 140, 43.5);

  // Armado de filas de la tabla
  const tableRows = dias.map((d, index) => {
    const diaNum = d.dia || index + 1;
    const diaSem = d.dia_semana || d.diaSemana || '';
    const fechaCompleta = d.fecha || '';
    const reg = d.record || (d.registrado ? d : null);

    const isFinde = d.esFinDeSemana || d.tipoDia === 'FIN_DE_SEMANA';
    const isFeriado = d.esFeriado || d.tipoDia === 'FERIADO';
    const feriadoNombre = d.nombreFeriado || (typeof d.esFeriado === 'string' ? d.esFeriado : 'Feriado');

    let horarioStr = '-';
    let docH = '-';
    let vincH = '-';
    let invH = '-';
    let gestH = '-';
    let totalH = '-';
    let actDetail = '-';

    if (reg) {
      const cin = reg.check_in_time || reg.check_in || '--:--';
      const cout = reg.check_out_time || reg.check_out || '--:--';
      if (cin.includes('-')) {
        horarioStr = `${cin} / ${cout}`;
      } else {
        horarioStr = `${cin} - ${cout}`;
      }
      docH = reg.docencia_hours !== undefined ? Number(reg.docencia_hours).toFixed(1) : '0.0';
      vincH = reg.vinculacion_hours !== undefined ? Number(reg.vinculacion_hours).toFixed(1) : '0.0';
      invH = reg.investigacion_hours !== undefined ? Number(reg.investigacion_hours).toFixed(1) : '0.0';
      gestH = reg.gestion_hours !== undefined ? Number(reg.gestion_hours).toFixed(1) : '0.0';
      totalH = reg.total_hours !== undefined ? Number(reg.total_hours).toFixed(1) : '0.0';
      actDetail = reg.activities_detail || reg.observations || 'Cumplimiento regular de actividades';
    } else if (isFeriado) {
      horarioStr = 'Feriado';
      actDetail = feriadoNombre;
    } else if (isFinde) {
      horarioStr = 'No Laboral';
      actDetail = 'Fin de Semana (Descanso obligatorio)';
    } else {
      actDetail = 'Sin registro de asistencia';
    }

    return [
      diaNum,
      diaSem,
      fechaCompleta,
      horarioStr,
      docH,
      vincH,
      invH,
      gestH,
      totalH,
      actDetail
    ];
  });

  const totDoc = (totales.docencia || 0).toFixed(1);
  const totVinc = (totales.vinculacion || 0).toFixed(1);
  const totInv = (totales.investigacion || 0).toFixed(1);
  const totGest = (totales.gestion || 0).toFixed(1);
  const totGen = (totales.totalHoras || totales.total || totales.total_horas || 0).toFixed(1);

  autoTable(doc, {
    startY: 47,
    head: [[
      'Día', 'Sem.', 'Fecha', 'Horario',
      'Doc.', 'Vinc.', 'Inv.', 'Gest.', 'Total',
      'Resumen de Actividades / Observaciones'
    ]],
    body: tableRows,
    foot: [[
      { content: 'TOTALES ACUMULADOS:', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: `${totDoc}h`, styles: { halign: 'center', fontStyle: 'bold' } },
      { content: `${totVinc}h`, styles: { halign: 'center', fontStyle: 'bold' } },
      { content: `${totInv}h`, styles: { halign: 'center', fontStyle: 'bold' } },
      { content: `${totGest}h`, styles: { halign: 'center', fontStyle: 'bold' } },
      { content: `${totGen}h`, styles: { halign: 'center', fontStyle: 'bold', textColor: [166, 8, 9] } },
      { content: 'Reporte Legalizado FADE-ESPOCH', styles: { fontStyle: 'italic', textColor: [100, 116, 139] } }
    ]],
    theme: 'grid',
    styles: {
      fontSize: 6.8,
      cellPadding: 1.2,
      lineColor: [215, 214, 215],
      lineWidth: 0.15,
      textColor: [30, 41, 59]
    },
    headStyles: {
      fillColor: [166, 8, 9], // Rojo ESPOCH
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 7
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      lineWidth: 0.25,
      fontSize: 7.2
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 9, halign: 'center' },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 11, halign: 'center' },
      5: { cellWidth: 11, halign: 'center' },
      6: { cellWidth: 11, halign: 'center' },
      7: { cellWidth: 11, halign: 'center' },
      8: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
      9: { cellWidth: 'auto' }
    },
    didDrawCell: (hookData) => {
      if (hookData.section === 'body') {
        const rawRow = hookData.row.raw;
        if (rawRow && (rawRow[3] === 'No Laboral' || rawRow[3] === 'Feriado')) {
          hookData.cell.styles.textColor = [148, 163, 184];
        }
      }
    }
  });

  // Pie de página con firmas reglamentarias
  const pageHeight = doc.internal.pageSize.height;
  const signatureY = pageHeight - 22;

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);

  // Línea y firma del Docente
  doc.line(25, signatureY, 85, signatureY);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('FIRMA DEL DOCENTE', 55, signatureY + 3.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text(nombreCompleto, 55, signatureY + 7, { align: 'center' });
  doc.text(`C.I. ${cedulaDocente}`, 55, signatureY + 10, { align: 'center' });

  // Línea y firma de Visto Bueno Coordinación
  doc.line(125, signatureY, 185, signatureY);
  doc.setFont('helvetica', 'bold');
  doc.text('VISTO BUENO / APROBACIÓN', 155, signatureY + 3.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text(institucion?.director_carrera || 'Coordinador(a) de Carrera de Marketing', 155, signatureY + 7, { align: 'center' });
  doc.text('Carrera de Marketing ESPOCH', 155, signatureY + 10, { align: 'center' });

  // Marca de agua y crédito técnico MKTAP
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text('Plataforma de Control de Asistencia y Jornada Docente • Carrera de Marketing ESPOCH • MKTAP', 105, pageHeight - 5, { align: 'center' });

  const filename = `Asistencia_Marketing_${nombreCompleto.replace(/\s+/g, '_')}_${mes}.pdf`;
  doc.save(filename);
}

export function exportarCsvOficial(data) {
  const prof = data.docente || data.teacher || data.profesor || {};
  const mes = data.mes || (data.anio && data.mes ? `${data.anio}-${data.mes < 10 ? '0' + data.mes : data.mes}` : '2026-09');
  const totales = data.totales || {};
  const dias = data.dias || [];

  const nombreCompleto = prof.nombre || `${prof.nombres || ''} ${prof.apellidos || ''}`.trim() || 'Docente';
  const cedulaDocente = prof.cedula || '';
  const jornadaNombre = prof.schedule_name || prof.tipo_jornada || 'Jornada Asignada (6h)';

  let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
  csvContent += `CARRERA DE MARKETING - ESPOCH\n`;
  csvContent += `HOJA DE ASISTENCIA Y DISTRIBUCION DE JORNADA DOCENTE\n`;
  csvContent += `Docente: ${nombreCompleto},Cedula: ${cedulaDocente},Mes: ${mes},Jornada: ${jornadaNombre}\n\n`;
  csvContent += `Dia,DiaSemana,Fecha,HoraEntrada,HoraSalida,Docencia_Horas,Vinculacion_Horas,Investigacion_Horas,Gestion_Horas,Total_Horas,Detalle_Actividades,Estado\n`;

  dias.forEach((d, index) => {
    const diaNum = d.dia || index + 1;
    const diaSem = d.dia_semana || d.diaSemana || '';
    const fechaCompleta = d.fecha || '';
    const reg = d.record || (d.registrado ? d : null);

    const detalleLimpio = ((reg?.activities_detail || reg?.observations || (d.esFeriado ? 'Feriado' : (d.esFinDeSemana ? 'Fin de semana' : '')))).replace(/"/g, '""').replace(/\n/g, ' ');
    const checkIn = reg?.check_in_time || reg?.check_in || '';
    const checkOut = reg?.check_out_time || reg?.check_out || '';
    const doc = reg?.docencia_hours || 0;
    const vinc = reg?.vinculacion_hours || 0;
    const inv = reg?.investigacion_hours || 0;
    const gest = reg?.gestion_hours || 0;
    const tot = reg?.total_hours || 0;
    const est = reg?.status || (d.tipoDia || '');

    csvContent += `${diaNum},"${diaSem}",${fechaCompleta},"${checkIn}","${checkOut}",${doc},${vinc},${inv},${gest},${tot},"${detalleLimpio}","${est}"\n`;
  });

  const totDoc = totales.docencia || 0;
  const totVinc = totales.vinculacion || 0;
  const totInv = totales.investigacion || 0;
  const totGest = totales.gestion || 0;
  const totGen = totales.totalHoras || totales.total || 0;

  csvContent += `TOTALES,,,,,"${totDoc}","${totVinc}","${totInv}","${totGest}","${totGen}","Consolidado mensual"\n`;

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Asistencia_Marketing_${nombreCompleto.replace(/\s+/g, '_')}_${mes}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export aliases for flexible imports
export const exportarHojaAsistenciaPDF = generarPdfOficial;
export const exportarHojaCSV = exportarCsvOficial;
