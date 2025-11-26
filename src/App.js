import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import './App.css';
import Sidebar from "./components/Sidebar";
import Login from "./components/Login";
import SetupInicial from "./pages/SetupInicial";
import Alumnos from "./pages/Alumnos";
import DetalleAlumno from "./components/DetalleAlumno";
import HomePage from "./pages/HomePage";
import Profesores from "./pages/Profesores";
import Loader from "./components/Loader";
import Header from "./components/Header";
import GradosPage from "./pages/GradosPage";
import SeccionesPage from "./pages/SeccionesPage";
import MateriasPage from "./pages/MateriasPage";
import CalificacionesPage from "./pages/CalificacionesPage";
import HorarioPage from "./pages/HorarioPage";
import HorarioClases from "./pages/HorarioClases";
import RegistroAlumno from "./pages/RegistroAlumno";
import Asistencia from "./pages/Asistencia";
import ProtectedRoute from "./components/ProtectedRoute";
import PerfilUsuario from "./pages/PerfilUsuario";
import MisCalificaciones from "./pages/MisCalificaciones";
import api from "./api/axiosConfig";

function AuthWrapper({ token, setToken, selected, setSelected, user, necesitaSetup, setNecesitaSetup }) {
  if (necesitaSetup) {
    return (
      <Routes>
        <Route path="/setup" element={<SetupInicial setToken={setToken} setNecesitaSetup={setNecesitaSetup} />} />
        <Route path="*" element={<Navigate to="/setup" />} />
      </Routes>
    );
  }

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-1">
        <Sidebar
          setToken={setToken}
          user={user}
          onSelect={setSelected}
          active={selected}
          onLogout={() => {
            localStorage.removeItem("token");
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

            <Route path="/alumnos/registro" element={
              <ProtectedRoute user={user}>
                <RegistroAlumno />
              </ProtectedRoute>
            } />

            <Route path="/profesores" element={
              <ProtectedRoute user={user}>
                <Profesores setToken={setToken} />
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

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
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
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [selected, setSelected] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [necesitaSetup, setNecesitaSetup] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

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
    </Router>
  );
}

export default App;
