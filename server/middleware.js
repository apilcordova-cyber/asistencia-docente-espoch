const jwt = require('jsonwebtoken');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'Marketing_ESPOCH_SecretKey_2026_ArielPilco';

async function logAudit(userId, action, targetEntity, details, ip = '127.0.0.1') {
  try {
    await db.prepare(`
      INSERT INTO audit_logs (user_id, action, target_entity, details, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId || null, action, targetEntity || '', details || '', ip);
  } catch (err) {
    console.error('Error al registrar auditoría:', err.message);
  }
}

async function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso no autorizado: Token requerido' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.prepare('SELECT id, cedula, role, status FROM users WHERE id = ?').get(decoded.id);
    
    if (!user || user.status === 'INACTIVO') {
      return res.status(401).json({ error: 'Usuario no válido o inactivo' });
    }

    req.user = user;

    // Cargar perfil docente si existe (aplica a DOCENTE y a COORDINADOR docente)
    const teacher = await db.prepare(`
      SELECT t.*, s.name as schedule_name, s.start_time, s.end_time, s.expected_hours, s.code as schedule_code
      FROM teachers t
      JOIN schedules s ON t.schedule_id = s.id
      WHERE t.user_id = ?
    `).get(user.id);
    if (teacher) {
      req.teacher = teacher;
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

function requireCoordinator(req, res, next) {
  if (!req.user || req.user.role !== 'COORDINADOR') {
    return res.status(403).json({ error: 'Acceso denegado: Se requieren permisos de Coordinador de Carrera' });
  }
  next();
}

function requireDocente(req, res, next) {
  if (!req.user || (req.user.role !== 'DOCENTE' && req.user.role !== 'COORDINADOR')) {
    return res.status(403).json({ error: 'Acceso denegado: Vista exclusiva para Docentes' });
  }
  next();
}

module.exports = {
  JWT_SECRET,
  logAudit,
  authenticate,
  requireCoordinator,
  requireDocente
};
