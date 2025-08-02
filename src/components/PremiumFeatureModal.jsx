import React from 'react';
import { useTranslation } from 'react-i18next';

const PremiumFeatureModal = ({ isOpen, onClose, onUpgrade, featureName, featureDescription, featureIcon, currentTheme = 'dark' }) => {
    const { t } = useTranslation();
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl p-8 max-w-md mx-4 transform transition-all`}>
                {/* Header con icono y título */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">{featureIcon}</span>
                    </div>
                    <h2 className={`text-2xl font-bold mb-2 ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {t('premium.featureTitle')}
                    </h2>
                    <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {t('premium.unlockPotential')}
                    </p>
                </div>

                {/* Contenido principal */}
                <div className="text-center mb-8">
                    <h3 className={`text-lg font-semibold mb-3 ${currentTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                        {featureName}
                    </h3>
                    <p className={`leading-relaxed ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        {featureDescription}
                    </p>
                </div>

                {/* Lista de beneficios */}
                <div className={`${currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gradient-to-r from-purple-50 to-blue-50'} rounded-lg p-4 mb-6`}>
                    <h4 className={`font-semibold mb-3 text-sm uppercase tracking-wide ${currentTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                        {t('premium.includesWithPremium')}
                    </h4>
                    <ul className={`space-y-2 text-sm ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        <li className="flex items-center">
                            <span className="text-green-500 mr-2">✓</span>
                            {t('premium.virtualTherapistChat')}
                        </li>
                        <li className="flex items-center">
                            <span className="text-green-500 mr-2">✓</span>
                            {t('premium.advancedWritingAssistant')}
                        </li>
                        <li className="flex items-center">
                            <span className="text-green-500 mr-2">✓</span>
                            {t('premium.behaviorPatternAnalysis')}
                        </li>
                        <li className="flex items-center">
                            <span className="text-green-500 mr-2">✓</span>
                            {t('premium.twoFactorAuthentication')}
                        </li>
                        <li className="flex items-center">
                            <span className="text-green-500 mr-2">✓</span>
                            {t('premium.unlimitedActivities')}
                        </li>
                    </ul>
                </div>

                {/* Botones */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                            currentTheme === 'dark' 
                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {t('premium.close')}
                    </button>
                    <button
                        onClick={() => {
                            onClose();
                            if (onUpgrade) onUpgrade();
                        }}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
                    >
                        {t('premium.upgradeToPremium')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PremiumFeatureModal; 