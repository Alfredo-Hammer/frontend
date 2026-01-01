import React, { useEffect, useState, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import './App.css';
import Sidebar from "./components/Sidebar";
import Login from "./components/Login";
import SetupInicial from "./pages/SetupInicial";
import VerificarEmail from "./pages/VerificarEmail";
import EmailNoVerificado from "./pages/EmailNoVerificado";
import RestablecerPassword from "./pages/RestablecerPassword";
import Estudiantes from "./pages/Estudiantes";
import Alumnos from "./pages/Alumnos";
import DetalleAlumno from "./components/DetalleAlumno";
import HomePage from "./pages/HomePage";
import Profesores from "./pages/Profesores";
import ProfesorDetalle from "./pages/ProfesorDetalle";
import Loader from "./components/Loader";
import Header from "./components/Header";
import GradosPage from "./pages/GradosPage";
import SeccionesPage from "./pages/SeccionesPage";
import MateriasPage from "./pages/MateriasPage";
import CargaAcademica from "./pages/CargaAcademica";
import CalificacionesPage from "./pages/CalificacionesPage";
import HorarioPage from "./pages/HorarioPage";
import HorarioClases from "./pages/HorarioClases";
import Asistencia from "./pages/Asistencia";
import ProtectedRoute from "./components/ProtectedRoute";
import PerfilUsuario from "./pages/PerfilUsuario";
import MisCalificaciones from "./pages/MisCalificaciones";
import UsuariosPage from "./pages/UsuariosPage";
import ExamenesPage from "./pages/ExamenesPage";
import ReportesPage from "./pages/ReportesPage";
import FinanzasPage from "./pages/FinanzasPage";
import InitFinanzas from "./pages/InitFinanzas";
import Configuracion from "./pages/Configuracion";
import CiclosEscolares from "./pages/CiclosEscolares";
import PadresFamilia from "./pages/PadresFamilia";
import Mensajes from "./pages/Mensajes";
import Soporte from "./pages/Soporte";
import SessionWarningDialog from "./components/SessionWarningDialog";
import useSessionTimeout from "./hooks/useSessionTimeout";
import api from "./api/axiosConfig";
import { getTokenIfValid, clearToken } from "./utils/tokenUtils";
import { MensajesProvider } from "./context/MensajesContext";

function AuthWrapper({ token, setToken, selected, setSelected, user, necesitaSetup, setNecesitaSetup, setLoading }) {
  // Hook de gestión de sesión con callback para limpiar estado
  const handleSessionExpired = useCallback(() => {
    setLoading(false);
    setToken(null);
  }, [setToken, setLoading]);

  const { showWarning, countdown, maxCountdown, handleContinue, handleLogout } = useSessionTimeout(handleSessionExpired);

  // Si no hay token, mostrar login o setup según la ruta
  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/setup" element={<SetupInicial setToken={setToken} setNecesitaSetup={setNecesitaSetup} />} />
        <Route path="/init-finanzas" element={<InitFinanzas />} />
        {/* Redirigir a setup solo si necesita setup, sino a login */}
        <Route path="*" element={<Navigate to={necesitaSetup ? "/setup" : "/login"} />} />
      </Routes>
    );
  }

  return (
    <MensajesProvider>
      <div className="flex flex-col min-h-screen">
        {/* Diálogo de advertencia de sesión */}
        <SessionWarningDialog
          isOpen={showWarning}
          countdown={countdown}
          maxCountdown={maxCountdown}
          onContinue={handleContinue}
          onLogout={handleLogout}
        />

        <div className="flex flex-1">
          <Sidebar
            setToken={setToken}
            user={user}
            onSelect={setSelected}
            active={selected}
            onLogout={() => {
              clearToken();
              setToken(null);
            }}
          />
          <main className="flex-1 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-auto">
            <Header user={user} />
            <Routes>
              <Route path="/" element={
                <ProtectedRoute user={user}>
                  <HomePage />
                </ProtectedRoute>
              } />

              <Route path="/estudiantes" element={
                <ProtectedRoute user={user}>
                  <Estudiantes />
                </ProtectedRoute>
              } />

              <Route path="/alumnos" element={
                <ProtectedRoute user={user}>
                  <Alumnos />
                </ProtectedRoute>
              } />

              <Route path="/alumnos/detalle/:id" element={
                <ProtectedRoute user={user}>
                  <DetalleAlumno />
                </ProtectedRoute>
              } />

              {/* Ruta antigua de registro de alumnos eliminada; ahora se usa el módulo de Estudiantes */}

              <Route path="/profesores" element={
                <ProtectedRoute user={user}>
                  <Profesores setToken={setToken} />
                </ProtectedRoute>
              } />

              <Route path="/profesores/detalle/:id" element={
                <ProtectedRoute user={user}>
                  <ProfesorDetalle />
                </ProtectedRoute>
              } />

              <Route path="/materias" element={
                <ProtectedRoute user={user}>
                  <MateriasPage />
                </ProtectedRoute>
              } />

              <Route path="/calificaciones" element={
                <ProtectedRoute user={user}>
                  <CalificacionesPage />
                </ProtectedRoute>
              } />

              <Route path="/examenes" element={
                <ProtectedRoute user={user}>
                  <ExamenesPage />
                </ProtectedRoute>
              } />

              <Route path="/reportes" element={
                <ProtectedRoute user={user}>
                  <ReportesPage />
                </ProtectedRoute>
              } />

              <Route path="/finanzas" element={
                <ProtectedRoute user={user} requiredRoles={['admin', 'director', 'secretariado']}>
                  <FinanzasPage />
                </ProtectedRoute>
              } />


              <Route path="/configuracion" element={
                <ProtectedRoute user={user} requiredRoles={['admin', 'director']}>
                  <Configuracion />
                </ProtectedRoute>
              } />

              <Route path="/ciclosescolares" element={
                <ProtectedRoute user={user} requiredRoles={['admin', 'director']}>
                  <CiclosEscolares />
                </ProtectedRoute>
              } />

              <Route path="/grados" element={
                <ProtectedRoute user={user}>
                  <GradosPage />
                </ProtectedRoute>
              } />

              <Route path="/secciones" element={
                <ProtectedRoute user={user}>
                  <SeccionesPage />
                </ProtectedRoute>
              } />

              <Route path="/carga-academica" element={
                <ProtectedRoute user={user} requiredRoles={['admin', 'director', 'secretariado']}>
                  <CargaAcademica />
                </ProtectedRoute>
              } />

              <Route path="/horario" element={
                <ProtectedRoute user={user}>
                  <HorarioPage />
                </ProtectedRoute>
              } />

              <Route path="/horario-clases" element={
                <ProtectedRoute user={user}>
                  <HorarioClases />
                </ProtectedRoute>
              } />

              <Route path="/asistencia" element={
                <ProtectedRoute user={user}>
                  <Asistencia />
                </ProtectedRoute>
              } />

              <Route path="/perfil" element={
                <ProtectedRoute user={user}>
                  <PerfilUsuario />
                </ProtectedRoute>
              } />

              <Route path="/mis-calificaciones" element={
                <ProtectedRoute user={user}>
                  <MisCalificaciones />
                </ProtectedRoute>
              } />

              <Route path="/usuarios" element={
                <ProtectedRoute user={user}>
                  <UsuariosPage />
                </ProtectedRoute>
              } />

              <Route path="/padres-familia" element={
                <ProtectedRoute user={user}>
                  <PadresFamilia />
                </ProtectedRoute>
              } />

              <Route path="/mensajes" element={
                <ProtectedRoute user={user}>
                  <Mensajes />
                </ProtectedRoute>
              } />

              <Route path="/soporte" element={
                <ProtectedRoute user={user}>
                  <Soporte />
                </ProtectedRoute>
              } />

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </div>
    </MensajesProvider>
  );
}

