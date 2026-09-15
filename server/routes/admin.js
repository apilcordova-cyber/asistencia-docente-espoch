const express = require('express');
const db = require('../db');
const { logAudit, authenticate, requireCoordinator } = require('../middleware');

const router = express.Router();
router.use(authenticate);
router.use(requireCoordinator);

// Dashboard general
router.get('/dashboard', (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonth = todayStr.substring(0, 7);

    const totalTeachers = db.prepare('SELECT COUNT(*) as c FROM teachers').get().c;
    const activeTeachers = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'DOCENTE' AND status = 'ACTIVO'").get().c;
    const pendingActivation = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'DOCENTE' AND status = 'PENDIENTE_ACTIVACION'").get().c;

    const markedToday = db.prepare('SELECT COUNT(*) as c FROM attendance_records WHERE date = ?').get(todayStr).c;
    const pendingToday = Math.max(0, activeTeachers - markedToday);

    const monthlyStats = db.prepare(`
      SELECT 
        SUM(d.docencia_hours) as sum_doc,
        SUM(d.vinculacion_hours) as sum_vinc,
        SUM(d.investigacion_hours) as sum_inv,
        SUM(d.gestion_hours) as sum_gest,
        SUM(r.total_hours) as sum_total
      FROM attendance_records r
      JOIN attendance_details d ON r.id = d.record_id
      WHERE r.date LIKE ?
    `).get(`${currentMonth}%`);

    const teachersWithoutToday = db.prepare(`
      SELECT t.id, t.nombre, t.cedula, s.name as schedule_name, s.code as schedule_code
      FROM teachers t
      JOIN schedules s ON t.schedule_id = s.id
      JOIN users u ON t.user_id = u.id
      WHERE u.status = 'ACTIVO' 
        AND t.id NOT IN (SELECT teacher_id FROM attendance_records WHERE date = ?)
      ORDER BY s.code ASC, t.nombre ASC
    `).all(todayStr);

    const j1Count = db.prepare('SELECT COUNT(*) as c FROM teachers WHERE schedule_id = 1').get().c;
    const j2Count = db.prepare('SELECT COUNT(*) as c FROM teachers WHERE schedule_id = 2').get().c;

    const totalHorasMes = parseFloat((monthlyStats.sum_total || 0).toFixed(2));
    const docMes = parseFloat((monthlyStats.sum_doc || 0).toFixed(2));
    const vincMes = parseFloat((monthlyStats.sum_vinc || 0).toFixed(2));
    const invMes = parseFloat((monthlyStats.sum_inv || 0).toFixed(2));
    const gestMes = parseFloat((monthlyStats.sum_gest || 0).toFixed(2));

    const tasaCumplimiento = totalTeachers > 0 
      ? Math.min(100, parseFloat(((totalHorasMes / (Math.max(1, activeTeachers) * 8.0 * 20)) * 100).toFixed(1)))
      : 0;

    res.json({
      today: todayStr,
      mes: currentMonth,
      kpis: {
        totalTeachers,
        totalDocentes: totalTeachers,
        activeTeachers,
        docentesActivos: activeTeachers,
        pendingActivation,
        markedToday,
        asistenciasHoy: markedToday,
        pendingToday,
        sinRegistroHoy: pendingToday,
        jornada1Total: j1Count,
        jornada2Total: j2Count,
        horasMesTotal: totalHorasMes,
        horasMes: totalHorasMes,
        tasaCumplimiento,
        docenciaMes: docMes,
        vinculacionMes: vincMes,
        investigacionMes: invMes,
        gestionMes: gestMes
      },
      desglosePilares: {
        docencia: docMes,
        vinculacion: vincMes,
        investigacion: invMes,
        gestion: gestMes
      },
      distribucionJornadas: [
        { id: 1, name: 'Jornada Combinable 8h (07h00 a 13h00 y 15h00 a 21h00)', start_time: '07:00', end_time: '13:00', hours_per_day: 8.0, count: j1Count },
        { id: 2, name: 'Jornada Vespertina Combinable 8h (15h00 a 21h00 y 07h00 a 13h00)', start_time: '15:00', end_time: '21:00', hours_per_day: 8.0, count: j2Count }
      ],
      docentesPendientesHoy: teachersWithoutToday,
      docentesSinRegistroHoy: teachersWithoutToday
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lista de docentes
router.get('/teachers', (req, res) => {
  try {
    const teachers = db.prepare(`
      SELECT t.*, u.status as user_status, u.created_at as account_created, u.last_login,
             s.name as schedule_name, s.code as schedule_code, s.expected_hours
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      JOIN schedules s ON t.schedule_id = s.id
      ORDER BY t.nombre ASC
    `).all();
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear docente (cédula como contraseña inicial y estado ACTIVO)
router.post('/teachers', (req, res) => {
  try {
    const { cedula, nombre, email_institucional, schedule_id, titulo_academico, telefono } = req.body;
    if (!cedula || !nombre) {
      return res.status(400).json({ error: 'Cédula y nombre son obligatorios' });
    }

    const c = cedula.trim();
    const nom = nombre.trim();
    const email = (email_institucional && email_institucional.trim()) ? email_institucional.trim() : `${c}@espoch.edu.ec`;

    let targetScheduleId = schedule_id ? parseInt(schedule_id) : null;
    if (!targetScheduleId) {
      const defSched = db.prepare('SELECT id FROM schedules ORDER BY id ASC LIMIT 1').get();
      targetScheduleId = defSched ? defSched.id : 1;
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE cedula = ?').get(c);
    if (existingUser) {
      return res.status(400).json({ error: 'Ya existe un usuario o docente con ese número de cédula' });
    }

    const defaultHash = bcrypt.hashSync(c, 10);

    const createTx = db.transaction(() => {
      const u = db.prepare(`
        INSERT INTO users (cedula, password_hash, role, status)
        VALUES (?, ?, 'DOCENTE', 'ACTIVO')
      `).run(c, defaultHash);

      const t = db.prepare(`
        INSERT INTO teachers (user_id, cedula, nombre, email_institucional, schedule_id, titulo_academico, custom_hours, telefono)
        VALUES (?, ?, ?, ?, ?, ?, 8.0, ?)
      `).run(u.lastInsertRowid, c, nom, email, targetScheduleId, titulo_academico || '', telefono || null);

      return t.lastInsertRowid;
    });

    const newTeacherId = createTx();
    logAudit(req.user.id, 'CREAR_DOCENTE', 'teachers', `Creado docente ${nom} (C.I. ${c}) con contraseña inicial = cédula`, req.ip);

    const created = db.prepare(`
      SELECT t.*, u.status as user_status, s.name as schedule_name 
      FROM teachers t 
      JOIN users u ON t.user_id = u.id 
      JOIN schedules s ON t.schedule_id = s.id 
      WHERE t.id = ?
    `).get(newTeacherId);

    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Carga masiva de docentes desde matriz (JSON / Array)
router.post('/teachers/bulk', (req, res) => {
  try {
    const { docentes } = req.body;
    if (!Array.isArray(docentes) || docentes.length === 0) {
      return res.status(400).json({ error: 'Se requiere un arreglo de docentes para la carga masiva' });
    }

    const results = [];
    for (const item of docentes) {
      const t = db.registrarDocenteMatriz(item);
      if (t) results.push(t);
    }

    logAudit(req.user.id, 'CARGA_MASIVA_DOCENTES', 'teachers', `Cargados/actualizados ${results.length} docentes desde matriz`, req.ip);
    res.json({
      success: true,
      totalProcesados: results.length,
      docentes: results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar docente
router.put('/teachers/:id', (req, res) => {
  try {
    const { nombre, email_institucional, schedule_id, titulo_academico, user_status, custom_hours } = req.body;
    const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(req.params.id);
    if (!teacher) return res.status(404).json({ error: 'Docente no encontrado' });

    db.transaction(() => {
      db.prepare(`
        UPDATE teachers 
        SET nombre = ?, email_institucional = ?, schedule_id = ?, titulo_academico = ?, custom_hours = ?
        WHERE id = ?
      `).run(
        nombre.trim(),
        email_institucional.trim(),
        parseInt(schedule_id),
        titulo_academico || '',
        custom_hours ? parseFloat(custom_hours) : null,
        teacher.id
      );

      if (user_status) {
        db.prepare('UPDATE users SET status = ? WHERE id = ?').run(user_status, teacher.user_id);
      }
    })();

    logAudit(req.user.id, 'ACTUALIZAR_DOCENTE', 'teachers', `Actualizados datos de ${nombre}`, req.ip);

    const updated = db.prepare(`
      SELECT t.*, u.status as user_status, s.name as schedule_name 
      FROM teachers t 
      JOIN users u ON t.user_id = u.id 
      JOIN schedules s ON t.schedule_id = s.id 
      WHERE t.id = ?
    `).get(teacher.id);

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resetear contraseña
router.post('/teachers/:id/reset-password', (req, res) => {
  try {
    const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(req.params.id);
    if (!teacher) return res.status(404).json({ error: 'Docente no encontrado' });

    db.prepare("UPDATE users SET password_hash = NULL, status = 'PENDIENTE_ACTIVACION' WHERE id = ?").run(teacher.user_id);
    logAudit(req.user.id, 'RESET_PASSWORD', 'users', `Reseteada contraseña de ${teacher.nombre}`, req.ip);

    res.json({ success: true, message: `Contraseña reseteada. ${teacher.nombre} puede ingresar a 'Activar cuenta' para definir nueva clave.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Jornadas
router.get('/schedules', (req, res) => {
  try {
    const schedules = db.prepare('SELECT * FROM schedules WHERE is_active = 1').all();
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supervisión de asistencias
router.get('/attendance', (req, res) => {
  try {
    const { teacher_id, schedule_id, mes, fecha, status } = req.query;
    let sql = `
      SELECT r.*, t.nombre as teacher_nombre, t.cedula as teacher_cedula,
             s.name as schedule_name, s.expected_hours,
             d.docencia_hours, d.vinculacion_hours, d.investigacion_hours, d.gestion_hours, d.activities_detail
      FROM attendance_records r
      JOIN teachers t ON r.teacher_id = t.id
      JOIN schedules s ON t.schedule_id = s.id
      JOIN attendance_details d ON r.id = d.record_id
      WHERE 1=1
    `;
    const params = [];

    if (teacher_id) {
      sql += ' AND r.teacher_id = ?';
      params.push(teacher_id);
    }
    if (schedule_id) {
      sql += ' AND t.schedule_id = ?';
      params.push(schedule_id);
    }
    if (fecha) {
      sql += ' AND r.date = ?';
      params.push(fecha);
    } else if (mes) {
      sql += ' AND r.date LIKE ?';
      params.push(`${mes}%`);
    }
    if (status) {
      sql += ' AND r.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY r.date DESC, t.nombre ASC';
    const records = db.prepare(sql).all(...params);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Activar directamente a un docente por el Coordinador
router.post('/teachers/:id/activate-direct', (req, res) => {
  try {
    const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(req.params.id);
    if (!teacher) return res.status(404).json({ error: 'Docente no encontrado' });

    db.prepare("UPDATE users SET status = 'ACTIVO' WHERE id = ?").run(teacher.user_id);
    logAudit(req.user.id, 'ACTIVAR_DOCENTE_DIRECTO', 'users', `Docente ${teacher.nombre} activado directamente por Coordinación`, req.ip);

    res.json({ success: true, message: `Docente ${teacher.nombre} activado exitosamente por Coordinación.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Control de Turnos y Activación del Sistema
router.get('/shift-control', (req, res) => {
  try {
    const settings = db.prepare('SELECT shift_morning_active, shift_afternoon_active, shift_mode, last_activation_morning, last_activation_afternoon, coordinator_activation_msg FROM institutional_settings WHERE id = 1').get();
    res.json(settings || {
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

router.post('/shift-toggle', (req, res) => {
  try {
    const { shift, active, message } = req.body;
    const now = new Date().toISOString();
    
    if (shift === 'morning') {
      db.prepare(`
        UPDATE institutional_settings 
        SET shift_morning_active = ?, last_activation_morning = ?, coordinator_activation_msg = COALESCE(?, coordinator_activation_msg)
        WHERE id = 1
      `).run(active ? 1 : 0, now, message || null);
      logAudit(req.user.id, active ? 'ACTIVAR_TURNO_MATUTINO' : 'CERRAR_TURNO_MATUTINO', 'institutional_settings', `Turno matutino ${active ? 'activado' : 'cerrado'} por Coordinación`, req.ip);
    } else if (shift === 'afternoon') {
      db.prepare(`
        UPDATE institutional_settings 
        SET shift_afternoon_active = ?, last_activation_afternoon = ?, coordinator_activation_msg = COALESCE(?, coordinator_activation_msg)
        WHERE id = 1
      `).run(active ? 1 : 0, now, message || null);
      logAudit(req.user.id, active ? 'ACTIVAR_TURNO_VESPERTINO' : 'CERRAR_TURNO_VESPERTINO', 'institutional_settings', `Turno vespertino ${active ? 'activado' : 'cerrado'} por Coordinación`, req.ip);
    } else {
      return res.status(400).json({ error: 'Turno inválido (debe ser morning o afternoon)' });
    }

    const updated = db.prepare('SELECT shift_morning_active, shift_afternoon_active, shift_mode, last_activation_morning, last_activation_afternoon, coordinator_activation_msg FROM institutional_settings WHERE id = 1').get();
    res.json({ success: true, settings: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/shift-mode', (req, res) => {
  try {
    const { mode } = req.body;
    db.prepare('UPDATE institutional_settings SET shift_mode = ? WHERE id = 1').run(mode);
    logAudit(req.user.id, 'CAMBIO_MODO_TURNOS', 'institutional_settings', `Modo de turnos cambiado a: ${mode}`, req.ip);
    res.json({ success: true, mode });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Validar y activar asistencia de un docente
router.put('/attendance/:id/approve', (req, res) => {
  try {
    const inst = db.prepare('SELECT coordinator_name FROM institutional_settings WHERE id = 1').get();
    const coordName = inst ? inst.coordinator_name : 'Coordinador Académico';
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE attendance_records 
      SET is_approved = 1, approved_by = ?, approved_at = ?, is_locked = 1 
      WHERE id = ?
    `).run(coordName, now, req.params.id);

    logAudit(req.user.id, 'APROBAR_ASISTENCIA', 'attendance_records', `Registro ID ${req.params.id} validado y activado por ${coordName}`, req.ip);
    res.json({ success: true, message: `Registro ID ${req.params.id} validado y activado oficialmente por Coordinación` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Validar y activar todas las asistencias de hoy en 1 clic
router.post('/attendance/approve-all-today', (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const inst = db.prepare('SELECT coordinator_name FROM institutional_settings WHERE id = 1').get();
    const coordName = inst ? inst.coordinator_name : 'Coordinador Académico';
    const now = new Date().toISOString();

    const info = db.prepare(`
      UPDATE attendance_records 
      SET is_approved = 1, approved_by = ?, approved_at = ?, is_locked = 1 
      WHERE date = ? AND is_approved = 0
    `).run(coordName, now, todayStr);

    logAudit(req.user.id, 'APROBAR_TODAS_ASISTENCIAS_HOY', 'attendance_records', `${info.changes} registros aprobados y activados para hoy (${todayStr})`, req.ip);
    res.json({ success: true, count: info.changes, message: `Se validaron y activaron ${info.changes} registros de asistencia del día de hoy.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Desbloquear asistencia
router.put('/attendance/:id/unlock', (req, res) => {
  try {
    db.prepare('UPDATE attendance_records SET is_locked = 0 WHERE id = ?').run(req.params.id);
    logAudit(req.user.id, 'DESBLOQUEO_ASISTENCIA', 'attendance_records', `Registro ID ${req.params.id} desbloqueado`, req.ip);
    res.json({ success: true, message: 'Registro desbloqueado para edición docente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reporte de docente para el coordinador
router.get('/reporte-docente', (req, res) => {
  try {
    const { teacher_id, mes } = req.query;
    if (!teacher_id || !mes) return res.status(400).json({ error: 'teacher_id y mes son requeridos' });

    const teacher = db.prepare(`
      SELECT t.*, s.name as schedule_name, s.start_time, s.end_time, s.expected_hours
      FROM teachers t
      JOIN schedules s ON t.schedule_id = s.id
      WHERE t.id = ?
    `).get(teacher_id);

    if (!teacher) return res.status(404).json({ error: 'Docente no encontrado' });

    const inst = db.prepare('SELECT * FROM institutional_settings WHERE id = 1').get();
    const holidays = db.prepare('SELECT * FROM holidays WHERE date LIKE ?').all(`${mes}%`);
    const holidayMap = {};
    holidays.forEach(h => { holidayMap[h.date] = h.description; });

    const records = db.prepare(`
      SELECT r.*, d.docencia_hours, d.vinculacion_hours, d.investigacion_hours, d.gestion_hours, d.activities_detail
      FROM attendance_records r
      JOIN attendance_details d ON r.id = d.record_id
      WHERE r.teacher_id = ? AND r.date LIKE ?
    `).all(teacher.id, `${mes}%`);

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
      docente: teacher,
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

// Configuración institucional
router.get('/settings', (req, res) => {
  try {
    const inst = db.prepare('SELECT * FROM institutional_settings WHERE id = 1').get();
    res.json(inst);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/settings', (req, res) => {
  try {
    const { institution_name, faculty_name, career_name, coordinator_name, coordinator_title, edit_grace_days } = req.body;
    db.prepare(`
      UPDATE institutional_settings
      SET institution_name = ?, faculty_name = ?, career_name = ?, coordinator_name = ?, coordinator_title = ?, edit_grace_days = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(institution_name, faculty_name, career_name, coordinator_name, coordinator_title, parseInt(edit_grace_days) || 3);

    logAudit(req.user.id, 'CONFIGURACION_INSTITUCIONAL', 'institutional_settings', 'Actualizados parámetros institucionales', req.ip);

    const updated = db.prepare('SELECT * FROM institutional_settings WHERE id = 1').get();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Feriados
router.get('/holidays', (req, res) => {
  try {
    const holidays = db.prepare('SELECT * FROM holidays ORDER BY date ASC').all();
    res.json(holidays);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/holidays', (req, res) => {
  try {
    const { date, description, is_national } = req.body;
    if (!date || !description) return res.status(400).json({ error: 'Fecha y descripción son requeridos' });

    db.prepare('INSERT INTO holidays (date, description, is_national) VALUES (?, ?, ?)').run(date, description, is_national ? 1 : 0);
    logAudit(req.user.id, 'CREAR_FERIADO', 'holidays', `Feriado ${date}: ${description}`, req.ip);

    const holidays = db.prepare('SELECT * FROM holidays ORDER BY date ASC').all();
    res.json(holidays);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/holidays/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM holidays WHERE id = ?').run(req.params.id);
    logAudit(req.user.id, 'ELIMINAR_FERIADO', 'holidays', `Feriado ID ${req.params.id} eliminado`, req.ip);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auditoría
router.get('/audit-logs', (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT a.*, u.cedula as user_cedula, u.role as user_role
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 100
    `).all();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
