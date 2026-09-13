const API_BASE = '/api';

export function getToken() {
  return localStorage.getItem('asistencia_token') || localStorage.getItem('marketing_espoch_token');
}

export function setToken(token) {
  localStorage.setItem('asistencia_token', token);
  localStorage.setItem('marketing_espoch_token', token);
}

export function clearToken() {
  localStorage.removeItem('asistencia_token');
  localStorage.removeItem('asistencia_user');
  localStorage.removeItem('marketing_espoch_token');
  localStorage.removeItem('marketing_espoch_user');
}

export function getStoredUser() {
  const u = localStorage.getItem('asistencia_user') || localStorage.getItem('marketing_espoch_user');
  return u ? JSON.parse(u) : null;
}

export function setStoredUser(user) {
  localStorage.setItem('asistencia_user', JSON.stringify(user));
  localStorage.setItem('marketing_espoch_user', JSON.stringify(user));
}

async function fetchWithAuth(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });

  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new Event('auth:unauthorized'));
    throw new Error('Sesión expirada o no autorizada');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Error en la solicitud (${res.status})`);
  }

  return data;
}

// Normalizador de datos de profesor
function normalizeTeacher(t) {
  if (!t) return null;
  const nombreCompleto = t.nombre || `${t.nombres || ''} ${t.apellidos || ''}`.trim();
  const parts = nombreCompleto.split(' ');
  const apellidos = parts.length > 2 ? parts.slice(-2).join(' ') : (parts[1] || '');
  const nombres = parts.length > 2 ? parts.slice(0, -2).join(' ') : (parts[0] || nombreCompleto);

  return {
    ...t,
    nombre: nombreCompleto,
    nombres: t.nombres || nombres,
    apellidos: t.apellidos || apellidos,
    email: t.email_institucional || t.email || '',
    email_institucional: t.email_institucional || t.email || '',
    status: t.user_status || t.status || 'ACTIVO',
    user_status: t.user_status || t.status || 'ACTIVO',
    hours_per_day: t.expected_hours || t.hours_per_day || 8.0
  };
}

// Normalizador para la hoja mensual completa (docente y admin)
function normalizeHojaMensual(raw) {
  const teacher = normalizeTeacher(raw.docente || raw.teacher || {});
  const inst = raw.institucion || raw.settings || {};
  const mes = raw.mes || '';
  const expectedDaily = teacher.custom_hours || teacher.expected_hours || teacher.hours_per_day || 8.0;

  // Contar días laborales (lunes a viernes que no sean feriado)
  let diasLaborales = 0;
  const dias = (raw.dias || []).map((d) => {
    const isFinde = d.esFinDeSemana || d.tipoDia === 'FIN_DE_SEMANA';
    const isFeriado = d.esFeriado || d.tipoDia === 'FERIADO';
    let tipoDia = 'LABORAL';
    if (isFeriado) tipoDia = 'FERIADO';
    else if (isFinde) tipoDia = 'FIN_DE_SEMANA';

    if (tipoDia === 'LABORAL') {
      diasLaborales++;
    }

    const reg = d.record || (d.registrado ? {
      check_in_time: d.check_in,
      check_out_time: d.check_out,
      docencia_hours: d.docencia_hours,
      vinculacion_hours: d.vinculacion_hours,
      investigacion_hours: d.investigacion_hours,
      gestion_hours: d.gestion_hours,
      total_hours: d.total_hours,
      observations: d.activities_detail,
      status: d.status
    } : null);

    return {
      ...d,
      tipoDia,
      diaSemana: d.dia_semana || d.diaSemana || '',
      nombreFeriado: d.nombreFeriado || (typeof d.esFeriado === 'string' ? d.esFeriado : (d.activities_detail && isFeriado ? d.activities_detail : 'Feriado')),
      record: reg
    };
  });

  const totalHoras = raw.totales?.total ?? raw.totales?.totalHoras ?? 0;
  const horasEsperadas = diasLaborales * expectedDaily;
  const porcentajeCumplimiento = horasEsperadas > 0
    ? Math.min(100, parseFloat(((totalHoras / horasEsperadas) * 100).toFixed(1)))
    : 0;

  const totales = {
    ...raw.totales,
    docencia: raw.totales?.docencia || 0,
    vinculacion: raw.totales?.vinculacion || 0,
    investigacion: raw.totales?.investigacion || 0,
    gestion: raw.totales?.gestion || 0,
    total: totalHoras,
    totalHoras: totalHoras,
    diasLaborales,
    horasEsperadas,
    porcentajeCumplimiento
  };

  return {
    ...raw,
    institucion: inst,
    settings: inst,
    docente: teacher,
    teacher: teacher,
    mes,
    totales,
    dias
  };
}

// ================= AUTH =================
export async function login(cedula, password) {
  const data = await fetchWithAuth('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ cedula, password })
  });
  setToken(data.token);
  setStoredUser(data.user);
  return data;
}

export async function checkActivation(cedula) {
  return fetchWithAuth('/auth/check-activation', {
    method: 'POST',
    body: JSON.stringify({ cedula })
  });
}

export async function activateAccount(cedula, password) {
  const data = await fetchWithAuth('/auth/activate', {
    method: 'POST',
    body: JSON.stringify({ cedula, password })
  });
  setToken(data.token);
  setStoredUser(data.user);
  return data;
}

export async function getCurrentUser() {
  const data = await fetchWithAuth('/auth/me');
  return data.user || data;
}

export async function changePassword(currentPassword, newPassword) {
  return fetchWithAuth('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, oldPassword: currentPassword, newPassword })
  });
}

// ================= DOCENTE =================
export async function getDocentePerfil() {
  const p = await fetchWithAuth('/docente/perfil');
  return normalizeTeacher(p);
}

export async function getDocenteAsistencias(params = {}) {
  const q = new URLSearchParams(params).toString();
  return fetchWithAuth(`/docente/asistencias?${q}`);
}

export async function saveDocenteAsistencia(payload) {
  return fetchWithAuth('/docente/asistencia', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function getDocenteResumen(mes) {
  return fetchWithAuth(`/docente/resumen?mes=${mes}`);
}

export async function getDocenteHojaMes(mes) {
  const raw = await fetchWithAuth(`/docente/hoja-mes?mes=${mes}`);
  return normalizeHojaMensual(raw);
}

// ================= COORDINADOR / ADMIN =================
export async function getAdminDashboard() {
  const data = await fetchWithAuth('/admin/dashboard');
  return {
    ...data,
    docentesSinRegistroHoy: (data.docentesSinRegistroHoy || []).map(normalizeTeacher)
  };
}

export async function getAdminTeachers() {
  const list = await fetchWithAuth('/admin/teachers');
  return list.map(normalizeTeacher);
}

export async function createAdminTeacher(teacherData) {
  const nombre = teacherData.nombre || `${teacherData.nombres || ''} ${teacherData.apellidos || ''}`.trim();
  const email_institucional = teacherData.email_institucional || teacherData.email;
  return fetchWithAuth('/admin/teachers', {
    method: 'POST',
    body: JSON.stringify({
      ...teacherData,
      nombre,
      email_institucional
    })
  });
}

export async function updateAdminTeacher(id, teacherData) {
  return fetchWithAuth(`/admin/teachers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(teacherData)
  });
}

