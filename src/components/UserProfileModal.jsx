import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';

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
    const { t } = useTranslation();
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
        font: 'patrick-hand',
        fontSize: 'text-2xl',
        theme: 'dark',
        
        // Notificaciones Básicas
        dailyReminder: false,
        reminderTime: '09:00',
        
        // Premium - Personalización de IA
        therapistStyle: 'empatico',
        writingAssistantStyle: 'claro',
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
                            {t('profile.personal')}
                        </button>
                        <button
                            onClick={() => setActiveTab('regional')}
                            className={`${tabBaseStyle} ${activeTab === 'regional' ? tabActiveStyle : tabInactiveStyle} whitespace-nowrap`}
                        >
                            {t('profile.regionalSettings')}
                        </button>
                        <button
                            onClick={() => setActiveTab('preferences')}
                            className={`${tabBaseStyle} ${activeTab === 'preferences' ? tabActiveStyle : tabInactiveStyle} whitespace-nowrap`}
                        >
                            {t('profile.preferences')}
                        </button>
                        <button
                            onClick={() => setActiveTab('notifications')}
                            className={`${tabBaseStyle} ${activeTab === 'notifications' ? tabActiveStyle : tabInactiveStyle} whitespace-nowrap`}
                        >
                            {t('profile.notifications')}
                        </button>
                        {isPremium && (
                            <>
                                <button
                                    onClick={() => setActiveTab('ai')}
                                    className={`${tabBaseStyle} ${activeTab === 'ai' ? tabActiveStyle : tabInactiveStyle} whitespace-nowrap`}
                                >
                                    {t('profile.aiCustomization')}
                                </button>
                                <button
                                    onClick={() => setActiveTab('security')}
                                    className={`${tabBaseStyle} ${activeTab === 'security' ? tabActiveStyle : tabInactiveStyle} whitespace-nowrap`}
                                >
                                    {t('profile.security')}
                                </button>
                                <button
                                    onClick={() => setActiveTab('goals')}
                                    className={`${tabBaseStyle} ${activeTab === 'goals' ? tabActiveStyle : tabInactiveStyle} whitespace-nowrap`}
                                >
                                    {t('profile.goals')}
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
                            <h3 className={`text-lg font-semibold mb-4 ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('profile.personalInformation')}</h3>
                            
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{t('profile.fullName')}</label>
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
                    <label className={`block text-sm font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{t('profile.birthDateOptional')}</label>
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
                                <label className={`block text-sm font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{t('profile.genderOptional')}</label>
                                <select
                                    value={formData.gender}
                                    onChange={(e) => handleInputChange('gender', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-md focus:ring-2 focus:ring-indigo-500 ${
                                        currentTheme === 'dark' 
                                            ? 'bg-gray-700 border-gray-600 text-white' 
                                            : 'bg-white border-gray-300 text-gray-900'
                                    } border`}
                                >
                                    <option value="">{t('profile.notSpecify')}</option>
                                    <option value="masculino">{t('profile.male')}</option>
                                    <option value="femenino">{t('profile.female')}</option>
                                    <option value="no-binario">{t('profile.nonBinary')}</option>
                                    <option value="otro">{t('profile.other')}</option>
                                </select>
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{t('profile.timezone')}</label>
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
                            <h3 className={`text-lg font-semibold mb-4 ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('profile.regionalSettings')}</h3>
                            
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{t('profile.language')}</label>
                                <LanguageSelector
                                    userPrefs={userPrefs}
                                    onUpdateUserPrefs={onUpdateUserPrefs}
                                    currentTheme={currentTheme}
                                    showFullNames={true}
                                />
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{t('profile.dateFormat')}</label>
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
                                <label className={`block text-sm font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{t('profile.timeFormat')}</label>
                                <select
                                    value={formData.timeFormat}
                                    onChange={(e) => handleInputChange('timeFormat', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-md focus:ring-2 focus:ring-indigo-500 ${
                                        currentTheme === 'dark' 
                                            ? 'bg-gray-700 border-gray-600 text-white' 
                                            : 'bg-white border-gray-300 text-gray-900'
                                    } border`}
                                >
                                    <option value="24h">{t('profile.24h')}</option>
                                    <option value="12h">{t('profile.12h')}</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Preferencias Básicas */}
                    {activeTab === 'preferences' && (
                        <div className="space-y-4">
                            <h3 className={`text-lg font-semibold mb-4 ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('profile.writingPreferences')}</h3>
                            
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{t('profile.defaultFont')}</label>
                                <select
                                    value={formData.font}
                                    onChange={(e) => handleInputChange('font', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-md focus:ring-2 focus:ring-indigo-500 ${
                                        currentTheme === 'dark' 
                                            ? 'bg-gray-700 border-gray-600 text-white' 
                                            : 'bg-white border-gray-300 text-gray-900'
                                    } border`}
                                >
                                    <option value="patrick-hand">{t('fonts.names.patrickHand')}</option>
                                    <option value="caveat">{t('fonts.names.caveat')}</option>
                                    <option value="indie-flower">{t('fonts.names.indieFlower')}</option>
                                    <option value="kalam">{t('fonts.names.kalam')}</option>
                                    <option value="gochi-hand">{t('fonts.names.gochiHand')}</option>
                                    <option value="lora">{t('fonts.names.lora')}</option>
                                    <option value="sans">{t('fonts.names.sans')}</option>
                                </select>
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{t('profile.defaultFontSize')}</label>
                                <select
                                    value={formData.fontSize}
                                    onChange={(e) => handleInputChange('fontSize', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-md focus:ring-2 focus:ring-indigo-500 ${
                                        currentTheme === 'dark' 
                                            ? 'bg-gray-700 border-gray-600 text-white' 
                                            : 'bg-white border-gray-300 text-gray-900'
                                    } border`}
                                >
                                    <option value="text-lg">{t('fonts.sizes.verySmall')}</option>
                                    <option value="text-xl">{t('fonts.sizes.small')}</option>
                                    <option value="text-2xl">{t('fonts.sizes.medium')}</option>
                                    <option value="text-3xl">{t('fonts.sizes.large')}</option>
                                    <option value="text-4xl">{t('fonts.sizes.extraLarge')}</option>
                                </select>
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{t('profile.theme')}</label>
                                <select
                                    value={formData.theme}
                                    onChange={(e) => handleInputChange('theme', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-md focus:ring-2 focus:ring-indigo-500 ${
                                        currentTheme === 'dark' 
                                            ? 'bg-gray-700 border-gray-600 text-white' 
                                            : 'bg-white border-gray-300 text-gray-900'
                                    } border`}
                                >
                                    <option value="dark">{t('profile.dark')}</option>
                                    <option value="light">{t('profile.light')}</option>
                                    <option value="auto">{t('profile.auto')}</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Notificaciones Básicas */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-4">
                            <h3 className={`text-lg font-semibold mb-4 ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('profile.notifications')}</h3>
                            
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className={`block text-sm font-medium ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{t('profile.dailyReminder')}</label>
                                    <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('profile.dailyReminderDescription')}</p>
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
                                    <label className={`block text-sm font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{t('profile.reminderTime')}</label>
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
                                    <h4 className="text-lg font-semibold text-white mb-2">{t('profile.premiumFeatures')}</h4>
                                    <p className="text-gray-300 mb-3">{t('profile.premiumDescription')}</p>
                                    <ul className="text-sm text-gray-400 space-y-1 mb-4">
                                        <li>• {t('profile.activityReminders')}</li>
                                        <li>• {t('profile.weeklySummaries')}</li>
                                        <li>• {t('profile.aiCustomizationAdvanced')}</li>
                                        <li>• {t('profile.securitySettings')}</li>
                                        <li>• {t('profile.personalGoals')}</li>
                                        <li>• {t('profile.behaviorAnalysis')}</li>
                                        <li>• {t('profile.aiChat')}</li>
                                    </ul>
                                    <button
                                        onClick={() => {
                                            onClose(); // Cerrar el modal de perfil
                                            onUpgradeClick(); // Abrir el modal de suscripción
                                        }}
                                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all"
                                    >
                                        {t('profile.upgradeToPremium')}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* IA Personalizada (Premium) */}
                    {activeTab === 'ai' && isPremium && (
                        <div className="space-y-4">
                            <h3 className={`text-lg font-semibold mb-4 ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('profile.aiCustomizationTitle')}</h3>
                            
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{t('profile.therapistStyle')}</label>
                                <select
                                    value={formData.therapistStyle}
                                    onChange={(e) => handleInputChange('therapistStyle', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-md focus:ring-2 focus:ring-indigo-500 ${
                                        currentTheme === 'dark' 
                                            ? 'bg-gray-700 border-gray-600 text-white' 
                                            : 'bg-white border-gray-300 text-gray-900'
                                    } border`}
                                >
                                    <option value="empatico">{t('profile.empathetic')}</option>
                                    <option value="directo">{t('profile.direct')}</option>
                                    <option value="motivacional">{t('profile.motivational')}</option>
                                    <option value="cognitivo">{t('profile.cognitive')}</option>
                                    <option value="psicodinamico">{t('profile.psychodynamic')}</option>
                                    <option value="mindfulness">{t('profile.mindfulness')}</option>
                                </select>
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{t('profile.writingAssistantStyle')}</label>
                                <select
                                    value={formData.writingAssistantStyle}
                                    onChange={(e) => handleInputChange('writingAssistantStyle', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-md focus:ring-2 focus:ring-indigo-500 ${
                                        currentTheme === 'dark' 
                                            ? 'bg-gray-700 border-gray-600 text-white' 
                                            : 'bg-white border-gray-300 text-gray-900'
                                    } border`}
                                >
                                    <option value="claro">{t('profile.clear')}</option>
                                    <option value="natural">{t('profile.natural')}</option>
                                    <option value="reflexivo">{t('profile.reflective')}</option>
                                    <option value="estructurado">{t('profile.structured')}</option>
                                    <option value="creativo">{t('profile.creative')}</option>
                                    <option value="breve">{t('profile.brief')}</option>
                                    <option value="humor">{t('profile.humorous')}</option>
                                </select>
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{t('profile.motivationalTone')}</label>
                                <select
                                    value={formData.motivationalTone}
                                    onChange={(e) => handleInputChange('motivationalTone', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-md focus:ring-2 focus:ring-indigo-500 ${
                                        currentTheme === 'dark' 
                                            ? 'bg-gray-700 border-gray-600 text-white' 
                                            : 'bg-white border-gray-300 text-gray-900'
                                    } border`}
                                >
                                    <option value="espiritual">{t('profile.spiritual')}</option>
                                    <option value="filosofico">{t('profile.philosophical')}</option>
                                    <option value="motivacional">{t('profile.energetic')}</option>
                                    <option value="mindfulness">{t('profile.present')}</option>
                                    <option value="cientifico">{t('profile.scientific')}</option>
                                    <option value="poetico">{t('profile.poetic')}</option>
                                    <option value="practico">{t('profile.practical')}</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Seguridad (Premium) */}
                    {activeTab === 'security' && isPremium && (
                        <div className="space-y-4">
                            <h3 className={`text-lg font-semibold mb-4 ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('profile.securityAndBackup')}</h3>
                            
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className={`block text-sm font-medium ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{t('profile.twoFactorAuth')}</label>
                                    <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('profile.twoFactorDescription')}</p>
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
                                    <label className={`block text-sm font-medium ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{t('profile.autoBackup')}</label>
                                    <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('profile.autoBackupDescription')}</p>
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
                                    <label className={`block text-sm font-medium ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{t('profile.sync')}</label>
                                    <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('profile.syncDescription')}</p>
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
                            <h3 className={`text-lg font-semibold mb-4 ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('profile.personalGoalsTitle')}</h3>
                            
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{t('profile.dailyWritingGoal')}</label>
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
                                <label className={`block text-sm font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{t('profile.weeklyWritingGoal')}</label>
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
                                <label className={`block text-sm font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{t('profile.dailyActivityGoal')}</label>
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
                                    <label className={`block text-sm font-medium ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{t('profile.activityRemindersTitle')}</label>
                                    <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('profile.activityRemindersDescription')}</p>
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
                                    <label className={`block text-sm font-medium ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{t('profile.weeklySummariesTitle')}</label>
                                    <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('profile.weeklySummariesDescription')}</p>
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
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        {t('common.save')}
                    </button>
                </div>
            </div>
        </div>
        </>
    );
};

export default UserProfileModal; 