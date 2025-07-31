import { useState, useEffect, useCallback } from 'react';

// Configuración de seguridad por defecto
const DEFAULT_SECURITY_CONFIG = {
  autoLockDelay: 10 * 60 * 1000, // 10 minutos
  requirePinOnResume: true,
  hideContentInMultitask: true,
  pinLength: 4
};

export const useAppSecurity = (config = {}) => {
  // Cargar configuración guardada o usar valores por defecto
  const savedConfig = localStorage.getItem('security_config');
  const initialConfig = savedConfig ? JSON.parse(savedConfig) : DEFAULT_SECURITY_CONFIG;
  const securityConfig = { ...initialConfig, ...config };
  
  const [isLocked, setIsLocked] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [isVisible, setIsVisible] = useState(!document.hidden);
  const [userPin, setUserPin] = useState(localStorage.getItem('app_pin') || '');
  const [isPinSet, setIsPinSet] = useState(!!localStorage.getItem('app_pin'));
  const [currentConfig, setCurrentConfig] = useState(securityConfig);

  // Detectar actividad del usuario
  const resetActivityTimer = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  // Detectar cambios de visibilidad (pestaña activa/inactiva)
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsVisible(visible);
      
      // Si la app se vuelve visible y requiere PIN, bloquear
      if (visible && currentConfig.requirePinOnResume && isPinSet) {
        setIsLocked(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentConfig.requirePinOnResume, isPinSet]);

  // Detectar eventos de actividad del usuario
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      resetActivityTimer();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [resetActivityTimer]);

  // Auto-bloqueo por inactividad
  useEffect(() => {
    if (!isPinSet) return; // No bloquear si no hay PIN configurado

    const timer = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivity;
      
      if (timeSinceLastActivity > currentConfig.autoLockDelay && !isLocked) {
        console.log('🔒 Auto-bloqueo por inactividad');
        setIsLocked(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [lastActivity, currentConfig.autoLockDelay, isLocked, isPinSet]);

  // Función para configurar PIN
  const setupPin = useCallback((pin) => {
    if (pin.length === currentConfig.pinLength) {
      setUserPin(pin);
      setIsPinSet(true);
      localStorage.setItem('app_pin', pin);
      return true;
    }
    return false;
  }, [currentConfig.pinLength]);

  // Función para verificar PIN
  const verifyPin = useCallback((pin) => {
    if (pin === userPin) {
      setIsLocked(false);
      resetActivityTimer();
      return true;
    }
    return false;
  }, [userPin, resetActivityTimer]);

  // Función para bloquear manualmente
  const lockApp = useCallback(() => {
    if (isPinSet) {
      setIsLocked(true);
    }
  }, [isPinSet]);

  // Función para desbloquear
  const unlockApp = useCallback((pin) => {
    return verifyPin(pin);
  }, [verifyPin]);

  // Función para cambiar PIN
  const changePin = useCallback((currentPin, newPin) => {
    if (currentPin === userPin && newPin.length === securityConfig.pinLength) {
      setUserPin(newPin);
      localStorage.setItem('app_pin', newPin);
      return true;
    }
    return false;
  }, [userPin, securityConfig.pinLength]);

  // Función para deshabilitar PIN
  const disablePin = useCallback((currentPin) => {
    if (currentPin === userPin) {
      setUserPin('');
      setIsPinSet(false);
      setIsLocked(false);
      localStorage.removeItem('app_pin');
      return true;
    }
    return false;
  }, [userPin]);

  // Función para actualizar configuración
  const updateConfig = useCallback((newConfig) => {
    const updatedConfig = { ...currentConfig, ...newConfig };
    setCurrentConfig(updatedConfig);
    localStorage.setItem('security_config', JSON.stringify(updatedConfig));
    console.log('🔧 Configuración de seguridad actualizada:', updatedConfig);
  }, [currentConfig]);

  // Obtener tiempo restante antes del auto-bloqueo
  const getTimeUntilLock = useCallback(() => {
    if (!isPinSet) return null;
    
    const timeSinceLastActivity = Date.now() - lastActivity;
    const timeRemaining = currentConfig.autoLockDelay - timeSinceLastActivity;
    
    if (timeRemaining <= 0) return 0;
    
    return Math.ceil(timeRemaining / 1000); // En segundos
  }, [lastActivity, currentConfig.autoLockDelay, isPinSet]);

  return {
    // Estado
    isLocked,
    isVisible,
    isPinSet,
    userPin: userPin ? '*'.repeat(currentConfig.pinLength) : '',
    
    // Funciones
    setupPin,
    verifyPin,
    lockApp,
    unlockApp,
    changePin,
    disablePin,
    resetActivityTimer,
    updateConfig,
    
    // Utilidades
    getTimeUntilLock,
    pinLength: currentConfig.pinLength,
    
    // Configuración
    config: currentConfig
  };
}; 