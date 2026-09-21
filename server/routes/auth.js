const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET, logAudit, authenticate } = require('../middleware');

const router = express.Router();

// Iniciar sesión
router.post('/login', async (req, res) => {
  try {
    const { cedula, password } = req.body;
    if (!cedula || !password) {
      return res.status(400).json({ error: 'Cédula y contraseña son requeridas' });
    }

    const user = await db.prepare('SELECT * FROM users WHERE cedula = ?').get(cedula.trim());
    if (!user) {
      return res.status(401).json({ error: 'Credenciales incorrectas o usuario no registrado' });
    }

    // Si la cuenta estaba pendiente de activación pero el docente ingresa su cédula como contraseña
    if (user.status === 'PENDIENTE_ACTIVACION') {
      if (password === user.cedula) {
        await db.prepare("UPDATE users SET status = 'ACTIVO', password_hash = ? WHERE id = ?")
          .run(bcrypt.hashSync(password, 10), user.id);
        user.status = 'ACTIVO';
      } else {
        return res.status(403).json({ 
          error: 'Tu cuenta requiere activación. Puedes ingresar directamente usando tu número de cédula como usuario y contraseña, o hacer clic en "Activar cuenta".' 
        });
      }
    }

    if (user.status === 'INACTIVO') {
      return res.status(403).json({ error: 'Tu usuario ha sido desactivado por la Coordinación de Carrera.' });
    }

    // Valida con hash bcrypt O con cédula como contraseña inicial directa O clave maestra de coordinación
    const validPassword = (user.password_hash && bcrypt.compareSync(password, user.password_hash)) ||
                          (password === user.cedula) ||
                          (user.role === 'COORDINADOR' && password === 'Marketing2026*');
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Si ingresó con su cédula y no tenía hash actualizado, guardamos el hash
    if (password === user.cedula && (!user.password_hash || !bcrypt.compareSync(password, user.password_hash))) {
      try {
        await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(password, 10), user.id);
      } catch (e) {}
    }

    await db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

    let profileData = { id: user.id, cedula: user.cedula, role: user.role, status: user.status };

    if (user.role === 'DOCENTE') {
      const teacher = await db.prepare(`
        SELECT t.*, s.name as schedule_name, s.start_time, s.end_time, s.expected_hours, s.code as schedule_code
        FROM teachers t
        JOIN schedules s ON t.schedule_id = s.id
        WHERE t.user_id = ?
      `).get(user.id);
      profileData.teacher = teacher;
      profileData.nombre = teacher ? teacher.nombre : 'Docente';
      profileData.email = teacher ? teacher.email_institucional : '';
      profileData.schedule_name = teacher ? teacher.schedule_name : 'Jornada Asignada (6h)';
      profileData.hours_per_day = teacher ? teacher.expected_hours : 6.0;
      profileData.start_time = teacher ? teacher.start_time : '07:00';
      profileData.end_time = teacher ? teacher.end_time : '13:00';
    } else {
      const inst = await db.prepare('SELECT coordinator_name, coordinator_title FROM institutional_settings WHERE id = 1').get();
      const teacher = await db.prepare(`
        SELECT t.*, s.name as schedule_name, s.start_time, s.end_time, s.expected_hours, s.code as schedule_code
        FROM teachers t
        JOIN schedules s ON t.schedule_id = s.id
        WHERE t.user_id = ?
      `).get(user.id);
      profileData.nombre = inst ? inst.coordinator_name : 'Ing. Marco Vinicio Salazar Tenelanda';
      profileData.cargo = inst ? inst.coordinator_title : 'Coordinador de la Carrera de Marketing';
      profileData.teacher = teacher;
    }

    const token = jwt.sign(
      { id: user.id, cedula: user.cedula, role: user.role },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    logAudit(user.id, 'INICIO_SESION', 'users', `Login exitoso rol ${user.role}`, req.ip);

    res.json({ token, user: profileData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Comprobar cédula para activación
router.post('/check-activation', async (req, res) => {
  try {
    const { cedula } = req.body;
    if (!cedula) return res.status(400).json({ error: 'Cédula es requerida' });

    const user = await db.prepare('SELECT * FROM users WHERE cedula = ?').get(cedula.trim());
    if (!user) {
      return res.status(404).json({ 
        error: 'El número de cédula no se encuentra registrado en el sistema. Contacta al Coordinador de Carrera para que te dé de alta.' 
      });
    }

    if (user.status === 'ACTIVO') {
      return res.status(400).json({ 
        error: 'Esta cuenta ya fue activada previamente. Por favor inicia sesión con tu cédula y contraseña.' 
      });
    }

    const teacher = await db.prepare(`
      SELECT t.*, s.name as schedule_name 
      FROM teachers t 
      JOIN schedules s ON t.schedule_id = s.id 
      WHERE t.user_id = ?
    `).get(user.id);

    res.json({
      canActivate: true,
      nombre: teacher?.nombre || 'Docente',
      email: teacher?.email_institucional || '',
      jornada: teacher?.schedule_name || 'Jornada Asignada'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Activar cuenta
router.post('/activate', async (req, res) => {
  try {
    const { cedula, password } = req.body;
    if (!cedula || !password || password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const user = await db.prepare('SELECT * FROM users WHERE cedula = ?').get(cedula.trim());
    if (!user || user.status !== 'PENDIENTE_ACTIVACION') {
      return res.status(400).json({ error: 'Usuario no habilitado para activación' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    await db.prepare(`
      UPDATE users 
      SET password_hash = ?, status = 'ACTIVO', last_login = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(passwordHash, user.id);

    const teacher = await db.prepare(`
      SELECT t.*, s.name as schedule_name, s.start_time, s.end_time, s.expected_hours, s.code as schedule_code
      FROM teachers t
      JOIN schedules s ON t.schedule_id = s.id
      WHERE t.user_id = ?
    `).get(user.id);

    const token = jwt.sign(
      { id: user.id, cedula: user.cedula, role: user.role },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    logAudit(user.id, 'ACTIVACION_CUENTA', 'users', `Docente activó su cuenta con éxito`, req.ip);

    res.json({
      token,
      user: {
        id: user.id,
        cedula: user.cedula,
        role: user.role,
        status: 'ACTIVO',
        nombre: teacher?.nombre || 'Docente',
        email: teacher?.email_institucional || '',
        schedule_name: teacher?.schedule_name || 'Jornada Asignada (6h)',
        hours_per_day: teacher?.expected_hours || 6.0,
        start_time: teacher?.start_time || '07:00',
        end_time: teacher?.end_time || '13:00',
        teacher
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener datos del usuario conectado
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = req.user;
    let profileData = { id: user.id, cedula: user.cedula, role: user.role, status: user.status };

    if (user.role === 'DOCENTE') {
      profileData.teacher = req.teacher;
      profileData.nombre = req.teacher ? req.teacher.nombre : 'Docente';
      profileData.email = req.teacher ? req.teacher.email_institucional : '';
      profileData.schedule_name = req.teacher ? req.teacher.schedule_name : 'Jornada Asignada (6h)';
      profileData.hours_per_day = req.teacher ? req.teacher.expected_hours : 6.0;
      profileData.start_time = req.teacher ? req.teacher.start_time : '07:00';
      profileData.end_time = req.teacher ? req.teacher.end_time : '13:00';
    } else {
      const inst = await db.prepare('SELECT coordinator_name, coordinator_title FROM institutional_settings WHERE id = 1').get();
      profileData.nombre = inst ? inst.coordinator_name : 'Coordinador de Carrera';
      profileData.cargo = inst ? inst.coordinator_title : 'Coordinación';
    }

    res.json(profileData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cambio de contraseña
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    const user = await db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
    if (!bcrypt.compareSync(oldPassword, user.password_hash)) {
      return res.status(400).json({ error: 'La contraseña actual no es correcta' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, req.user.id);

    logAudit(req.user.id, 'CAMBIO_PASSWORD', 'users', 'Usuario actualizó su contraseña', req.ip);

    res.json({ success: true, message: 'Contraseña actualizada con éxito' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
