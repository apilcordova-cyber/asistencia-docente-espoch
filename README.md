# 📚 Sistema de Registro de Asistencia y Distribución de Jornada Docente

Aplicación web integral diseñada para sustituir las hojas físicas de firma de asistencia docente en universidades e institutos, permitiendo a los profesores reportar diariamente sus horas de acuerdo a las **4 funciones sustantivas de la educación superior**:

1. **Docencia** (clases teóricas/prácticas, preparación de material, evaluaciones, tutorías académicas).
2. **Vinculación con la Sociedad** (proyectos comunitarios, supervisión de prácticas preprofesionales, convenios).
3. **Investigación** (redacción de artículos científicos, proyectos I+D, semilleros de investigación).
4. **Gestión Académica / Administrativa** (reuniones de claustro, comités de carrera, acreditación institucional).

---

## ✨ Características Principales

- **Registro Diario Rápido e Intuitivo**:
  - Selector de fecha con navegación entre días ("Anterior", "Hoy", "Siguiente").
  - Marcación de hora de entrada y hora de salida (con botón "Marcar ahora").
  - Controles con botones `+` / `-`, campos numéricos y accesos rápidos (2h, 4h, 6h).
  - **Medidor en vivo de cumplimiento de jornada**: alerta visualmente si faltan horas, si se cumple la jornada exacta contratada (ej. 8h/día, 4h/día), o si hay sobretiempo.
  - Bitácora de actividades para auditorías académicas (con botón para insertar plantilla de evidencias).
  - Efecto de celebración con confeti al completar la jornada laboral requerida.

- **Dashboard y Analítica de Desempeño**:
  - Indicadores clave (Total horas acumuladas, días registrados, promedio diario, % de cumplimiento).
  - Gráfica interactiva de distribución del tiempo por función sustantiva con porcentajes.
  - Historial detallado de todas las asistencias del mes.

- **Hoja Oficial de Asistencia (Sustituto de la Hoja Física de Firmas)**:
  - Vista previa de documento oficial con membrete institucional, datos del docente y desglose día por día.
  - **Descarga en PDF Oficial**: formato listo para imprimir o anexar firma digital.
  - **Exportación a Excel / CSV**: compatible con nómina y Recursos Humanos / Talento Humano.
  - Casillas reglamentarias de firma del docente y visto bueno de la dirección de carrera.

- **Módulo de Gestión Docente e Institución**:
  - Creación y edición de profesores con su jornada específica (Tiempo Completo 8h, Medio Tiempo 4h, Tiempo Parcial 6h o por horas).
  - Personalización del nombre de la Universidad, Facultad, Carrera y Autoridad firmante.

---

## 🚀 Cómo Iniciar la Aplicación

La aplicación cuenta con backend (Node.js/Express + SQLite) y frontend (React + Tailwind CSS + Lucide Icons) unificados:

### 1. Iniciar la aplicación
Abre una terminal en la carpeta del proyecto:
```bash
cd C:\Users\Admin\.gemini\antigravity\scratch\asistencia-docente
npm start
```
Luego abre en tu navegador:
👉 **`http://localhost:5000`**

### 2. Modo Desarrollo (Opcional si deseas modificar código en caliente)
- **Servidor Backend**: `npm run dev:server` (puerto 5000)
- **Cliente Frontend Vite**: `npm run dev:client` (puerto 3000 con proxy automático)

---

## 🗄️ Base de Datos
Todos los datos se guardan de forma segura y local en una base de datos **SQLite** (`server/asistencia_docente.db`). No requiere instalar servidores de bases de datos pesados como MySQL o PostgreSQL.

Las tablas creadas son:
- `profesores`: Lista de docentes, departamentos y jornadas contratadas.
- `asistencias`: Registros diarios con el desglose de las 4 funciones sustantivas y bitácora.
- `institucion`: Configuración del membrete y autoridades firmantes.
