const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const docenteRoutes = require('./routes/docente');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Montar rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/docente', docenteRoutes);
app.use('/api/admin', adminRoutes);

// Servir frontend compilado
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Servidor de Asistencia Marketing ESPOCH escuchando en http://localhost:${PORT}`);
});