// Función para normalizar roles del backend al frontend
const normalizeRole = (backendRole) => {
  const roleMap = {
    'Administrador': 'admin',
    'Profesor': 'profesor',
    'Estudiante': 'alumno',
    'Director': 'director',
    'Padre': 'padre',
    'Secretariado': 'secretariado'
  };
  return roleMap[backendRole] || backendRole?.toLowerCase();
};

function App() {
  const [token, setToken] = useState(getTokenIfValid());
  const [user, setUser] = useState(null);
  const [selected, setSelected] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [necesitaSetup, setNecesitaSetup] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  // Verificar expiración del token periódicamente
  useEffect(() => {
    const checkTokenExpiration = () => {
      const validToken = getTokenIfValid();
      if (!validToken && token) {
        console.log('⏰ Token expirado, cerrando sesión...');
        setToken(null);
        setUser(null);
      }
    };

    // Verificar cada minuto
    const interval = setInterval(checkTokenExpiration, 60000);

    return () => clearInterval(interval);
  }, [token]);

  // Sincronizar logout inmediato cuando Axios detecta 401 y limpia localStorage
  useEffect(() => {
    const handler = () => {
      setToken(null);
      setUser(null);
      setLoading(false);
    };

    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  // Verificar si el sistema necesita configuración inicial
  useEffect(() => {
    const verificarSetup = async () => {
      try {
        const response = await api.get("/api/auth/necesita-setup");
        console.log("📋 Verificación de setup:", response.data);
        setNecesitaSetup(response.data.necesitaSetup);
      } catch (err) {
        console.error("Error verificando setup:", err);
        setNecesitaSetup(false);
      } finally {
        setCheckingSetup(false);
      }
    };

    verificarSetup();
  }, []);

  // Obtén los datos del usuario cuando haya token
  useEffect(() => {
    if (token && !necesitaSetup) {
      setLoading(true);
      api.get("/api/usuarios/perfil", {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          console.log("Datos del usuario obtenidos:", res.data); // Debug
          const backendRole = res.data.usuario?.rol || res.data.rol;
          const normalizedRole = normalizeRole(backendRole);
          console.log("Rol del backend:", backendRole, "→ Normalizado:", normalizedRole); // Debug

          setUser({
            id_usuario: res.data.usuario?.id_usuario,
            nombre: res.data.usuario?.nombre || res.data.nombre,
            apellido: res.data.usuario?.apellido || res.data.apellido,
            rol: normalizedRole,
            email: res.data.usuario?.email || res.data.email,
            id_escuela: res.data.usuario?.id_escuela,
            id_profesor: res.data.usuario?.id_profesor,
            imagen: res.data.usuario?.imagen
              ? `http://localhost:4000${res.data.usuario.imagen}`
              : null
          });
          console.log("Debug - Usuario completo:", {
            id_usuario: res.data.usuario?.id_usuario,
            nombre: res.data.usuario?.nombre,
            apellido: res.data.usuario?.apellido,
            rol: normalizedRole,
            email: res.data.usuario?.email,
            id_escuela: res.data.usuario?.id_escuela,
            id_profesor: res.data.usuario?.id_profesor
          });
        })
        .catch(err => {
          console.error("Error al obtener usuario:", err);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setUser(null);
    }
  }, [token, necesitaSetup]);

  if (checkingSetup) {
    return <Loader />;
  }

  return (
    <Router>
      {loading && <Loader />}
      <Routes>
        {/* Rutas públicas que siempre deben estar disponibles */}
        <Route path="/verificar-email/:token" element={<VerificarEmail />} />
        <Route path="/email-no-verificado" element={<EmailNoVerificado />} />
        <Route path="/restablecer-password/:token" element={<RestablecerPassword />} />

        {/* Resto de rutas manejadas por AuthWrapper */}
        <Route path="/*" element={
          <AuthWrapper
            token={token}
            setToken={setToken}
            selected={selected}
            setSelected={setSelected}
            setLoading={setLoading}
            user={user}
            necesitaSetup={necesitaSetup}
            setNecesitaSetup={setNecesitaSetup}
          />
        } />
      </Routes>
    </Router>
  );
}

export default App;
