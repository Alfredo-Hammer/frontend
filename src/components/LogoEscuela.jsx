import React, {useState, useEffect} from "react";
import axios from "axios";

const LogoEscuela = ({className = "", size = "md"}) => {
  const API_BASE_URL = "http://localhost:4000";
  const [logoUrl, setLogoUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tamaños predefinidos
  const sizes = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-20 h-20",
    xl: "w-24 h-24",
  };

  useEffect(() => {
    cargarLogoEscuela();
  }, []);

  const cargarLogoEscuela = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/api/escuelas`, {
        headers: {Authorization: `Bearer ${token}`},
      });

      console.log("📸 Respuesta de escuelas:", response.data);

      if (response.data && response.data.length > 0) {
        const escuela = response.data[0];
        console.log("🏫 Escuela:", escuela);
        console.log("🖼️ Logo:", escuela.logo);

        if (escuela.logo) {
          const logoPath = `${API_BASE_URL}${escuela.logo}`;
          console.log("✅ Logo URL completa:", logoPath);
          setLogoUrl(logoPath);
        } else {
          console.log("⚠️ No hay logo en la escuela");
        }
      } else {
        console.log("⚠️ No hay escuelas en la respuesta");
      }
    } catch (error) {
      console.error("❌ Error al cargar logo de la escuela:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className={`${sizes[size]} ${className} rounded-full bg-gray-200 animate-pulse`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} ${className} rounded-full overflow-hidden bg-white shadow-lg flex items-center justify-center`}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt="Logo de la escuela"
          className="w-full h-full object-contain p-1"
        />
      ) : (
        // Logo por defecto
        <svg
          className="w-3/4 h-3/4 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      )}
    </div>
  );
};

export default LogoEscuela;
