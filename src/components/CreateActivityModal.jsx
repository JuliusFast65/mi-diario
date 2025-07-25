import React, { useState, useEffect } from 'react';

// Estilos CSS para options en diferentes temas
const selectStyles = `
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

const CreateActivityModal = ({ isOpen, onClose, onCreateActivity, initialData, subscription, currentTheme = 'dark' }) => {
    const isEdit = !!initialData;
    const isFreePlan = subscription?.plan === 'free';
    
    const [activityName, setActivityName] = useState(initialData?.name || '');
    // Cambiar estructura de options: [{desc: '', pts: ''}]
    const [options, setOptions] = useState(
        initialData?.options?.length
            ? initialData.options.map(opt => ({ desc: opt, pts: initialData.points?.[opt] || '' }))
            : [{ desc: '', pts: '' }]
    );
    // points ya no se usa como estado separado
    const [goalType, setGoalType] = useState(initialData?.goal?.type || 'weekly');
    const [goalTarget, setGoalTarget] = useState(initialData?.goal?.target || '');
    const [goalStartDate, setGoalStartDate] = useState(initialData?.goal?.startDate || new Date().toISOString().split('T')[0]);
    const [goalEndDate, setGoalEndDate] = useState(initialData?.goal?.endDate || new Date().toISOString().split('T')[0]);
    const [showGoalSection, setShowGoalSection] = useState(!!initialData?.goal);

    useEffect(() => {
        if (isOpen && initialData) {
            setActivityName(initialData.name || '');
            setOptions(
                initialData.options?.length
                    ? initialData.options.map(opt => ({ desc: opt, pts: initialData.points?.[opt] || '' }))
                    : [{ desc: '', pts: '' }]
            );
            setGoalType(initialData.goal?.type || 'weekly');
            setGoalTarget(initialData.goal?.target || '');
            setGoalStartDate(initialData.goal?.startDate || new Date().toISOString().split('T')[0]);
            setGoalEndDate(initialData.goal?.endDate || new Date().toISOString().split('T')[0]);
            setShowGoalSection(!!initialData.goal);
        } else if (isOpen && !initialData) {
            setActivityName('');
            setOptions([{ desc: '', pts: '' }]);
            setGoalType('weekly');
            setGoalTarget('');
            setGoalStartDate(new Date().toISOString().split('T')[0]);
            setGoalEndDate(new Date().toISOString().split('T')[0]);
            setShowGoalSection(false);
        }
    }, [isOpen, initialData]);

    const handleOptionChange = (index, field, value) => {
        setOptions(prev => prev.map((opt, i) => i === index ? { ...opt, [field]: value } : opt));
    };
    const addOption = () => setOptions([...options, { desc: '', pts: '' }]);
    const removeOption = (index) => setOptions(options.filter((_, i) => i !== index));

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!activityName.trim()) {
            alert('Por favor ingresa un nombre para la actividad.');
            return;
        }
        
        // Construir estructura para guardar
        let finalOptions = [];
        let points = {};
        
        if (isFreePlan) {
            // Para usuarios gratuitos: sin subniveles, siempre 1 punto
            finalOptions = [];
            points = {};
        } else {
            // Para usuarios premium: con subniveles y puntos personalizados
            finalOptions = options.map(o => o.desc.trim()).filter(o => o !== '');
            options.forEach(o => {
                if (o.desc.trim()) points[o.desc.trim()] = parseInt(o.pts) || 0;
            });
        }
        
        const activityData = {
            ...initialData,
            name: activityName.trim(),
            options: finalOptions,
            points: points,
        };
        
        // Solo agregar meta si es premium y está configurada
        if (!isFreePlan && showGoalSection && goalTarget && !isNaN(goalTarget) && goalTarget > 0) {
            const goalData = { type: goalType, target: parseInt(goalTarget) };
            if (goalType === 'custom') {
                if (goalStartDate > goalEndDate) {
                    alert('La fecha de inicio no puede ser posterior a la fecha de fin.');
                    return;
                }
                goalData.startDate = goalStartDate;
                goalData.endDate = goalEndDate;
            }
            activityData.goal = goalData;
        } else {
            delete activityData.goal;
        }
        
        onCreateActivity(activityData);
        onClose();
    };
    
    const handleCancel = () => {
        onClose();
    };
    
    if (!isOpen) return null;
    
    return (
        <>
            <style>{selectStyles}</style>
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className={`${currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col`}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className={`text-2xl font-bold ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{isEdit ? 'Editar Actividad' : 'Crear Nueva Actividad'}</h2>
                    <button onClick={handleCancel} className={`p-1 rounded-full ${currentTheme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
                        <svg className={`w-6 h-6 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                {/* Indicador de plan */}
                {isFreePlan && (
                    <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-600/50 rounded-lg">
                        <div className="flex items-center gap-2 text-yellow-300 text-sm">
                            <span>⚠️ Plan Gratuito:</span>
                            <span>Las actividades tendrán 1 punto automáticamente</span>
                        </div>
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="overflow-y-auto space-y-6 pr-2">
                    {/* Nombre de la actividad */}
                    <div>
                        <label htmlFor="activity-name" className={`block text-sm font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                            Nombre de la Actividad *
                        </label>
                        <input
                            id="activity-name"
                            type="text"
                            value={activityName}
                            onChange={(e) => setActivityName(e.target.value)}
                            placeholder="Ej: Leer, Ejercicio, Meditación..."
                            className={`w-full rounded-md p-3 border focus:ring-2 focus:ring-indigo-500 ${
                                currentTheme === 'dark' 
                                    ? 'bg-gray-700 border-gray-600 text-white' 
                                    : 'bg-white border-gray-300 text-gray-900'
                            }`}
                            required
                        />
                    </div>
                    
                    {/* Opciones/Subniveles - Solo para premium */}
                    {!isFreePlan && (
                        <div>
                            <label className={`block text-sm font-medium mb-3 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                                Subniveles/Opciones
                            </label>
                            <div className="space-y-3">
                                {options.map((option, index) => (
                                    <div key={index} className="flex items-center gap-2 w-full">
                                        <input
                                            type="text"
                                            value={option.desc}
                                            onChange={e => handleOptionChange(index, 'desc', e.target.value)}
                                            placeholder={`Opción ${index + 1}`}
                                            className={`flex-grow min-w-0 rounded-md p-2 border ${
                                                currentTheme === 'dark' 
                                                    ? 'bg-gray-700 border-gray-600 text-white' 
                                                    : 'bg-white border-gray-300 text-gray-900'
                                            }`}
                                            style={{ maxWidth: '60%' }}
                                        />
                                        <input
                                            type="number"
                                            min="0"
                                            value={option.pts}
                                            onChange={e => handleOptionChange(index, 'pts', e.target.value)}
                                            placeholder="Puntos"
                                            className={`rounded-md p-2 border text-center ${
                                                currentTheme === 'dark' 
                                                    ? 'bg-gray-700 border-gray-600 text-white' 
                                                    : 'bg-white border-gray-300 text-gray-900'
                                            }`}
                                            style={{ width: 70 }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeOption(index)}
                                            className="p-2 bg-red-600 hover:bg-red-700 rounded-full text-white flex-shrink-0"
                                            tabIndex={-1}
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
                    )}
                    
                    {/* Sección de Meta - Solo para premium */}
                    {!isFreePlan && (
                        <div className={`border-t ${currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} pt-4`}>
                            <div className="flex items-center justify-between mb-3">
                                <label className={`text-sm font-medium ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                                    Configurar Meta (Opcional)
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowGoalSection(!showGoalSection)}
                                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                                        showGoalSection
                                            ? 'bg-yellow-600 text-white'
                                            : currentTheme === 'dark'
                                                ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    {showGoalSection ? 'Ocultar' : 'Mostrar'}
                                </button>
                            </div>
                            {showGoalSection && (
                                <div className={`space-y-4 p-4 rounded-lg ${currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                                                Tipo de Meta
                                            </label>
                                            <select
                                                value={goalType}
                                                onChange={(e) => setGoalType(e.target.value)}
                                                className={`w-full rounded-md p-2 border ${
                                                    currentTheme === 'dark' 
                                                        ? 'bg-gray-600 border-gray-500 text-white' 
                                                        : 'bg-white border-gray-300 text-gray-900'
                                                }`}
                                            >
                                                <option value="weekly">Semanal</option>
                                                <option value="monthly">Mensual</option>
                                                <option value="custom">Personalizada</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                                                Puntos Objetivo *
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={goalTarget}
                                                onChange={(e) => setGoalTarget(e.target.value)}
                                                placeholder="Ej: 100"
                                                className={`w-full rounded-md p-2 border ${
                                                    currentTheme === 'dark' 
                                                        ? 'bg-gray-600 border-gray-500 text-white' 
                                                        : 'bg-white border-gray-300 text-gray-900'
                                                }`}
                                                required={showGoalSection}
                                            />
                                        </div>
                                    </div>
                                    {goalType === 'custom' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className={`block text-sm font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                                                    Fecha de Inicio
                                                </label>
                                                <input
                                                    type="date"
                                                    value={goalStartDate}
                                                    onChange={(e) => setGoalStartDate(e.target.value)}
                                                    className={`w-full rounded-md p-2 border ${
                                                        currentTheme === 'dark' 
                                                            ? 'bg-gray-600 border-gray-500 text-white' 
                                                            : 'bg-white border-gray-300 text-gray-900'
                                                    }`}
                                                />
                                            </div>
                                            <div>
                                                <label className={`block text-sm font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                                                    Fecha de Fin
                                                </label>
                                                <input
                                                    type="date"
                                                    value={goalEndDate}
                                                    onChange={(e) => setGoalEndDate(e.target.value)}
                                                    className={`w-full rounded-md p-2 border ${
                                                        currentTheme === 'dark' 
                                                            ? 'bg-gray-600 border-gray-500 text-white' 
                                                            : 'bg-white border-gray-300 text-gray-900'
                                                    }`}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Botones */}
                    <div className={`flex justify-end space-x-3 pt-4 border-t ${currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                        <button
                            type="button"
                            onClick={handleCancel}
                            className={`px-6 py-2 rounded-lg ${
                                currentTheme === 'dark' 
                                    ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                            }`}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 font-bold rounded-lg text-white"
                        >
                            {isEdit ? 'Guardar Cambios' : 'Crear Actividad'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
        </>
    );
};

export default CreateActivityModal; 