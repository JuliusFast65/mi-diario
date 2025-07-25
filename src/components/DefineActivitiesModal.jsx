import React, { useState } from 'react';
import CreateActivityModal from './CreateActivityModal';

const DefineActivitiesModal = ({ isOpen, onClose, activities, onCreateActivity, onDeleteActivity, onAddOption, onDeleteOption, onSaveGoal, onUpdatePoints, activityLimits, onUpgradeClick, subscription, currentTheme = 'dark' }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [editingActivity, setEditingActivity] = useState(null);

    const handleEdit = (activity) => {
        setEditingActivity(activity);
        setModalOpen(true);
    };

    const handleCreate = () => {
        setEditingActivity(null);
        setModalOpen(true);
    };

    const handleSave = (activityData) => {
        // Migrar actividades existentes al nuevo formato si es necesario
        if (subscription?.plan === 'free' && activityData.options && activityData.options.length > 0) {
            // Convertir actividad premium a simple para usuarios gratuitos
            activityData.isSimple = true;
            activityData.originalOptions = activityData.options;
            activityData.options = [];
            activityData.points = {};
        }
        onCreateActivity(activityData);
        setModalOpen(false);
        setEditingActivity(null);
    };

    if (!isOpen) return null;

    const sortedActivities = Object.values(activities).sort((a, b) => a.name.localeCompare(b.name));
    const isFreePlan = subscription?.plan === 'free';
    const { maxActivities } = activityLimits;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                <div className={`${currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[80vh] flex flex-col border ${currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className={`text-2xl font-bold ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Gestor de Actividades</h2>
                        <button onClick={onClose} className={`p-1 rounded-full ${currentTheme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
                            <svg className={`w-6 h-6 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>



                    <div className="flex justify-between items-center mb-4">
                        <div className={`${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            {sortedActivities.length} actividad{sortedActivities.length !== 1 ? 'es' : ''} definida{sortedActivities.length !== 1 ? 's' : ''}
                        </div>
                        <button 
                            onClick={handleCreate}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                        >
                            + Nueva Actividad
                        </button>
                    </div>

                    <div className="overflow-y-auto space-y-3 pr-2">
                        {sortedActivities.length === 0 ? (
                            <div className={`text-center py-8 ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                <p>No hay actividades definidas.</p>
                                <p className="text-sm mt-2">Crea tu primera actividad para comenzar a registrar tus hábitos.</p>
                            </div>
                        ) : (
                            sortedActivities.map(activity => (
                                <div key={activity.id} className={`${currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} p-4 rounded-lg border ${currentTheme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex-grow">
                                            <div className="flex items-center gap-3">
                                                <span className={`font-bold text-lg ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{activity.name}</span>
                                                {isFreePlan && (
                                                    <span className={`text-xs px-2 py-1 rounded ${
                                                        currentTheme === 'dark' 
                                                            ? 'bg-gray-600 text-gray-300' 
                                                            : 'bg-gray-300 text-gray-700'
                                                    }`}>
                                                        +1 punto
                                                    </span>
                                                )}
                                            </div>
                                            
                                            {/* Información adicional para premium */}
                                            {!isFreePlan && (
                                                <div className="mt-2 space-y-1">
                                                    {/* Subniveles */}
                                                    {activity.options && activity.options.length > 0 && (
                                                        <div className={`text-sm ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                                            <span className={`${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Subniveles:</span> {activity.options.length}
                                                        </div>
                                                    )}
                                                    
                                                    {/* Meta */}
                                                    {activity.goal && (
                                                        <div className={`text-sm ${currentTheme === 'dark' ? 'text-yellow-300' : 'text-yellow-600'}`}>
                                                            <span className={`${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>🎯 Meta:</span> {activity.goal.target} puntos
                                                            {activity.goal.type === 'weekly' && ' (semanal)'}
                                                            {activity.goal.type === 'monthly' && ' (mensual)'}
                                                            {activity.goal.type === 'custom' && ` (${activity.goal.startDate} a ${activity.goal.endDate})`}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center gap-2 ml-4">
                                            <button 
                                                onClick={() => handleEdit(activity)}
                                                className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full text-white"
                                                title="Editar actividad"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button 
                                                onClick={() => onDeleteActivity(activity.id)} 
                                                className="p-2 bg-red-800 hover:bg-red-700 rounded-full text-white" 
                                                aria-label={`Eliminar permanentemente ${activity.name}`}
                                            >
                                                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
            <CreateActivityModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onCreateActivity={handleSave}
                initialData={editingActivity}
                subscription={subscription}
                currentTheme={currentTheme}
            />
        </>
    );
};

export default DefineActivitiesModal; 