import React from 'react';

const PremiumFeatureModal = ({ isOpen, onClose, onUpgrade, featureName, featureDescription, featureIcon }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md mx-4 transform transition-all">
                {/* Header con icono y título */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">{featureIcon}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Característica Premium
                    </h2>
                    <p className="text-gray-600 text-sm">
                        Desbloquea todo el potencial de tu diario
                    </p>
                </div>

                {/* Contenido principal */}
                <div className="text-center mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        {featureName}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                        {featureDescription}
                    </p>
                </div>

                {/* Lista de beneficios */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">
                        Incluye con Premium:
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-center">
                            <span className="text-green-500 mr-2">✓</span>
                            Chat con terapeuta virtual
                        </li>
                        <li className="flex items-center">
                            <span className="text-green-500 mr-2">✓</span>
                            Asistente de escritura avanzado
                        </li>
                        <li className="flex items-center">
                            <span className="text-green-500 mr-2">✓</span>
                            Análisis de patrones de comportamiento
                        </li>
                        <li className="flex items-center">
                            <span className="text-green-500 mr-2">✓</span>
                            Autenticación de dos factores
                        </li>
                        <li className="flex items-center">
                            <span className="text-green-500 mr-2">✓</span>
                            Actividades ilimitadas
                        </li>
                    </ul>
                </div>

                {/* Botones */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                        Cerrar
                    </button>
                    <button
                        onClick={() => {
                            onClose();
                            if (onUpgrade) onUpgrade();
                        }}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
                    >
                        Actualizar a Premium
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PremiumFeatureModal; 