export async function resetTeacherPassword(id, newPassword) {
  return fetchWithAuth(`/admin/teachers/${id}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ newPassword })
  });
}

export async function getAdminSchedules() {
  return fetchWithAuth('/admin/schedules');
}

export async function getAdminAttendance(params = {}) {
  const q = new URLSearchParams(params).toString();
  const list = await fetchWithAuth(`/admin/attendance?${q}`);
  return list.map(t => ({
    ...t,
    nombres: t.nombres || t.nombre,
    apellidos: t.apellidos || ''
  }));
}

export async function unlockAttendance(id) {
  return fetchWithAuth(`/admin/attendance/${id}/unlock`, {
    method: 'PUT'
  });
}

export async function getAdminReporteDocente(teacherId, mes) {
  const raw = await fetchWithAuth(`/admin/reporte-docente?teacher_id=${teacherId}&mes=${mes}`);
  return normalizeHojaMensual(raw);
}

export async function getAdminSettings() {
  return fetchWithAuth('/admin/settings');
}

export async function updateAdminSettings(settings) {
  return fetchWithAuth('/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(settings)
  });
}

export async function getAdminHolidays() {
  const hols = await fetchWithAuth('/admin/holidays');
  return hols.map(h => ({
    ...h,
    name: h.name || h.description
  }));
}

export async function createAdminHoliday(holiday) {
  return fetchWithAuth('/admin/holidays', {
    method: 'POST',
    body: JSON.stringify({
      date: holiday.date,
      description: holiday.name || holiday.description
    })
  });
}

export async function deleteAdminHoliday(id) {
  return fetchWithAuth(`/admin/holidays/${id}`, {
    method: 'DELETE'
  });
}

export async function getAdminAuditLogs() {
  return fetchWithAuth('/admin/audit-logs');
}

// Control de Turnos y Activación del Coordinador
export async function getDocenteShiftStatus() {
  return fetchWithAuth('/docente/shift-status');
}

export async function getAdminShiftControl() {
  return fetchWithAuth('/admin/shift-control');
}

export async function toggleAdminShift(shift, active, message) {
  return fetchWithAuth('/admin/shift-toggle', {
    method: 'POST',
    body: JSON.stringify({ shift, active: active ? 1 : 0, message })
  });
}

export async function setAdminShiftMode(mode) {
  return fetchWithAuth('/admin/shift-mode', {
    method: 'POST',
    body: JSON.stringify({ mode })
  });
}

export async function approveAdminAttendance(recordId) {
  return fetchWithAuth(`/admin/attendance/${recordId}/approve`, {
    method: 'PUT'
  });
}

export async function approveAllAdminAttendanceToday() {
  return fetchWithAuth('/admin/attendance/approve-all-today', {
    method: 'POST'
  });
}

export async function activateAdminTeacherDirect(teacherId) {
  return fetchWithAuth(`/admin/teachers/${teacherId}/activate-direct`, {
    method: 'POST'
  });
}

// ================= API OBJECTS FOR MODULAR CALLS =================
export const authAPI = {
  login,
  logout: clearToken,
  getMe: getCurrentUser,
  checkActivation,
  activateAccount,
  changePassword
};

export const docenteAPI = {
  getPerfil: getDocentePerfil,
  getAsistencias: getDocenteAsistencias,
  saveAsistencia: saveDocenteAsistencia,
  getResumen: getDocenteResumen,
  getShiftStatus: getDocenteShiftStatus,
  getHojaMensual: async (anio, mes) => {
    const mesStr = typeof mes === 'number' ? (mes < 10 ? `0${mes}` : `${mes}`) : mes;
    const mesParam = `${anio}-${mesStr}`;
    return getDocenteHojaMes(mesParam);
  }
};

export const adminAPI = {
  getDashboard: getAdminDashboard,
  getDocentes: getAdminTeachers,
  crearDocente: createAdminTeacher,
  updateDocente: updateAdminTeacher,
  resetPassword: resetTeacherPassword,
  activateDocenteDirect: activateAdminTeacherDirect,
  getSchedules: getAdminSchedules,
  getAttendanceRecords: getAdminAttendance,
  unlockAttendance,
  approveAttendance: approveAdminAttendance,
  approveAllToday: approveAllAdminAttendanceToday,
  getShiftControl: getAdminShiftControl,
  toggleShift: toggleAdminShift,
  setShiftMode: setAdminShiftMode,
  getHojaDocente: async (teacherId, anio, mes) => {
    const mesStr = typeof mes === 'number' ? (mes < 10 ? `0${mes}` : `${mes}`) : mes;
    const mesParam = `${anio}-${mesStr}`;
    return getAdminReporteDocente(teacherId, mesParam);
  },
  getSettings: getAdminSettings,
  updateSettings: updateAdminSettings,
  getHolidays: getAdminHolidays,
  createHoliday: createAdminHoliday,
  deleteHoliday: deleteAdminHoliday,
  getAuditLogs: getAdminAuditLogs
};

