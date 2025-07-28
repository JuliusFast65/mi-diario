import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const TherapistReflection = ({ 
    isOpen, 
    onClose, 
    db, 
    user, 
    appId, 
    selectedDate, 
    currentEntry, 
    activities,
    currentTheme 
}) => {
    const [therapistReflection, setTherapistReflection] = useState('');
    const [reflectionAnalysisCount, setReflectionAnalysisCount] = useState(0);
    const [lastEntryHash, setLastEntryHash] = useState('');
    const [lastAnalyzedEntry, setLastAnalyzedEntry] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState('');
    const [isAILoading, setIsAILoading] = useState(false);

    // Función para generar hash de la entrada
    const generateEntryHash = (entry) => {
        const entryData = JSON.stringify({
            text: entry.text || '',
            tracked: entry.tracked || {}
        });
        return btoa(entryData).slice(0, 20); // Hash simple para comparación
    };

    // Función para detectar si el cambio es significativo
    const isSignificantChange = (currentHash, lastHash, currentEntry, lastEntry) => {
        // Si no hay entrada previa, cualquier entrada es significativa
        if (!lastHash || !lastEntry) return true;
        
        // Si el hash es diferente, hay cambio
        if (currentHash !== lastHash) {
            // Verificar si el cambio es significativo (más de 10 caracteres de diferencia en el texto)
            const currentText = currentEntry.text || '';
            const lastText = lastEntry.text || '';
            const textDiff = Math.abs(currentText.length - lastText.length);
            
            // También verificar si cambió el número de actividades
            const currentActivities = Object.keys(currentEntry.tracked || {}).length;
            const lastActivities = Object.keys(lastEntry || {}).length;
            const activitiesDiff = Math.abs(currentActivities - lastActivities);
            
            // Considerar significativo si hay más de 10 caracteres de diferencia o cambió el número de actividades
            return textDiff > 10 || activitiesDiff > 0;
        }
        
        return false;
    };

    // Función para cargar reflexión guardada
    const loadTherapistReflection = async () => {
        if (!db || !user?.uid) return;
        
        try {
            const reflectionRef = doc(db, 'artifacts', appId, 'users', user.uid, 'entries', selectedDate);
            const reflectionDoc = await getDoc(reflectionRef);
            
            console.log(`Cargando reflexión para la fecha: ${selectedDate}`);
            
            if (reflectionDoc.exists()) {
                const data = reflectionDoc.data();
                if (data.therapistReflection) {
                    setTherapistReflection(data.therapistReflection);
                    setReflectionAnalysisCount(data.reflectionAnalysisCount || 0);
                    setLastEntryHash(data.lastEntryHash || '');
                    setLastAnalyzedEntry(data.lastAnalyzedEntry || null);
                    console.log(`Reflexión encontrada para ${selectedDate}, análisis: ${data.reflectionAnalysisCount || 0}/3`);
                } else {
                    console.log(`No hay reflexión guardada para ${selectedDate}`);
                }
            } else {
                console.log(`No existe entrada para ${selectedDate}`);
            }
        } catch (error) {
            console.error('Error loading therapist reflection:', error);
        }
    };

    // Función para guardar reflexión
    const saveTherapistReflection = async (reflection) => {
        if (!db || !user?.uid) return;
        
        try {
            const reflectionRef = doc(db, 'artifacts', appId, 'users', user.uid, 'entries', selectedDate);
            const currentHash = generateEntryHash(currentEntry);
            
            // Usar setDoc con merge para crear o actualizar la entrada
            await setDoc(reflectionRef, {
                therapistReflection: reflection,
                reflectionAnalysisCount: reflectionAnalysisCount + 1,
                lastEntryHash: currentHash,
                lastAnalyzedEntry: {
                    text: currentEntry.text || '',
                    tracked: currentEntry.tracked || {}
                },
                reflectionUpdatedAt: new Date()
            }, { merge: true }); // merge: true permite actualizar sin sobrescribir otros campos
            
            setTherapistReflection(reflection);
            setReflectionAnalysisCount(prev => prev + 1);
            setLastEntryHash(currentHash);
            setLastAnalyzedEntry({
                text: currentEntry.text || '',
                tracked: currentEntry.tracked || {}
            });
            
            console.log(`Reflexión guardada para la fecha: ${selectedDate}`);
        } catch (error) {
            console.error('Error saving therapist reflection:', error);
        }
    };

    // Función para llamar a la IA
    const callAI = async (prompt) => {
        setIsAILoading(true);
        setAiResponse('');
        
        try {
            const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo procesar la respuesta.";
            setAiResponse(textResponse);
            return textResponse;
        } catch (error) {
            setAiResponse("Error al conectar con la IA.");
            return null;
        } finally {
            setIsAILoading(false);
        }
    };

    // Función para generar análisis
    const generateAnalysis = async () => {
        const currentHash = generateEntryHash(currentEntry);
        
        // Si hay una reflexión guardada y no hay cambios significativos, mostrar la existente
        if (therapistReflection && !isSignificantChange(currentHash, lastEntryHash, currentEntry, lastAnalyzedEntry)) {
            setAiResponse(therapistReflection);
            return;
        }
        
        // Si la entrada ha cambiado significativamente, verificar límite de análisis
        if (reflectionAnalysisCount >= 3) {
            alert('Has alcanzado el límite de 3 análisis por entrada. Modifica el contenido para poder hacer un nuevo análisis.');
            return;
        }
        
        // Hacer nuevo análisis
        const trackedActivitiesSummary = Object.entries(currentEntry.tracked || {}).map(([activityId, option]) => `- ${activities[activityId]?.name || 'Actividad'}: ${option}`).join('\n');
        const prompt = `Actúa como un terapeuta empático y perspicaz. Analiza la siguiente entrada de diario y las actividades registradas. Ofrece una reflexión amable, identifica posibles patrones o sentimientos subyacentes y proporciona una o dos sugerencias constructivas o preguntas para la autorreflexión. Sé conciso y alentador.\n\n**Entrada del Diario:**\n"${currentEntry.text || 'No se escribió nada.'}"\n\n**Actividades Registradas:**\n${trackedActivitiesSummary || 'No se registraron actividades.'}`;
        
        const response = await callAI(prompt);
        if (response) {
            await saveTherapistReflection(response);
        }
    };

    // Función para reanalizar
    const handleReanalyze = async () => {
        // Verificar límite de análisis
        if (reflectionAnalysisCount >= 3) {
            alert('Has alcanzado el límite de 3 análisis por entrada. Modifica el contenido para poder hacer un nuevo análisis.');
            return;
        }
        
        const trackedActivitiesSummary = Object.entries(currentEntry.tracked || {}).map(([activityId, option]) => `- ${activities[activityId]?.name || 'Actividad'}: ${option}`).join('\n');
        const prompt = `Actúa como un terapeuta empático y perspicaz. Analiza la siguiente entrada de diario y las actividades registradas. Ofrece una reflexión amable, identifica posibles patrones o sentimientos subyacentes y proporciona una o dos sugerencias constructivas o preguntas para la autorreflexión. Sé conciso y alentador.\n\n**Entrada del Diario:**\n"${currentEntry.text || 'No se escribió nada.'}"\n\n**Actividades Registradas:**\n${trackedActivitiesSummary || 'No se registraron actividades.'}`;
        
        const response = await callAI(prompt);
        if (response) {
            await saveTherapistReflection(response);
        }
    };

    // Cargar reflexión cuando se abre el modal o cambia la fecha
    useEffect(() => {
        if (isOpen && db && user && selectedDate) {
            console.log(`Modal abierto para fecha: ${selectedDate}`);
            setIsLoading(true);
            loadTherapistReflection().then(() => {
                setIsLoading(false);
                generateAnalysis();
            });
        }
    }, [isOpen, selectedDate, db, user]);

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 ${currentTheme === 'dark' ? 'bg-black bg-opacity-70' : 'bg-black bg-opacity-50'} flex items-center justify-center z-50 p-4`}>
            <div className={`${currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl p-6 w-full max-w-lg flex flex-col`}>
                <h2 className={`text-2xl font-bold ${currentTheme === 'dark' ? 'text-purple-300' : 'text-purple-600'} mb-4`}>
                    Reflexión del Terapeuta IA
                </h2>
                
                <div className="overflow-y-auto max-h-[60vh] pr-2">
                    {isLoading ? (
                        <div className="text-center py-10">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
                            <p className={`mt-4 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Cargando...</p>
                        </div>
                    ) : isAILoading ? (
                        <div className="text-center py-10">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
                            <p className={`mt-4 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Analizando...</p>
                        </div>
                    ) : (
                        <div className={`${currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'} whitespace-pre-wrap prose ${currentTheme === 'dark' ? 'prose-invert' : ''} max-w-none`} 
                             dangerouslySetInnerHTML={{ __html: aiResponse.replace(/\n/g, '<br />') }} />
                    )}
                </div>
                
                <div className={`flex justify-between items-center mt-6 pt-4 border-t ${currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
                    {/* Información del conteo de análisis */}
                    <div className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Análisis {reflectionAnalysisCount}/3
                    </div>
                    
                    <div className="flex gap-3">
                        {!isAILoading && reflectionAnalysisCount < 3 && (
                            <button 
                                onClick={handleReanalyze}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition"
                            >
                                Reanalizar
                            </button>
                        )}
                        
                        <button 
                            onClick={onClose} 
                            className={`px-4 py-2 rounded-lg transition-colors ${
                                currentTheme === 'dark' 
                                    ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                            }`}
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TherapistReflection; 