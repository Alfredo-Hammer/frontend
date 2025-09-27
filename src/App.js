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
            <Route path="/" element={<HomePage />} />
            <Route path="/escuelas" element={<EscuelasList setToken={setToken} />} />
            <Route path="/alumnos" element={<Alumnos />} />
            <Route path="/alumnos/detalle/:id" element={<DetalleAlumno />} />
            <Route path="/alumnos/registro" element={<RegistroAlumno />} />
            <Route path="/profesores" element={<Profesores setToken={setToken} />} />
            <Route path="/materias" element={<MateriasPage />} />
            <Route path="/calificaciones" element={<CalificacionesPage />} />
            <Route path="/grados" element={<GradosPage />} />
            <Route path="/secciones" element={<SeccionesPage />} />
            <Route path="/horario" element={<HorarioPage />} />
            <Route path="/registro" element={<Registro setToken={setToken} />} />
            <Route path="/horario-clases" element={<HorarioClases />} />
            <Route path="/asistencia" element={<Asistencia />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

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
          setUser({
            nombre: res.data.usuario?.nombre || res.data.nombre,
            apellido: res.data.usuario?.apellido || res.data.apellido,
            rol: res.data.usuario?.rol || res.data.rol,
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
