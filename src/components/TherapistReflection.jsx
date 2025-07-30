import React, { useState, useEffect, useRef } from 'react';
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
    const [isSaving, setIsSaving] = useState(false);

    // Debug: Solo mostrar log cuando el modal esté abierto
    useEffect(() => {
        if (isOpen) {
            console.log('🎯 TherapistReflection recibió currentEntry:', {
                textLength: (currentEntry?.text || '').length,
                textPreview: (currentEntry?.text || '').substring(0, 100) + '...',
                activitiesCount: Object.keys(currentEntry?.tracked || {}).length,
                isOpen: isOpen
            });
        }
    }, [currentEntry, isOpen]);

    // Función para generar hash de la entrada
    const generateEntryHash = (entry) => {
        const entryData = JSON.stringify({
            text: entry.text || '',
            tracked: entry.tracked || {}
        });
        // Use encodeURIComponent to handle special characters safely
        const hash = btoa(encodeURIComponent(entryData)).slice(0, 20); // Hash simple para comparación
        console.log('🔐 Generando hash para entrada:', {
            textLength: (entry.text || '').length,
            activitiesCount: Object.keys(entry.tracked || {}).length,
            hash: hash
        });
        return hash;
    };

    // Función para detectar si el cambio es significativo
    const isSignificantChange = (currentHash, lastHash, currentEntry, lastEntry) => {
        console.log('🔍 Verificando cambios significativos...');
        console.log('Hash actual:', currentHash);
        console.log('Hash guardado:', lastHash);
        console.log('Hash diferente:', currentHash !== lastHash);
        
        // Si no hay entrada previa, cualquier entrada es significativa
        if (!lastHash || !lastEntry) {
            console.log('✅ Cambio significativo: No hay entrada previa');
            return true;
        }
        
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
            
            console.log('📊 Detalles del cambio:');
            console.log('- Diferencia de texto:', textDiff, 'caracteres');
            console.log('- Diferencia de actividades:', activitiesDiff);
            console.log('- Contenido de actividades cambió:', activitiesContentChanged);
            console.log('- Texto actual:', currentText.substring(0, 50) + '...');
            console.log('- Texto guardado:', lastText.substring(0, 50) + '...');
            
            // Considerar significativo si hay más de 10 caracteres de diferencia, cambió el número de actividades, o cambió el contenido de las actividades
            const isSignificant = textDiff > 10 || activitiesDiff > 0 || activitiesContentChanged;
            console.log('✅ Cambio significativo:', isSignificant);
            return isSignificant;
        }
        
        console.log('❌ No hay cambios significativos');
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
            
            let hasReflection = false;
            let loadedReflection = '';
            let loadedAnalysisCount = 0;
            let loadedHash = '';
            let loadedAnalyzedEntry = null;
            
            if (reflectionDoc.exists()) {
                const data = reflectionDoc.data();
                console.log('Datos encontrados en Firestore:', data);
                
                if (data.therapistReflection) {
                    console.log(`Reflexión encontrada para ${selectedDate}, análisis: ${data.reflectionAnalysisCount || 0}/3`);
                    hasReflection = true;
                    loadedReflection = data.therapistReflection;
                    loadedAnalysisCount = data.reflectionAnalysisCount || 0;
                    loadedHash = data.lastEntryHash || '';
                    loadedAnalyzedEntry = data.lastAnalyzedEntry || null;
                } else {
                    console.log(`No hay reflexión guardada para ${selectedDate}`);
                }
            } else {
                console.log(`No existe entrada para ${selectedDate}`);
            }
            
            // Actualizar estado con los datos cargados
            setTherapistReflection(loadedReflection);
            setReflectionAnalysisCount(loadedAnalysisCount);
            setLastEntryHash(loadedHash);
            setLastAnalyzedEntry(loadedAnalyzedEntry);
            
            console.log('📋 Datos cargados para comparación:');
            console.log('- Reflexión cargada:', loadedReflection ? 'SÍ' : 'NO');
            console.log('- Hash cargado:', loadedHash);
            console.log('- Entrada analizada anterior:', loadedAnalyzedEntry);
            
        } catch (error) {
            console.error('Error loading therapist reflection:', error);
            // Limpiar estado en caso de error
            setTherapistReflection('');
            setReflectionAnalysisCount(0);
            setLastEntryHash('');
            setLastAnalyzedEntry(null);
        }
    };

    // Función para guardar reflexión (simplificada)
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
            
            // Asegurar que la respuesta se mantenga visible
            setAiResponse(reflection);
            
            console.log(`Reflexión guardada exitosamente para la fecha: ${selectedDate}`);
            console.log(`✅ Respuesta visible: ${aiResponse ? 'SÍ' : 'NO'}`);
            
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

    // Función para generar análisis (simplificada)
    const generateAnalysis = async (forceNewAnalysis = false) => {
        console.log('🔄 Generando análisis con currentEntry:', {
            textLength: (currentEntry?.text || '').length,
            activitiesCount: Object.keys(currentEntry?.tracked || {}).length
        });
        
        // Verificar límite
        if (reflectionAnalysisCount >= 3) {
            console.log('❌ Límite de análisis alcanzado');
            setAiResponse('Has alcanzado el límite de 3 análisis por entrada. Modifica el contenido para poder hacer un nuevo análisis.');
            return;
        }
        
        // Hacer nuevo análisis
        console.log('✅ Generando nuevo análisis...');
        
        const trackedActivitiesSummary = Object.entries(currentEntry?.tracked || {}).map(([activityId, option]) => `- ${activities[activityId]?.name || 'Actividad'}: ${option}`).join('\n');
        const prompt = `Actúa como un terapeuta empático y perspicaz. Analiza la siguiente entrada de diario y las actividades registradas. Ofrece una reflexión amable, identifica posibles patrones o sentimientos subyacentes y proporciona una o dos sugerencias constructivas o preguntas para la autorreflexión. Sé conciso y alentador.\n\n**Entrada del Diario:**\n"${currentEntry?.text || 'No se escribió nada.'}"\n\n**Actividades Registradas:**\n${trackedActivitiesSummary || 'No se registraron actividades.'}`;
        
        const response = await callAI(prompt);
        if (response) {
            await saveTherapistReflection(response);
            setAiResponse(response);
        }
    };

    // Limpiar estado cuando cambia la fecha Y el modal está abierto
    const previousDateRef = useRef(selectedDate);
    
    useEffect(() => {
        // Solo limpiar si el modal está abierto y la fecha realmente cambió
        if (isOpen && selectedDate && previousDateRef.current !== selectedDate) {
            console.log(`=== LIMPIANDO ESTADO para fecha: ${selectedDate} (cambio real de fecha) ===`);
            // Limpiar completamente el estado para la nueva fecha
            setTherapistReflection('');
            setReflectionAnalysisCount(0);
            setLastEntryHash('');
            setLastAnalyzedEntry(null);
            setAiResponse('');
            // Actualizar la referencia
            previousDateRef.current = selectedDate;
        } else if (isSaving) {
            console.log('No limpiando estado - hay un guardado en progreso');
        } else if (!isOpen) {
            console.log('No limpiando estado - modal cerrado');
        } else {
            console.log(`No limpiando estado - fecha sin cambio real: ${selectedDate}`);
        }
    }, [selectedDate, isSaving, isOpen]);

    // Cargar reflexión cuando se abre el modal o cambia la fecha
    useEffect(() => {
        if (isOpen && db && user && selectedDate) {
            console.log(`Modal abierto para fecha: ${selectedDate}`);
            console.log(`Entrada actual:`, currentEntry);
            setIsLoading(true);
            
            loadTherapistReflection().then(() => {
                setIsLoading(false);
            });
        }
    }, [isOpen, selectedDate, db, user]);

    // Lógica mejorada: cargar, mostrar existente, o generar nueva si hay cambios
    useEffect(() => {
        if (isOpen && !isLoading) {
            console.log(`=== PROCESANDO REFLEXIÓN MEJORADA para fecha: ${selectedDate} ===`);
            
            // Si no hay reflexión guardada, generar nueva
            if (!therapistReflection) {
                console.log('🆕 No hay reflexión guardada, generando nueva');
                generateAnalysis();
                return;
            }
            
            // Si hay reflexión guardada, verificar si hay cambios significativos
            const currentHash = generateEntryHash(currentEntry);
            const hasChanges = isSignificantChange(currentHash, lastEntryHash, currentEntry, lastAnalyzedEntry);
            
            if (hasChanges) {
                console.log('🔄 Cambios detectados, generando nueva reflexión');
                generateAnalysis();
            } else {
                console.log('✅ Mostrando reflexión existente (sin cambios)');
                setAiResponse(therapistReflection);
            }
        }
    }, [isOpen, isLoading, therapistReflection, selectedDate, currentEntry, lastEntryHash, lastAnalyzedEntry]);

    // Limpiar estado cuando se cierra el modal
    useEffect(() => {
        if (!isOpen) {
            console.log('Modal cerrado, limpiando estado temporal');
            setAiResponse('');
            setIsAILoading(false);
        }
    }, [isOpen]);

    // Debug: Verificar estado cuando cambia la fecha Y el modal está abierto
    useEffect(() => {
        if (isOpen && selectedDate) {
            console.log(`=== DEBUG: Cambio de fecha a ${selectedDate} ===`);
            console.log('Estado actual:', {
                therapistReflection: therapistReflection ? 'SÍ' : 'NO',
                reflectionAnalysisCount,
                lastEntryHash,
                hasLastAnalyzedEntry: !!lastAnalyzedEntry
            });
        }
    }, [selectedDate, therapistReflection, reflectionAnalysisCount, lastEntryHash, lastAnalyzedEntry, isOpen]);

    // Verificar que el estado se limpió correctamente después del cambio de fecha (solo cuando modal abierto)
    useEffect(() => {
        if (isOpen && selectedDate && !therapistReflection && !lastEntryHash) {
            console.log(`✅ Estado limpiado correctamente para fecha: ${selectedDate}`);
        }
    }, [selectedDate, therapistReflection, lastEntryHash, isOpen]);

    // Verificar que el guardado se completó correctamente (solo cuando modal abierto)
    useEffect(() => {
        if (isOpen && !isSaving && therapistReflection && lastEntryHash) {
            console.log(`✅ Estado persistente confirmado para fecha: ${selectedDate}`);
            console.log('Estado actual:', {
                hasReflection: !!therapistReflection,
                analysisCount: reflectionAnalysisCount,
                hash: lastEntryHash
            });
        }
    }, [isSaving, therapistReflection, lastEntryHash, selectedDate, reflectionAnalysisCount, isOpen]);

    // Asegurar que la respuesta se mantenga visible después del guardado
    useEffect(() => {
        if (!isSaving && therapistReflection && !aiResponse && isOpen) {
            console.log('Restaurando respuesta después del guardado...');
            setAiResponse(therapistReflection);
        }
    }, [isSaving, therapistReflection, aiResponse, isOpen]);

    // Debug: Verificar cambios en aiResponse
    useEffect(() => {
        if (aiResponse) {
            console.log(`📝 aiResponse actualizado: ${aiResponse.substring(0, 50)}...`);
        } else {
            console.log('📝 aiResponse limpiado');
        }
    }, [aiResponse]);

    // Debug: Verificar cambios en currentEntry
    useEffect(() => {
        if (isOpen && currentEntry) {
            console.log(`🔄 currentEntry actualizado:`, {
                textLength: (currentEntry.text || '').length,
                textPreview: (currentEntry.text || '').substring(0, 50) + '...',
                activitiesCount: Object.keys(currentEntry.tracked || {}).length
            });
        }
    }, [currentEntry, isOpen]);

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 ${currentTheme === 'dark' ? 'bg-black bg-opacity-70' : 'bg-black bg-opacity-50'} flex items-center justify-center z-50 p-4`}>
            <div className={`${currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl p-6 w-full max-w-lg flex flex-col`}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-2xl font-bold ${currentTheme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`}>
                        Reflexión del Terapeuta IA
                    </h2>
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
                
                <div className={`flex justify-end mt-6 pt-4 border-t ${currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
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
    );
};

export default TherapistReflection; 