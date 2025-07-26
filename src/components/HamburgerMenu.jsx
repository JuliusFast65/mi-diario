import React, { useState, useRef, useEffect } from 'react';

export default function HamburgerMenu({ 
    onAdvancedIntrospectiveAssistant,
    onTherapistChat, 
    onWritingAssistant, 
    onBehaviorAnalysis, 
    onTwoFactorAuth, 
    onExport, 
    onImport,
    onInspirationalMessage,
    onUserProfile,
    onFeedback,
    onSubscriptionModal,
    subscription,
    currentTheme = 'dark'
}) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    // Cerrar menú al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMenuToggle = () => {
        setIsOpen(!isOpen);
    };

    const handleMenuItemClick = (action) => {
        setIsOpen(false);
        action();
    };

    const getPlanColor = (plan) => {
        switch (plan) {
            case 'free': return 'text-gray-400';
            case 'premium': return 'text-yellow-400';
            default: return 'text-gray-400';
        }
    };

    const getPlanIcon = (plan) => {
        switch (plan) {
            case 'free': return '⭐';
            case 'premium': return '💎';
            default: return '⭐';
        }
    };

    return (
        <div className="relative" ref={menuRef}>
            {/* Botón hamburguesa */}
            <button
                onClick={handleMenuToggle}
                className={`${currentTheme === 'dark' ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'} transition-colors p-2 rounded-lg`}
                title="Menú de opciones"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* Menú desplegable */}
            {isOpen && (
                <div className={`absolute right-0 mt-2 w-64 rounded-lg shadow-xl border z-50 ${
                    currentTheme === 'dark' 
                        ? 'bg-gray-800 border-gray-700' 
                        : 'bg-white border-gray-200'
                }`}>
                    {/* Header del menú */}
                    <div className={`p-4 border-b ${currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-between">
                            <h3 className={`font-semibold ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Opciones</h3>
                            <button
                                onClick={handleMenuToggle}
                                className={`${currentTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        {/* Estado de suscripción */}
                        <div className="mt-2 flex items-center gap-2">
                            <span className={`text-sm ${getPlanColor(subscription.plan)}`}>
                                {getPlanIcon(subscription.plan)} {subscription.plan === 'free' ? 'Gratuito' : 'Premium'}
                            </span>
                            <button
                                onClick={() => handleMenuItemClick(onSubscriptionModal)}
                                className="text-xs text-blue-400 hover:text-blue-300 underline"
                            >
                                Cambiar plan
                            </button>
                        </div>
                    </div>

                    {/* Sección Premium */}
                    <div className="p-2">
                        <h4 className={`text-xs font-medium uppercase tracking-wider px-3 py-2 ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            Características Premium
                        </h4>
                        
                        <button
                            onClick={() => handleMenuItemClick(onAdvancedIntrospectiveAssistant)}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                                currentTheme === 'dark' 
                                    ? 'text-gray-300 hover:bg-gray-700' 
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <span className="text-gradient-to-r from-blue-500 to-purple-600">🧠</span>
                            <div>
                                <div className="font-medium">Asistente Introspectivo Avanzado</div>
                                <div className="text-xs text-gray-500">Nuevo - Terapeuta + Escritura</div>
                            </div>
                        </button>

                        <button
                            onClick={() => handleMenuItemClick(onTherapistChat)}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                                currentTheme === 'dark' 
                                    ? 'text-gray-300 hover:bg-gray-700' 
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <span className="text-green-400">💬</span>
                            <div>
                                <div className="font-medium">Chat con Terapeuta</div>
                                <div className="text-xs text-gray-500">Versión original</div>
                            </div>
                        </button>

                        <button
                            onClick={() => handleMenuItemClick(onWritingAssistant)}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                                currentTheme === 'dark' 
                                    ? 'text-gray-300 hover:bg-gray-700' 
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <span className="text-purple-400">✍️</span>
                            <div>
                                <div className="font-medium">Asistente de Escritura</div>
                                <div className="text-xs text-gray-500">Versión original</div>
                            </div>
                        </button>

                        <button
                            onClick={() => handleMenuItemClick(onBehaviorAnalysis)}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                                currentTheme === 'dark' 
                                    ? 'text-gray-300 hover:bg-gray-700' 
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <span className="text-indigo-400">📊</span>
                            <div>
                                <div className="font-medium">Análisis de Comportamiento</div>
                            </div>
                        </button>

                        <button
                            onClick={() => handleMenuItemClick(onTwoFactorAuth)}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                                currentTheme === 'dark' 
                                    ? 'text-gray-300 hover:bg-gray-700' 
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <span className="text-red-400">🔒</span>
                            <div>
                                <div className="font-medium">Autenticación 2FA</div>
                            </div>
                        </button>
                    </div>

                    {/* Sección Herramientas */}
                    <div className={`p-2 border-t ${currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                        <h4 className={`text-xs font-medium uppercase tracking-wider px-3 py-2 ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            Herramientas
                        </h4>
                        
                        <button
                            onClick={() => handleMenuItemClick(onExport)}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                                currentTheme === 'dark' 
                                    ? 'text-gray-300 hover:bg-gray-700' 
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <span className="text-blue-400">📤</span>
                            <div>
                                <div className="font-medium">Exportar Entradas</div>
                            </div>
                        </button>

                        <button
                            onClick={() => handleMenuItemClick(onImport)}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                                currentTheme === 'dark' 
                                    ? 'text-gray-300 hover:bg-gray-700' 
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <span className="text-green-400">📥</span>
                            <div>
                                <div className="font-medium">Importar Entradas</div>
                            </div>
                        </button>

                        <button
                            onClick={() => handleMenuItemClick(onInspirationalMessage)}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                                currentTheme === 'dark' 
                                    ? 'text-gray-300 hover:bg-gray-700' 
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <span className="text-yellow-400">✨</span>
                            <div>
                                <div className="font-medium">Mensaje Inspirador</div>
                            </div>
                        </button>

                        <button
                            onClick={() => handleMenuItemClick(onUserProfile)}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                                currentTheme === 'dark' 
                                    ? 'text-gray-300 hover:bg-gray-700' 
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <span className="text-blue-400">👤</span>
                            <div>
                                <div className="font-medium">Mi Perfil</div>
                            </div>
                        </button>
                    </div>

                    {/* Sección Ayuda */}
                    <div className={`p-2 border-t ${currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                        <h4 className={`text-xs font-medium uppercase tracking-wider px-3 py-2 ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            Ayuda
                        </h4>
                        
                        <a
                            href="mailto:tu-email-aqui@example.com?subject=Feedback sobre la App de Diario"
                            className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                                currentTheme === 'dark' 
                                    ? 'text-gray-300 hover:bg-gray-700' 
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <span className="text-gray-400">📧</span>
                            <div>
                                <div className="font-medium">Enviar Feedback</div>
                            </div>
                        </a>

                        <button
                            onClick={() => {
                                setIsOpen(false);
                                window.dispatchEvent(new CustomEvent('openOnboarding'));
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                                currentTheme === 'dark' 
                                    ? 'text-gray-300 hover:bg-gray-700' 
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <span className="text-gray-400">❓</span>
                            <div>
                                <div className="font-medium">Tutorial</div>
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
} 