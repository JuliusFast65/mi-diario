import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import PremiumFeatureModal from './PremiumFeatureModal';

const WritingAssistant = ({ 
    isOpen, 
    onClose, 
    currentEntry, 
    onUpdateEntry, 
    onUpgradeClick, 
    hasFeature, 
    textareaRef,
    db,
    user,
    appId,
    selectedDate,
    currentTheme
}) => {
    const [suggestions, setSuggestions] = useState([]);
    const [prompts, setPrompts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('suggestions');
    const [writingAssistantData, setWritingAssistantData] = useState({
        suggestions: [],
        prompts: [],
        lastEntryHash: '',
        lastAnalyzedEntry: null,
        analysisCount: 0
    });
    const [isAILoading, setIsAILoading] = useState(false);

    // Function to generate hash of the entry
    const generateEntryHash = (entry) => {
        const entryData = JSON.stringify({
            text: entry.text || '',
            tracked: entry.tracked || {}
        });
        // Use encodeURIComponent to handle special characters safely
        return btoa(encodeURIComponent(entryData)).slice(0, 20); // Simple hash for comparison
    };

    // Function to detect if the change is significant
    const isSignificantChange = (currentHash, lastHash, currentEntry, lastEntry) => {
        // If no previous entry, any entry is significant
        if (!lastHash || !lastEntry) return true;
        
        // If the hash is different, there's a change
        if (currentHash !== lastHash) {
            // Check if the change is significant (more than 10 characters difference in text)
            const currentText = currentEntry.text || '';
            const lastText = lastEntry.text || '';
            const textDiff = Math.abs(currentText.length - lastText.length);
            
            // Also check if the number of activities changed
            const currentActivities = Object.keys(currentEntry.tracked || {}).length;
            const lastActivities = Object.keys(lastEntry || {}).length;
            const activitiesDiff = Math.abs(currentActivities - lastActivities);
            
            // Consider significant if there's more than 10 characters difference or the number of activities changed
            return textDiff > 10 || activitiesDiff > 0;
        }
        
        return false;
    };

    // Function to load saved writing assistant data
    const loadWritingAssistantData = async () => {
        if (!db || !user?.uid) return;
        
        try {
            const entryRef = doc(db, 'artifacts', appId, 'users', user.uid, 'entries', selectedDate);
            const entryDoc = await getDoc(entryRef);
            
            console.log(`Cargando datos del asistente de escritura para la fecha: ${selectedDate}`);
            
            if (entryDoc.exists()) {
                const data = entryDoc.data();
                if (data.writingAssistantData) {
                    setWritingAssistantData(data.writingAssistantData);
                    setSuggestions(data.writingAssistantData.suggestions || []);
                    setPrompts(data.writingAssistantData.prompts || []);
                    console.log(`Datos del asistente encontrados para ${selectedDate}, análisis: ${data.writingAssistantData.analysisCount || 0}/5`);
                } else {
                    console.log(`No hay datos del asistente guardados para ${selectedDate}`);
                }
            } else {
                console.log(`No existe entrada para ${selectedDate}`);
            }
        } catch (error) {
            console.error('Error loading writing assistant data:', error);
        }
    };

    // Function to save writing assistant data
    const saveWritingAssistantData = async (newData) => {
        if (!db || !user?.uid) return;
        
        try {
            const entryRef = doc(db, 'artifacts', appId, 'users', user.uid, 'entries', selectedDate);
            const currentHash = generateEntryHash(currentEntry);
            
            const dataToSave = {
                ...newData,
                lastEntryHash: currentHash,
                lastAnalyzedEntry: {
                    text: currentEntry.text || '',
                    tracked: currentEntry.tracked || {}
                },
                updatedAt: new Date()
            };
            
            // Use setDoc with merge to create or update the entry
            await setDoc(entryRef, {
                writingAssistantData: dataToSave
            }, { merge: true });
            
            setWritingAssistantData(dataToSave);
            console.log(`Datos del asistente guardados para la fecha: ${selectedDate}`);
        } catch (error) {
            console.error('Error saving writing assistant data:', error);
        }
    };

    // Function to call AI
    const callAI = async (prompt) => {
        setIsAILoading(true);
        
        try {
            const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo procesar la respuesta.";
            return textResponse;
        } catch (error) {
            console.error('Error calling AI:', error);
            return "Error al conectar con la IA.";
        } finally {
            setIsAILoading(false);
        }
    };

    // Function to generate AI-powered suggestions
    const generateAISuggestions = async () => {
        if (!currentEntry?.text || currentEntry.text.length < 20) {
            setSuggestions([]);
            return;
        }
        
        const currentHash = generateEntryHash(currentEntry);
        
        // If there's saved data and no significant changes, use the existing suggestions
        if (writingAssistantData.suggestions.length > 0 && !isSignificantChange(currentHash, writingAssistantData.lastEntryHash, currentEntry, writingAssistantData.lastAnalyzedEntry)) {
            setSuggestions(writingAssistantData.suggestions);
            return;
        }
        
        // Check analysis limit
        if (writingAssistantData.analysisCount >= 5) {
            alert('Has alcanzado el límite de 5 análisis por entrada. Modifica el contenido para poder hacer un nuevo análisis.');
            return;
        }
        
        setIsLoading(true);
        
        try {
            const prompt = `Actúa como un asistente de escritura experto. Analiza la siguiente entrada de diario y proporciona 3-4 sugerencias específicas para mejorar la escritura. Considera:

1. Estructura y organización
2. Claridad y expresividad
3. Gramática y estilo
4. Profundidad emocional

Para cada sugerencia, proporciona:
- Título corto
- Descripción del problema
- Ejemplo de mejora específica

Formato de respuesta (JSON):
{
  "suggestions": [
    {
      "id": 1,
      "type": "structure|clarity|grammar|depth",
      "title": "Título de la sugerencia",
      "suggestion": "Descripción del problema",
      "original": "Texto original problemático",
      "improved": "Versión mejorada"
    }
  ]
}

Entrada del diario:
"${currentEntry.text}"

Responde solo con el JSON válido.`;
            
            const response = await callAI(prompt);
            
            try {
                // Clean the response to remove markdown formatting
                let cleanResponse = response;
                if (response.includes('```json')) {
                    cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                }
                
                const parsedResponse = JSON.parse(cleanResponse);
                if (parsedResponse.suggestions && Array.isArray(parsedResponse.suggestions)) {
                    const newData = {
                        ...writingAssistantData,
                        suggestions: parsedResponse.suggestions,
                        analysisCount: writingAssistantData.analysisCount + 1
                    };
                    
                    await saveWritingAssistantData(newData);
                    setSuggestions(parsedResponse.suggestions);
                } else {
                    throw new Error('Invalid response format');
                }
            } catch (parseError) {
                console.error('Error parsing AI response:', parseError);
                // Fallback to basic suggestions
                generateBasicSuggestions();
            }
        } catch (error) {
            console.error('Error generating AI suggestions:', error);
            generateBasicSuggestions();
        } finally {
            setIsLoading(false);
        }
    };

    // Fallback function for basic suggestions
    const generateBasicSuggestions = () => {
        const text = currentEntry.text;
        const basicSuggestions = [];
        
        // Basic structure suggestion
        if (text.length > 200) {
            basicSuggestions.push({
                id: 1,
                type: 'structure',
                title: 'Estructurar mejor',
                suggestion: 'Tu texto es bastante largo. Considera dividirlo en párrafos para mejorar la legibilidad.',
                original: text.substring(0, 150) + '...',
                improved: 'Divide tu texto en párrafos temáticos para mayor claridad.'
            });
        }
        
        // Basic clarity suggestion
        if (text.includes('me siento mal') || text.includes('estoy mal')) {
            basicSuggestions.push({
                id: 2,
                type: 'clarity',
                title: 'Clarificar emociones',
                suggestion: 'Podrías ser más específico sobre tus emociones para una mejor reflexión.',
                original: 'me siento mal',
                improved: 'me siento frustrado y desanimado porque...'
            });
        }
        
        // Basic expansion suggestion
        if (text.length < 50 && text.length > 10) {
            basicSuggestions.push({
                id: 3,
                type: 'depth',
                title: 'Expandir reflexión',
                suggestion: 'Tu entrada es muy corta. Considera agregar más detalles sobre tus pensamientos y emociones.',
                original: text,
                improved: text + '\n\nPienso que esto me afecta porque...\n\nMe gustaría...'
            });
        }
        
        if (basicSuggestions.length === 0) {
            basicSuggestions.push({
                id: 4,
                type: 'general',
                title: 'Mejorar escritura',
                suggestion: 'Tu texto se ve bien. Considera agregar más detalles específicos para enriquecer tu reflexión.',
                original: 'Tu entrada actual',
                improved: 'Agregar ejemplos específicos y detalles emocionales'
            });
        }
        
        const newData = {
            ...writingAssistantData,
            suggestions: basicSuggestions,
            analysisCount: writingAssistantData.analysisCount + 1
        };
        
        saveWritingAssistantData(newData);
        setSuggestions(basicSuggestions);
    };

    // Function to generate AI-powered prompts
    const generateAIPrompts = async () => {
        const currentHash = generateEntryHash(currentEntry);
        
        // If there's saved data and no significant changes, use the existing prompts
        if (writingAssistantData.prompts.length > 0 && !isSignificantChange(currentHash, writingAssistantData.lastEntryHash, currentEntry, writingAssistantData.lastAnalyzedEntry)) {
            setPrompts(writingAssistantData.prompts);
            return;
        }
        
        setIsLoading(true);
        
        try {
            const prompt = `Actúa como un asistente de escritura creativo. Basándote en el contenido de esta entrada de diario, genera 6 prompts específicos y personalizados para ayudar al usuario a expandir su reflexión.

Considera el contexto emocional y temático de la entrada para crear prompts relevantes.

Formato de respuesta (JSON):
{
  "prompts": [
    {
      "id": 1,
      "category": "Emociones|Logros|Desafíos|Gratitud|Reflexión|Futuro",
      "prompt": "Pregunta específica y personalizada",
      "icon": "😊"
    }
  ]
}

Entrada del diario:
"${currentEntry.text || 'No hay contenido aún'}"

Responde solo con el JSON válido.`;
            
            const response = await callAI(prompt);
            
            try {
                // Clean the response to remove markdown formatting
                let cleanResponse = response;
                if (response.includes('```json')) {
                    cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                }
                
                const parsedResponse = JSON.parse(cleanResponse);
                if (parsedResponse.prompts && Array.isArray(parsedResponse.prompts)) {
                    const newData = {
                        ...writingAssistantData,
                        prompts: parsedResponse.prompts
                    };
                    
                    await saveWritingAssistantData(newData);
                    setPrompts(parsedResponse.prompts);
                } else {
                    throw new Error('Invalid response format');
                }
            } catch (parseError) {
                console.error('Error parsing AI response:', parseError);
                generateBasicPrompts();
            }
        } catch (error) {
            console.error('Error generating AI prompts:', error);
            generateBasicPrompts();
        } finally {
            setIsLoading(false);
        }
    };

    // Fallback function for basic prompts
    const generateBasicPrompts = () => {
        const basicPrompts = [
            {
                id: 1,
                category: 'Emociones',
                prompt: '¿Cómo te has sentido emocionalmente hoy? Describe los altibajos del día.',
                icon: '😊'
            },
            {
                id: 2,
                category: 'Logros',
                prompt: '¿Qué logro, por pequeño que sea, te hace sentir orgulloso hoy?',
                icon: '🏆'
            },
            {
                id: 3,
                category: 'Desafíos',
                prompt: '¿Qué desafío enfrentaste hoy y cómo lo manejaste?',
                icon: '💪'
            },
            {
                id: 4,
                category: 'Gratitud',
                prompt: '¿Por qué tres cosas estás agradecido hoy?',
                icon: '🙏'
            },
            {
                id: 5,
                category: 'Reflexión',
                prompt: '¿Qué has aprendido sobre ti mismo hoy?',
                icon: '🧠'
            },
            {
                id: 6,
                category: 'Futuro',
                prompt: '¿Qué te gustaría mejorar o cambiar para mañana?',
                icon: '🔮'
            }
        ];
        
        const newData = {
            ...writingAssistantData,
            prompts: basicPrompts
        };
        
        saveWritingAssistantData(newData);
        setPrompts(basicPrompts);
    };

    // Function to regenerate suggestions
    const handleRegenerateSuggestions = async () => {
        if (writingAssistantData.analysisCount >= 5) {
            alert('Has alcanzado el límite de 5 análisis por entrada. Modifica el contenido para poder hacer un nuevo análisis.');
            return;
        }
        
        await generateAISuggestions();
    };

    // Function to regenerate prompts
    const handleRegeneratePrompts = async () => {
        await generateAIPrompts();
    };

    const applySuggestion = (suggestion) => {
        if (!currentEntry?.text) return;
        
        const updatedText = currentEntry.text.replace(
            suggestion.original,
            suggestion.improved
        );
        
        onUpdateEntry({
            ...currentEntry,
            text: updatedText
        });
    };

    const usePrompt = (prompt) => {
        if (!currentEntry?.text) return;
        
        const newText = currentEntry.text + '\n\n' + prompt.prompt;
        onUpdateEntry({
            ...currentEntry,
            text: newText
        });
        
        // Cerrar el modal para que el usuario vea el área de escritura con el prompt
        onClose();
        
        // Enfocar el textarea después de un pequeño delay para que el modal se cierre
        setTimeout(() => {
            if (textareaRef?.current) {
                textareaRef.current.focus();
                // Mover el cursor al final del texto
                const length = textareaRef.current.value.length;
                textareaRef.current.setSelectionRange(length, length);
            }
        }, 100);
    };

    // Load data when modal opens or date changes
    useEffect(() => {
        if (isOpen && db && user && selectedDate) {
            console.log(`Modal de asistente abierto para fecha: ${selectedDate}`);
            setIsLoading(true);
            loadWritingAssistantData().then(() => {
                setIsLoading(false);
                // Solo generar si no hay datos guardados o si hay cambios significativos
                const currentHash = generateEntryHash(currentEntry);
                const hasSignificantChanges = isSignificantChange(
                    currentHash, 
                    writingAssistantData.lastEntryHash, 
                    currentEntry, 
                    writingAssistantData.lastAnalyzedEntry
                );
                
                // Solo generar si realmente no hay datos o hay cambios significativos
                if (activeTab === 'suggestions') {
                    if (suggestions.length === 0 && (writingAssistantData.suggestions.length === 0 || hasSignificantChanges)) {
                        generateAISuggestions();
                    }
                } else {
                    if (prompts.length === 0 && (writingAssistantData.prompts.length === 0 || hasSignificantChanges)) {
                        generateAIPrompts();
                    }
                }
            });
        }
    }, [isOpen, selectedDate, db, user]);

    // Handle tab changes - solo cargar datos existentes, no regenerar
    useEffect(() => {
        if (isOpen && !isLoading) {
            // Al cambiar de tab, solo mostrar los datos existentes
            if (activeTab === 'suggestions') {
                setSuggestions(writingAssistantData.suggestions || []);
            } else {
                setPrompts(writingAssistantData.prompts || []);
            }
        }
    }, [activeTab, isOpen, isLoading, writingAssistantData.suggestions, writingAssistantData.prompts]);

    if (!isOpen) return null;

    if (!hasFeature('writing_assistant')) {
        return (
            <PremiumFeatureModal
                isOpen={isOpen}
                onClose={onClose}
                onUpgrade={onUpgradeClick}
                featureName="Asistente de Escritura"
                featureDescription="Mejora tu escritura con sugerencias inteligentes y prompts creativos para enriquecer tus reflexiones diarias."
                featureIcon="✍️"
            />
        );
    }

    return (
        <div className={`fixed inset-0 ${currentTheme === 'dark' ? 'bg-black bg-opacity-70' : 'bg-black bg-opacity-50'} flex items-center justify-center z-50 p-4`}>
            <div className={`${currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col`}>
                {/* Header */}
                <div className={`flex items-center justify-between p-4 border-b ${currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${currentTheme === 'dark' ? 'bg-purple-900' : 'bg-purple-100'} rounded-full flex items-center justify-center`}>
                            <span className={`${currentTheme === 'dark' ? 'text-purple-300' : 'text-purple-600'} font-semibold`}>✍️</span>
                        </div>
                        <div>
                            <h2 className={`text-xl font-bold ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                Asistente de Escritura
                            </h2>
                            <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} font-medium`}>
                                Mejora tu escritura con IA - {selectedDate}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className={`${currentTheme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'} p-2 rounded-lg transition-colors`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className={`flex border-b ${currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
                    <button
                        onClick={() => setActiveTab('suggestions')}
                        className={`px-4 py-2 font-medium ${
                            activeTab === 'suggestions'
                                ? `${currentTheme === 'dark' ? 'text-purple-300 border-purple-300' : 'text-purple-600 border-purple-600'} border-b-2`
                                : `${currentTheme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
                        }`}
                    >
                        Sugerencias
                    </button>
                    <button
                        onClick={() => setActiveTab('prompts')}
                        className={`px-4 py-2 font-medium ${
                            activeTab === 'prompts'
                                ? `${currentTheme === 'dark' ? 'text-purple-300 border-purple-300' : 'text-purple-600 border-purple-600'} border-b-2`
                                : `${currentTheme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
                        }`}
                    >
                        Prompts de Escritura
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {isLoading || isAILoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                                <p className={`${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                                    {isAILoading ? 'Conectando con IA...' : `Generando ${activeTab === 'suggestions' ? 'sugerencias' : 'prompts'}...`}
                                </p>
                            </div>
                        </div>
                    ) : activeTab === 'suggestions' ? (
                        <div className="space-y-4">
                            {suggestions.length === 0 ? (
                                <div className={`text-center ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'} py-8`}>
                                    <p>No hay sugerencias disponibles para esta entrada.</p>
                                    <p className="text-sm mt-2">Escribe más contenido para recibir sugerencias de mejora.</p>
                                </div>
                            ) : (
                                suggestions.map((suggestion) => (
                                    <div key={suggestion.id} className={`border rounded-lg p-4 ${currentTheme === 'dark' ? 'border-gray-700 bg-gray-700' : 'border-gray-300 bg-white'}`}>
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className={`font-semibold text-lg ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{suggestion.title}</h3>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                suggestion.type === 'grammar' ? 'bg-blue-100 text-blue-800' :
                                                suggestion.type === 'clarity' ? 'bg-green-100 text-green-800' :
                                                suggestion.type === 'structure' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-purple-100 text-purple-800'
                                            }`}>
                                                {suggestion.type}
                                            </span>
                                        </div>
                                        <p className={`text-sm mb-3 font-medium leading-relaxed ${currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{suggestion.suggestion}</p>
                                        <div className={`rounded p-3 mb-3 ${currentTheme === 'dark' ? 'bg-gray-600' : 'bg-gray-50'}`}>
                                            <p className={`text-xs font-semibold mb-1 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Original:</p>
                                            <p className={`text-sm leading-relaxed ${currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>{suggestion.original}</p>
                                            <p className={`text-xs font-semibold mb-1 mt-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Mejorado:</p>
                                            <p className={`text-sm font-semibold leading-relaxed ${currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>{suggestion.improved}</p>
                                        </div>
                                        <button
                                            onClick={() => applySuggestion(suggestion)}
                                            className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors"
                                        >
                                            Aplicar Sugerencia
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {prompts.map((prompt) => (
                                <div key={prompt.id} className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${currentTheme === 'dark' ? 'border-gray-700 bg-gray-700' : 'border-gray-300 bg-white'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xl">{prompt.icon}</span>
                                        <span className={`text-xs px-2 py-1 rounded font-medium ${currentTheme === 'dark' ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-800'}`}>
                                            {prompt.category}
                                        </span>
                                    </div>
                                    <p className={`text-sm mb-3 font-medium leading-relaxed ${currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>{prompt.prompt}</p>
                                    <button
                                        onClick={() => usePrompt(prompt)}
                                        className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors"
                                    >
                                        Usar Prompt
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer with controls */}
                <div className={`flex justify-between items-center p-4 border-t ${currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
                    {/* Information about analysis count */}
                    <div className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Análisis {writingAssistantData.analysisCount}/5
                    </div>
                    
                    <div className="flex gap-3">
                        {!isLoading && !isAILoading && writingAssistantData.analysisCount < 5 && (
                            <button 
                                onClick={activeTab === 'suggestions' ? handleRegenerateSuggestions : handleRegeneratePrompts}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
                            >
                                Regenerar {activeTab === 'suggestions' ? 'Sugerencias' : 'Prompts'}
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

export default WritingAssistant; 