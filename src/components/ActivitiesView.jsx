import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ActivityTrackerItem from './ActivityTrackerItem';

const ActivitiesView = ({ 
    activities, 
    currentEntry, 
    onTrackActivity, 
    onUntrackActivity, 
    onOpenDefineActivitiesModal,
    onOpenStatisticsModal,
    isPremium = false,
    isSimpleActivity,
    getActivityPoints,
    getActivityCount,
    usesCountInsteadOfPoints,
    currentTheme = 'dark'
}) => {
    const { t } = useTranslation();
    
    // Filtrar actividades trackeadas y disponibles
    const { trackedActivities, availableActivities } = useMemo(() => {
        // Convertir el objeto activities a array
        const activitiesArray = Object.values(activities || {});
        
        const tracked = activitiesArray.filter(activity => 
            currentEntry?.tracked?.[activity.id]
        );
        
        const available = activitiesArray.filter(activity => 
            !currentEntry?.tracked?.[activity.id]
        );
        
        return { trackedActivities: tracked, availableActivities: available };
    }, [activities, currentEntry?.tracked]);

    return (
        <div className="space-y-4 p-4">
            {/* Lista de actividades trackeadas */}
            {trackedActivities.map(activity => (
                <ActivityTrackerItem
                    key={activity.id}
                    activity={activity}
                    selectedValue={currentEntry?.tracked?.[activity.id]}
                    onValueChange={(value) => onTrackActivity(activity.id, value)}
                    onUntrack={() => onUntrackActivity(activity.id)}
                    isSimpleActivity={isSimpleActivity}
                    getActivityPoints={getActivityPoints}
                    getActivityCount={getActivityCount}
                    usesCountInsteadOfPoints={usesCountInsteadOfPoints}
                    currentTheme={currentTheme}
                />
            ))}

            {/* Mensaje cuando no hay actividades registradas */}
            {trackedActivities.length === 0 && (
                <div className={`text-center py-8 ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    <p>{t('diary.noActivitiesRegistered')}</p>
                    <p className="text-sm mt-2">{t('diary.tapActivityToRegister')}</p>
                </div>
            )}

            {/* Botones de acción */}
            <div className="flex justify-center pt-4">
                <button
                    onClick={onOpenDefineActivitiesModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                    Registrar Actividad
                </button>
            </div>
        </div>
    );
};

export default ActivitiesView; 