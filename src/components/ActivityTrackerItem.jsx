import React from 'react';

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

const ActivityTrackerItem = ({ activity, selectedValue, onValueChange, onUntrack, autoFocus, isSimpleActivity, getActivityPoints, currentTheme = 'dark' }) => {
    const selectRef = React.useRef();
    React.useEffect(() => {
        if (autoFocus && selectRef.current) {
            selectRef.current.focus();
        }
    }, [autoFocus]);
    
    const hasOptions = Array.isArray(activity.options) && activity.options.length > 0;
    const isSimple = isSimpleActivity ? isSimpleActivity(activity.id) : false;
    const selectedPoints = getActivityPoints ? getActivityPoints(activity.id, selectedValue) : (activity.points?.[selectedValue] || 0);
    
    // Para actividades simples, mostrar solo el nombre y puntos
    if (isSimple) {
        const isRegistered = !!selectedValue;
        
        return (
            <>
                <style>{selectStyles}</style>
            <div className={`${currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} p-3 rounded-lg border ${currentTheme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                {/* Nombre de la actividad y estado */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className={`font-semibold ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{activity.name}</span>
                        {isRegistered && (
                            <div className="bg-green-600 text-white px-2 py-1 rounded text-sm font-semibold">
                                1 pt
                            </div>
                        )}
                    </div>
                    
                    {/* Botón de eliminar */}
                    <button 
                        onClick={() => onUntrack(activity.id)} 
                        className={`p-1 rounded-full transition-colors ${
                            currentTheme === 'dark' 
                                ? 'bg-gray-600 hover:bg-red-800 text-gray-300 hover:text-white' 
                                : 'bg-gray-300 hover:bg-red-500 text-gray-600 hover:text-white'
                        }`}
                        aria-label={`Quitar ${activity.name} de este día`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
            </>
        );
    }
    
    // Para actividades premium, mantener la interfaz original
    return (
        <>
            <style>{selectStyles}</style>
            <div className={`${currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} p-3 rounded-lg border ${currentTheme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
            {/* Nombre de la actividad */}
            <div className="mb-3">
                <span className={`font-semibold ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{activity.name}</span>
            </div>
            
            {/* Input/Dropdown y controles en la misma línea */}
            <div className="flex items-center gap-3">
                <div className="flex-grow">
                    {hasOptions ? (
                        <select 
                            ref={selectRef}
                            value={selectedValue} 
                            onChange={(e) => onValueChange(e.target.value)} 
                            className={`w-full rounded-md p-2 border ${
                                currentTheme === 'dark' 
                                    ? 'bg-gray-600 border-gray-500 text-white' 
                                    : 'bg-white border-gray-300 text-gray-900'
                            }`}
                        >
                            <option value="">Seleccionar opción...</option>
                            {activity.options.map(opt => (
                                <option key={opt} value={opt}>
                                    {opt} {activity.points?.[opt] ? `(${activity.points[opt]} pts)` : ''}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input 
                            type="text" 
                            placeholder="Añade un valor (ej: 30 mins)" 
                            value={selectedValue} 
                            onChange={(e) => onValueChange(e.target.value)} 
                            className={`w-full rounded-md p-2 border ${
                                currentTheme === 'dark' 
                                    ? 'bg-gray-600 border-gray-500 text-white' 
                                    : 'bg-white border-gray-300 text-gray-900'
                            }`}
                        />
                    )}
                </div>
                
                {/* Puntos y botón de eliminar */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {selectedPoints > 0 && (
                        <div className="bg-green-600 text-white px-2 py-1 rounded text-sm font-semibold">
                            {selectedPoints} pts
                        </div>
                    )}
                    <button 
                        onClick={() => onUntrack(activity.id)} 
                        className={`p-1 rounded-full transition-colors ${
                            currentTheme === 'dark' 
                                ? 'bg-gray-600 hover:bg-red-800 text-gray-300 hover:text-white' 
                                : 'bg-gray-300 hover:bg-red-500 text-gray-600 hover:text-white'
                        }`}
                        aria-label={`Quitar ${activity.name} de este día`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
        </>
    );
};

export default ActivityTrackerItem; 