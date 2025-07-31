import React, { useState } from 'react';

export default function SecuritySettings({ 
    isOpen, 
    onClose, 
    securityHook,
    onLockApp,
    currentTheme = 'light'
}) {
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmNewPin, setConfirmNewPin] = useState('');
    const [showPins, setShowPins] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('settings');

    const {
        isPinSet,
        setupPin,
        changePin,
        disablePin,
        lockApp,
        getTimeUntilLock,
        pinLength,
        config,
        updateConfig
    } = securityHook;

    // Opciones de tiempo de auto-bloqueo
    const lockDelayOptions = [
        { value: 5 * 60 * 1000, label: '5 minutos' },
        { value: 10 * 60 * 1000, label: '10 minutos' },
        { value: 15 * 60 * 1000, label: '15 minutos' },
        { value: 30 * 60 * 1000, label: '30 minutos' },
        { value: 0, label: 'Deshabilitado' }
    ];

    // Manejar cambio de PIN
    const handleChangePin = () => {
        setError('');
        setSuccess('');

        if (!currentPin || !newPin || !confirmNewPin) {
            setError('Todos los campos son requeridos');
            return;
        }

        if (newPin !== confirmNewPin) {
            setError('Los nuevos PINs no coinciden');
            return;
        }

        if (newPin.length !== pinLength) {
            setError(`El PIN debe tener ${pinLength} dígitos`);
            return;
        }

        const success = changePin(currentPin, newPin);
        
        if (success) {
            setSuccess('PIN cambiado exitosamente');
            setCurrentPin('');
            setNewPin('');
            setConfirmNewPin('');
        } else {
            setError('PIN actual incorrecto');
        }
    };

    // Manejar deshabilitar PIN
    const handleDisablePin = () => {
        setError('');
        setSuccess('');

        if (!currentPin) {
            setError('Introduce tu PIN actual');
            return;
        }

        const success = disablePin(currentPin);
        
        if (success) {
            setSuccess('PIN deshabilitado exitosamente');
            setCurrentPin('');
            onClose();
        } else {
            setError('PIN incorrecto');
        }
    };

    // Manejar bloquear app
    const handleLockApp = () => {
        lockApp();
        onClose();
    };

    // Obtener tiempo restante formateado
    const getFormattedTimeUntilLock = () => {
        const seconds = getTimeUntilLock();
        if (seconds === null) return 'No configurado';
        if (seconds === 0) return 'Bloqueado';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        if (minutes > 0) {
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
        return `${remainingSeconds}s`;
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 ${currentTheme === 'dark' ? 'bg-black bg-opacity-70' : 'bg-black bg-opacity-50'} flex items-center justify-center z-50`}>
            <div className={`${currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto`}>
                {/* Header */}
                <div className={`flex items-center justify-between p-4 border-b ${currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${currentTheme === 'dark' ? 'bg-blue-900' : 'bg-blue-100'} rounded-full flex items-center justify-center`}>
                            <span className={`${currentTheme === 'dark' ? 'text-blue-300' : 'text-blue-600'} font-semibold`}>🔒</span>
                        </div>
                        <div>
                            <h2 className={`font-semibold ${currentTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Configuración de Seguridad</h2>
                            <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Protege tu diario personal</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className={`${currentTheme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className={`flex border-b ${currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex-1 px-4 py-2 text-sm font-medium ${
                            activeTab === 'settings' 
                                ? `${currentTheme === 'dark' ? 'text-blue-400 border-blue-400' : 'text-blue-600 border-blue-600'} border-b-2` 
                                : `${currentTheme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`
                        }`}
                    >
                        Configuración
                    </button>
                    <button
                        onClick={() => setActiveTab('pin')}
                        className={`flex-1 px-4 py-2 text-sm font-medium ${
                            activeTab === 'pin' 
                                ? `${currentTheme === 'dark' ? 'text-blue-400 border-blue-400' : 'text-blue-600 border-blue-600'} border-b-2` 
                                : `${currentTheme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`
                        }`}
                    >
                        PIN
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    {activeTab === 'settings' ? (
                        <div className="space-y-6">
                            {/* Estado actual */}
                            <div className={`${currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                                <h3 className={`font-medium ${currentTheme === 'dark' ? 'text-white' : 'text-gray-800'} mb-2`}>Estado Actual</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className={`${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>PIN configurado:</span>
                                        <span className={isPinSet ? 'text-green-600' : 'text-red-600'}>
                                            {isPinSet ? '✅ Sí' : '❌ No'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className={`${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Auto-bloqueo:</span>
                                        <span className={`${currentTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                                            {config.autoLockDelay === 0 ? 'Deshabilitado' : `${config.autoLockDelay / 60000} min`}
                                        </span>
                                    </div>
                                    {isPinSet && (
                                        <div className="flex justify-between">
                                            <span className={`${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Bloqueo en:</span>
                                            <span className={`${currentTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                                                {getFormattedTimeUntilLock()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Configuración de auto-bloqueo */}
                            <div>
                                <h3 className={`font-medium ${currentTheme === 'dark' ? 'text-white' : 'text-gray-800'} mb-3`}>Auto-bloqueo</h3>
                                <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
                                    El diario se bloqueará automáticamente después de este tiempo de inactividad.
                                </p>
                                <select 
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${currentTheme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-800'}`}
                                    value={config.autoLockDelay}
                                    onChange={(e) => {
                                        const newDelay = parseInt(e.target.value);
                                        updateConfig({ autoLockDelay: newDelay });
                                    }}
                                >
                                    {lockDelayOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Acciones rápidas */}
                            <div>
                                <h3 className={`font-medium ${currentTheme === 'dark' ? 'text-white' : 'text-gray-800'} mb-3`}>Acciones Rápidas</h3>
                                <div className="space-y-2">
                                    <button
                                        onClick={handleLockApp}
                                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        🔒 Bloquear Ahora
                                    </button>
                                </div>
                            </div>

                            {/* Información de seguridad */}
                            <div className={`${currentTheme === 'dark' ? 'bg-blue-900 border-blue-700' : 'bg-blue-50 border-blue-200'} border rounded-lg p-4`}>
                                <h4 className={`font-medium ${currentTheme === 'dark' ? 'text-blue-300' : 'text-blue-800'} mb-2`}>¿Cómo funciona?</h4>
                                <ul className={`text-sm ${currentTheme === 'dark' ? 'text-blue-200' : 'text-blue-700'} space-y-1`}>
                                    <li>• Se bloquea automáticamente por inactividad</li>
                                    <li>• Se bloquea al cambiar de pestaña/aplicación</li>
                                    <li>• Protege tu contenido si dejas el dispositivo abierto</li>
                                    <li>• Solo tú puedes acceder con tu PIN</li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Cambiar PIN */}
                            {isPinSet && (
                                <div>
                                    <h3 className="font-medium text-gray-800 mb-3">Cambiar PIN</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                PIN actual
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPins ? "text" : "password"}
                                                    value={currentPin}
                                                    onChange={(e) => setCurrentPin(e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="0000"
                                                    maxLength={pinLength}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPins(!showPins)}
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                                                >
                                                    {showPins ? "🙈" : "👁️"}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nuevo PIN
                                            </label>
                                            <input
                                                type={showPins ? "text" : "password"}
                                                value={newPin}
                                                onChange={(e) => setNewPin(e.target.value)}
                                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="0000"
                                                maxLength={pinLength}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Confirmar nuevo PIN
                                            </label>
                                            <input
                                                type={showPins ? "text" : "password"}
                                                value={confirmNewPin}
                                                onChange={(e) => setConfirmNewPin(e.target.value)}
                                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="0000"
                                                maxLength={pinLength}
                                            />
                                        </div>
                                        <button
                                            onClick={handleChangePin}
                                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        >
                                            Cambiar PIN
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Deshabilitar PIN */}
                            {isPinSet && (
                                <div>
                                    <h3 className="font-medium text-gray-800 mb-3">Deshabilitar PIN</h3>
                                    <p className="text-sm text-gray-600 mb-3">
                                        Esto eliminará la protección de PIN de tu diario.
                                    </p>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                PIN actual
                                            </label>
                                            <input
                                                type={showPins ? "text" : "password"}
                                                value={currentPin}
                                                onChange={(e) => setCurrentPin(e.target.value)}
                                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="0000"
                                                maxLength={pinLength}
                                            />
                                        </div>
                                        <button
                                            onClick={handleDisablePin}
                                            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                        >
                                            Deshabilitar PIN
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Configurar PIN por primera vez */}
                            {!isPinSet && (
                                <div>
                                    <h3 className="font-medium text-gray-800 mb-3">Configurar PIN</h3>
                                    <p className="text-sm text-gray-600 mb-3">
                                        Crea un PIN para proteger tu diario personal.
                                    </p>
                                    <button
                                        onClick={() => {
                                            // Esto activaría el setup de PIN
                                            onClose();
                                            // Aquí se mostraría el AppLock en modo setup
                                        }}
                                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Configurar PIN
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Mensajes de error/éxito */}
                    {error && (
                        <div className={`${currentTheme === 'dark' ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-200'} border rounded-lg p-3`}>
                            <p className={`${currentTheme === 'dark' ? 'text-red-300' : 'text-red-600'} text-sm`}>{error}</p>
                        </div>
                    )}
                    {success && (
                        <div className={`${currentTheme === 'dark' ? 'bg-green-900 border-green-700' : 'bg-green-50 border-green-200'} border rounded-lg p-3`}>
                            <p className={`${currentTheme === 'dark' ? 'text-green-300' : 'text-green-600'} text-sm`}>{success}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 