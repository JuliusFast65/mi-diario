import { useState, useRef, useEffect } from 'react';

export default function HamburgerMenu({ 
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
    subscription
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
                className="text-gray-300 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700"
                title="Menú de opciones"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* Menú desplegable */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50">
                    {/* Header del menú */}
                    <div className="p-4 border-b border-gray-700">
                        <div className="flex items-center justify-between">
                            <h3 className="text-white font-semibold">Opciones</h3>
                            <button
                                onClick={handleMenuToggle}
                                className="text-gray-400 hover:text-white"
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
                        <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider px-3 py-2">
                            Características Premium
                        </h4>
                        
                        <button
                            onClick={() => handleMenuItemClick(onTherapistChat)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <span className="text-green-400">💬</span>
                            <div>
                                <div className="font-medium">Chat con Terapeuta</div>
                            </div>
                        </button>

                        <button
                            onClick={() => handleMenuItemClick(onWritingAssistant)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <span className="text-purple-400">✍️</span>
                            <div>
                                <div className="font-medium">Asistente de Escritura</div>
                            </div>
                        </button>

                        <button
                            onClick={() => handleMenuItemClick(onBehaviorAnalysis)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <span className="text-indigo-400">📊</span>
                            <div>
                                <div className="font-medium">Análisis de Comportamiento</div>
                            </div>
                        </button>

                        <button
                            onClick={() => handleMenuItemClick(onTwoFactorAuth)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <span className="text-red-400">🔒</span>
                            <div>
                                <div className="font-medium">Autenticación 2FA</div>
                            </div>
                        </button>
                    </div>

                    {/* Sección Herramientas */}
                    <div className="p-2 border-t border-gray-700">
                        <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider px-3 py-2">
                            Herramientas
                        </h4>
                        
                        <button
                            onClick={() => handleMenuItemClick(onExport)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <span className="text-blue-400">📤</span>
                            <div>
                                <div className="font-medium">Exportar Entradas</div>
                            </div>
                        </button>

                        <button
                            onClick={() => handleMenuItemClick(onImport)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <span className="text-green-400">📥</span>
                            <div>
                                <div className="font-medium">Importar Entradas</div>
                            </div>
                        </button>

                        <button
                            onClick={() => handleMenuItemClick(onInspirationalMessage)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <span className="text-yellow-400">✨</span>
                            <div>
                                <div className="font-medium">Mensaje Inspirador</div>
                            </div>
                        </button>

                        <button
                            onClick={() => handleMenuItemClick(onUserProfile)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <span className="text-blue-400">👤</span>
                            <div>
                                <div className="font-medium">Mi Perfil</div>
                            </div>
                        </button>
                    </div>

                    {/* Sección Ayuda */}
                    <div className="p-2 border-t border-gray-700">
                        <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider px-3 py-2">
                            Ayuda
                        </h4>
                        
                        <a
                            href="mailto:tu-email-aqui@example.com?subject=Feedback sobre la App de Diario"
                            className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
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
                            className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
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