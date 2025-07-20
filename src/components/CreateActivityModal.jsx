import React, { useState } from 'react';

const CreateActivityModal = ({ isOpen, onClose, onCreateActivity }) => {
    const [activityName, setActivityName] = useState('');
    const [options, setOptions] = useState(['']);
    const [points, setPoints] = useState({});
    const [goalType, setGoalType] = useState('weekly');
    const [goalTarget, setGoalTarget] = useState('');
    const [goalStartDate, setGoalStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [goalEndDate, setGoalEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [showGoalSection, setShowGoalSection] = useState(false);

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
        const newPoints = { ...points };
        if (value.trim()) {
            if (!newPoints[value]) {
                newPoints[value] = 0;
            }
        }
        setPoints(newPoints);
    };

    const addOption = () => {
        setOptions([...options, '']);
    };

    const removeOption = (index) => {
        const newOptions = options.filter((_, i) => i !== index);
        setOptions(newOptions);
        const removedOption = options[index];
        if (removedOption && points[removedOption]) {
            const newPoints = { ...points };
            delete newPoints[removedOption];
            setPoints(newPoints);
        }
    };

    const handlePointChange = (option, value) => {
        setPoints(prev => ({
            ...prev,
            [option]: parseInt(value) || 0
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!activityName.trim()) {
            alert('Por favor ingresa un nombre para la actividad.');
            return;
        }
        const finalOptions = options.map(o => o.trim()).filter(o => o !== '');
        const activityData = {
            name: activityName.trim(),
            options: finalOptions,
            points: points,
            createdAt: new Date()
        };
        if (showGoalSection && goalTarget && !isNaN(goalTarget) && goalTarget > 0) {
            const goalData = {
                type: goalType,
                target: parseInt(goalTarget)
            };
            if (goalType === 'custom') {
                if (goalStartDate > goalEndDate) {
                    alert('La fecha de inicio no puede ser posterior a la fecha de fin.');
                    return;
                }
                goalData.startDate = goalStartDate;
                goalData.endDate = goalEndDate;
            }
            activityData.goal = goalData;
        }
        onCreateActivity(activityData);
        setActivityName('');
        setOptions(['']);
        setPoints({});
        setGoalType('weekly');
        setGoalTarget('');
        setShowGoalSection(false);
        onClose();
    };

    const handleCancel = () => {
        setActivityName('');
        setOptions(['']);
        setPoints({});
        setGoalType('weekly');
        setGoalTarget('');
        setShowGoalSection(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">Crear Nueva Actividad</h2>
                    <button onClick={handleCancel} className="p-1 rounded-full hover:bg-gray-700">
                        <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="overflow-y-auto space-y-6 pr-2">
                    <div>
                        <label htmlFor="activity-name" className="block text-sm font-medium text-gray-300 mb-2">
                            Nombre de la Actividad *
                        </label>
                        <input 
                            id="activity-name"
                            type="text" 
                            value={activityName} 
                            onChange={(e) => setActivityName(e.target.value)} 
                            placeholder="Ej: Leer, Ejercicio, Meditación..." 
                            className="w-full bg-gray-700 text-white rounded-md p-3 border border-gray-600 focus:ring-2 focus:ring-indigo-500" 
                            required 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                            Subniveles/Opciones
                        </label>
                        <div className="space-y-3">
                            {options.map((option, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <input 
                                        type="text" 
                                        value={option} 
                                        onChange={(e) => handleOptionChange(index, e.target.value)} 
                                        placeholder={`Opción ${index + 1}`} 
                                        className="flex-grow bg-gray-700 text-white rounded-md p-2 border border-gray-600" 
                                    />
                                    {option.trim() && (
                                        <input 
                                            type="number" 
                                            min="0"
                                            placeholder="Puntos" 
                                            value={points[option] || ''} 
                                            onChange={(e) => handlePointChange(option, e.target.value)} 
                                            className="w-20 bg-gray-700 text-white rounded-md p-2 border border-gray-600 text-center" 
                                        />
                                    )}
                                    <button 
                                        type="button" 
                                        onClick={() => removeOption(index)} 
                                        className="p-2 bg-red-600 hover:bg-red-700 rounded-full text-white"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                            <button 
                                type="button" 
                                onClick={addOption} 
                                className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold flex items-center gap-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Añadir opción
                            </button>
                        </div>
                    </div>
                    <div className="border-t border-gray-700 pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium text-gray-300">
                                Configurar Meta (Opcional)
                            </label>
                            <button 
                                type="button"
                                onClick={() => setShowGoalSection(!showGoalSection)}
                                className={`px-3 py-1 rounded-md text-sm font-medium ${
                                    showGoalSection 
                                        ? 'bg-yellow-600 text-white' 
                                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                }`}
                            >
                                {showGoalSection ? 'Ocultar' : 'Mostrar'}
                            </button>
                        </div>
                        {showGoalSection && (
                            <div className="space-y-4 p-4 bg-gray-700 rounded-lg">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Tipo de Meta
                                        </label>
                                        <select 
                                            value={goalType} 
                                            onChange={(e) => setGoalType(e.target.value)}
                                            className="w-full bg-gray-600 text-white rounded-md p-2 border border-gray-500"
                                        >
                                            <option value="weekly">Semanal</option>
                                            <option value="monthly">Mensual</option>
                                            <option value="custom">Personalizada</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Puntos Objetivo *
                                        </label>
                                        <input 
                                            type="number" 
                                            min="1"
                                            value={goalTarget} 
                                            onChange={(e) => setGoalTarget(e.target.value)} 
                                            placeholder="Ej: 100" 
                                            className="w-full bg-gray-600 text-white rounded-md p-2 border border-gray-500" 
                                            required={showGoalSection}
                                        />
                                    </div>
                                </div>
                                {goalType === 'custom' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Fecha de Inicio
                                            </label>
                                            <input 
                                                type="date" 
                                                value={goalStartDate} 
                                                onChange={(e) => setGoalStartDate(e.target.value)} 
                                                className="w-full bg-gray-600 text-white rounded-md p-2 border border-gray-500" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Fecha de Fin
                                            </label>
                                            <input 
                                                type="date" 
                                                value={goalEndDate} 
                                                onChange={(e) => setGoalEndDate(e.target.value)} 
                                                className="w-full bg-gray-600 text-white rounded-md p-2 border border-gray-500" 
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                        <button 
                            type="button" 
                            onClick={handleCancel} 
                            className="px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 font-bold rounded-lg text-white"
                        >
                            Crear Actividad
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateActivityModal; 