const express = require('express');
const db = require('../db');
const { authenticate, requireDocente } = require('../middleware');

const router = express.Router();
router.use(authenticate);
router.use(requireDocente);

// Perfil y jornada del docente o coordinador
router.get('/perfil', (req, res) => {
  try {
    const inst = db.prepare('SELECT * FROM institutional_settings WHERE id = 1').get();
    let currentTeacher = req.teacher;
    if (!currentTeacher && req.user.role === 'COORDINADOR') {
      currentTeacher = db.prepare('SELECT * FROM teachers WHERE cedula = ?').get(req.user.cedula);
    }
    if (!currentTeacher) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    const teacher = db.prepare(`
      SELECT t.*, s.name as schedule_name, s.start_time, s.end_time, s.expected_hours, s.code as schedule_code
      FROM teachers t
      LEFT JOIN schedules s ON t.schedule_id = s.id
      WHERE t.id = ?
    `).get(currentTeacher.id);

    const fullTeacher = teacher || currentTeacher;
    const data = {
      ...fullTeacher,
      nombre: fullTeacher.nombre,
      email: fullTeacher.email_institucional,
      email_institucional: fullTeacher.email_institucional,
      telefono: fullTeacher.telefono || '',
      titulo_academico: fullTeacher.titulo_academico || '',
      docente: fullTeacher,
      teacher: fullTeacher,
      institucion: inst
    };
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Modificar datos personales e institucionales del docente o coordinador
router.put('/perfil', (req, res) => {
  try {
    let currentTeacher = req.teacher;
    if (!currentTeacher && req.user.role === 'COORDINADOR') {
      currentTeacher = db.prepare('SELECT * FROM teachers WHERE cedula = ?').get(req.user.cedula);
    }
    if (!currentTeacher) {
      return res.status(404).json({ error: 'Registro docente no encontrado para actualizar' });
    }

    const { nombre, email_institucional, email, titulo_academico, telefono } = req.body;

    const nombreFinal = (nombre && nombre.trim()) ? nombre.trim() : currentTeacher.nombre;
    const emailFinal = (email_institucional && email_institucional.trim())
      ? email_institucional.trim()
      : ((email && email.trim()) ? email.trim() : currentTeacher.email_institucional);
    const tituloFinal = titulo_academico !== undefined ? titulo_academico.trim() : (currentTeacher.titulo_academico || '');
    const telFinal = telefono !== undefined ? telefono.trim() : (currentTeacher.telefono || '');

    db.prepare(`
      UPDATE teachers
      SET nombre = ?, email_institucional = ?, titulo_academico = ?, telefono = ?
      WHERE id = ?
    `).run(nombreFinal, emailFinal, tituloFinal, telFinal, currentTeacher.id);

    // Si es coordinador, sincronizar institutional_settings para reportes oficiales
    if (req.user.role === 'COORDINADOR') {
      try {
        db.prepare(`
          UPDATE institutional_settings
          SET coordinator_name = ?, coordinator_title = ?
          WHERE id = 1
        `).run(nombreFinal, tituloFinal || 'Coordinador Académico');
      } catch (syncErr) {
        console.warn('Advertencia al sincronizar institutional_settings:', syncErr.message);
      }
    }

    const updated = db.prepare(`
      SELECT t.*, s.name as schedule_name, s.start_time, s.end_time, s.expected_hours, s.code as schedule_code
      FROM teachers t
      LEFT JOIN schedules s ON t.schedule_id = s.id
      WHERE t.id = ?
    `).get(currentTeacher.id);

    res.json({
      success: true,
      message: 'Datos personales y de contacto actualizados correctamente',
      docente: updated,
      teacher: updated
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Asistencias propias
router.get('/asistencias', (req, res) => {
  try {
    const { mes, fecha } = req.query;
    let sql = `
      SELECT r.*, d.docencia_hours, d.vinculacion_hours, d.investigacion_hours, d.gestion_hours, d.activities_detail
      FROM attendance_records r
      JOIN attendance_details d ON r.id = d.record_id
      WHERE r.teacher_id = ?
    `;
    const params = [req.teacher.id];

    if (fecha) {
      sql += ' AND r.date = ?';
      params.push(fecha);
    } else if (mes) {
      sql += ' AND r.date LIKE ?';
      params.push(`${mes}%`);
    }

    sql += ' ORDER BY r.date DESC';
    const records = db.prepare(sql).all(...params);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Estado de turnos y activación por el Coordinador
router.get('/shift-status', (req, res) => {
  try {
    const inst = db.prepare(`
      SELECT shift_morning_active, shift_afternoon_active, shift_mode,
             last_activation_morning, last_activation_afternoon, coordinator_activation_msg
      FROM institutional_settings WHERE id = 1
    `).get();
    res.json(inst || {
      shift_morning_active: 1,
      shift_afternoon_active: 1,
      shift_mode: 'COORDINADOR',
      last_activation_morning: null,
      last_activation_afternoon: null,
      coordinator_activation_msg: ''
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Registrar o actualizar asistencia propia
router.post('/asistencia', (req, res) => {
  try {
    const {
      date,
      check_in,
      check_out,
      docencia_hours,
      vinculacion_hours,
      investigacion_hours,
      gestion_hours,
      activities_detail,
      notes
    } = req.body;

    if (!date || !check_in || !check_out) {
      return res.status(400).json({ error: 'Fecha, hora de entrada y hora de salida son obligatorios' });
    }

    const inst = db.prepare('SELECT edit_grace_days, shift_morning_active, shift_afternoon_active, shift_mode FROM institutional_settings WHERE id = 1').get();
    const graceDays = inst ? inst.edit_grace_days : 3;

    const existing = db.prepare('SELECT * FROM attendance_records WHERE teacher_id = ? AND date = ?').get(req.teacher.id, date);
    
    if (existing && existing.is_locked === 1) {
      return res.status(403).json({ error: 'Este registro se encuentra bloqueado. Contacte a Coordinación si requiere corregirlo.' });
    }

    // El sistema se encuentra abierto permanentemente (24/7). Solo se bloquea si el Coordinador lo cerró explícitamente.
    if (inst && inst.shift_mode === 'CERRADO') {
      if (!existing || existing.is_locked === 1) {
        return res.status(403).json({ 
          error: 'El sistema de registro se encuentra temporalmente en pausa por Coordinación de Carrera.' 
        });
      }
    }

    const recordDate = new Date(date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today - recordDate) / (1000 * 60 * 60 * 24));

    if (diffDays > graceDays && !existing) {
      return res.status(403).json({ 
        error: `El plazo para registrar asistencia de esa fecha expiró (máximo ${graceDays} días posteriores). Solicite autorización al Coordinador.` 
      });
    }

    const doc = parseFloat(docencia_hours) || 0;
    const vinc = parseFloat(vinculacion_hours) || 0;
    const inv = parseFloat(investigacion_hours) || 0;
    const gest = parseFloat(gestion_hours) || 0;
    const total = parseFloat((doc + vinc + inv + gest).toFixed(2));

    const expectedHours = 8.0;

    if (total !== expectedHours) {
      return res.status(400).json({
        error: `La jornada laboral debe registrar estrictamente las 8.0 horas reglamentarias (actualmente suma ${total} hrs). No se permite guardar menos ni más de 8.0 horas.`
      });
    }

    const status = 'COMPLETO';

    const saveTransaction = db.transaction(() => {
      let recordId;
      if (existing) {
        db.prepare(`
          UPDATE attendance_records
          SET check_in = ?, check_out = ?, total_hours = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(check_in, check_out, total, status, notes || '', existing.id);
        recordId = existing.id;

        db.prepare(`
          UPDATE attendance_details
          SET docencia_hours = ?, vinculacion_hours = ?, investigacion_hours = ?, gestion_hours = ?, activities_detail = ?
          WHERE record_id = ?
        `).run(doc, vinc, inv, gest, activities_detail || '', recordId);
      } else {
        const r = db.prepare(`
          INSERT INTO attendance_records (teacher_id, date, check_in, check_out, total_hours, status, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(req.teacher.id, date, check_in, check_out, total, status, notes || '');
        recordId = r.lastInsertRowid;

        db.prepare(`
          INSERT INTO attendance_details (record_id, docencia_hours, vinculacion_hours, investigacion_hours, gestion_hours, activities_detail)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(recordId, doc, vinc, inv, gest, activities_detail || '');
      }

      return recordId;
    });

    const savedId = saveTransaction();

    const savedRecord = db.prepare(`
      SELECT r.*, d.docencia_hours, d.vinculacion_hours, d.investigacion_hours, d.gestion_hours, d.activities_detail
      FROM attendance_records r
      JOIN attendance_details d ON r.id = d.record_id
      WHERE r.id = ?
    `).get(savedId);

    res.json(savedRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resumen personal del docente
router.get('/resumen', (req, res) => {
  try {
    const { mes } = req.query;
    if (!mes) return res.status(400).json({ error: 'Mes (YYYY-MM) es requerido' });

    const expectedHours = req.teacher.custom_hours || req.teacher.expected_hours || 8.0;

    const records = db.prepare(`
      SELECT r.*, d.docencia_hours, d.vinculacion_hours, d.investigacion_hours, d.gestion_hours, d.activities_detail
      FROM attendance_records r
      JOIN attendance_details d ON r.id = d.record_id
      WHERE r.teacher_id = ? AND r.date LIKE ?
      ORDER BY r.date ASC
    `).all(req.teacher.id, `${mes}%`);

    let totalDoc = 0, totalVinc = 0, totalInv = 0, totalGest = 0, totalHoras = 0;
    records.forEach(r => {
      totalDoc += r.docencia_hours;
      totalVinc += r.vinculacion_hours;
      totalInv += r.investigacion_hours;
      totalGest += r.gestion_hours;
      totalHoras += r.total_hours;
    });

    const diasRegistrados = records.length;
    const horasMetaRegistradas = diasRegistrados * expectedHours;
    const porcentajeCumplimiento = horasMetaRegistradas > 0 
      ? Math.min(100, parseFloat(((totalHoras / horasMetaRegistradas) * 100).toFixed(1))) 
      : 0;

    const calcPct = (v) => totalHoras > 0 ? parseFloat(((v / totalHoras) * 100).toFixed(1)) : 0;

    res.json({
      teacher: req.teacher,
      mes,
      diasRegistrados,
      expectedHoursDaily: expectedHours,
      totalHoras: parseFloat(totalHoras.toFixed(2)),
      porcentajeCumplimiento,
      promedioDiario: diasRegistrados > 0 ? parseFloat((totalHoras / diasRegistrados).toFixed(2)) : 0,
      totalesPorFuncion: {
        docencia: parseFloat(totalDoc.toFixed(2)),
        pctDocencia: calcPct(totalDoc),
        vinculacion: parseFloat(totalVinc.toFixed(2)),
        pctVinculacion: calcPct(totalVinc),
        investigacion: parseFloat(totalInv.toFixed(2)),
        pctInvestigacion: calcPct(totalInv),
        gestion: parseFloat(totalGest.toFixed(2)),
        pctGestion: calcPct(totalGest)
      },
      asistencias: records
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Estructura completa mensual para PDF del docente
router.get('/hoja-mes', (req, res) => {
  try {
    const { mes } = req.query;
    if (!mes) return res.status(400).json({ error: 'Mes (YYYY-MM) es requerido' });

    const inst = db.prepare('SELECT * FROM institutional_settings WHERE id = 1').get();
    const holidays = db.prepare('SELECT * FROM holidays WHERE date LIKE ?').all(`${mes}%`);
    const holidayMap = {};
    holidays.forEach(h => { holidayMap[h.date] = h.description; });

    const records = db.prepare(`
      SELECT r.*, d.docencia_hours, d.vinculacion_hours, d.investigacion_hours, d.gestion_hours, d.activities_detail
      FROM attendance_records r
      JOIN attendance_details d ON r.id = d.record_id
      WHERE r.teacher_id = ? AND r.date LIKE ?
    `).all(req.teacher.id, `${mes}%`);

    const recordsMap = {};
    records.forEach(r => { recordsMap[r.date] = r; });

    const [year, month] = mes.split('-').map(Number);
    const totalDays = new Date(year, month, 0).getDate();

    const dias = [];
    let sumDoc = 0, sumVinc = 0, sumInv = 0, sumGest = 0, sumTot = 0, diasTrabajados = 0;

    for (let day = 1; day <= totalDays; day++) {
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const fechaStr = `${year}-${month < 10 ? '0' + month : month}-${dayStr}`;
      const dateObj = new Date(year, month - 1, day);
      const dayOfWeek = dateObj.getDay();
      const esFinDeSemana = (dayOfWeek === 0 || dayOfWeek === 6);
      const esFeriado = holidayMap[fechaStr];

      const reg = recordsMap[fechaStr];

      if (reg) {
        sumDoc += reg.docencia_hours;
        sumVinc += reg.vinculacion_hours;
        sumInv += reg.investigacion_hours;
        sumGest += reg.gestion_hours;
        sumTot += reg.total_hours;
        diasTrabajados++;

        dias.push({
          dia: day,
          fecha: fechaStr,
          dia_semana: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][dayOfWeek],
          esFinDeSemana,
          esFeriado: !!esFeriado,
          registrado: true,
          check_in: reg.check_in,
          check_out: reg.check_out,
          docencia_hours: reg.docencia_hours,
          vinculacion_hours: reg.vinculacion_hours,
          investigacion_hours: reg.investigacion_hours,
          gestion_hours: reg.gestion_hours,
          total_hours: reg.total_hours,
          activities_detail: reg.activities_detail,
          status: reg.status
        });
      } else {
        dias.push({
          dia: day,
          fecha: fechaStr,
          dia_semana: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][dayOfWeek],
          esFinDeSemana,
          esFeriado: !!esFeriado,
          registrado: false,
          check_in: esFinDeSemana ? '-' : (esFeriado ? 'Feriado' : ''),
          check_out: esFinDeSemana ? '-' : (esFeriado ? 'Feriado' : ''),
          docencia_hours: 0,
          vinculacion_hours: 0,
          investigacion_hours: 0,
          gestion_hours: 0,
          total_hours: 0,
          activities_detail: esFinDeSemana ? 'No laboral (Descanso)' : (esFeriado ? esFeriado : 'Sin registro'),
          status: esFinDeSemana ? 'NO_LABORAL' : (esFeriado ? 'FERIADO' : 'PENDIENTE')
        });
      }
    }

    res.json({
      institucion: inst,
      docente: req.teacher,
      mes,
      totalDays,
      diasTrabajados,
      totales: {
        docencia: parseFloat(sumDoc.toFixed(2)),
        vinculacion: parseFloat(sumVinc.toFixed(2)),
        investigacion: parseFloat(sumInv.toFixed(2)),
        gestion: parseFloat(sumGest.toFixed(2)),
        total: parseFloat(sumTot.toFixed(2))
      },
      dias
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
