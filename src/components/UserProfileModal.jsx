import React, { useState, useEffect } from 'react';

// Estilos CSS para ocultar scrollbar y temas
const scrollbarHideStyles = `
    .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }
    
    /* Estilos para options en modo claro */
    .light select option {
        background-color: white;
        color: #374151;
    }
    
    /* Estilos para options en modo oscuro */
    .dark select option {
        background-color: #374151;
        color: #f9fafb;
    }
`;

const UserProfileModal = ({ isOpen, onClose, user, userPrefs, onUpdateUserPrefs, subscription, onUpgradeClick, currentTheme = 'dark' }) => {
    const [activeTab, setActiveTab] = useState('personal');
    const [formData, setFormData] = useState({
        // Información Personal
        fullName: '',
        birthDate: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        gender: '',
        
        // Configuración Regional
        language: 'es',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        
        // Preferencias Básicas
        defaultFont: 'patrick-hand',
        defaultFontSize: 'text-2xl',
        theme: 'dark',
        
        // Notificaciones Básicas
        dailyReminder: false,
        reminderTime: '09:00',
        
        // Premium - Personalización de IA
        therapistStyle: 'empatico',
        writingAssistantStyle: 'creativo',
        motivationalTone: 'espiritual',
        
        // Premium - Seguridad
        twoFactorEnabled: false,
        autoBackup: false,
        syncEnabled: false,
        
        // Premium - Metas
        dailyWritingGoal: 100,
        weeklyWritingGoal: 500,
        dailyActivityGoal: 3,
        
        // Premium - Notificaciones Avanzadas
        activityReminders: false,
        weeklySummaries: false
    });

    useEffect(() => {
        if (isOpen && user) {
            // Cargar datos del usuario
            setFormData(prev => ({
                ...prev,
                fullName: user.displayName || '',
                // Cargar preferencias existentes
                ...userPrefs
            }));
        }
    }, [isOpen, user, userPrefs]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        try {
            await onUpdateUserPrefs(formData);
            onClose();
        } catch (error) {
            console.error('Error saving profile:', error);
        }
    };

    const isPremium = subscription?.plan === 'premium';

    const tabBaseStyle = "px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-200";
    const tabActiveStyle = "bg-indigo-600 text-white";
    const tabInactiveStyle = currentTheme === 'dark' 
        ? "bg-gray-700 text-gray-400 hover:bg-gray-600" 
        : "bg-gray-200 text-gray-700 hover:bg-gray-300";

    if (!isOpen) return null;

    return (
        <>
            <style>{scrollbarHideStyles}</style>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-xl`}>
                {/* Header */}
                <div className={`flex items-center justify-between p-6 border-b ${currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-4">
                        <img 
                            src={user?.photoURL || '/default-avatar.png'} 
                            alt="Profile" 
                            className="w-12 h-12 rounded-full"
                        />
                        <div>
                            <h2 className={`text-xl font-bold ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Mi Perfil</h2>
                            <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className={`${currentTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className={`flex border-b ${currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} overflow-x-auto scrollbar-hide`}>
                    <div className="flex min-w-max">
                        <button
                            onClick={() => setActiveTab('personal')}
                            className={`${tabBaseStyle} ${activeTab === 'personal' ? tabActiveStyle : tabInactiveStyle} whitespace-nowrap`}
                        >
                            Personal
                        </button>
                        <button
                            onClick={() => setActiveTab('regional')}
                            className={`${tabBaseStyle} ${activeTab === 'regional' ? tabActiveStyle : tabInactiveStyle} whitespace-nowrap`}
                        >
                            Regional
                        </button>
                        <button
                            onClick={() => setActiveTab('preferences')}
                            className={`${tabBaseStyle} ${activeTab === 'preferences' ? tabActiveStyle : tabInactiveStyle} whitespace-nowrap`}
                        >
                            Preferencias
                        </button>
                        <button
                            onClick={() => setActiveTab('notifications')}
                            className={`${tabBaseStyle} ${activeTab === 'notifications' ? tabActiveStyle : tabInactiveStyle} whitespace-nowrap`}
                        >
                            Notificaciones
                        </button>
                        {isPremium && (
                            <>
                                <button
                                    onClick={() => setActiveTab('ai')}
                                    className={`${tabBaseStyle} ${activeTab === 'ai' ? tabActiveStyle : tabInactiveStyle} whitespace-nowrap`}
                                >
                                    IA Personalizada
                                </button>
                                <button
                                    onClick={() => setActiveTab('security')}
                                    className={`${tabBaseStyle} ${activeTab === 'security' ? tabActiveStyle : tabInactiveStyle} whitespace-nowrap`}
                                >
                                    Seguridad
                                </button>
                                <button
                                    onClick={() => setActiveTab('goals')}
                                    className={`${tabBaseStyle} ${activeTab === 'goals' ? tabActiveStyle : tabInactiveStyle} whitespace-nowrap`}
                                >
                                    Metas
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto h-[50vh]">
                    {/* Información Personal */}
                    {activeTab === 'personal' && (
                        <div className="space-y-4">
                            <h3 className={`text-lg font-semibold mb-4 ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Información Personal</h3>
                            
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Nombre Completo</label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-md focus:ring-2 focus:ring-indigo-500 ${
                                        currentTheme === 'dark' 
                                            ? 'bg-gray-700 border-gray-600 text-white' 
                                            : 'bg-white border-gray-300 text-gray-900'
                                    } border`}
                                />
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Fecha de Nacimiento (Opcional)</label>
                                <input
                                    type="date"
                                    value={formData.birthDate}
                                    onChange={(e) => handleInputChange('birthDate', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-md focus:ring-2 focus:ring-indigo-500 ${
                                        currentTheme === 'dark' 
                                            ? 'bg-gray-700 border-gray-600 text-white' 
                                            : 'bg-white border-gray-300 text-gray-900'
                                    } border`}
                                />
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Género/Identidad (Opcional)</label>
                                <select
                                    value={formData.gender}
                                    onChange={(e) => handleInputChange('gender', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-md focus:ring-2 focus:ring-indigo-500 ${
                                        currentTheme === 'dark' 
                                            ? 'bg-gray-700 border-gray-600 text-white' 
                                            : 'bg-white border-gray-300 text-gray-900'
                                    } border`}
                                >
                                    <option value="">No especificar</option>
                                    <option value="masculino">Masculino</option>
                                    <option value="femenino">Femenino</option>
                                    <option value="no-binario">No binario</option>
                                    <option value="otro">Otro</option>
                                </select>
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Zona Horaria</label>
                                <select
                                    value={formData.timezone}
                                    onChange={(e) => handleInputChange('timezone', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-md focus:ring-2 focus:ring-indigo-500 ${
                                        currentTheme === 'dark' 
                                            ? 'bg-gray-700 border-gray-600 text-white' 
                                            : 'bg-white border-gray-300 text-gray-900'
                                    } border`}
                                >
                                    <option value="America/Mexico_City">México (GMT-6)</option>
                                    <option value="America/New_York">Nueva York (GMT-5)</option>
                                    <option value="America/Los_Angeles">Los Ángeles (GMT-8)</option>
                                    <option value="Europe/Madrid">Madrid (GMT+1)</option>
                                    <option value="America/Buenos_Aires">Buenos Aires (GMT-3)</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Configuración Regional */}
                    {activeTab === 'regional' && (
                        <div className="space-y-4">
                            <h3 className={`text-lg font-semibold mb-4 ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Configuración Regional</h3>
                            
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Idioma</label>
                                <select
                                    value={formData.language}
                                    onChange={(e) => handleInputChange('language', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-md focus:ring-2 focus:ring-indigo-500 ${
                                        currentTheme === 'dark' 
                                            ? 'bg-gray-700 border-gray-600 text-white' 
                                            : 'bg-white border-gray-300 text-gray-900'
                                    } border`}
                                >
                                    <option value="es">Español</option>
                                    <option value="en">English</option>
                                    <option value="pt">Português</option>
                                </select>
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Formato de Fecha</label>
                                <select
                                    value={formData.dateFormat}
                                    onChange={(e) => handleInputChange('dateFormat', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-md focus:ring-2 focus:ring-indigo-500 ${
                                        currentTheme === 'dark' 
                                            ? 'bg-gray-700 border-gray-600 text-white' 
                                            : 'bg-white border-gray-300 text-gray-900'
                                    } border`}
                                >
                                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                </select>
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Formato de Hora</label>
                                <select
                                    value={formData.timeFormat}
                                    onChange={(e) => handleInputChange('timeFormat', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-md focus:ring-2 focus:ring-indigo-500 ${
                                        currentTheme === 'dark' 
                                            ? 'bg-gray-700 border-gray-600 text-white' 
                                            : 'bg-white border-gray-300 text-gray-900'
                                    } border`}
                                >
                                    <option value="24h">24 horas</option>
                                    <option value="12h">12 horas</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Preferencias Básicas */}
                    {activeTab === 'preferences' && (
                        <div className="space-y-4">
                            <h3 className={`text-lg font-semibold mb-4 ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Preferencias de Escritura</h3>
                            
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Fuente Predeterminada</label>
                                <select
                                    value={formData.defaultFont}
                                    onChange={(e) => handleInputChange('defaultFont', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-md focus:ring-2 focus:ring-indigo-500 ${
                                        currentTheme === 'dark' 
                                            ? 'bg-gray-700 border-gray-600 text-white' 
                                            : 'bg-white border-gray-300 text-gray-900'
                                    } border`}
                                >
                                    <option value="patrick-hand">Patrick Hand</option>
                                    <option value="caveat">Caveat</option>
                                    <option value="indie-flower">Indie Flower</option>
                                    <option value="kalam">Kalam</option>
                                    <option value="gochi-hand">Gochi Hand</option>
                                    <option value="lora">Lora (Serif)</option>
                                    <option value="sans">Nunito Sans (Simple)</option>
                                </select>
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Tamaño de Fuente Predeterminado</label>
                                <select
                                    value={formData.defaultFontSize}
                                    onChange={(e) => handleInputChange('defaultFontSize', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-md focus:ring-2 focus:ring-indigo-500 ${
                                        currentTheme === 'dark' 
                                            ? 'bg-gray-700 border-gray-600 text-white' 
                                            : 'bg-white border-gray-300 text-gray-900'
                                    } border`}
                                >
                                    <option value="text-lg">Muy Pequeño</option>
                                    <option value="text-xl">Pequeño</option>
                                    <option value="text-2xl">Mediano</option>
                                    <option value="text-3xl">Grande</option>
                                    <option value="text-4xl">Extra Grande</option>
                                </select>
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Tema</label>
                                <select
                                    value={formData.theme}
                                    onChange={(e) => handleInputChange('theme', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-md focus:ring-2 focus:ring-indigo-500 ${
                                        currentTheme === 'dark' 
                                            ? 'bg-gray-700 border-gray-600 text-white' 
                                            : 'bg-white border-gray-300 text-gray-900'
                                    } border`}
                                >
                                    <option value="dark">Oscuro</option>
                                    <option value="light">Claro</option>
                                    <option value="auto">Automático</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Notificaciones Básicas */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-4">
                            <h3 className={`text-lg font-semibold mb-4 ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Notificaciones</h3>
                            
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className={`block text-sm font-medium ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Recordatorio Diario</label>
                                    <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Recibir notificación diaria para escribir</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.dailyReminder}
                                        onChange={(e) => handleInputChange('dailyReminder', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>

                            {formData.dailyReminder && (
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Hora del Recordatorio</label>
                                    <input
                                        type="time"
                                        value={formData.reminderTime}
                                        onChange={(e) => handleInputChange('reminderTime', e.target.value)}
                                        className={`w-full px-3 py-2 rounded-md focus:ring-2 focus:ring-indigo-500 ${
                                            currentTheme === 'dark' 
                                                ? 'bg-gray-700 border-gray-600 text-white' 
                                                : 'bg-white border-gray-300 text-gray-900'
                                        } border`}
                                    />
                                </div>
                            )}

                            {/* Sección Premium */}
                            {!isPremium && (
                                <div className="mt-6 p-4 bg-gradient-to-r from-purple-900 to-indigo-900 rounded-lg border border-purple-500">
                                    <h4 className="text-lg font-semibold text-white mb-2">✨ Funcionalidades Premium</h4>
                                    <p className="text-gray-300 mb-3">Desbloquea notificaciones avanzadas y más opciones de personalización</p>
                                    <ul className="text-sm text-gray-400 space-y-1 mb-4">
                                        <li>• Recordatorios de actividades pendientes</li>
                                        <li>• Resúmenes semanales del diario</li>
                                        <li>• Personalización avanzada de IA (terapeuta, asistente, frases)</li>
                                        <li>• Configuración de seguridad (2FA, respaldo, sincronización)</li>
                                        <li>• Metas personales y objetivos de escritura</li>
                                        <li>• Análisis de patrones de comportamiento</li>
                                        <li>• Chat con terapeuta IA y asistente de escritura</li>
                                    </ul>
                                    <button
                                        onClick={() => {
                                            onClose(); // Cerrar el modal de perfil
                                            onUpgradeClick(); // Abrir el modal de suscripción
                                        }}
                                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all"
                                    >
                                        Actualizar a Premium
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* IA Personalizada (Premium) */}
                    {activeTab === 'ai' && isPremium && (
                        <div className="space-y-4">
                            <h3 className={`text-lg font-semibold mb-4 ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Personalización de IA</h3>
                            
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Estilo del Terapeuta IA</label>
                                <select
                                    value={formData.therapistStyle}
                                    onChange={(e) => handleInputChange('therapistStyle', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-md focus:ring-2 focus:ring-indigo-500 ${
                                        currentTheme === 'dark' 
                                            ? 'bg-gray-700 border-gray-600 text-white' 
                                            : 'bg-white border-gray-300 text-gray-900'
                                    } border`}
                                >
                                    <option value="empatico">Empático y comprensivo</option>
                                    <option value="directo">Directo y analítico</option>
                                    <option value="motivacional">Motivacional y alentador</option>
                                    <option value="cognitivo">Cognitivo-conductual</option>
                                    <option value="psicodinamico">Psicodinámico</option>
                                    <option value="mindfulness">Mindfulness y meditación</option>
                                </select>
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Estilo del Asistente de Escritura</label>
                                <select
                                    value={formData.writingAssistantStyle}
                                    onChange={(e) => handleInputChange('writingAssistantStyle', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-md focus:ring-2 focus:ring-indigo-500 ${
                                        currentTheme === 'dark' 
                                            ? 'bg-gray-700 border-gray-600 text-white' 
                                            : 'bg-white border-gray-300 text-gray-900'
                                    } border`}
                                >
                                    <option value="formal">Formal y académico</option>
                                    <option value="creativo">Creativo y expresivo</option>
                                    <option value="simple">Simple y claro</option>
                                    <option value="detallado">Detallado y descriptivo</option>
                                    <option value="conciso">Conciso y directo</option>
                                </select>
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Tono de Frases Motivacionales</label>
                                <select
                                    value={formData.motivationalTone}
                                    onChange={(e) => handleInputChange('motivationalTone', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-md focus:ring-2 focus:ring-indigo-500 ${
                                        currentTheme === 'dark' 
                                            ? 'bg-gray-700 border-gray-600 text-white' 
                                            : 'bg-white border-gray-300 text-gray-900'
                                    } border`}
                                >
                                    <option value="espiritual">Espiritual y trascendental</option>
                                    <option value="filosofico">Filosófico y reflexivo</option>
                                    <option value="motivacional">Motivacional y energético</option>
                                    <option value="mindfulness">Mindfulness y presente</option>
                                    <option value="cientifico">Científico y racional</option>
                                    <option value="poetico">Poético y artístico</option>
                                    <option value="practico">Práctico y aplicable</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Seguridad (Premium) */}
                    {activeTab === 'security' && isPremium && (
                        <div className="space-y-4">
                            <h3 className={`text-lg font-semibold mb-4 ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Seguridad y Respaldo</h3>
                            
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className={`block text-sm font-medium ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Autenticación de Dos Factores</label>
                                    <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Mayor seguridad para tu cuenta</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.twoFactorEnabled}
                                        onChange={(e) => handleInputChange('twoFactorEnabled', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <label className={`block text-sm font-medium ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Respaldo Automático</label>
                                    <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Respaldar datos automáticamente</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.autoBackup}
                                        onChange={(e) => handleInputChange('autoBackup', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <label className={`block text-sm font-medium ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Sincronización</label>
                                    <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Sincronizar entre dispositivos</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.syncEnabled}
                                        onChange={(e) => handleInputChange('syncEnabled', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Metas (Premium) */}
                    {activeTab === 'goals' && isPremium && (
                        <div className="space-y-4">
                            <h3 className={`text-lg font-semibold mb-4 ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Metas Personales</h3>
                            
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Objetivo de Escritura Diario (palabras)</label>
                                <input
                                    type="number"
                                    value={formData.dailyWritingGoal}
                                    onChange={(e) => handleInputChange('dailyWritingGoal', parseInt(e.target.value))}
                                    className={`w-full px-3 py-2 rounded-md focus:ring-2 focus:ring-indigo-500 ${
                                        currentTheme === 'dark' 
                                            ? 'bg-gray-700 border-gray-600 text-white' 
                                            : 'bg-white border-gray-300 text-gray-900'
                                    } border`}
                                    min="1"
                                />
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Objetivo de Escritura Semanal (palabras)</label>
                                <input
                                    type="number"
                                    value={formData.weeklyWritingGoal}
                                    onChange={(e) => handleInputChange('weeklyWritingGoal', parseInt(e.target.value))}
                                    className={`w-full px-3 py-2 rounded-md focus:ring-2 focus:ring-indigo-500 ${
                                        currentTheme === 'dark' 
                                            ? 'bg-gray-700 border-gray-600 text-white' 
                                            : 'bg-white border-gray-300 text-gray-900'
                                    } border`}
                                    min="1"
                                />
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Meta de Actividades Diarias</label>
                                <input
                                    type="number"
                                    value={formData.dailyActivityGoal}
                                    onChange={(e) => handleInputChange('dailyActivityGoal', parseInt(e.target.value))}
                                    className={`w-full px-3 py-2 rounded-md focus:ring-2 focus:ring-indigo-500 ${
                                        currentTheme === 'dark' 
                                            ? 'bg-gray-700 border-gray-600 text-white' 
                                            : 'bg-white border-gray-300 text-gray-900'
                                    } border`}
                                    min="1"
                                    max="10"
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <label className={`block text-sm font-medium ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Recordatorios de Actividades</label>
                                    <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Notificar actividades pendientes</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.activityReminders}
                                        onChange={(e) => handleInputChange('activityReminders', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <label className={`block text-sm font-medium ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Resúmenes Semanales</label>
                                    <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Recibir resumen semanal del diario</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.weeklySummaries}
                                        onChange={(e) => handleInputChange('weeklySummaries', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={`flex justify-end gap-3 p-6 border-t ${currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <button
                        onClick={onClose}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            currentTheme === 'dark' 
                                ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' 
                                : 'text-gray-700 bg-gray-200 hover:bg-gray-300'
                        }`}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
        </>
    );
};

export default UserProfileModal; 