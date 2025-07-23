import React from 'react';

const ActivityTrackerItem = ({ activity, selectedValue, onValueChange, onUntrack, autoFocus }) => {
    const selectRef = React.useRef();
    React.useEffect(() => {
        if (autoFocus && selectRef.current) {
            selectRef.current.focus();
        }
    }, [autoFocus]);
    const hasOptions = Array.isArray(activity.options) && activity.options.length > 0;
    const selectedPoints = activity.points?.[selectedValue] || 0;
    
    return (
        <div className="bg-gray-700 p-3 rounded-lg">
            {/* Nombre de la actividad */}
            <div className="mb-3">
                <span className="font-semibold text-white">{activity.name}</span>
            </div>
            
            {/* Input/Dropdown y controles en la misma línea */}
            <div className="flex items-center gap-3">
                <div className="flex-grow">
                    {hasOptions ? (
                        <select 
                            ref={selectRef}
                            value={selectedValue} 
                            onChange={(e) => onValueChange(e.target.value)} 
                            className="w-full bg-gray-600 text-white rounded-md p-2 border border-gray-500"
                        >
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
                            className="w-full bg-gray-600 text-white rounded-md p-2 border border-gray-500" 
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
                        className="p-1 bg-gray-600 hover:bg-red-800 rounded-full text-gray-300 hover:text-white transition-colors" 
                        aria-label={`Quitar ${activity.name} de este día`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ActivityTrackerItem; 