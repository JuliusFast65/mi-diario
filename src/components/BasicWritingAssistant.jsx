import React, { useState, useEffect } from 'react';

const BasicWritingAssistant = ({ 
    isOpen, 
    onClose, 
    currentEntry, 
    onUpdateEntry,
    currentTheme = 'dark'
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState('');

    const callAI = async (prompt, title) => {
        setIsLoading(true);
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
            setIsLoading(false); 
        }
    };

    const handleWritingAssistant = async () => {
        // Verificar si el texto está vacío
        if (!currentEntry?.text || currentEntry.text.trim() === '') {
            setAiResponse("No hay texto para analizar. Escribe algo en tu diario para recibir sugerencias de mejora.");
            return;
        }

        const currentText = currentEntry.text.trim();
        const prompt = `Eres un editor de texto. Revisa la siguiente entrada de diario. - Corrige gramática y ortografía y mejora el flujo. - No cambies la voz del autor. - Ofrece tus explicaciones o comentarios si lo deseas. - Al final, presenta la versión mejorada del texto envuelta entre tres arrobas. Ejemplo: "Aquí tienes una versión mejorada. @@@El texto mejorado va aquí dentro.@@@" - Si el texto de entrada está vacío, devuelve un mensaje indicándolo.\n\n**Texto Original:**\n"${currentText}"`;
        
        await callAI(prompt, "Sugerencias del Asistente");
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
            onUpdateEntry({
                ...currentEntry,
                text: improvedText
            });
            onClose();
        }
    };

    // Verificar si hay una sugerencia aplicable
    const hasApplicableSuggestion = () => {
        return extractImprovedText(aiResponse) !== null && !isLoading;
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
            <div className={`${currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col`}>
                {/* Header */}
                <div className={`flex items-center justify-between p-4`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${currentTheme === 'dark' ? 'bg-cyan-900' : 'bg-cyan-100'} rounded-full flex items-center justify-center`}>
                            <span className={`${currentTheme === 'dark' ? 'text-cyan-300' : 'text-cyan-600'} font-semibold`}>✍️</span>
                        </div>
                        <div>
                            <h2 className={`text-xl font-bold ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                Sugerencias del Asistente
                            </h2>
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

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto mb-2"></div>
                                <p className={`${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                                    Analizando tu texto...
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className={`prose ${currentTheme === 'dark' ? 'prose-invert' : ''} max-w-none`}>
                            <div 
                                className={`text-sm leading-relaxed ${currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'} whitespace-pre-wrap`}
                                dangerouslySetInnerHTML={{ 
                                    __html: aiResponse
                                        .replace(/@@@(.*?)@@@/s, `<blockquote class="${currentTheme === 'dark' ? 'border-l-4 border-cyan-400 bg-gray-800' : 'border-l-4 border-cyan-400 bg-gray-100'} pl-4 py-2 my-3 italic">$1</blockquote>`)
                                        .replace(/\n\n/g, '<br><br>')
                                        .replace(/\n/g, '<br>')
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={`flex justify-end items-center p-4 border-t ${currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
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
                    {hasApplicableSuggestion() && (
                        <button 
                            onClick={handleApplySuggestion} 
                            className={`ml-2 px-4 py-2 rounded-lg transition-colors ${
                                currentTheme === 'dark' 
                                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white' 
                                    : 'bg-cyan-100 hover:bg-cyan-200 text-cyan-800'
                            }`}
                        >
                            Aplicar Sugerencia
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BasicWritingAssistant; 