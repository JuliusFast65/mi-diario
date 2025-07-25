import React, { useState } from 'react';
import CreateActivityModal from './CreateActivityModal';

const DefineActivitiesModal = ({ isOpen, onClose, activities, onCreateActivity, onDeleteActivity, onAddOption, onDeleteOption, onSaveGoal, onUpdatePoints, activityLimits, onUpgradeClick, subscription }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [editingActivity, setEditingActivity] = useState(null);
    const [newOptionValues, setNewOptionValues] = useState({});

    const handleEdit = (activity) => {
        setEditingActivity(activity);
        setModalOpen(true);
    };

    const handleCreate = () => {
        setEditingActivity(null);
        setModalOpen(true);
    };

    const handleSave = (activityData) => {
        onCreateActivity(activityData);
        setModalOpen(false);
        setEditingActivity(null);
    };

    const handleNewOptionChange = (activityId, value) => {
        setNewOptionValues(prev => ({ ...prev, [activityId]: value }));
    };
    
    const handleAddNewOption = (activityId) => {
        const newOption = newOptionValues[activityId];
        if (newOption && newOption.trim()) {
            onAddOption(activityId, newOption.trim());
            handleNewOptionChange(activityId, '');
        }
    };

    if (!isOpen) return null;

    const sortedActivities = Object.values(activities).sort((a, b) => a.name.localeCompare(b.name));
    const isFreePlan = subscription?.plan === 'free';
    const { maxActivities, maxOptions } = activityLimits;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[80vh] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-white">Gestor de Actividades</h2>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
                            <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Límites para plan gratuito */}
                    {isFreePlan && (
                        <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-600/50 rounded-lg">
                            <div className="flex items-center gap-2 text-yellow-300 text-sm">
                                <span>⚠️ Plan Gratuito:</span>
                                <span>Máximo {maxActivities} actividades, {maxOptions} opciones por actividad</span>
                                <button 
                                    onClick={onUpgradeClick}
                                    className="ml-auto px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md text-xs font-medium"
                                >
                                    Actualizar
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-center mb-4">
                        <div className="text-gray-300">
                            {sortedActivities.length} actividad{sortedActivities.length !== 1 ? 'es' : ''} definida{sortedActivities.length !== 1 ? 's' : ''}
                        </div>
                        <button 
                            onClick={handleCreate}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                            disabled={isFreePlan && sortedActivities.length >= maxActivities}
                        >
                            + Nueva Actividad
                        </button>
                    </div>

                    <div className="overflow-y-auto space-y-4 pr-2">
                        {sortedActivities.map(activity => (
                            <div key={activity.id} className="bg-gray-700 p-4 rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="font-bold text-lg text-white">{activity.name}</span>
                                    <div className="flex items-center gap-2">
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
                                
                                {/* Meta actual */}
                                {activity.goal && (
                                    <div className="mb-3 p-2 bg-yellow-900/30 border border-yellow-600/50 rounded-lg">
                                        <div className="flex items-center gap-2 text-yellow-300 text-sm">
                                            <span>🎯 Meta:</span>
                                            <span className="font-semibold">
                                                {activity.goal.target} puntos
                                                {activity.goal.type === 'weekly' && ' (semanal)'}
                                                {activity.goal.type === 'monthly' && ' (mensual)'}
                                                {activity.goal.type === 'custom' && ` (${activity.goal.startDate} a ${activity.goal.endDate})`}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="border-t border-gray-600 pt-3">
                                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Subniveles y Puntos:</h4>
                                    <div className="space-y-2">
                                        {(activity.options && activity.options.length > 0) ? (
                                            activity.options.map(option => (
                                                <div key={option} className="flex items-center gap-2 bg-gray-600 px-3 py-2 rounded">
                                                    <span className="text-gray-200 flex-grow">{option}</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        placeholder="Puntos"
                                                        value={activity.points?.[option] || ''}
                                                        onChange={(e) => onUpdatePoints(activity.id, option, e.target.value)}
                                                        className="w-16 bg-gray-700 text-white rounded px-2 py-1 text-sm border border-gray-500"
                                                    />
                                                    <button 
                                                        onClick={() => onDeleteOption(activity.id, option)} 
                                                        className="p-1 text-gray-400 hover:text-white"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-gray-400 italic">Sin subniveles predefinidos.</p>
                                        )}
                                    </div>
                                    <div className="mt-3 flex gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="Añadir nuevo subnivel" 
                                            value={newOptionValues[activity.id] || ''} 
                                            onChange={(e) => handleNewOptionChange(activity.id, e.target.value)} 
                                            className="flex-grow bg-gray-600 text-white rounded-md p-2 text-sm border border-gray-500" 
                                        />
                                        <button 
                                            onClick={() => handleAddNewOption(activity.id)} 
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 rounded-lg text-sm"
                                        >
                                            Añadir
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <CreateActivityModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onCreateActivity={handleSave}
                initialData={editingActivity}
            />
        </>
    );
};

export default DefineActivitiesModal; 