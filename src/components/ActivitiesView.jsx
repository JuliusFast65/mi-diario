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

    // Función para agregar actividad
    const handleAddActivity = (activityId) => {
        const activity = activities[activityId];
        if (!activity) return;

        // Para actividades simples, solo registrar que se hizo
        if (isSimpleActivity(activity.id)) {
            onTrackActivity(activityId, '1');
        } else {
            // Para actividades premium, usar el primer valor disponible
            const firstOption = activity.options?.[0] || '';
            onTrackActivity(activityId, firstOption);
        }
    };



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

            {/* Combo para agregar actividad */}
            {availableActivities.length > 0 && (
                <div className="flex items-center gap-2">
                    <select
                        onChange={(e) => {
                            if (e.target.value) {
                                handleAddActivity(e.target.value);
                                e.target.value = '';
                            }
                        }}
                        className={`flex-grow rounded-md p-2 border ${
                            currentTheme === 'dark' 
                                ? 'bg-gray-600 border-gray-500 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        defaultValue=""
                    >
                        <option value="">{t('diary.registerActivity')}...</option>
                        {availableActivities.map(activity => (
                            <option key={activity.id} value={activity.id}>
                                {activity.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Botones de acción */}
            <div className="flex gap-3 pt-4">
                <button
                    onClick={onOpenDefineActivitiesModal}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                    {t('diary.defineActivities')}
                </button>
                
                <button
                    onClick={onOpenStatisticsModal}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                    {t('navigation.statistics')}
                </button>
            </div>
        </div>
    );
};

export default ActivitiesView; 