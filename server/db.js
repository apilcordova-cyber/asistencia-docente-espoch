const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'asistencia_docente.db');
const db = new Database(dbPath);

// Habilitar claves foráneas
db.pragma('foreign_keys = ON');

// Crear tablas del modelo reformado
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cedula TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    role TEXT NOT NULL DEFAULT 'DOCENTE', -- 'DOCENTE' o 'COORDINADOR'
    status TEXT NOT NULL DEFAULT 'PENDIENTE_ACTIVACION', -- 'PENDIENTE_ACTIVACION', 'ACTIVO', 'INACTIVO'
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
    status TEXT NOT NULL, -- 'COMPLETO', 'INCOMPLETO', 'SOBRETIEMPO', 'NO_LABORAL', 'FERIADO'
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

// Migraciones seguras para bases de datos existentes
function addCol(table, colDef) {
  try { db.prepare(`ALTER TABLE ${table} ADD COLUMN ${colDef}`).run(); } catch (e) {}
}
addCol('institutional_settings', 'shift_morning_active INTEGER DEFAULT 1');
addCol('institutional_settings', 'shift_afternoon_active INTEGER DEFAULT 1');
addCol('institutional_settings', 'shift_mode TEXT DEFAULT \'COORDINADOR\'');
addCol('institutional_settings', 'last_activation_morning TIMESTAMP');
addCol('institutional_settings', 'last_activation_afternoon TIMESTAMP');
addCol('institutional_settings', 'coordinator_activation_msg TEXT');
addCol('attendance_records', 'is_approved INTEGER DEFAULT 0');
addCol('attendance_records', 'approved_by TEXT');
addCol('attendance_records', 'approved_at TIMESTAMP');

// 1. Inicializar Catálogo de Jornadas oficiales de Marketing ESPOCH
const scheduleCount = db.prepare('SELECT COUNT(*) as c FROM schedules').get().c;
if (scheduleCount === 0) {
  const insertSched = db.prepare('INSERT INTO schedules (id, code, name, start_time, end_time, expected_hours) VALUES (?, ?, ?, ?, ?, ?)');
  insertSched.run(1, 'JORNADA_1', 'Jornada Combinable 8h (07h00 a 13h00 y 15h00 a 21h00)', '07:00', '13:00', 8.0);
  insertSched.run(2, 'JORNADA_2', 'Jornada Vespertina Combinable 8h (15h00 a 21h00 y 07h00 a 13h00)', '15:00', '21:00', 8.0);
  insertSched.run(3, 'PERSONALIZADA', 'Jornada Continua 8h (07h00 a 15h00)', '07:00', '15:00', 8.0);
}

// 2. Inicializar Datos Institucionales Marketing ESPOCH
const instCount = db.prepare('SELECT COUNT(*) as c FROM institutional_settings').get().c;
if (instCount === 0) {
  db.prepare(`
    INSERT INTO institutional_settings (id, institution_name, faculty_name, career_name, coordinator_name, coordinator_title, edit_grace_days)
    VALUES (1, 'Escuela Superior Politécnica de Chimborazo - ESPOCH', 'Facultad de Administración de Empresas - FADE', 'Carrera de Marketing', 'Ing. Coordinador Académico, Mgs.', 'Coordinador(a) de la Carrera de Marketing', 3)
  `).run();
}

// 3. Inicializar Feriados de muestra
const holCount = db.prepare('SELECT COUNT(*) as c FROM holidays').get().c;
if (holCount === 0) {
  const insertHol = db.prepare('INSERT INTO holidays (date, description, is_national) VALUES (?, ?, ?)');
  insertHol.run('2026-01-01', 'Año Nuevo', 1);
  insertHol.run('2026-04-21', 'Independencia de Riobamba', 0);
  insertHol.run('2026-05-01', 'Día del Trabajo', 1);
  insertHol.run('2026-05-24', 'Batalla de Pichincha', 1);
  insertHol.run('2026-10-09', 'Independencia de Guayaquil', 1);
  insertHol.run('2026-11-02', 'Día de los Difuntos', 1);
  insertHol.run('2026-11-03', 'Independencia de Cuenca', 1);
  insertHol.run('2026-12-25', 'Navidad', 1);
}

