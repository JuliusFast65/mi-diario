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
    const [isEdgeAndroid, setIsEdgeAndroid] = useState(false);
    const [isPWAInstallable, setIsPWAInstallable] = useState(false);
    const [debugInfo, setDebugInfo] = useState({});
    const [hasUserDismissed, setHasUserDismissed] = useState(false);

    useEffect(() => {
        // NUEVO: Verificar si ya hay un beforeinstallprompt disponible globalmente
        if (window.deferredPrompt) {
            console.log('🎯 beforeinstallprompt ya disponible globalmente');
            setDeferredPrompt(window.deferredPrompt);
            setIsPWAInstallable(true);
        }

        // Detectar navegador y plataforma
        const userAgent = navigator.userAgent;
        const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
        const isAndroidDevice = /Android/.test(userAgent);
        const isChromeBrowser = /Chrome/.test(userAgent) && !/Edge/.test(userAgent);
        const isEdgeBrowser = /Edge/.test(userAgent);
        const isEdgeAndroid = isEdgeBrowser && isAndroidDevice;
        
        setIsIOS(isIOSDevice);
        setIsAndroid(isAndroidDevice);
        setIsChrome(isChromeBrowser);
        setIsEdge(isEdgeBrowser);
        setIsEdgeAndroid(isEdgeAndroid);

        // Detectar si ya está instalada como PWA
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                                window.navigator.standalone === true;
        setIsStandalone(isStandaloneMode);

        // Debug info
        setDebugInfo({
            userAgent,
            isIOS: isIOSDevice,
            isAndroid: isAndroidDevice,
            isChrome: isChromeBrowser,
            isEdge: isEdgeBrowser,
            isEdgeAndroid: isEdgeAndroid,
            isStandalone: isStandaloneMode,
            timestamp: new Date().toISOString()
        });

        console.log('🔧 InstallPWA Debug:', {
            isIOS: isIOSDevice,
            isAndroid: isAndroidDevice,
            isChrome: isChromeBrowser,
            isEdge: isEdgeBrowser,
            isEdgeAndroid: isEdgeAndroid,
            isStandalone: isStandaloneMode
        });

        // Si ya está instalada, no mostrar el modal
        if (isStandaloneMode) {
            console.log('🚫 PWA ya instalada, no mostrar modal');
            return;
        }

        // Verificar si la PWA es instalable
        const checkPWAInstallability = async () => {
            try {
                // Verificar que el Service Worker esté registrado
                if ('serviceWorker' in navigator) {
                    const registration = await navigator.serviceWorker.getRegistration();
                    if (registration) {
                        console.log('✅ Service Worker registrado');
                        
                        // Verificar que el manifest esté cargado
                        const manifestResponse = await fetch('/manifest.json');
                        if (manifestResponse.ok) {
                            const manifest = await manifestResponse.json();
                            console.log('✅ Manifest cargado:', manifest.name);
                            
                            // Verificar criterios básicos de instalación
                            const hasValidManifest = manifest.name && manifest.short_name && manifest.icons && manifest.icons.length > 0;
                            const hasValidIcons = manifest.icons.some(icon => 
                                (icon.sizes === '192x192' || icon.sizes === '512x512') && 
                                icon.type === 'image/png'
                            );
                            
                            if (hasValidManifest && hasValidIcons) {
                                setIsPWAInstallable(true);
                                console.log('✅ PWA es instalable');
                            } else {
                                console.log('❌ PWA no cumple criterios de instalación');
                            }
                        } else {
                            console.log('❌ Error cargando manifest');
                        }
                    } else {
                        console.log('❌ Service Worker no registrado');
                    }
                }
            } catch (error) {
                console.error('Error verificando instalabilidad PWA:', error);
            }
        };

        // Capturar el evento beforeinstallprompt (Chrome, Edge, etc.)
        const handleBeforeInstallPrompt = (e) => {
            console.log('🎯 beforeinstallprompt event fired');
            
            // Prevenir que Chrome muestre el prompt automático
            e.preventDefault();
            
            // Guardar el evento globalmente también
            window.deferredPrompt = e;
            
            // Guardar el evento para usarlo más tarde
            setDeferredPrompt(e);
            setIsPWAInstallable(true);
            
            // Mostrar nuestro modal personalizado después de un pequeño delay
            setTimeout(() => {
                console.log('⏰ Mostrando modal después de delay');
                setShowInstallModal(true);
            }, 3000); // 3 segundos después de cargar la página
        };

        // Verificar instalabilidad al cargar
        checkPWAInstallability();

        // Para navegadores que soportan beforeinstallprompt, esperar el evento
        if ((isChromeBrowser || isEdgeBrowser) && !isIOSDevice) {
            console.log('⏳ Esperando evento beforeinstallprompt...');
            
            // Esperar hasta 10 segundos para el evento beforeinstallprompt
            const timeoutId = setTimeout(() => {
                console.log('⏰ Timeout de 10 segundos alcanzado');
                // Si después de 10 segundos no tenemos deferredPrompt pero la PWA es instalable,
                // mostrar instrucciones manuales
                if (!deferredPrompt && isPWAInstallable) {
                    console.log('📱 Mostrando instrucciones manuales (timeout)');
                    setShowInstallModal(true);
                }
            }, 10000);

            // Limpiar timeout si se dispara beforeinstallprompt
            const cleanup = () => {
                clearTimeout(timeoutId);
                console.log('🧹 Timeout limpiado');
            };
            window.addEventListener('beforeinstallprompt', cleanup);
            
            return () => {
                cleanup();
                window.removeEventListener('beforeinstallprompt', cleanup);
            };
        }

        // Para iOS Safari, mostrar instrucciones de instalación manual
        if (isIOSDevice && !isStandaloneMode) {
            console.log('🍎 iOS detectado, mostrando instrucciones manuales');
            setTimeout(() => {
                console.log('📱 Mostrando modal para iOS');
                setShowInstallModal(true);
            }, 4000); // 4 segundos para iOS
        }

        // NUEVO: Para Edge Android, mostrar instrucciones específicas
        if (isEdgeAndroid && !isStandaloneMode) {
            console.log('🔗 Edge Android detectado, mostrando instrucciones específicas');
            setTimeout(() => {
                console.log('📱 Mostrando modal para Edge Android');
                setShowInstallModal(true);
            }, 3000); // 3 segundos para Edge Android
        }

        // NUEVO: Timeout adicional para mostrar modal cuando PWA es instalable
        // Este timeout se ejecuta independientemente del evento beforeinstallprompt
        const showModalTimeout = setTimeout(() => {
            if (isPWAInstallable && !isStandaloneMode && !hasUserDismissed && !deferredPrompt) {
                console.log('📱 Mostrando modal por timeout de instalabilidad');
                setShowInstallModal(true);
            }
        }, 5000); // 5 segundos después de cargar

        // Escuchar el evento beforeinstallprompt
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Limpiar el event listener y timeout
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            clearTimeout(showModalTimeout);
        };
    }, []); // REMOVIDO hasUserDismissed como dependencia para evitar loops

    // NUEVO: useEffect separado para manejar hasUserDismissed
    useEffect(() => {
        if (hasUserDismissed) {
            console.log('⏰ Usuario cerró modal, esperando 30 segundos antes de permitir mostrar de nuevo');
        }
    }, [hasUserDismissed]);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        setIsInstalling(true);
        console.log('🚀 Iniciando instalación...');

        try {
            // Mostrar el prompt de instalación
            deferredPrompt.prompt();

            // Esperar la respuesta del usuario
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                console.log('✅ Usuario aceptó instalar la PWA');
                setShowInstallModal(false);
            } else {
                console.log('❌ Usuario rechazó instalar la PWA');
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
        console.log('❌ Usuario cerró el modal');
        setShowInstallModal(false);
        setDeferredPrompt(null);
        setHasUserDismissed(true);
        
        // NUEVO: Marcar como cerrado temporalmente para evitar loop
        // Solo permitir que aparezca de nuevo después de un tiempo
        setTimeout(() => {
            setHasUserDismissed(false);
        }, 30000); // 30 segundos antes de permitir que aparezca de nuevo
    };

    // Debug: Log del estado actual
    useEffect(() => {
        console.log('🔍 Estado actual InstallPWA:', {
            deferredPrompt: !!deferredPrompt,
            showInstallModal,
            isStandalone,
            isIOS,
            isPWAInstallable,
            hasUserDismissed,
            shouldShow: !isStandalone && !hasUserDismissed && (deferredPrompt || isIOS || showInstallModal || (isPWAInstallable && !isStandalone))
        });
    }, [deferredPrompt, showInstallModal, isStandalone, isIOS, isPWAInstallable, hasUserDismissed]);

    // No mostrar nada si ya está instalada
    if (isStandalone) {
        console.log('🚫 No mostrar modal - ya instalada');
        return null;
    }

    // CORREGIDO: Lógica simplificada para evitar loops
    // Solo mostrar si:
    // 1. No está instalada
    // 2. No fue cerrada recientemente
    // 3. Y tiene deferredPrompt O es iOS O es Edge Android O el modal está activo
    const shouldShowModal = !isStandalone && 
                           !hasUserDismissed && 
                           (deferredPrompt || isIOS || isEdgeAndroid || showInstallModal);

    if (!shouldShowModal) {
        console.log('🚫 No mostrar modal - condiciones no cumplidas');
        return null;
    }

    console.log('✅ Mostrando modal de instalación');

    return (
        <>
            {/* Debug Panel - Solo en desarrollo */}
            {import.meta.env.DEV && (
                <div className="fixed top-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg text-xs max-w-xs z-50">
                    <h4 className="font-bold mb-2">🔧 InstallPWA Debug</h4>
                    <div className="space-y-1">
                        <div>📱 iOS: {isIOS ? 'Sí' : 'No'}</div>
                        <div>🤖 Android: {isAndroid ? 'Sí' : 'No'}</div>
                        <div>🌐 Chrome: {isChrome ? 'Sí' : 'No'}</div>
                        <div>🔗 Edge: {isEdge ? 'Sí' : 'No'}</div>
                        <div>🔗 Edge Android: {isEdgeAndroid ? 'Sí' : 'No'}</div>
                        <div>📦 Standalone: {isStandalone ? 'Sí' : 'No'}</div>
                        <div>✅ Installable: {isPWAInstallable ? 'Sí' : 'No'}</div>
                        <div>🎯 DeferredPrompt: {deferredPrompt ? 'Sí' : 'No'}</div>
                        <div>📋 ShowModal: {showInstallModal ? 'Sí' : 'No'}</div>
                        <div>🚀 ShouldShow: {shouldShowModal ? 'Sí' : 'No'}</div>
                    </div>
                    <button 
                        onClick={() => setShowInstallModal(true)}
                        className="mt-2 bg-blue-600 px-2 py-1 rounded text-xs"
                    >
                        Forzar Modal
                    </button>
                    <button 
                        onClick={() => {
                            // Simular beforeinstallprompt en desarrollo
                            const mockEvent = {
                                preventDefault: () => {},
                                prompt: () => {
                                    console.log('Mock prompt llamado');
                                    return Promise.resolve({ outcome: 'accepted' });
                                },
                                userChoice: Promise.resolve({ outcome: 'accepted' })
                            };
                            setDeferredPrompt(mockEvent);
                            setIsPWAInstallable(true);
                            setShowInstallModal(true);
                        }}
                        className="mt-2 bg-green-600 px-2 py-1 rounded text-xs"
                    >
                        Simular Install
                    </button>
                </div>
            )}

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
                        ) : isEdgeAndroid ? (
                            <div className="space-y-4">
                                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                                    <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                                        📱 Instrucciones para Edge Android:
                                    </h4>
                                    <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                                        Edge en Android tiene limitaciones con la instalación automática. Sigue estos pasos:
                                    </p>
                                    <ol className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                                        <li>1. Toca el menú (⋮) en la esquina superior derecha</li>
                                        <li>2. Selecciona <strong>"Aplicaciones"</strong></li>
                                        <li>3. Busca <strong>"Instalar aplicación"</strong> o <strong>"Agregar a pantalla de inicio"</strong></li>
                                        <li>4. Confirma la instalación</li>
                                    </ol>
                                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                                        💡 Alternativa: Usa Chrome para una instalación más sencilla
                                    </p>
                                </div>
                                
                                <button
                                    onClick={handleDismiss}
                                    className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                                >
                                    Entendido
                                </button>
                            </div>
                        ) : deferredPrompt ? (
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
                        ) : (isChrome || isEdge) ? (
                            // Para Chrome/Edge que deberían tener beforeinstallprompt pero no lo tienen
                            <div className="space-y-4">
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                                        📱 Instalación disponible:
                                    </h4>
                                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                                        Esta app se puede instalar en tu dispositivo. Busca la opción de instalación en el menú del navegador.
                                    </p>
                                    <ol className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
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
                            // Fallback para otros navegadores
                            <div className="space-y-4">
                                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                    <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                                        📱 Instrucciones de instalación:
                                    </h4>
                                    <ol className="text-sm text-green-700 dark:text-green-300 space-y-1">
                                        <li>1. Busca la opción de instalación en el menú del navegador</li>
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
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default InstallPWA;
