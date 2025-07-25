import React, { useState, useMemo, useRef } from 'react';

// Importar ActivityTrackerItem desde el mismo directorio temporalmente
import ActivityTrackerItem from './ActivityTrackerItem';

const DiaryEntryEditor = ({ currentEntry, onTextChange, activities, onTrackActivity, onAddOption, onOpenDefineActivitiesModal, onConsultAI, onWritingAssistant, onUntrackActivity, userPrefs, onUpdateUserPrefs, selectedDate, onDateChange, textareaRef }) => {
    const [activeTab, setActiveTab] = useState('entrada');
    const [focusMode, setFocusMode] = useState(false);

    const fontOptions = [
        { id: 'patrick-hand', name: 'Patrick Hand' },
        { id: 'caveat', name: 'Caveat' },
        { id: 'indie-flower', name: 'Indie Flower' },
        { id: 'kalam', name: 'Kalam' },
        { id: 'gochi-hand', name: 'Gochi Hand' },
        { id: 'lora', name: 'Lora (Serif)' },
        { id: 'sans', name: 'Nunito Sans (Simple)' },
    ];

    const fontSizeOptions = [
        { id: 'text-lg', name: 'Muy Pequeño'},
        { id: 'text-xl', name: 'Pequeño' },
        { id: 'text-2xl', name: 'Mediano' },
        { id: 'text-3xl', name: 'Grande' },
        { id: 'text-4xl', name: 'Extra Grande' },
    ];

    const fontClassMap = {
        'patrick-hand': 'font-patrick-hand',
        'caveat': 'font-caveat',
        'indie-flower': 'font-indie-flower',
        'kalam': 'font-kalam',
        'gochi-hand': 'font-gochi-hand',
        'lora': 'font-lora',
        'sans': 'font-sans',
    };

    const fontSizeClassMap = {
        'text-lg': 'text-lg',
        'text-xl': 'text-xl',
        'text-2xl': 'text-2xl',
        'text-3xl': 'text-3xl',
        'text-4xl': 'text-4xl',
    };

    const [trackedActivityIds, untrackedActivities] = useMemo(() => {
        const trackedIds = Object.keys(currentEntry?.tracked || {});
        const untracked = Object.values(activities).filter(act => !trackedIds.includes(act.id));
        return [trackedIds, untracked];
    }, [currentEntry, activities]);

    const [lastTrackedId, setLastTrackedId] = useState(null);
    const handleAddActivitySelect = (e) => {
        const activityId = e.target.value;
        if (!activityId || !activities[activityId]) { e.target.value = ""; return; }
        const activity = activities[activityId];
        const initialValue = activity.options?.[0] || '';
        onTrackActivity(activityId, initialValue);
        setLastTrackedId(activityId);
        e.target.value = "";
    };
    React.useEffect(() => {
        if (lastTrackedId) {
            const timeout = setTimeout(() => setLastTrackedId(null), 1000);
            return () => clearTimeout(timeout);
        }
    }, [lastTrackedId]);

    const tabBaseStyle = "px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-200";
    const tabActiveStyle = "bg-gray-800 text-white";
    const tabInactiveStyle = "bg-gray-700 text-gray-400 hover:bg-gray-600";

    // Funciones para manejar los clicks de las pestañas y fecha
    const handleTabClick = (tab) => {
        setActiveTab(tab);
        setFocusMode(false);
    };

    const handleDateChange = (e) => {
        onDateChange(e.target.value);
        setFocusMode(false);
    };

    return (
        <div className={`flex flex-col flex-grow relative ${focusMode ? 'z-50 fixed inset-0 bg-gray-900' : ''}`}>
            {/* Botón de modo enfoque solo en móvil, solo si no está activo y solo en pestaña Entrada */}
            {!focusMode && activeTab === 'entrada' && (
                <button
                    className="md:hidden absolute top-2 right-2 z-20 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full p-2 shadow-lg focus-mode-btn"
                    title="Modo enfoque"
                    onClick={() => setFocusMode(true)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V6a2 2 0 012-2h2m8 0h2a2 2 0 012 2v2m0 8v2a2 2 0 01-2 2h-2m-8 0H6a2 2 0 01-2-2v-2" /></svg>
                </button>
            )}
            {/* Elementos normales ocultos en modo enfoque */}
            {!focusMode && (
                <div className="flex justify-between items-center flex-shrink-0 px-4 md:px-6 pt-4">
                    <div className="flex border-b border-gray-700">
                        <button onClick={() => handleTabClick('entrada')} className={`${tabBaseStyle} ${activeTab === 'entrada' ? tabActiveStyle : tabInactiveStyle}`}>Entrada</button>
                        <button onClick={() => handleTabClick('actividades')} className={`${tabBaseStyle} activities-tab ${activeTab === 'actividades' ? tabActiveStyle : tabInactiveStyle}`}>Actividades</button>
                    </div>
                    <input type="date" value={selectedDate} onChange={handleDateChange} className="bg-gray-700 border-gray-600 text-white rounded-lg p-2 focus:ring-2 focus:ring-indigo-500" />
                </div>
            )}
            {/* Área de escritura en modo enfoque ocupa toda la pantalla */}
            {activeTab === 'entrada' && (
                <div className={`bg-gray-800 rounded-b-lg ${focusMode ? 'fixed inset-0 z-50 flex flex-col justify-center items-center p-2' : 'p-2 flex flex-col flex-grow mb-4 md:mb-6'}`}>
                    <textarea
                        ref={textareaRef}
                        value={currentEntry?.text || ''}
                        onChange={onTextChange}
                        placeholder="Escribe un título en la primera línea..."
                        className={`w-full flex-grow rounded-md p-3 border-none focus:ring-0 transition resize-none notebook journal-editor leading-[1.5] ${fontSizeClassMap[userPrefs.fontSize]} ${fontClassMap[userPrefs.font]} ${focusMode ? 'h-[80vh] text-lg' : ''} writing-area`}
                        style={focusMode ? {minHeight: '60vh'} : {}}
                    />
                    {/* Botón para salir del modo enfoque */}
                    {focusMode && (
                        <button
                            className="fixed top-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-lg"
                            title="Salir de modo enfoque"
                            onClick={() => setFocusMode(false)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    )}
                    {/* El resto de controles solo si no está en modo enfoque */}
                    {!focusMode && (
                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700 flex-wrap gap-4 flex-shrink-0">
                            <div className="flex items-center gap-2 flex-wrap text-xs">
                                <div className="flex items-center gap-1 min-w-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10.755 2.168A.75.75 0 009.245 2.168L3.32 13.5h2.978l1.035-2.5h4.334l1.035 2.5h2.978L10.755 2.168zm-2.034 7.5L10 4.17l1.279 5.5H8.721z" /></svg>
                                    <select
                                        id="font-select"
                                        value={userPrefs.font}
                                        onChange={(e) => onUpdateUserPrefs({ font: e.target.value })}
                                        className="bg-gray-700 text-white rounded p-0.5 border border-gray-600 text-xs min-w-0"
                                        style={{maxWidth:'90px'}}
                                    >
                                        {fontOptions.map(font => (
                                            <option key={font.id} value={font.id}>{font.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center gap-1 min-w-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path d="M8.25 3.75a.75.75 0 01.75.75v10.5a.75.75 0 01-1.5 0V4.5a.75.75 0 01.75-.75zM13.25 5.75a.75.75 0 01.75.75v8.5a.75.75 0 01-1.5 0V6.5a.75.75 0 01.75-.75zM4.25 8.75a.75.75 0 01.75.75v2.5a.75.75 0 01-1.5 0v-2.5a.75.75 0 01.75-.75z" /></svg>
                                    <select
                                        id="fontsize-select"
                                        value={userPrefs.fontSize}
                                        onChange={(e) => onUpdateUserPrefs({ fontSize: e.target.value })}
                                        className="bg-gray-700 text-white rounded p-0.5 border border-gray-600 text-xs min-w-0"
                                        style={{maxWidth:'70px'}}
                                    >
                                        {fontSizeOptions.map(size => (
                                            <option key={size.id} value={size.id}>{size.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-grow"></div>
                                <button 
                                    onClick={() => window.dispatchEvent(new CustomEvent('openOnboarding'))} 
                                    title="Ayuda / Tutorial" 
                                    className="text-gray-400 hover:text-blue-300 transition-colors p-1"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <button title="Recibe sugerencias para mejorar tu escritura" onClick={onWritingAssistant} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold p-2 rounded-lg text-sm flex items-center gap-2 writing-assistant-btn">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                                </button>
                                <button title="Recibe una reflexión sobre tu entrada y actividades" onClick={onConsultAI} className="bg-purple-600 hover:bg-purple-700 text-white font-bold p-2 rounded-lg text-sm flex items-center gap-2 ai-consult-btn">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a2 2 0 100 4 2 2 0 000-4z" clipRule="evenodd" /></svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
            {/* Tab de actividades solo si no está en modo enfoque */}
            {activeTab === 'actividades' && !focusMode && (
                <div className="bg-gray-800 rounded-b-lg p-4 mx-4 md:mx-6 mb-4 md:mb-6">
                    <div className="space-y-4 min-h-[50px]">
                        {trackedActivityIds.length > 0 ? (
                            trackedActivityIds.map((id, idx) => activities[id]).filter(Boolean).sort((a,b) => a.name.localeCompare(b.name)).map(activity => (
                                <ActivityTrackerItem
                                    key={activity.id}
                                    activity={activity}
                                    selectedValue={currentEntry?.tracked?.[activity.id] || ''}
                                    onValueChange={(value) => onTrackActivity(activity.id, value)}
                                    onUntrack={onUntrackActivity}
                                    autoFocus={lastTrackedId === activity.id}
                                />
                            ))
                        ) : (<div className="text-center py-4 text-gray-400 italic">No hay actividades registradas para este día.</div>)}
                    </div>
                    <div className="mt-6 border-t border-gray-700 pt-4 flex flex-col sm:flex-row items-center gap-4">
                        <select onChange={handleAddActivitySelect} defaultValue="" className="w-full sm:flex-grow bg-gray-600 text-white rounded-md p-2 border border-gray-500 focus:ring-1 focus:ring-indigo-400"><option value="" disabled>+ Registrar una actividad...</option>{untrackedActivities.sort((a,b) => a.name.localeCompare(b.name)).map(act => (<option key={act.id} value={act.id}>{act.name}</option>))}</select>
                        <div className="flex items-center gap-4">
                            <button onClick={onOpenDefineActivitiesModal} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 whitespace-nowrap">Definir Actividades</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DiaryEntryEditor; 