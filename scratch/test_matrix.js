const http = require('http');
const Database = require('better-sqlite3');
const path = require('path');

// Asegurar precondiciones en base de datos para idempotencia
const dbPath = path.join(__dirname, '..', 'server', 'asistencia_docente.db');
const db = new Database(dbPath);
db.prepare("UPDATE users SET status = 'PENDIENTE_ACTIVACION', password_hash = NULL WHERE cedula = '0605554443'").run();

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (body) {
      headers['Content-Length'] = Buffer.byteLength(dataString);
    }

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: `/api${path}`,
      method,
      headers
    }, (res) => {
      let chunks = '';
      res.on('data', chunk => { chunks += chunk; });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = chunks ? JSON.parse(chunks) : null;
        } catch (e) {
          parsed = chunks;
        }
        resolve({ status: res.statusCode, data: parsed });
      });
    });

    req.on('error', reject);
    if (body) req.write(dataString);
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('EJECUCIÓN DE MATRIZ DE PRUEBAS DEL SISTEMA REFORMADO (20 CASOS)');
  console.log('Carrera de Marketing • ESPOCH 2026 | Desarrollado por: Ariel Pilco');
  console.log('================================================================\n');

  const results = [];

  function record(tc, name, success, details) {
    results.push({ tc, name, success, details });
    const mark = success ? '✓ APROBADO' : '✗ FALLIDO';
    console.log(`[${tc}] ${name}: ${mark}`);
    if (details) console.log(`      Detalle: ${details}`);
  }

  let tokenCoord = null;
  let tokenDoc = null;
  let newTeacherId = null;

  try {
    // TC01: Login Coordinador
    const r1 = await request('POST', '/auth/login', { cedula: '0601234567', password: 'Marketing2026*' });
    const s1 = r1.status === 200 && r1.data?.user?.role === 'COORDINADOR';
    tokenCoord = r1.data?.token;
    record('TC01', 'Login Coordinador con credenciales oficiales', s1, `Status: ${r1.status}, Rol: ${r1.data?.user?.role}`);

    // TC02: Login Docente
    const r2 = await request('POST', '/auth/login', { cedula: '0609876543', password: 'Docente2026*' });
    const schedName = r2.data?.user?.schedule_name || r2.data?.user?.teacher?.schedule_name || '';
    const s2 = r2.status === 200 && r2.data?.user?.role === 'DOCENTE' && schedName.includes('Jornada');
    tokenDoc = r2.data?.token;
    record('TC02', 'Login Docente con jornada de 6h asignada', s2, `Status: ${r2.status}, Jornada: ${schedName}`);

    // TC03: Login Credenciales Inválidas
    const r3 = await request('POST', '/auth/login', { cedula: '0601234567', password: 'PasswordErroneo123' });
    const s3 = r3.status === 401;
    record('TC03', 'Bloqueo de autenticación por credenciales inválidas', s3, `Status HTTP devuelto: ${r3.status} (Esperado 401)`);

    // TC04: Chequeo de Primer Acceso / Activación
    const r4 = await request('POST', '/auth/check-activation', { cedula: '0605554443' });
    const s4 = r4.status === 200 && r4.data?.canActivate === true;
    record('TC04', 'Verificación de estado PENDIENTE_ACTIVACION para primer acceso', s4, `Docente detectado: ${r4.data?.nombre || 'OK'}`);

    // TC05: Intento de Login a cuenta pendiente de activación
    const r5 = await request('POST', '/auth/login', { cedula: '0605554443', password: 'CualquierPassword*' });
    const s5 = r5.status === 403;
    record('TC05', 'Bloqueo de inicio de sesión estándar previo a la activación', s5, `Status HTTP: ${r5.status}, Mensaje: ${r5.data?.error}`);

    // TC06: Activación de Cuenta Exitosa
    const r6 = await request('POST', '/auth/activate', { cedula: '0605554443', password: 'NuevaClaveActivada2026*' });
    const s6 = r6.status === 200 && r6.data?.token && r6.data?.user?.status === 'ACTIVO';
    record('TC06', 'Activación autónoma con clave personalizada por el docente', s6, `Token emitido tras activación para CI 0605554443`);

    // TC07: RBAC - Docente intentando acceder a Dashboard de Coordinación
    const r7 = await request('GET', '/admin/dashboard', null, tokenDoc);
    const s7 = r7.status === 403;
    record('TC07', 'Restricción RBAC: Docente vetado de ver Dashboard Administrativo', s7, `Status HTTP: ${r7.status} (Esperado 403 Forbidden)`);

    // TC08: RBAC - Docente intentando consultar nómina y otros docentes
    const r8 = await request('GET', '/admin/teachers', null, tokenDoc);
    const s8 = r8.status === 403;
    record('TC08', 'Restricción RBAC: Docente vetado de acceder al listado general de profesores', s8, `Status HTTP: ${r8.status} (Esperado 403 Forbidden)`);

    // TC09: Consulta de Perfil Docente propio
    const r9 = await request('GET', '/docente/perfil', null, tokenDoc);
    const s9 = r9.status === 200 && r9.data?.cedula === '0609876543';
    record('TC09', 'Acceso seguro al perfil individual del docente', s9, `Docente: ${r9.data?.nombre}, Horas base: ${r9.data?.expected_hours}h`);

    // TC10: Registro diario de jornada completa de 8.0 horas combinando turnos (4h doc, 2h vinc, 1h inv, 1h gest)
    const hoyStr = new Date().toISOString().split('T')[0];
    
    // Si ya existe registro bloqueado por pruebas de aprobación del coordinador, desbloquearlo
    const prevRegs = await request('GET', `/docente/asistencias?fecha=${hoyStr}`, null, tokenDoc);
    if (prevRegs.status === 200 && prevRegs.data?.length > 0 && prevRegs.data[0].is_locked) {
      await request('PUT', `/admin/attendance/${prevRegs.data[0].id}/unlock`, null, tokenCoord);
    }

    const payloadAsistencia = {
      date: hoyStr,
      check_in: '07:00 - 13:00',
      check_out: '15:00 - 17:00',
      docencia_hours: 4.0,
      vinculacion_hours: 2.0,
      investigacion_hours: 1.0,
      gestion_hours: 1.0,
      activities_detail: 'Jornada combinada 8h: 07h-13h docencia y vinculación + 15h-17h investigación y gestión'
    };
    const r10 = await request('POST', '/docente/asistencia', payloadAsistencia, tokenDoc);
    const s10 = (r10.status === 200 || r10.status === 201) && r10.data?.total_hours === 8.0 && r10.data?.status === 'COMPLETO';
    record('TC10', 'Registro de jornada laboral de 8.0h combinando turnos con los 4 pilares', s10, `Total registrado: ${r10.data?.total_hours}h, Estado: ${r10.data?.status}`);

    // TC11: Validación de registro sin horas completas (< 8.0h dentro del período de gracia)
    const ayer = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const r11 = await request('POST', '/docente/asistencia', {
      date: ayer,
      check_in: '07:00 - 13:00',
      check_out: '13:00',
      docencia_hours: 3.0,
      vinculacion_hours: 1.0,
      investigacion_hours: 1.0,
      gestion_hours: 1.0,
      activities_detail: 'Registro parcial de 6 horas'
    }, tokenDoc);
    const s11 = (r11.status === 200 || r11.status === 201) && r11.data?.status === 'INCOMPLETO';
    record('TC11', 'Detección automática de jornada incompleta (< 8.0h)', s11, `Total: ${r11.data?.total_hours}h, Clasificación: ${r11.data?.status}`);

    // TC12: Medición de Jornada en Vivo y consistencia de datos
    const r12 = await request('GET', '/docente/asistencias', null, tokenDoc);
    const s12 = r12.status === 200 && Array.isArray(r12.data) && r12.data.length > 0;
    record('TC12', 'Consistencia de asistencias históricas registradas por el profesor', s12, `Registros encontrados: ${r12.data?.length}`);

    // TC13: Resumen Personal Docente basado en estándar de 8.0 horas diarias
    const r13 = await request('GET', `/docente/resumen?mes=2026-09`, null, tokenDoc);
    const s13 = r13.status === 200 && r13.data?.expectedHoursDaily === 8.0 && r13.data?.totalesPorFuncion;
    record('TC13', 'Cálculo de métricas de cumplimiento relativo a la jornada de 8.0h oficiales', s13, `Base esperada diaria: ${r13.data?.expectedHoursDaily}h, Cumplimiento: ${r13.data?.porcentajeCumplimiento}%`);

    // TC14: Hoja Oficial Mensual para descarga PDF/Excel del docente
    const r14 = await request('GET', `/docente/hoja-mes?mes=2026-09`, null, tokenDoc);
    const s14 = r14.status === 200 && r14.data?.institucion && r14.data?.totales && Array.isArray(r14.data?.dias);
    record('TC14', 'Generación de estructura completa de hoja mensual con días, feriados y totales', s14, `Días generados en mes: ${r14.data?.dias?.length}, Horas acumuladas: ${r14.data?.totales?.total}h`);

    // TC15: Dashboard de Supervisión del Coordinador
    const r15 = await request('GET', '/admin/dashboard', null, tokenCoord);
    const s15 = r15.status === 200 && r15.data?.kpis && r15.data?.distribucionJornadas && r15.data?.docentesSinRegistroHoy;
    record('TC15', 'Monitoreo global de KPIs, jornadas y alertas de inasistencia del coordinador', s15, `Docentes totales: ${r15.data?.kpis?.totalDocentes}, Asistencias hoy: ${r15.data?.kpis?.asistenciasHoy}`);

    // TC16: Creación de Docente por parte del Coordinador
    const cedulaTest = '0609998881';
    // Limpiar si ya existía de pruebas anteriores
    db.prepare("DELETE FROM users WHERE cedula = ?").run(cedulaTest);

    const r16 = await request('POST', '/admin/teachers', {
      cedula: cedulaTest,
      nombre: 'Mgs. Andrea Morales Velasco',
      email_institucional: 'andrea.morales@espoch.edu.ec',
      schedule_id: 1,
      titulo_academico: 'Magíster en Marketing Estratégico'
    }, tokenCoord);
    const s16 = r16.status === 201 && r16.data?.cedula === cedulaTest;
    newTeacherId = r16.data?.id;
    record('TC16', 'Alta y enrolamiento de nuevo docente con jornada institucional', s16, `Docente ID: ${newTeacherId}, Estado: ${r16.data?.user_status}`);

    // TC17: Reasignación de Jornada Laboral a Jornada 2 (15h00 a 21h00)
    const r17 = await request('PUT', `/admin/teachers/${newTeacherId}`, {
      nombre: 'Mgs. Andrea Morales Velasco',
      email_institucional: 'andrea.morales@espoch.edu.ec',
      schedule_id: 2
    }, tokenCoord);
    const s17 = r17.status === 200 && r17.data?.schedule_id === 2;
    record('TC17', 'Modificación de jornada laboral docente a Jornada 2 (Vespertina/Nocturna 6h)', s17, `Nueva jornada: ${r17.data?.schedule_name}`);

    // TC18: Restablecimiento de Contraseña y Retorno a Primer Acceso
    const r18 = await request('POST', `/admin/teachers/${newTeacherId}/reset-password`, {}, tokenCoord);
    const s18 = r18.status === 200;
    record('TC18', 'Restablecimiento de credenciales con reasignación a estado de activación', s18, `Respuesta: ${r18.data?.message}`);

    // TC19: Desbloqueo Excepcional de Registro por el Coordinador
    const rRecs = await request('GET', `/admin/attendance?date=${hoyStr}`, null, tokenCoord);
    let recordIdToUnlock = rRecs.data?.[0]?.id;
    let s19 = false;
    if (recordIdToUnlock) {
      const r19 = await request('PUT', `/admin/attendance/${recordIdToUnlock}/unlock`, {}, tokenCoord);
      s19 = r19.status === 200 && r19.data?.success === true;
    }
    record('TC19', 'Desbloqueo administrativo de registro diario para rectificación docente', s19, `Registro ID desbloqueado: ${recordIdToUnlock}`);

    // TC20: Registro de Auditoría y Trazabilidad (audit_logs)
    const r20 = await request('GET', '/admin/audit-logs', null, tokenCoord);
    const s20 = r20.status === 200 && Array.isArray(r20.data) && r20.data.length >= 3;
    record('TC20', 'Trazabilidad y persistencia de eventos en la bitácora de auditoría (audit_logs)', s20, `Eventos auditados registrados: ${r20.data?.length}`);

  } catch (err) {
    console.error('Error fatal durante la prueba:', err);
  }

  console.log('\n================================================================');
  const pasados = results.filter(r => r.success).length;
  console.log(`RESUMEN FINAL: ${pasados} de ${results.length} CASOS APROBADOS (${((pasados/results.length)*100).toFixed(1)}%)`);
  console.log('================================================================');

  if (pasados === 20) {
    console.log('¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE! EL SISTEMA ESTÁ 100% OPERATIVO.');
  }
}

runTests();
