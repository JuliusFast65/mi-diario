import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const InstallPWA = () => {
    const { t } = useTranslation();
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallModal, setShowInstallModal] = useState(false);
    const [isInstalling, setIsInstalling] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isChrome, setIsChrome] = useState(false);
    const [isEdge, setIsEdge] = useState(false);
    const [isAndroid, setIsAndroid] = useState(false);

    useEffect(() => {
        // Detectar navegador y plataforma
        const userAgent = navigator.userAgent;
        const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
        const isAndroidDevice = /Android/.test(userAgent);
        const isChromeBrowser = /Chrome/.test(userAgent) && !/Edge/.test(userAgent);
        const isEdgeBrowser = /Edge/.test(userAgent);
        
        setIsIOS(isIOSDevice);
        setIsAndroid(isAndroidDevice);
        setIsChrome(isChromeBrowser);
        setIsEdge(isEdgeBrowser);

        // Detectar si ya está instalada como PWA
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                                window.navigator.standalone === true;
        setIsStandalone(isStandaloneMode);

        // Si ya está instalada, no mostrar el modal
        if (isStandaloneMode) {
            return;
        }

        // Capturar el evento beforeinstallprompt (Chrome, Edge, etc.)
        const handleBeforeInstallPrompt = (e) => {
            console.log('beforeinstallprompt event fired');
            
            // Prevenir que Chrome muestre el prompt automático
            e.preventDefault();
            
            // Guardar el evento para usarlo más tarde
            setDeferredPrompt(e);
            
            // Mostrar nuestro modal personalizado después de un pequeño delay
            setTimeout(() => {
                setShowInstallModal(true);
            }, 3000); // 3 segundos después de cargar la página
        };

        // Para iOS Safari, mostrar instrucciones de instalación manual
        if (isIOSDevice && !isStandaloneMode) {
            setTimeout(() => {
                setShowInstallModal(true);
            }, 4000); // 4 segundos para iOS
        }

        // Para Android Chrome/Edge, verificar si podemos mostrar el prompt
        if ((isChromeBrowser || isEdgeBrowser) && isAndroidDevice && !isStandaloneMode) {
            // Verificar si el Service Worker está registrado
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(() => {
                    // Si no se disparó beforeinstallprompt después de 5 segundos, mostrar instrucciones manuales
                    setTimeout(() => {
                        if (!deferredPrompt) {
                            setShowInstallModal(true);
                        }
                    }, 5000);
                });
            }
        }

        // Escuchar el evento beforeinstallprompt
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Limpiar el event listener
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, [deferredPrompt]);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        setIsInstalling(true);

        try {
            // Mostrar el prompt de instalación
            deferredPrompt.prompt();

            // Esperar la respuesta del usuario
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                console.log('Usuario aceptó instalar la PWA');
                setShowInstallModal(false);
            } else {
                console.log('Usuario rechazó instalar la PWA');
            }
        } catch (error) {
            console.error('Error al instalar PWA:', error);
        } finally {
            // Limpiar el prompt
            setDeferredPrompt(null);
            setIsInstalling(false);
        }
    };

    const handleDismiss = () => {
        setShowInstallModal(false);
        setDeferredPrompt(null);
    };

    // No mostrar nada si ya está instalada
    if (isStandalone) {
        return null;
    }

    // Para iOS, mostrar aunque no haya deferredPrompt
    if (isIOS && !deferredPrompt && !showInstallModal) {
        return null;
    }

    // Para Android, mostrar si no hay deferredPrompt después del timeout
    if (isAndroid && !deferredPrompt && !showInstallModal) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="text-center">
                    {/* Icono */}
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-900 mb-4">
                        <svg className="h-8 w-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    </div>

                    {/* Título */}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Instalar Introspect
                    </h3>

                    {/* Descripción */}
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        Instala Introspect en tu dispositivo para acceder más rápido y usar la app sin conexión.
                    </p>

                    {/* Contenido específico por plataforma */}
                    {isIOS ? (
                        <div className="space-y-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                                    📱 Instrucciones para iOS:
                                </h4>
                                <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                                    <li>1. Toca el botón <strong>Compartir</strong> 📤</li>
                                    <li>2. Selecciona <strong>"Agregar a Pantalla de Inicio"</strong></li>
                                    <li>3. Toca <strong>"Agregar"</strong> para confirmar</li>
                                </ol>
                            </div>
                            
                            <button
                                onClick={handleDismiss}
                                className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                            >
                                Entendido
                            </button>
                        </div>
                    ) : isAndroid && !deferredPrompt ? (
                        <div className="space-y-4">
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                                    📱 Instrucciones para Android:
                                </h4>
                                <ol className="text-sm text-green-700 dark:text-green-300 space-y-1">
                                    <li>1. Toca el menú (⋮) en la esquina superior derecha</li>
                                    <li>2. Selecciona <strong>"Instalar aplicación"</strong></li>
                                    <li>3. Confirma la instalación</li>
                                </ol>
                            </div>
                            
                            <button
                                onClick={handleDismiss}
                                className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                            >
                                Entendido
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Botones para navegadores que soportan beforeinstallprompt */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={handleInstallClick}
                                    disabled={isInstalling}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                                >
                                    {isInstalling ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Instalando...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            Instalar
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={handleDismiss}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                                >
                                    Más tarde
                                </button>
                            </div>

                            {/* Información adicional */}
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                                Puedes instalar la app desde el menú del navegador en cualquier momento.
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InstallPWA;
