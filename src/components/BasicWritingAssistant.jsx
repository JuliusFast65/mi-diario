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
            <div className={`${currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl p-6 w-full max-w-lg flex flex-col`}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-2xl font-bold ${currentTheme === 'dark' ? 'text-cyan-300' : 'text-cyan-600'}`}>
                        Sugerencias del Asistente
                    </h2>
                </div>
                
                <div className="overflow-y-auto max-h-[60vh] pr-2">
                    {isLoading ? (
                        <div className="text-center py-10">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
                            <p className={`mt-4 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Analizando tu texto...</p>
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