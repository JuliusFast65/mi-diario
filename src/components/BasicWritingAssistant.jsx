import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { detectLanguage, getLanguageInstruction } from '../utils/languageUtils';

const BasicWritingAssistant = ({ 
    isOpen, 
    onClose, 
    currentEntry, 
    onUpdateEntry,
    currentTheme = 'dark',
    userPrefs = {}, // Agregar userPrefs como prop
    selectedTextForAI = null // Texto seleccionado por el usuario
}) => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState('');

    // Función para obtener el estilo del asistente basado en las preferencias
    const getWritingAssistantStyle = () => {
        const style = userPrefs.writingAssistantStyle || 'claro';
        
        const styleConfigs = {
            'claro': {
                tone: 'claro y conciso',
                approach: 'enfocado en la claridad y precisión del mensaje',
                suggestions: 'sugerencias para mejorar la claridad y concisión',
                description: 'Mejora la claridad y precisión de tu escritura, eliminando redundancias y mejorando la estructura.'
            },
            'natural': {
                tone: 'natural y conversacional',
                approach: 'enfocado en mantener un estilo cercano y espontáneo',
                suggestions: 'sugerencias para hacer el texto más natural y conversacional',
                description: 'Escribe como hablas, cercano y espontáneo, ideal para registrar tu día tal cual lo viviste.'
            },
            'reflexivo': {
                tone: 'reflexivo e inspirador',
                approach: 'enfocado en agregar introspección y motivación',
                suggestions: 'sugerencias para añadir reflexión e inspiración',
                description: 'Da un toque de introspección y motivación, resaltando aprendizajes y emociones positivas.'
            },
            'estructurado': {
                tone: 'claro y estructurado',
                approach: 'enfocado en organizar ideas de manera coherente',
                suggestions: 'sugerencias para mejorar la estructura y organización',
                description: 'Organiza tus ideas para que sean fáciles de releer y comprender en el futuro.'
            },
            'creativo': {
                tone: 'creativo y literario',
                approach: 'enfocado en agregar estilo poético y artístico',
                suggestions: 'sugerencias para enriquecer con creatividad literaria',
                description: 'Agrega un estilo poético o artístico, perfecto para transformar tus pensamientos en pequeñas historias.'
            },
            'breve': {
                tone: 'breve y al grano',
                approach: 'enfocado en la concisión y precisión',
                suggestions: 'sugerencias para hacer el texto más conciso',
                description: 'Resume tus ideas en pocas palabras, sin adornos ni rodeos.'
            },
            'humor': {
                tone: 'ligero y con humor',
                approach: 'enfocado en agregar un toque divertido o irónico',
                suggestions: 'sugerencias para añadir humor y ligereza',
                description: 'Dale un giro divertido o irónico a tus recuerdos, haciéndolos más amenos de leer.'
            }
        };
        
        return styleConfigs[style] || styleConfigs['claro'];
    };

    const callAI = async (prompt, title) => {
        setIsLoading(true);
        setAiResponse('');
        
        try {
            // Detectar idioma del texto del usuario
            const userText = selectedTextForAI || currentEntry?.text || '';
            const detectedLanguage = detectLanguage(userText);
            const languageInstruction = getLanguageInstruction(detectedLanguage);
            
            // Agregar instrucción de idioma al prompt
            const promptWithLanguage = `${languageInstruction}\n\n${prompt}`;
            
            const payload = { contents: [{ role: "user", parts: [{ text: promptWithLanguage }] }] };
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || t('basicWritingAssistant.errorProcessing');
            setAiResponse(textResponse);
            return textResponse;
        } catch (error) { 
            setAiResponse(t('basicWritingAssistant.connectionError')); 
            return null;
        } finally { 
            setIsLoading(false); 
        }
    };

    const handleWritingAssistant = async () => {
        const styleConfig = getWritingAssistantStyle();
        
        // Si hay texto seleccionado, usarlo en lugar del texto completo
        if (selectedTextForAI && selectedTextForAI.trim() !== '') {
            console.log('✍️ Usando texto seleccionado para asistente de escritura:', {
                selectedTextLength: selectedTextForAI.length,
                selectedTextPreview: selectedTextForAI.substring(0, 100) + '...'
            });
            
            const prompt = `Eres un editor de texto con estilo ${styleConfig.tone}. Revisa el siguiente fragmento de texto seleccionado con un enfoque ${styleConfig.approach}. 

- Corrige gramática y ortografía
- Mejora el flujo del texto manteniendo el estilo ${styleConfig.tone}
- Ofrece ${styleConfig.suggestions}
- No cambies la voz del autor
- Ofrece tus explicaciones o comentarios si lo deseas
- Al final, presenta la versión mejorada del texto envuelta entre tres arrobas

Ejemplo: "Aquí tienes una versión mejorada. @@@El texto mejorado va aquí dentro.@@@"

**Texto Seleccionado:**
"${selectedTextForAI.trim()}"`;
            
            await callAI(prompt, t('basicWritingAssistant.assistantSuggestions'));
            return;
        }
        
        // Verificar si el texto está vacío
        if (!currentEntry?.text || currentEntry.text.trim() === '') {
            // Sugerir qué y cómo escribir cuando la entrada está vacía
            // Obtener información demográfica del usuario
            const userGender = userPrefs.gender || '';
            let userAge = '';
            if (userPrefs.birthDate) {
                const birthDate = new Date(userPrefs.birthDate);
                const today = new Date();
                const age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    userAge = age - 1;
                } else {
                    userAge = age;
                }
            }
            
            const demographicInfo = [];
            if (userAge) demographicInfo.push(`edad: ${userAge} años`);
            if (userGender) demographicInfo.push(`género: ${userGender}`);
            const demographicContext = demographicInfo.length > 0 ? `\n- Información demográfica: ${demographicInfo.join(', ')}` : '';

            const prompt = `Eres un asistente de escritura creativa especializado en diarios personales con un enfoque ${styleConfig.approach}. El usuario tiene una entrada de diario vacía y necesita ayuda para comenzar a escribir.

**Contexto del usuario:**${demographicContext}

Proporciona sugerencias útiles y motivadoras que incluyan:

1. **Preguntas reflexivas** (3-4 preguntas) que ayuden al usuario a explorar sus pensamientos y sentimientos del día
2. **Temas de escritura** (2-3 ideas) que puedan servir como punto de partida
3. **Técnicas de escritura** (2-3 consejos prácticos) para superar el bloqueo del escritor
4. **Un ejemplo breve** de cómo podría comenzar una entrada de diario

Mantén un tono ${styleConfig.tone} de manera NATURAL y un enfoque ${styleConfig.approach}. NO exageres el estilo - debe sentirse auténtico. Adapta tus sugerencias según la edad y contexto del usuario. No uses formato especial, solo texto natural y conversacional.

Ejemplo de estructura:
"¡Hola! Veo que tienes una página en blanco esperando tus pensamientos. Aquí tienes algunas ideas para comenzar:

**Preguntas para reflexionar:**
- ¿Qué momento del día te hizo sonreír hoy?
- ¿Hay algo que te preocupa y quieres explorar?
- ¿Qué logro, por pequeño que sea, te gustaría celebrar?

**Temas para escribir:**
- Un momento especial del día
- Algo que aprendiste sobre ti mismo
- Un desafío que enfrentaste

**Consejos para comenzar:**
- No te preocupes por la perfección, solo escribe lo que sientes
- Comienza con una frase simple como "Hoy fue..."
- Si no sabes qué escribir, describe tu día paso a paso

**Ejemplo de inicio:**
"Hoy fue un día interesante. Me desperté pensando en..."`;

            await callAI(prompt, t('basicWritingAssistant.suggestionsToStart'));
            return;
        }

        // Comportamiento actual para texto existente con estilo personalizado
        const currentText = currentEntry.text.trim();
        
        // Obtener información demográfica del usuario
        const userGender = userPrefs.gender || '';
        let userAge = '';
        if (userPrefs.birthDate) {
            const birthDate = new Date(userPrefs.birthDate);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                userAge = age - 1;
            } else {
                userAge = age;
            }
        }
        
        const demographicInfo = [];
        if (userAge) demographicInfo.push(`edad: ${userAge} años`);
        if (userGender) demographicInfo.push(`género: ${userGender}`);
        const demographicContext = demographicInfo.length > 0 ? `\n- Información demográfica: ${demographicInfo.join(', ')}` : '';

        const prompt = `Eres un editor de texto con un enfoque ${styleConfig.approach}. Revisa la siguiente entrada de diario con un enfoque ${styleConfig.approach}. 

**Contexto del usuario:**${demographicContext}

- Corrige gramática y ortografía
- Mejora el flujo del texto manteniendo un estilo ${styleConfig.tone} NATURAL
- Ofrece ${styleConfig.suggestions}
- No cambies la voz del autor
- NO exageres el estilo - debe sentirse auténtico
- Adapta tus sugerencias según la edad y contexto del usuario
- Ofrece tus explicaciones o comentarios si lo deseas
- Al final, presenta la versión mejorada del texto envuelta entre tres arrobas

Ejemplo: "Aquí tienes una versión mejorada. @@@El texto mejorado va aquí dentro.@@@"

**Texto Original:**
"${currentText}"`;
        
        await callAI(prompt, t('basicWritingAssistant.assistantSuggestions'));
    };

    // Función para extraer el texto mejorado de la respuesta de la IA
    const extractImprovedText = (response) => {
        const match = response.match(/@@@(.*?)@@@/s);
        return match ? match[1].trim() : null;
    };

    // Función para aplicar la sugerencia
    const handleApplySuggestion = () => {
        const improvedText = extractImprovedText(aiResponse);
        if (improvedText && currentEntry) {
            // Si hay texto seleccionado, reemplazar solo esa parte
            if (selectedTextForAI && selectedTextForAI.trim() !== '') {
                // Obtener el textarea para encontrar las posiciones de selección
                const textarea = document.querySelector('textarea[data-testid="diary-textarea"]') || 
                                document.querySelector('textarea') ||
                                document.querySelector('.diary-textarea');
                
                if (textarea) {
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    
                    // Reemplazar solo el texto seleccionado
                    const currentText = currentEntry.text;
                    const newText = currentText.substring(0, start) + improvedText + currentText.substring(end);
                    
                    onUpdateEntry({
                        ...currentEntry,
                        text: newText
                    });
                    
                    console.log('✍️ Texto seleccionado reemplazado:', {
                        originalLength: selectedTextForAI.length,
                        newLength: improvedText.length,
                        start: start,
                        end: end
                    });
                } else {
                    // Fallback: reemplazar todo el texto
                    onUpdateEntry({
                        ...currentEntry,
                        text: improvedText
                    });
                }
            } else {
                // Comportamiento original: reemplazar todo el texto
                onUpdateEntry({
                    ...currentEntry,
                    text: improvedText
                });
            }
            onClose();
        }
    };

    // Verificar si hay una sugerencia aplicable (solo para texto existente)
    const hasApplicableSuggestion = () => {
        const hasText = (currentEntry?.text && currentEntry.text.trim() !== '') || (selectedTextForAI && selectedTextForAI.trim() !== '');
        return hasText && extractImprovedText(aiResponse) !== null && !isLoading;
    };

    // Verificar si la entrada está vacía
    const isEntryEmpty = () => {
        return !currentEntry?.text || currentEntry.text.trim() === '';
    };

    // Ejecutar automáticamente cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            handleWritingAssistant();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 ${currentTheme === 'dark' ? 'bg-black bg-opacity-70' : 'bg-black bg-opacity-50'} flex items-center justify-center z-50 p-4`}>
            <div className={`${currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl p-6 w-full max-w-lg flex flex-col`}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-2xl font-bold ${currentTheme === 'dark' ? 'text-cyan-300' : 'text-cyan-600'}`}>
                        {isEntryEmpty() ? t('basicWritingAssistant.suggestionsToStart') : t('basicWritingAssistant.assistantSuggestions')}
                    </h2>
                </div>
                
                <div className="overflow-y-auto max-h-[60vh] pr-2">
                    {isLoading ? (
                        <div className="text-center py-10">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
                            <p className={`mt-4 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                {isEntryEmpty() ? t('basicWritingAssistant.generatingSuggestions') : t('basicWritingAssistant.analyzingText')}
                            </p>
                        </div>
                    ) : (
                        <div className={`${currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'} whitespace-pre-wrap prose ${currentTheme === 'dark' ? 'prose-invert' : ''} max-w-none`} 
                             dangerouslySetInnerHTML={{ 
                                 __html: aiResponse
                                     .replace(/@@@(.*?)@@@/s, `<blockquote class="${currentTheme === 'dark' ? 'border-l-4 border-cyan-400 bg-gray-800' : 'border-l-4 border-cyan-400 bg-gray-100'} pl-4 py-2 my-3 italic">$1</blockquote>`)
                                     .replace(/\n\n/g, '<br><br>')
                                     .replace(/\n/g, '<br>')
                             }} />
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
                        {t('basicWritingAssistant.close')}
                    </button>
                    {hasApplicableSuggestion() && (
                        <button 
                            onClick={handleApplySuggestion} 
                            className={`ml-2 px-4 py-2 rounded-lg transition-colors ${
                                currentTheme === 'dark' 
                                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white' 
                                    : 'bg-cyan-100 hover:bg-cyan-200 text-cyan-800'
                            }`}
                        >
                            {t('basicWritingAssistant.applySuggestion')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BasicWritingAssistant; 