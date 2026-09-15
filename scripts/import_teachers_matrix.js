const fs = require('fs');
const path = require('path');
const db = require('../server/db');

// Script de carga o importación masiva de matriz docente
// Uso: node scripts/import_teachers_matrix.js [ruta_archivo.json]

const defaultPath = path.join(__dirname, 'matriz_docentes.json');
const filePath = process.argv[2] || defaultPath;

if (!fs.existsSync(filePath)) {
  console.log('No se encontró archivo en:', filePath);
  console.log('Creando plantilla de ejemplo en:', defaultPath);
  const template = [
    {
      cedula: '0604703843',
      nombre: 'Ariel Enrique Pilco Cordova',
      email_institucional: 'enrique.pilco@espoch.edu.ec',
      titulo_academico: 'Ingeniero en Sistemas',
      schedule_id: 1
    },
    {
      cedula: '0602328064',
      nombre: 'Wilian Enrique Pilco Mosquera',
      email_institucional: 'wilian.pilco@espoch.edu.ec',
      titulo_academico: 'Magíster en Administración',
      schedule_id: 2
    }
  ];
  fs.writeFileSync(defaultPath, JSON.stringify(template, null, 2));
  console.log('Plantilla creada con éxito. Edítala y vuelve a ejecutar este script.');
  process.exit(0);
}

try {
  const rawData = fs.readFileSync(filePath, 'utf8');
  const docentes = JSON.parse(rawData);

  if (!Array.isArray(docentes)) {
    console.error('El contenido del archivo debe ser un arreglo [ {...}, {...} ]');
    process.exit(1);
  }

  console.log(`Procesando ${docentes.length} docentes...`);
  let importados = 0;

  for (const d of docentes) {
    const cedula = (d.cedula || d.ci || d.identificacion || '').toString().trim();
    const nombre = (d.nombre || d.nombres_apellidos || d.nombres || '').toString().trim();
    const email = (d.email_institucional || d.email || d.correo || '').toString().trim();
    const titulo = (d.titulo_academico || d.titulo || '').toString().trim();

    if (!cedula || !nombre) {
      console.warn('Fila omitida por faltar cédula o nombre:', d);
      continue;
    }

    const t = db.registrarDocenteMatriz({
      cedula,
      nombre,
      email_institucional: email,
      titulo_academico: titulo,
      schedule_id: d.schedule_id || 1,
      custom_hours: 8.0
    });

    if (t) {
      importados++;
      console.log(`[OK] Docente: ${nombre} | CI: ${cedula} (Usuario y clave: ${cedula})`);
    }
  }

  console.log(`\n=== Carga finalizada con éxito: ${importados} docentes registrados/actualizados en el sistema ===`);
} catch (err) {
  console.error('Error al importar la matriz:', err.message);
  process.exit(1);
}
