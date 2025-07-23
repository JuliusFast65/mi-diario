import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Función para manejar el registro y actualizaciones del Service Worker
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registrado con scope:', registration.scope);

      // Detectar actualizaciones
      registration.addEventListener('updatefound', () => {
        console.log('[SW] Nueva versión detectada');
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[SW] Nueva versión instalada, lista para activar');
            
            // Notificar a la aplicación que hay una actualización disponible
            window.dispatchEvent(new CustomEvent('swUpdateAvailable'));
          }
        });
      });

      // Manejar cuando el Service Worker toma control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SW] Nuevo Service Worker tomó control');
        
        // Recargar la página para aplicar la nueva versión
        window.location.reload();
      });

      // Verificar si hay una nueva versión al cargar la página
      registration.update();

      return registration;
    } catch (error) {
      console.error('Error registrando el Service Worker:', error);
    }
  }
};

// Registrar el Service Worker cuando la página cargue
window.addEventListener('load', registerServiceWorker);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
