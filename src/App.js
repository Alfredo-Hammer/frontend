import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import './App.css';
import Sidebar from "./components/Sidebar";
import EscuelasList from "./components/EsuelasList";
import Registro from "./components/Registro";
import Login from "./components/Login";
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

function AuthWrapper({ token, setToken, selected, setSelected, user }) {
  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/register" element={<Registro setToken={setToken} />} />
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

            <Route path="/escuelas" element={
              <ProtectedRoute user={user}>
                <EscuelasList setToken={setToken} />
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

            <Route path="/registro" element={
              <ProtectedRoute user={user}>
                <Registro setToken={setToken} />
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
    'Padre': 'padre'
  };
  return roleMap[backendRole] || backendRole?.toLowerCase();
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [selected, setSelected] = useState("escuelas");
  const [loading, setLoading] = useState(false);

  // Obtén los datos del usuario cuando haya token
  useEffect(() => {
    if (token) {
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
            nombre: res.data.usuario?.nombre || res.data.nombre,
            apellido: res.data.usuario?.apellido || res.data.apellido,
            rol: normalizedRole,
            email: res.data.usuario?.email || res.data.email,
            imagen: res.data.usuario?.imagen
              ? `http://localhost:4000${res.data.usuario.imagen}`
              : null
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
  }, [token]);

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
      />
    </Router>
  );
}

export default App;
