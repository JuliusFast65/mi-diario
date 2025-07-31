import React, { useState, useEffect, useRef } from 'react';

export default function AppLock({ 
    isLocked, 
    isPinSet, 
    onUnlock, 
    onSetupPin, 
    pinLength = 4,
    currentTheme = 'light',
    children 
}) {
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [isSetupMode, setIsSetupMode] = useState(!isPinSet);
    const [error, setError] = useState('');
    const [showPin, setShowPin] = useState(false);
    const [timeUntilLock, setTimeUntilLock] = useState(null);
    
    const pinInputRef = useRef(null);
    const confirmPinRef = useRef('');

    // Auto-focus en el input de PIN
    useEffect(() => {
        if (isLocked && pinInputRef.current) {
            setTimeout(() => {
                pinInputRef.current?.focus();
            }, 100);
        }
    }, [isLocked]);

    // Manejar entrada de PIN
    const handlePinChange = (value) => {
        setError('');
        
        if (isSetupMode) {
            if (value.length <= pinLength) {
                setPin(value);
                
                // Si completó el PIN, pasar a confirmación
                if (value.length === pinLength) {
                    setTimeout(() => {
                        document.getElementById('confirm-pin')?.focus();
                    }, 300);
                }
            }
        } else {
            if (value.length <= pinLength) {
                setPin(value);
                
                // Si completó el PIN, intentar desbloquear
                if (value.length === pinLength) {
                    handleUnlock(value);
                }
            }
        }
    };

    // Manejar confirmación de PIN
    const handleConfirmPinChange = (value) => {
        setError('');
        
        if (value.length <= pinLength) {
            setConfirmPin(value);
            confirmPinRef.current = value; // Actualizar la referencia
            
            // Si completó la confirmación, verificar
            if (value.length === pinLength) {
                // Pequeño delay para asegurar que el estado se actualice
                setTimeout(() => {
                    handleSetupPin();
                }, 100);
            }
        }
    };

    // Intentar desbloquear
    const handleUnlock = (pinToTry) => {
        const success = onUnlock(pinToTry);
        
        if (success) {
            setPin('');
            setError('');
        } else {
            setError('PIN incorrecto');
            setPin('');
            setTimeout(() => {
                pinInputRef.current?.focus();
            }, 100);
        }
    };

    // Configurar PIN
    const handleSetupPin = () => {
        const currentConfirmPin = confirmPinRef.current;
        console.log('🔐 Verificando PINs:', { 
            pin, 
            confirmPin, 
            currentConfirmPin,
            pinLength: pin.length, 
            confirmLength: confirmPin.length 
        });
        
        if (pin !== currentConfirmPin) {
            setError('Los PINs no coinciden');
            setConfirmPin('');
            confirmPinRef.current = '';
            setTimeout(() => {
                document.getElementById('confirm-pin')?.focus();
            }, 100);
            return;
        }

        const success = onSetupPin(pin);
        
        if (success) {
            setIsSetupMode(false);
            setPin('');
            setConfirmPin('');
            confirmPinRef.current = '';
            setError('');
        } else {
            setError('Error al configurar PIN');
        }
    };

    // Si no está bloqueado y no está en modo setup, mostrar contenido normal
    if (!isLocked && !isSetupMode) {
        return children;
    }

    return (
        <div className={`fixed inset-0 ${currentTheme === 'dark' ? 'bg-black bg-opacity-70' : 'bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900'} flex items-center justify-center z-50`}>
            <div className={`${currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-8`}>
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">🔒</span>
                    </div>
                    
                    {isSetupMode ? (
                        <>
                            <h2 className={`text-2xl font-bold ${currentTheme === 'dark' ? 'text-white' : 'text-gray-800'} mb-2`}>
                                Configurar Seguridad
                            </h2>
                            <p className={`${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                Crea un PIN para proteger tu diario
                            </p>
                        </>
                    ) : (
                        <>
                            <h2 className={`text-2xl font-bold ${currentTheme === 'dark' ? 'text-white' : 'text-gray-800'} mb-2`}>
                                Diario Bloqueado
                            </h2>
                            <p className={`${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                Introduce tu PIN para continuar
                            </p>
                        </>
                    )}
                </div>

                {/* PIN Input */}
                <div className="space-y-6">
                    {isSetupMode ? (
                        <>
                            {/* PIN inicial */}
                            <div>
                                <label className={`block text-sm font-medium ${currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                                    Crea tu PIN de {pinLength} dígitos
                                </label>
                                <div className="relative">
                                    <input
                                        ref={pinInputRef}
                                        type={showPin ? "text" : "password"}
                                        value={pin}
                                        onChange={(e) => handlePinChange(e.target.value)}
                                        className={`w-full px-4 py-3 text-center text-2xl font-mono border-2 ${currentTheme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-800'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                        placeholder="0000"
                                        maxLength={pinLength}
                                        autoComplete="off"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPin(!showPin)}
                                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${currentTheme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        {showPin ? "🙈" : "👁️"}
                                    </button>
                                </div>
                            </div>

                            {/* Confirmación de PIN */}
                            {pin.length === pinLength && (
                                <div>
                                    <label className={`block text-sm font-medium ${currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                                        Confirma tu PIN
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="confirm-pin"
                                            type={showPin ? "text" : "password"}
                                            value={confirmPin}
                                            onChange={(e) => handleConfirmPinChange(e.target.value)}
                                            className={`w-full px-4 py-3 text-center text-2xl font-mono border-2 ${currentTheme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-800'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                            placeholder="0000"
                                            maxLength={pinLength}
                                            autoComplete="off"
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div>
                            <label className={`block text-sm font-medium ${currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                                PIN de {pinLength} dígitos
                            </label>
                            <div className="relative">
                                <input
                                    ref={pinInputRef}
                                    type={showPin ? "text" : "password"}
                                    value={pin}
                                    onChange={(e) => handlePinChange(e.target.value)}
                                    className={`w-full px-4 py-3 text-center text-2xl font-mono border-2 ${currentTheme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-800'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                    placeholder="0000"
                                    maxLength={pinLength}
                                    autoComplete="off"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPin(!showPin)}
                                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${currentTheme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    {showPin ? "🙈" : "👁️"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className={`${currentTheme === 'dark' ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-200'} border rounded-lg p-3`}>
                            <p className={`${currentTheme === 'dark' ? 'text-red-300' : 'text-red-600'} text-sm text-center`}>{error}</p>
                        </div>
                    )}

                    {/* Información adicional */}
                    {isSetupMode && (
                        <div className={`${currentTheme === 'dark' ? 'bg-blue-900 border-blue-700' : 'bg-blue-50 border-blue-200'} border rounded-lg p-4`}>
                            <h4 className={`font-medium ${currentTheme === 'dark' ? 'text-blue-300' : 'text-blue-800'} mb-2`}>¿Por qué un PIN?</h4>
                            <ul className={`text-sm ${currentTheme === 'dark' ? 'text-blue-200' : 'text-blue-700'} space-y-1`}>
                                <li>• Protege tu diario si dejas el dispositivo abierto</li>
                                <li>• Se bloquea automáticamente después de 10 minutos</li>
                                <li>• Solo tú puedes acceder a tus pensamientos</li>
                            </ul>
                        </div>
                    )}

                    {/* Botones adicionales */}
                    {!isSetupMode && (
                        <div className="text-center">
                            <button
                                onClick={() => setIsSetupMode(true)}
                                className={`${currentTheme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} text-sm`}
                            >
                                ¿Olvidaste tu PIN?
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 