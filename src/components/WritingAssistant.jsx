import { useState, useEffect } from 'react';

export default function WritingAssistant({ isOpen, onClose, currentEntry, onUpdateEntry, onUpgradeClick, hasFeature }) {
    const [suggestions, setSuggestions] = useState([]);
    const [prompts, setPrompts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('suggestions');

    useEffect(() => {
        if (isOpen) {
            generateSuggestions();
            generatePrompts();
        }
    }, [isOpen, currentEntry]);

    const generateSuggestions = async () => {
        if (!currentEntry?.text) {
            setSuggestions([]);
            return;
        }
        
        setIsLoading(true);
        try {
            // Simulación de sugerencias de IA basadas en el texto actual
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const text = currentEntry.text;
            const suggestions = [];
            
            // Sugerencia de estructura si el texto es largo
            if (text.length > 200) {
                const firstHalf = text.substring(0, Math.floor(text.length/2));
                const secondHalf = text.substring(Math.floor(text.length/2));
                suggestions.push({
                    id: 1,
                    type: 'structure',
                    title: 'Estructurar mejor',
                    suggestion: 'Tu texto es bastante largo. Considera dividirlo en párrafos para mejorar la legibilidad.',
                    original: text.substring(0, 150) + '...',
                    improved: `Párrafo 1:\n${firstHalf}\n\nPárrafo 2:\n${secondHalf}`
                });
            }
            
            // Sugerencia de claridad si hay frases cortas
            if (text.includes('me siento mal') || text.includes('estoy mal')) {
                suggestions.push({
                    id: 2,
                    type: 'clarity',
                    title: 'Clarificar emociones',
                    suggestion: 'Podrías ser más específico sobre tus emociones para una mejor reflexión.',
                    original: 'me siento mal',
                    improved: 'me siento frustrado y desanimado porque...'
                });
            }
            
            // Sugerencia de gramática básica
            if (text.includes('estuve') && text.includes('pensando')) {
                suggestions.push({
                    id: 3,
                    type: 'grammar',
                    title: 'Mejorar gramática',
                    suggestion: 'Para acciones continuas en el pasado, considera usar "estaba" en lugar de "estuve".',
                    original: 'estuve pensando',
                    improved: 'estaba pensando'
                });
            }
            
            // Sugerencia para textos muy cortos
            if (text.length < 50 && text.length > 10) {
                suggestions.push({
                    id: 4,
                    type: 'expansion',
                    title: 'Expandir reflexión',
                    suggestion: 'Tu entrada es muy corta. Considera agregar más detalles sobre tus pensamientos y emociones.',
                    original: text,
                    improved: text + '\n\nPienso que esto me afecta porque...\n\nMe gustaría...'
                });
            }
            
            // Si no hay sugerencias específicas, mostrar una general
            if (suggestions.length === 0) {
                suggestions.push({
                    id: 5,
                    type: 'general',
                    title: 'Mejorar escritura',
                    suggestion: 'Tu texto se ve bien. Considera agregar más detalles específicos para enriquecer tu reflexión.',
                    original: 'Tu entrada actual',
                    improved: 'Agregar ejemplos específicos y detalles emocionales'
                });
            }
            
            setSuggestions(suggestions);
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
                <div className="flex items-center justify-between p-4 border-b border-gray-300">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-purple-600 font-semibold">✍️</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Asistente de Escritura</h2>
                            <p className="text-sm text-gray-700 font-medium">Mejora tu escritura con IA</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
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
                                            <h3 className="font-semibold text-gray-900 text-lg">{suggestion.title}</h3>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                suggestion.type === 'grammar' ? 'bg-blue-100 text-blue-800' :
                                                suggestion.type === 'clarity' ? 'bg-green-100 text-green-800' :
                                                'bg-purple-100 text-purple-800'
                                            }`}>
                                                {suggestion.type}
                                            </span>
                                        </div>
                                        <p className="text-gray-800 text-sm mb-3 font-medium leading-relaxed">{suggestion.suggestion}</p>
                                        <div className="bg-gray-50 rounded p-3 mb-3">
                                            <p className="text-xs font-semibold text-gray-700 mb-1">Original:</p>
                                            <p className="text-sm text-gray-900 leading-relaxed">{suggestion.original}</p>
                                            <p className="text-xs font-semibold text-gray-700 mb-1 mt-2">Mejorado:</p>
                                            <p className="text-sm font-semibold text-gray-900 leading-relaxed">{suggestion.improved}</p>
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
                                        <span className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded font-medium">
                                            {prompt.category}
                                        </span>
                                    </div>
                                    <p className="text-gray-900 text-sm mb-3 font-medium leading-relaxed">{prompt.prompt}</p>
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