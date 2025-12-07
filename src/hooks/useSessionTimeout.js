import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const useSessionTimeout = (onSessionExpired) => {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const navigate = useNavigate();
  const warningTimerRef = useRef(null);
  const logoutTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const activityTimerRef = useRef(null);

  // Tiempo en milisegundos
  const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hora
  const WARNING_TIME = 30 * 1000; // 30 segundos antes de expirar

  const clearAllTimers = useCallback(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
  }, []);

  const logout = useCallback(() => {
    clearAllTimers();
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
    setShowWarning(false);
    
    // Notificar a App.js que la sesión expiró
    if (onSessionExpired) {
      onSessionExpired();
    }
    
    navigate('/login');
  }, [clearAllTimers, navigate, onSessionExpired]);

  const refreshSession = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Intentar renovar el token haciendo una petición al perfil
      await api.get('/api/usuarios/perfil', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Si la petición es exitosa, actualizar el tiempo de expiración
      const newExpiry = Date.now() + SESSION_TIMEOUT;
      localStorage.setItem('tokenExpiry', newExpiry.toString());

      setShowWarning(false);
      setCountdown(30);
      clearAllTimers();
      startTimers();
    } catch (error) {
      console.error('Error al renovar sesión:', error);
      logout();
    }
  }, [SESSION_TIMEOUT, clearAllTimers, logout]);

  const handleContinue = useCallback(() => {
    refreshSession();
  }, [refreshSession]);

  const startCountdown = useCallback(() => {
    setCountdown(30);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const startTimers = useCallback(() => {
    clearAllTimers();

    // Timer para mostrar advertencia 30 segundos antes
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      startCountdown();
    }, SESSION_TIMEOUT - WARNING_TIME);

    // Timer para cerrar sesión automáticamente
    logoutTimerRef.current = setTimeout(() => {
      logout();
    }, SESSION_TIMEOUT);
  }, [SESSION_TIMEOUT, WARNING_TIME, clearAllTimers, logout, startCountdown]);

  const resetTimer = useCallback(() => {
    if (showWarning) return; // No resetear si ya está mostrando advertencia

    const token = localStorage.getItem('token');
    if (!token) return;

    // Actualizar tiempo de expiración
    const newExpiry = Date.now() + SESSION_TIMEOUT;
    localStorage.setItem('tokenExpiry', newExpiry.toString());

    startTimers();
  }, [SESSION_TIMEOUT, showWarning, startTimers]);

  // Detectar actividad del usuario
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      if (activityTimerRef.current) clearTimeout(activityTimerRef.current);

      activityTimerRef.current = setTimeout(() => {
        resetTimer();
      }, 1000); // Debounce de 1 segundo
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
    };
  }, [resetTimer]);

  // Inicializar timers al montar
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Si no hay tokenExpiry guardado, crearlo
    let expiry = localStorage.getItem('tokenExpiry');
    if (!expiry) {
      expiry = Date.now() + SESSION_TIMEOUT;
      localStorage.setItem('tokenExpiry', expiry.toString());
    }

    const timeRemaining = parseInt(expiry) - Date.now();

    if (timeRemaining <= 0) {
      logout();
      return;
    }

    if (timeRemaining <= WARNING_TIME) {
      // Ya está cerca de expirar, mostrar advertencia inmediatamente
      setShowWarning(true);
      const secondsLeft = Math.floor(timeRemaining / 1000);
      setCountdown(secondsLeft > 0 ? secondsLeft : 0);
      startCountdown();

      logoutTimerRef.current = setTimeout(() => {
        logout();
      }, timeRemaining);
    } else {
      startTimers();
    }

    return () => {
      clearAllTimers();
    };
  }, [SESSION_TIMEOUT, WARNING_TIME, clearAllTimers, logout, startTimers, startCountdown]);

  return {
    showWarning,
    countdown,
    handleContinue,
    handleLogout: logout,
  };
};

export default useSessionTimeout;
