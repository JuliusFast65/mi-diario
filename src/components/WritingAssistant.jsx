import { useState, useEffect } from 'react';

export default function WritingAssistant({ isOpen, onClose, currentEntry, onUpdateEntry, onUpgradeClick }) {
    const [suggestions, setSuggestions] = useState([]);
    const [prompts, setPrompts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('suggestions');
    
    // Simulación de verificación de suscripción (temporal)
    const hasFeature = (feature) => {
        return feature === 'writing_assistant' ? false : true; // Por ahora, simular que no tiene acceso
    };

    useEffect(() => {
        if (isOpen) {
            generateSuggestions();
            generatePrompts();
        }
    }, [isOpen, currentEntry]);

    const generateSuggestions = async () => {
        if (!currentEntry?.content) return;
        
        setIsLoading(true);
        try {
            // Simulación de sugerencias de IA
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const mockSuggestions = [
                {
                    id: 1,
                    type: 'grammar',
                    title: 'Mejorar gramática',
                    suggestion: 'Considera usar "estaba" en lugar de "estuve" para describir una acción continua en el pasado.',
                    original: 'estuve pensando',
                    improved: 'estaba pensando'
                },
                {
                    id: 2,
                    type: 'clarity',
                    title: 'Clarificar idea',
                    suggestion: 'Esta frase podría ser más específica para transmitir mejor tus emociones.',
                    original: 'me sentí mal',
                    improved: 'me sentí frustrado y desanimado'
                },
                {
                    id: 3,
                    type: 'structure',
                    title: 'Estructurar mejor',
                    suggestion: 'Podrías dividir esta idea larga en dos párrafos para mejor legibilidad.',
                    original: 'Hoy fue un día muy complicado porque...',
                    improved: 'Hoy fue un día muy complicado.\n\nLa razón principal fue...'
                }
            ];
            
            setSuggestions(mockSuggestions);
        } catch (error) {
            console.error('Error al generar sugerencias:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const generatePrompts = async () => {
        setIsLoading(true);
        try {
            // Simulación de prompts de escritura
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const mockPrompts = [
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
            
            setPrompts(mockPrompts);
        } catch (error) {
            console.error('Error al generar prompts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const applySuggestion = (suggestion) => {
        if (!currentEntry?.content) return;
        
        const updatedContent = currentEntry.content.replace(
            suggestion.original,
            suggestion.improved
        );
        
        onUpdateEntry({
            ...currentEntry,
            content: updatedContent
        });
    };

    const usePrompt = (prompt) => {
        if (!currentEntry?.content) return;
        
        const newContent = currentEntry.content + '\n\n' + prompt.prompt;
        onUpdateEntry({
            ...currentEntry,
            content: newContent
        });
    };

    if (!isOpen) return null;

    if (!hasFeature('writing_assistant')) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md mx-4">
                    <h2 className="text-xl font-semibold mb-4">Característica Premium</h2>
                    <p className="text-gray-600 mb-4">
                        El asistente de escritura es una característica exclusiva para usuarios Pro.
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                        >
                            Cerrar
                        </button>
                        <button
                            onClick={() => {
                                onClose();
                                if (onUpgradeClick) onUpgradeClick();
                            }}
                            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                        >
                            Actualizar a Pro
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] mx-4 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-purple-600 font-semibold">✍️</span>
                        </div>
                        <div>
                            <h2 className="font-semibold">Asistente de Escritura</h2>
                            <p className="text-sm text-gray-500">Mejora tu escritura con IA</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b">
                    <button
                        onClick={() => setActiveTab('suggestions')}
                        className={`px-4 py-2 font-medium ${
                            activeTab === 'suggestions'
                                ? 'text-purple-600 border-b-2 border-purple-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Sugerencias
                    </button>
                    <button
                        onClick={() => setActiveTab('prompts')}
                        className={`px-4 py-2 font-medium ${
                            activeTab === 'prompts'
                                ? 'text-purple-600 border-b-2 border-purple-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Prompts de Escritura
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                                <p className="text-gray-500">Generando {activeTab === 'suggestions' ? 'sugerencias' : 'prompts'}...</p>
                            </div>
                        </div>
                    ) : activeTab === 'suggestions' ? (
                        <div className="space-y-4">
                            {suggestions.length === 0 ? (
                                <div className="text-center text-gray-500 py-8">
                                    <p>No hay sugerencias disponibles para esta entrada.</p>
                                    <p className="text-sm mt-2">Escribe más contenido para recibir sugerencias de mejora.</p>
                                </div>
                            ) : (
                                suggestions.map((suggestion) => (
                                    <div key={suggestion.id} className="border rounded-lg p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-medium text-gray-800">{suggestion.title}</h3>
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                suggestion.type === 'grammar' ? 'bg-blue-100 text-blue-800' :
                                                suggestion.type === 'clarity' ? 'bg-green-100 text-green-800' :
                                                'bg-purple-100 text-purple-800'
                                            }`}>
                                                {suggestion.type}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 text-sm mb-3">{suggestion.suggestion}</p>
                                        <div className="bg-gray-50 rounded p-3 mb-3">
                                            <p className="text-xs text-gray-500 mb-1">Original:</p>
                                            <p className="text-sm">{suggestion.original}</p>
                                            <p className="text-xs text-gray-500 mb-1 mt-2">Mejorado:</p>
                                            <p className="text-sm font-medium">{suggestion.improved}</p>
                                        </div>
                                        <button
                                            onClick={() => applySuggestion(suggestion)}
                                            className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
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
                                <div key={prompt.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xl">{prompt.icon}</span>
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                            {prompt.category}
                                        </span>
                                    </div>
                                    <p className="text-gray-700 text-sm mb-3">{prompt.prompt}</p>
                                    <button
                                        onClick={() => usePrompt(prompt)}
                                        className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                                    >
                                        Usar Prompt
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 