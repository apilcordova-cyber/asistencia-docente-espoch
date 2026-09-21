import React, { useState, useEffect } from 'react';
import { authAPI } from './api';
import LoginScreen from './components/LoginScreen';
import DocenteNavbar from './components/DocenteNavbar';
import DocenteRegistroDiario from './components/DocenteRegistroDiario';
import DocenteResumen from './components/DocenteResumen';
import DocenteHojaAsistencia from './components/DocenteHojaAsistencia';
import DocentePerfil from './components/DocentePerfil';
import CoordinadorNavbar from './components/CoordinadorNavbar';
import CoordinadorDashboard from './components/CoordinadorDashboard';
import CoordinadorDocentes from './components/CoordinadorDocentes';
import CoordinadorSupervision from './components/CoordinadorSupervision';
import CoordinadorReportes from './components/CoordinadorReportes';
import CoordinadorConfiguracion from './components/CoordinadorConfiguracion';

export default function App() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [currentTab, setCurrentTab] = useState('');

  // Verificar sesión existente con token en localStorage
  useEffect(() => {
    const verificarSesion = async () => {
      const token = localStorage.getItem('asistencia_token');
      if (!token) {
        setLoadingUser(false);
        return;
      }
      try {
        const userData = await authAPI.getMe();
        setUser(userData);
        setCurrentTab(userData.role === 'COORDINADOR' ? 'dashboard' : 'registro');
      } catch (err) {
        console.error('Error al restaurar sesión:', err);
        localStorage.removeItem('asistencia_token');
        localStorage.removeItem('asistencia_user');
      } finally {
        setLoadingUser(false);
      }
    };

    verificarSesion();
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentTab(userData.role === 'COORDINADOR' ? 'dashboard' : 'registro');
  };

  const handleLogout = () => {
    authAPI.logout();
    setUser(null);
    setCurrentTab('');
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ECEAEB]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#A60809]/20 border-t-[#A60809] rounded-full animate-spin mx-auto" />
          <h2 className="text-base font-bold text-gray-800">Cargando Sistema Marketing ESPOCH...</h2>
          <p className="text-xs text-gray-500">Autenticando credenciales de acceso</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario autenticado, renderizar Login
  if (!user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const isCoordinador = user.role === 'COORDINADOR';

  return (
    <div className="min-h-screen bg-[#ECEAEB]/50 flex flex-col font-sans text-gray-800 antialiased selection:bg-[#A60809] selection:text-white">
      {isCoordinador ? (
        <CoordinadorNavbar
          user={user}
          usuario={user}
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          onSelectTab={setCurrentTab}
          onLogout={handleLogout}
        />
      ) : (
        <DocenteNavbar
          user={user}
          usuario={user}
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          onSelectTab={setCurrentTab}
          onLogout={handleLogout}
        />
      )}

      {/* Contenido Dinámico Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isCoordinador ? (
          <>
            {currentTab === 'dashboard' && <CoordinadorDashboard onNavigateTab={setCurrentTab} />}
            {currentTab === 'docentes' && <CoordinadorDocentes />}
            {currentTab === 'supervision' && <CoordinadorSupervision />}
            {currentTab === 'reportes' && <CoordinadorReportes />}
            {currentTab === 'configuracion' && <CoordinadorConfiguracion />}
            {currentTab === 'perfil' && <DocentePerfil user={user} usuario={user} />}
          </>
        ) : (
          <>
            {currentTab === 'registro' && <DocenteRegistroDiario user={user} usuario={user} onIrAHoja={() => setCurrentTab('hoja')} />}
            {currentTab === 'resumen' && <DocenteResumen user={user} usuario={user} onIrAHoja={() => setCurrentTab('hoja')} />}
            {currentTab === 'hoja' && <DocenteHojaAsistencia user={user} usuario={user} />}
            {currentTab === 'perfil' && <DocentePerfil user={user} usuario={user} />}
          </>
        )}
      </main>

      {/* Pie de Página Institucional con Atribución de Autor */}
      <footer className="bg-white border-t border-[#D7D6D7] mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[#A60809] tracking-wider uppercase">Marketing ESPOCH 2026</span>
            <span>•</span>
            <span>Escuela Superior Politécnica de Chimborazo</span>
          </div>

          <div className="flex items-center gap-2">
            <span>Sistema Institucional de Asistencia Docente</span>
            <span>•</span>
            <span className="font-bold text-[#810404] tracking-wider">
              MKTAP
            </span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-300">
              asistencia-docente-actualizada1
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
