const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');

const TURSO_URL = process.env.TURSO_DATABASE_URL || 'libsql://asistencia-marketing-arielp25.aws-us-east-1.turso.io';
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTAwMjI2ODIsImlkIjoiMDFhMGM1YTgtNWYwMS03NGQ5LWE4NzctYzQwYjE0MTRkOGNkIiwia2lkIjoieE92eEtiSjd4NDZJZHdSa1RXeG5jbkpqZ3dxN1ZrQ2RBVkZzSG5MWkVyUSIsInJpZCI6IjM0MDVjYWE0LThkZTgtNDBjNi1hOGE1LTc5NmJhZjU4MmI4YyJ9.3l3Iw3nrDgHlKv9KAR89YvxcPNdw1735nz_7N1PgEcsRKWzgCZR5gIJNDboem6tWnCmG4k-7whRJVn68X2GxDw';

const client = createClient({
  url: TURSO_URL,
  authToken: TURSO_TOKEN
});

console.log('📡 Conectado a base de datos persistente Turso Cloud:', TURSO_URL);

const db = {
  client,
  prepare: (sql) => ({
    get: async (...args) => {
      const params = (args.length === 1 && Array.isArray(args[0])) ? args[0] : args;
      const res = await client.execute({ sql, args: params });
      return res.rows[0] || null;
    },
    all: async (...args) => {
      const params = (args.length === 1 && Array.isArray(args[0])) ? args[0] : args;
      const res = await client.execute({ sql, args: params });
      return res.rows;
    },
    run: async (...args) => {
      const params = (args.length === 1 && Array.isArray(args[0])) ? args[0] : args;
      const res = await client.execute({ sql, args: params });
      return {
        changes: res.rowsAffected,
        lastInsertRowid: res.lastInsertRowid ? Number(res.lastInsertRowid) : 0
      };
    }
  }),
  exec: async (sql) => {
    const statements = sql.split(';').map(s => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      await client.execute(stmt);
    }
  },
  transaction: (fn) => {
    return async (...args) => {
      return await fn(...args);
    };
  }
};

async function registrarDocenteMatriz({ cedula, nombre, email_institucional, schedule_id, titulo_academico, custom_hours, telefono }) {
  if (!cedula || !nombre) return null;
  const c = cedula.trim();
  const nom = nombre.trim();
  const email = (email_institucional && email_institucional.trim()) ? email_institucional.trim() : `${c}@espoch.edu.ec`;
  const schedId = schedule_id ? parseInt(schedule_id) : 1;
  const defaultHash = bcrypt.hashSync(c, 10);

  let user = await db.prepare('SELECT * FROM users WHERE cedula = ?').get(c);
  if (!user) {
    const resU = await db.prepare(`
      INSERT INTO users (cedula, password_hash, role, status)
      VALUES (?, ?, 'DOCENTE', 'ACTIVO')
    `).run(c, defaultHash);
    user = { id: resU.lastInsertRowid, cedula: c };
  } else {
    if (!user.password_hash || user.status === 'PENDIENTE_ACTIVACION') {
      await db.prepare("UPDATE users SET password_hash = ?, status = 'ACTIVO' WHERE id = ?").run(defaultHash, user.id);
    }
  }

  let teacher = await db.prepare('SELECT * FROM teachers WHERE cedula = ?').get(c);
  if (!teacher) {
    const resT = await db.prepare(`
      INSERT INTO teachers (user_id, cedula, nombre, email_institucional, schedule_id, titulo_academico, custom_hours, telefono)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(user.id, c, nom, email, schedId, titulo_academico || '', custom_hours || 8.0, telefono || null);
    teacher = await db.prepare('SELECT * FROM teachers WHERE id = ?').get(resT.lastInsertRowid);
  }

  return teacher;
}

async function initDb() {
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cedula TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        role TEXT NOT NULL DEFAULT 'DOCENTE',
        status TEXT NOT NULL DEFAULT 'PENDIENTE_ACTIVACION',
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        expected_hours REAL NOT NULL DEFAULT 8.0,
        is_active INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS teachers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        cedula TEXT UNIQUE NOT NULL,
        nombre TEXT NOT NULL,
        email_institucional TEXT NOT NULL,
        schedule_id INTEGER NOT NULL,
        titulo_academico TEXT,
        custom_hours REAL,
        telefono TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(schedule_id) REFERENCES schedules(id)
      );

      CREATE TABLE IF NOT EXISTS attendance_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        teacher_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        check_in TEXT NOT NULL,
        check_out TEXT NOT NULL,
        total_hours REAL NOT NULL,
        status TEXT NOT NULL,
        is_locked INTEGER DEFAULT 0,
        is_approved INTEGER DEFAULT 0,
        approved_by TEXT,
        approved_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
        UNIQUE(teacher_id, date)
      );

      CREATE TABLE IF NOT EXISTS attendance_details (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        record_id INTEGER UNIQUE NOT NULL,
        docencia_hours REAL NOT NULL DEFAULT 0.0,
        vinculacion_hours REAL NOT NULL DEFAULT 0.0,
        investigacion_hours REAL NOT NULL DEFAULT 0.0,
        gestion_hours REAL NOT NULL DEFAULT 0.0,
        activities_detail TEXT,
        FOREIGN KEY(record_id) REFERENCES attendance_records(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS institutional_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        institution_name TEXT NOT NULL,
        faculty_name TEXT NOT NULL,
        career_name TEXT NOT NULL,
        coordinator_name TEXT NOT NULL,
        coordinator_title TEXT NOT NULL,
        edit_grace_days INTEGER DEFAULT 3,
        shift_morning_active INTEGER DEFAULT 1,
        shift_afternoon_active INTEGER DEFAULT 1,
        shift_mode TEXT DEFAULT 'COORDINADOR',
        last_activation_morning TIMESTAMP,
        last_activation_afternoon TIMESTAMP,
        coordinator_activation_msg TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS holidays (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT UNIQUE NOT NULL,
        description TEXT NOT NULL,
        is_national INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        target_entity TEXT,
        details TEXT,
        ip_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Asegurar que el coordinador y docentes principales estén siempre listos
    await registrarDocenteMatriz({
      cedula: '0604703843',
      nombre: 'Ariel Enrique Pilco Cordova',
      email_institucional: 'apilcordova@gmail.com',
      titulo_academico: 'Economista',
      telefono: '0959503869',
      schedule_id: 1,
      custom_hours: 8.0
    });

    const coordHash = bcrypt.hashSync('0603048703', 10);
    const uMarco = await db.prepare('SELECT id FROM users WHERE cedula = ?').get('0603048703');
    if (uMarco) {
      await db.prepare("UPDATE users SET role = 'COORDINADOR', status = 'ACTIVO', password_hash = ? WHERE id = ?").run(coordHash, uMarco.id);
    }
  } catch (err) {
    console.error('Error durante initDb:', err.message);
  }
}

// Inicializar de forma asíncrona
initDb();

db.registrarDocenteMatriz = registrarDocenteMatriz;
db.initDb = initDb;

module.exports = db;
