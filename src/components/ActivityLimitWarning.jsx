import React from 'react';

export default function ActivityLimitWarning({ activityLimits, onUpgradeClick }) {
    const { currentCount, maxActivities, canAddMore, isFreePlan } = activityLimits;

    // No mostrar advertencia - no hay límite para definir actividades
    // El límite se aplica solo al registro diario de actividades
    return null;

    return (
        <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-yellow-300">⚠️</span>
                    <div>
                        <p className="text-yellow-200 text-sm font-medium">
                            Límite de Actividades
                        </p>
                        <p className="text-yellow-300 text-xs">
                            {currentCount} de {maxActivities} actividades utilizadas
                        </p>
                    </div>
                </div>
                
                {!canAddMore && (
                    <button
                        onClick={onUpgradeClick}
                        className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white text-xs rounded-lg transition-colors"
                    >
                        Actualizar a Premium
                    </button>
                )}
            </div>
            
            {!canAddMore && (
                <p className="text-yellow-200 text-xs mt-2">
                    Has alcanzado el límite de actividades del plan gratuito. 
                    Actualiza a Premium para crear actividades ilimitadas.
                </p>
            )}
        </div>
    );
} 