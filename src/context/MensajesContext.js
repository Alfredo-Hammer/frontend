import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const MensajesContext = createContext();

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

export const MensajesProvider = ({ children }) => {
  const [contadorNoLeidos, setContadorNoLeidos] = useState(0);
  const [loading, setLoading] = useState(false);

  const cargarContador = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/mensajes/contador`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setContadorNoLeidos(response.data.data.total_no_leidos);
      }
    } catch (error) {
      console.error('Error al cargar contador de mensajes:', error);
      setContadorNoLeidos(0);
    } finally {
      setLoading(false);
    }
  };

  const actualizarContador = (nuevoValor) => {
    if (typeof nuevoValor === 'number') {
      setContadorNoLeidos(nuevoValor);
    } else {
      cargarContador();
    }
  };

  const decrementarContador = (cantidad = 1) => {
    setContadorNoLeidos(prev => Math.max(0, prev - cantidad));
  };

  const incrementarContador = (cantidad = 1) => {
    setContadorNoLeidos(prev => prev + cantidad);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    cargarContador();

    // Recargar cada 30 segundos si hay token
    const interval = setInterval(() => {
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        cargarContador();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <MensajesContext.Provider value={{
      contadorNoLeidos,
      loading,
      cargarContador,
      actualizarContador,
      decrementarContador,
      incrementarContador
    }}>
      {children}
    </MensajesContext.Provider>
  );
};

export const useMensajes = () => {
  const context = useContext(MensajesContext);
  if (!context) {
    throw new Error('useMensajes debe usarse dentro de MensajesProvider');
  }
  return context;
};

// Compatibilidad: permite importar como default o como named
export default MensajesProvider;