// 4. Inicializar Usuarios y Docentes de Demostración
const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
if (userCount === 0) {
  const insertUser = db.prepare('INSERT INTO users (cedula, password_hash, role, status) VALUES (?, ?, ?, ?)');
  const insertTeacher = db.prepare('INSERT INTO teachers (user_id, cedula, nombre, email_institucional, schedule_id, titulo_academico) VALUES (?, ?, ?, ?, ?, ?)');
  const insertAttRec = db.prepare('INSERT INTO attendance_records (teacher_id, date, check_in, check_out, total_hours, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const insertAttDet = db.prepare('INSERT INTO attendance_details (record_id, docencia_hours, vinculacion_hours, investigacion_hours, gestion_hours, activities_detail) VALUES (?, ?, ?, ?, ?, ?)');

  // COORDINADOR: 0601234567 / Marketing2026*
  const coordHash = bcrypt.hashSync('Marketing2026*', 10);
  insertUser.run('0601234567', coordHash, 'COORDINADOR', 'ACTIVO');

  // DOCENTE 1 (Jornada 1: 07h00 - 13h00): 0609876543 / Docente2026*
  const doc1Hash = bcrypt.hashSync('Docente2026*', 10);
  const u1 = insertUser.run('0609876543', doc1Hash, 'DOCENTE', 'ACTIVO');
  const t1 = insertTeacher.run(u1.lastInsertRowid, '0609876543', 'Ing. Carlos Patricio Morales, Mgs.', 'carlos.morales@espoch.edu.ec', 1, 'Magíster en Marketing Digital');

  // DOCENTE 2 (Jornada 2: 15h00 - 21h00 - Para probar activación de cuenta): 0605554443
  const u2 = insertUser.run('0605554443', null, 'DOCENTE', 'PENDIENTE_ACTIVACION');
  insertTeacher.run(u2.lastInsertRowid, '0605554443', 'Lic. Andrea Viviana Salazar, Ph.D.', 'andrea.salazar@espoch.edu.ec', 2, 'Doctora en Comportamiento del Consumidor');

  // DOCENTE 3 (Jornada 2: 15h00 - 21h00): 0608887776 / Docente2026*
  const doc3Hash = bcrypt.hashSync('Docente2026*', 10);
  const u3 = insertUser.run('0608887776', doc3Hash, 'DOCENTE', 'ACTIVO');
  insertTeacher.run(u3.lastInsertRowid, '0608887776', 'Mgs. Diego Fernando Ramos', 'diego.ramos@espoch.edu.ec', 2, 'Magíster en Inteligencia Comercial');

  // Cargar asistencias de muestra para Carlos Morales (Docente 1, Jornada 1: meta 6.0h)
  const fechasMuestra = [
    { fecha: '2026-09-07', in: '07:00', out: '13:00', doc: 3.5, vinc: 1.0, inv: 1.0, gest: 0.5, desc: 'Docencia: Cátedra de Fundamentos de Marketing y taller práctico. Vinculación: Reunión con empresa comunitaria. Investigación: Búsqueda de literatura sobre neuromarketing. Gestión: Planificación semanal.' },
    { fecha: '2026-09-08', in: '06:55', out: '13:00', doc: 4.0, vinc: 0.0, inv: 1.0, gest: 1.0, desc: 'Docencia: Estrategias de Fijación de Precios y tutorías académicas. Investigación: Redacción de introducción de paper. Gestión: Comisión de seguimiento curricular.' },
    { fecha: '2026-09-09', in: '07:05', out: '13:05', doc: 3.0, vinc: 1.5, inv: 1.0, gest: 0.5, desc: 'Docencia: Evaluación de casos prácticos en aula. Vinculación: Supervisión de estudiantes en proyecto de desarrollo comercial. Investigación: Procesamiento de encuestas. Gestión: Envío de actas.' },
    { fecha: '2026-09-10', in: '07:00', out: '13:00', doc: 3.5, vinc: 0.5, inv: 1.5, gest: 0.5, desc: 'Docencia: Marketing B2B y dinámicas de grupo. Investigación: Análisis estadístico de variables de compra. Vinculación: Contacto con gremio de emprendedores. Gestión: Registro en plataforma.' },
    { fecha: '2026-09-11', in: '07:00', out: '13:00', doc: 3.0, vinc: 1.0, inv: 1.0, gest: 1.0, desc: 'Docencia: Clase magistral de Investigación de Mercados. Gestión: Sesión ordinaria de claustro docente de Marketing ESPOCH. Vinculación: Revisión de bitácoras de pasantías.' }
  ];

  fechasMuestra.forEach(item => {
    const tot = item.doc + item.vinc + item.inv + item.gest;
    const r = insertAttRec.run(t1.lastInsertRowid, item.fecha, item.in, item.out, tot, 'COMPLETO', 'Jornada matutina cumplida');
    insertAttDet.run(r.lastInsertRowid, item.doc, item.vinc, item.inv, item.gest, item.desc);
  });
}

module.exports = db;
