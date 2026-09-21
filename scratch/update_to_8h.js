const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'server', 'asistencia_docente.db'));

db.prepare(`
  UPDATE schedules 
  SET expected_hours = 8.0, 
      name = 'Jornada Combinable 8h (07h00 a 13h00 y 15h00 a 21h00)'
  WHERE id = 1
`).run();

db.prepare(`
  UPDATE schedules 
  SET expected_hours = 8.0, 
      name = 'Jornada Vespertina Combinable 8h (15h00 a 21h00 y 07h00 a 13h00)'
  WHERE id = 2
`).run();

db.prepare(`
  UPDATE schedules 
  SET expected_hours = 8.0, 
      name = 'Jornada Continua 8h (07h00 a 15h00)'
  WHERE id = 3
`).run();

db.prepare('UPDATE teachers SET custom_hours = 8.0').run();

console.log('Schedules:', db.prepare('SELECT * FROM schedules').all());
console.log('Actualización a 8 horas completada con éxito.');
