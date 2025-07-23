import { useState, useRef, useEffect } from 'react';

export default function TherapistChat({ isOpen, onClose, db, user, onUpgradeClick }) {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    
    // Simulación de verificación de suscripción (temporal)
    const hasFeature = (feature) => {
        // TEMPORAL: Activar todas las características para pruebas
        return true; // Cambiar a false para simular acceso restringido
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            // Mensaje de bienvenida del terapeuta
            setMessages([
                {
                    id: 1,
                    type: 'therapist',
                    content: 'Hola, soy tu terapeuta virtual. Estoy aquí para escucharte y ayudarte a reflexionar sobre tus pensamientos y emociones. ¿En qué puedo ayudarte hoy?',
                    timestamp: new Date()
                }
            ]);
        }
    }, [isOpen]);

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: inputMessage,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            // Simulación de respuesta del terapeuta (aquí se integraría con una API de IA)
            const therapistResponse = await generateTherapistResponse(inputMessage);
            
            const therapistMessage = {
                id: Date.now() + 1,
                type: 'therapist',
                content: therapistResponse,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, therapistMessage]);
        } catch (error) {
            console.error('Error al generar respuesta del terapeuta:', error);
            const errorMessage = {
                id: Date.now() + 1,
                type: 'therapist',
                content: 'Lo siento, estoy teniendo dificultades técnicas en este momento. ¿Podrías intentar de nuevo en unos momentos?',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const generateTherapistResponse = async (userMessage) => {
        // Simulación de respuesta del terapeuta
        // En una implementación real, esto se conectaría con una API de IA como OpenAI
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        const responses = [
            "Entiendo cómo te sientes. ¿Puedes contarme más sobre esa situación?",
            "Es normal sentir esas emociones. ¿Qué crees que está causando estos sentimientos?",
            "Gracias por compartir eso conmigo. ¿Cómo te gustaría manejar esta situación?",
            "Veo que esto te está afectando. ¿Has notado algún patrón en estos sentimientos?",
            "Es importante reconocer tus emociones. ¿Qué te gustaría hacer para sentirte mejor?",
            "Me parece que has estado reflexionando mucho sobre esto. ¿Qué has aprendido de esta experiencia?",
            "Es valiente de tu parte expresar estos sentimientos. ¿Cómo te gustaría proceder?",
            "Entiendo la complejidad de esta situación. ¿Qué opciones has considerado?"
        ];

        return responses[Math.floor(Math.random() * responses.length)];
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!isOpen) return null;

    if (!hasFeature('therapy_chat')) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md mx-4">
                    <h2 className="text-xl font-semibold mb-4">Característica Premium</h2>
                    <p className="text-gray-600 mb-4">
                        El chat con terapeuta es una característica exclusiva para usuarios Premium y Pro.
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
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Actualizar Plan
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl h-[80vh] mx-4 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 font-semibold">👩‍⚕️</span>
                        </div>
                        <div>
                            <h2 className="font-semibold">Terapeuta Virtual</h2>
                            <p className="text-sm text-gray-500">Disponible 24/7</p>
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

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                    message.type === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-800'
                                }`}
                            >
                                <p className="text-sm">{message.content}</p>
                                <p className="text-xs opacity-70 mt-1">
                                    {message.timestamp.toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                    ))}
                    
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-100 rounded-lg px-4 py-2">
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t">
                    <div className="flex gap-2">
                        <textarea
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Escribe tu mensaje..."
                            className="flex-1 border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="2"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!inputMessage.trim() || isLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
} 