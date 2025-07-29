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
    const [isShowingExistingReflection, setIsShowingExistingReflection] = useState(false);
    const [hasSignificantChanges, setHasSignificantChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Función para generar hash de la entrada
    const generateEntryHash = (entry) => {
        const entryData = JSON.stringify({
            text: entry.text || '',
            tracked: entry.tracked || {}
        });
        // Use encodeURIComponent to handle special characters safely
        return btoa(encodeURIComponent(entryData)).slice(0, 20); // Hash simple para comparación
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
            const lastActivities = Object.keys(lastEntry.tracked || {}).length;
            const activitiesDiff = Math.abs(currentActivities - lastActivities);
            
            // Verificar si cambió el contenido de las actividades (no solo la cantidad)
            const currentActivitiesContent = JSON.stringify(currentEntry.tracked || {});
            const lastActivitiesContent = JSON.stringify(lastEntry.tracked || {});
            const activitiesContentChanged = currentActivitiesContent !== lastActivitiesContent;
            
            // Considerar significativo si hay más de 10 caracteres de diferencia, cambió el número de actividades, o cambió el contenido de las actividades
            return textDiff > 10 || activitiesDiff > 0 || activitiesContentChanged;
        }
        
        return false;
    };

    // Función para cargar reflexión guardada
    const loadTherapistReflection = async () => {
        if (!db || !user?.uid || !selectedDate) {
            console.log('Faltan parámetros para cargar reflexión');
            return;
        }
        
        try {
            const reflectionRef = doc(db, 'artifacts', appId, 'users', user.uid, 'entries', selectedDate);
            const reflectionDoc = await getDoc(reflectionRef);
            
            console.log(`Cargando reflexión para la fecha: ${selectedDate}`);
            
            if (reflectionDoc.exists()) {
                const data = reflectionDoc.data();
                console.log('Datos encontrados en Firestore:', data);
                
                if (data.therapistReflection) {
                    console.log(`Reflexión encontrada para ${selectedDate}, análisis: ${data.reflectionAnalysisCount || 0}/3`);
                    setTherapistReflection(data.therapistReflection);
                    setReflectionAnalysisCount(data.reflectionAnalysisCount || 0);
                    setLastEntryHash(data.lastEntryHash || '');
                    setLastAnalyzedEntry(data.lastAnalyzedEntry || null);
                } else {
                    console.log(`No hay reflexión guardada para ${selectedDate}`);
                    // Limpiar estado si no hay reflexión
                    setTherapistReflection('');
                    setReflectionAnalysisCount(0);
                    setLastEntryHash('');
                    setLastAnalyzedEntry(null);
                }
            } else {
                console.log(`No existe entrada para ${selectedDate}`);
                // Limpiar estado si no existe la entrada
                setTherapistReflection('');
                setReflectionAnalysisCount(0);
                setLastEntryHash('');
                setLastAnalyzedEntry(null);
            }
        } catch (error) {
            console.error('Error loading therapist reflection:', error);
            // Limpiar estado en caso de error
            setTherapistReflection('');
            setReflectionAnalysisCount(0);
            setLastEntryHash('');
            setLastAnalyzedEntry(null);
        }
    };

    // Función para guardar reflexión
    const saveTherapistReflection = async (reflection) => {
        if (!db || !user?.uid || !selectedDate) {
            console.error('Faltan parámetros para guardar reflexión');
            return;
        }
        
        setIsSaving(true);
        
        try {
            const reflectionRef = doc(db, 'artifacts', appId, 'users', user.uid, 'entries', selectedDate);
            const currentHash = generateEntryHash(currentEntry);
            const newAnalysisCount = reflectionAnalysisCount + 1;
            
            console.log(`Guardando reflexión para fecha: ${selectedDate}, análisis #${newAnalysisCount}`);
            console.log('Datos a guardar:', {
                therapistReflection: reflection.substring(0, 100) + '...',
                reflectionAnalysisCount: newAnalysisCount,
                lastEntryHash: currentHash,
                lastAnalyzedEntry: {
                    text: currentEntry.text || '',
                    tracked: currentEntry.tracked || {}
                }
            });
            
            // Usar setDoc con merge para crear o actualizar la entrada
            await setDoc(reflectionRef, {
                therapistReflection: reflection,
                reflectionAnalysisCount: newAnalysisCount,
                lastEntryHash: currentHash,
                lastAnalyzedEntry: {
                    text: currentEntry.text || '',
                    tracked: currentEntry.tracked || {}
                },
                reflectionUpdatedAt: new Date()
            }, { merge: true }); // merge: true permite actualizar sin sobrescribir otros campos
            
            // Actualizar estado local
            setTherapistReflection(reflection);
            setReflectionAnalysisCount(newAnalysisCount);
            setLastEntryHash(currentHash);
            setLastAnalyzedEntry({
                text: currentEntry.text || '',
                tracked: currentEntry.tracked || {}
            });
            
            console.log(`Reflexión guardada exitosamente para la fecha: ${selectedDate}`);
            
            // Verificar que se guardó correctamente
            const verificationDoc = await getDoc(reflectionRef);
            if (verificationDoc.exists()) {
                const savedData = verificationDoc.data();
                console.log('Verificación de guardado:', {
                    hasReflection: !!savedData.therapistReflection,
                    analysisCount: savedData.reflectionAnalysisCount,
                    hash: savedData.lastEntryHash
                });
                console.log('✅ Guardado completado exitosamente');
            } else {
                console.error('❌ Error: No se pudo verificar el guardado');
            }
        } catch (error) {
            console.error('Error saving therapist reflection:', error);
        } finally {
            setIsSaving(false);
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
    const generateAnalysis = async (forceNewAnalysis = false) => {
        const currentHash = generateEntryHash(currentEntry);
        
        // Si hay una reflexión guardada y no hay cambios significativos, mostrar la existente
        if (therapistReflection && !isSignificantChange(currentHash, lastEntryHash, currentEntry, lastAnalyzedEntry) && !forceNewAnalysis) {
            console.log('Mostrando reflexión existente - no hay cambios significativos');
            setAiResponse(therapistReflection);
            setIsShowingExistingReflection(true);
            return;
        }
        
        // Si la entrada ha cambiado significativamente o se fuerza un nuevo análisis, verificar límite
        if (reflectionAnalysisCount >= 3) {
            console.log('Límite de análisis alcanzado');
            setAiResponse('Has alcanzado el límite de 3 análisis por entrada. Modifica el contenido para poder hacer un nuevo análisis.');
            return;
        }
        
        // Hacer nuevo análisis
        console.log('Generando nuevo análisis...');
        setIsShowingExistingReflection(false);
        setHasSignificantChanges(false);
        const trackedActivitiesSummary = Object.entries(currentEntry.tracked || {}).map(([activityId, option]) => `- ${activities[activityId]?.name || 'Actividad'}: ${option}`).join('\n');
        const prompt = `Actúa como un terapeuta empático y perspicaz. Analiza la siguiente entrada de diario y las actividades registradas. Ofrece una reflexión amable, identifica posibles patrones o sentimientos subyacentes y proporciona una o dos sugerencias constructivas o preguntas para la autorreflexión. Sé conciso y alentador.\n\n**Entrada del Diario:**\n"${currentEntry.text || 'No se escribió nada.'}"\n\n**Actividades Registradas:**\n${trackedActivitiesSummary || 'No se registraron actividades.'}`;
        
        const response = await callAI(prompt);
        if (response) {
            await saveTherapistReflection(response);
        }
    };

    // Función para reanalizar
    const handleReanalyze = async () => {
        // Forzar un nuevo análisis
        await generateAnalysis(true);
    };

    // Limpiar estado cuando cambia la fecha (se ejecuta ANTES del useEffect de carga)
    useEffect(() => {
        if (selectedDate && !isSaving) {
            console.log(`=== LIMPIANDO ESTADO para fecha: ${selectedDate} ===`);
            // Limpiar completamente el estado para la nueva fecha
            setTherapistReflection('');
            setReflectionAnalysisCount(0);
            setLastEntryHash('');
            setLastAnalyzedEntry(null);
            setAiResponse('');
            setIsShowingExistingReflection(false);
            setHasSignificantChanges(false);
        } else if (isSaving) {
            console.log('No limpiando estado - hay un guardado en progreso');
        }
    }, [selectedDate, isSaving]);

    // Cargar reflexión cuando se abre el modal o cambia la fecha
    useEffect(() => {
        if (isOpen && db && user && selectedDate) {
            console.log(`Modal abierto para fecha: ${selectedDate}`);
            console.log(`Entrada actual:`, currentEntry);
            setIsLoading(true);
            
            loadTherapistReflection().then(() => {
                setIsLoading(false);
                
                // Esperar un momento para que el estado se actualice
                setTimeout(() => {
                    console.log(`=== PROCESANDO REFLEXIÓN para fecha: ${selectedDate} ===`);
                    // Solo generar análisis si no hay reflexión existente o si hay cambios significativos
                    const currentHash = generateEntryHash(currentEntry);
                    console.log(`Hash actual: ${currentHash}, Hash guardado: ${lastEntryHash}`);
                    console.log(`Reflexión existente: ${therapistReflection ? 'SÍ' : 'NO'}`);
                    
                    if (!therapistReflection) {
                        console.log('No hay reflexión guardada, generando nuevo análisis...');
                        generateAnalysis();
                    } else if (isSignificantChange(currentHash, lastEntryHash, currentEntry, lastAnalyzedEntry)) {
                        console.log('Hay cambios significativos, generando nuevo análisis...');
                        generateAnalysis();
                    } else {
                        // Mostrar reflexión existente
                        console.log('Mostrando reflexión existente...');
                        setAiResponse(therapistReflection);
                        setIsShowingExistingReflection(true);
                    }
                }, 100);
            });
        }
    }, [isOpen, selectedDate, db, user]);

    // Detectar cambios en la entrada actual cuando el modal está abierto
    useEffect(() => {
        if (isOpen && therapistReflection) {
            const currentHash = generateEntryHash(currentEntry);
            const hasSignificantChanges = isSignificantChange(currentHash, lastEntryHash, currentEntry, lastAnalyzedEntry);
            
            if (hasSignificantChanges) {
                console.log('Detectados cambios significativos en la entrada');
                setIsShowingExistingReflection(false);
                setHasSignificantChanges(true);
                // No generar análisis automáticamente, solo indicar que hay cambios
            } else {
                setHasSignificantChanges(false);
            }
        }
    }, [currentEntry, isOpen, therapistReflection, lastEntryHash, lastAnalyzedEntry]);

    // Limpiar estado cuando se cierra el modal
    useEffect(() => {
        if (!isOpen) {
            console.log('Modal cerrado, limpiando estado temporal');
            setAiResponse('');
            setIsShowingExistingReflection(false);
            setHasSignificantChanges(false);
            setIsAILoading(false);
        }
    }, [isOpen]);

    // Debug: Verificar estado cuando cambia la fecha
    useEffect(() => {
        if (selectedDate) {
            console.log(`=== DEBUG: Cambio de fecha a ${selectedDate} ===`);
            console.log('Estado actual:', {
                therapistReflection: therapistReflection ? 'SÍ' : 'NO',
                reflectionAnalysisCount,
                lastEntryHash,
                hasLastAnalyzedEntry: !!lastAnalyzedEntry
            });
        }
    }, [selectedDate, therapistReflection, reflectionAnalysisCount, lastEntryHash, lastAnalyzedEntry]);

    // Verificar que el estado se limpió correctamente después del cambio de fecha
    useEffect(() => {
        if (selectedDate && !therapistReflection && !lastEntryHash) {
            console.log(`✅ Estado limpiado correctamente para fecha: ${selectedDate}`);
        }
    }, [selectedDate, therapistReflection, lastEntryHash]);

    // Verificar que el guardado se completó correctamente
    useEffect(() => {
        if (!isSaving && therapistReflection && lastEntryHash) {
            console.log(`✅ Estado persistente confirmado para fecha: ${selectedDate}`);
            console.log('Estado actual:', {
                hasReflection: !!therapistReflection,
                analysisCount: reflectionAnalysisCount,
                hash: lastEntryHash
            });
        }
    }, [isSaving, therapistReflection, lastEntryHash, selectedDate, reflectionAnalysisCount]);

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 ${currentTheme === 'dark' ? 'bg-black bg-opacity-70' : 'bg-black bg-opacity-50'} flex items-center justify-center z-50 p-4`}>
            <div className={`${currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl p-6 w-full max-w-lg flex flex-col`}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-2xl font-bold ${currentTheme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`}>
                        Reflexión del Terapeuta IA
                    </h2>
                    {isShowingExistingReflection && (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                            currentTheme === 'dark' 
                                ? 'bg-blue-900 text-blue-200' 
                                : 'bg-blue-100 text-blue-800'
                        }`}>
                            Reflexión guardada
                        </span>
                    )}
                    {hasSignificantChanges && (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                            currentTheme === 'dark' 
                                ? 'bg-orange-900 text-orange-200' 
                                : 'bg-orange-100 text-orange-800'
                        }`}>
                            Cambios detectados
                        </span>
                    )}
                </div>
                
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
                    {/* Información del conteo de análisis y estado */}
                    <div className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        <div>Análisis {reflectionAnalysisCount}/3</div>
                        {reflectionAnalysisCount >= 3 && (
                            <div className="text-orange-500 font-medium">Límite alcanzado</div>
                        )}
                    </div>
                    
                    <div className="flex gap-3">
                        {!isAILoading && reflectionAnalysisCount < 3 && (
                            <button 
                                onClick={handleReanalyze}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition"
                                title="Generar una nueva reflexión"
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