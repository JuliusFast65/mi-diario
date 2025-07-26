import React, { useState, useRef, useEffect } from 'react';
import PremiumFeatureModal from './PremiumFeatureModal';

export default function AdvancedIntrospectiveAssistant({ 
    isOpen, 
    onClose, 
    db, 
    user, 
    onUpgradeClick, 
    hasFeature,
    currentEntry,
    onUpdateEntry,
    selectedDate,
    textareaRef
}) {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState('initial');
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen) {
            initializeSession();
        }
    }, [isOpen, currentEntry]);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const initializeSession = () => {
        const hasExistingEntry = currentEntry?.text && currentEntry.text.trim().length > 0;
        
        if (hasExistingEntry) {
            setMessages([
                {
                    id: 1,
                    type: 'therapist',
                    content: `Hola ${user?.displayName?.split(' ')[0] || 'Usuario'}. Veo que ya escribiste algo hoy. ¿Qué te gustaría hacer?`,
                    timestamp: new Date(),
                    options: [
                        { id: 'analyze', text: '🧠 Analiza lo que escribí', action: 'analyze_existing' },
                        { id: 'write_more', text: '✍️ Ayúdame a escribir más', action: 'help_write_more' },
                        { id: 'chat', text: '💬 Solo conversar', action: 'start_chat' }
                    ]
                }
            ]);
            setCurrentStep('existing_entry');
        } else {
            setMessages([
                {
                    id: 1,
                    type: 'therapist',
                    content: `Hola ${user?.displayName?.split(' ')[0] || 'Usuario'}. ¿Cómo te sientes hoy? ¿Te gustaría contarme algo o que te ayude a escribir en tu diario?`,
                    timestamp: new Date(),
                    options: [
                        { id: 'tell', text: 'Contarte cómo me siento', action: 'start_chat' },
                        { id: 'write', text: 'Ayúdame a escribir', action: 'help_write' }
                    ]
                }
            ]);
            setCurrentStep('initial');
        }
    };

    const handleOptionClick = async (option) => {
        if (isLoading) return;

        // Agregar la selección del usuario como mensaje
        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: option.text,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);

        setIsLoading(true);

        try {
            switch (option.action) {
                case 'start_chat':
                    await handleStartChat();
                    break;
                case 'help_write':
                    await handleHelpWrite();
                    break;
                case 'help_write_more':
                    await handleHelpWriteMore();
                    break;
                case 'analyze_existing':
                    await handleAnalyzeExisting();
                    break;
                case 'focus_diary':
                    await handleFocusDiary();
                    break;
                case 'end_session':
                    await handleEndSession();
                    break;
                default:
                    break;
            }
        } catch (error) {
            console.error('Error en la acción:', error);
            const errorMessage = {
                id: Date.now() + 1,
                type: 'therapist',
                content: 'Lo siento, estoy teniendo dificultades técnicas. ¿Podrías intentar de nuevo?',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: inputMessage,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        const userInput = inputMessage;
        setInputMessage('');

        setIsLoading(true);

        try {
            // Generar respuesta del terapeuta basada en el input del usuario
            const therapistResponse = await generateTherapistResponse(userInput, currentStep);
            setMessages(prev => [...prev, therapistResponse]);
        } catch (error) {
            console.error('Error al generar respuesta:', error);
            const errorMessage = {
                id: Date.now() + 1,
                type: 'therapist',
                content: 'Lo siento, estoy teniendo dificultades técnicas. ¿Podrías intentar de nuevo?',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartChat = async () => {
        const therapistResponse = {
            id: Date.now() + 1,
            type: 'therapist',
            content: 'Perfecto, estoy aquí para escucharte. Cuéntame más sobre cómo te sientes y qué está pasando en tu vida.',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, therapistResponse]);
        setCurrentStep('chat');
    };

    const handleHelpWrite = async () => {
        const therapistResponse = {
            id: Date.now() + 1,
            type: 'therapist',
            content: 'Te ayudo a escribir en tu diario. ¿Sobre qué te gustaría escribir hoy? Puedes contarme y te daré sugerencias para empezar.',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, therapistResponse]);
        setCurrentStep('helping_write');
    };

    const handleHelpWriteMore = async () => {
        const therapistResponse = {
            id: Date.now() + 1,
            type: 'therapist',
            content: 'Perfecto, te ayudo a expandir lo que ya escribiste. ¿Qué más te gustaría agregar o explorar sobre lo que ya tienes?',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, therapistResponse]);
        setCurrentStep('helping_write_more');
    };

    const handleAnalyzeExisting = async () => {
        const therapistResponse = {
            id: Date.now() + 1,
            type: 'therapist',
            content: 'Voy a analizar lo que escribiste hoy. Déjame reflexionar sobre tus palabras...',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, therapistResponse]);

        // Simular análisis de la entrada existente
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const analysis = await generateAnalysis(currentEntry.text);
        const analysisMessage = {
            id: Date.now() + 2,
            type: 'therapist',
            content: analysis,
            timestamp: new Date(),
            options: [
                { id: 'help_write_more', text: '✍️ Ayúdame a escribir más', action: 'help_write_more' },
                { id: 'focus_diary', text: '📝 Ir al diario', action: 'focus_diary' },
                { id: 'continue_chat', text: '💬 Continuar conversando', action: 'start_chat' }
            ]
        };
        setMessages(prev => [...prev, analysisMessage]);
        setCurrentStep('analysis_complete');
    };

    const handleFocusDiary = async () => {
        const therapistResponse = {
            id: Date.now() + 1,
            type: 'therapist',
            content: 'Perfecto, voy a cerrar este chat para que puedas escribir en tu diario. ¡Que tengas una excelente sesión de escritura!',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, therapistResponse]);
        
        // Cerrar el modal y enfocar el textarea del diario
        setTimeout(() => {
            onClose();
            if (textareaRef?.current) {
                textareaRef.current.focus();
            }
        }, 2000);
    };

    const handleEndSession = async () => {
        const therapistResponse = {
            id: Date.now() + 1,
            type: 'therapist',
            content: 'Ha sido un placer acompañarte en esta sesión. Recuerda que estoy aquí cuando necesites reflexionar o escribir. ¡Que tengas un excelente día!',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, therapistResponse]);
        setCurrentStep('session_ended');
        
        // Cerrar el modal después de un delay
        setTimeout(() => {
            onClose();
        }, 3000);
    };

    const generateTherapistResponse = async (userInput, step) => {
        // Simular respuesta del terapeuta
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

        let response = '';
        
        if (step === 'helping_write' || step === 'helping_write_more') {
            // Respuestas específicas para ayudar a escribir
            const writingPrompts = [
                `Basándome en lo que me contaste, te sugiero empezar escribiendo sobre: "${userInput}". Puedes expandir esto en tu diario.`,
                `Me parece que "${userInput}" es un tema importante para ti. ¿Por qué no escribes sobre cómo te hace sentir?`,
                `"${userInput}" suena muy significativo. Te sugiero escribir sobre cuándo empezaste a sentir esto y cómo ha evolucionado.`,
                `Excelente tema. Sobre "${userInput}", podrías escribir sobre qué aprendiste de esta experiencia.`,
                `"${userInput}" es muy interesante. ¿Qué te gustaría explorar más sobre esto en tu diario?`
            ];
            response = writingPrompts[Math.floor(Math.random() * writingPrompts.length)];
            
            // Agregar opción para ir al diario
            return {
                id: Date.now() + 1,
                type: 'therapist',
                content: response,
                timestamp: new Date(),
                options: [
                    { id: 'focus_diary', text: '📝 Ir a escribir al diario', action: 'focus_diary' },
                    { id: 'continue_chat', text: '💬 Seguir conversando', action: 'start_chat' }
                ]
            };
        } else {
            // Respuestas generales de conversación
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
            response = responses[Math.floor(Math.random() * responses.length)];
        }

        return {
            id: Date.now() + 1,
            type: 'therapist',
            content: response,
            timestamp: new Date()
        };
    };

    const generateAnalysis = async (text) => {
        // Simulación de análisis emocional
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const emotions = ['tristeza', 'frustración', 'alegría', 'ansiedad', 'esperanza', 'confusión', 'gratitud'];
        const detectedEmotions = emotions.filter(() => Math.random() > 0.5);
        
        return `He analizado tu entrada y detecto varios elementos interesantes:\n\n` +
               `**Emociones identificadas:** ${detectedEmotions.length > 0 ? detectedEmotions.join(', ') : 'Neutral'}\n\n` +
               `**Patrones observados:** Veo que estás reflexionando profundamente sobre tus experiencias.\n\n` +
               `**Sugerencias:** Considera explorar más sobre ${detectedEmotions[0] || 'tus sentimientos'} en futuras entradas.\n\n` +
               `¿Te gustaría que profundicemos en algún aspecto específico?`;
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!isOpen) return null;

    if (!hasFeature('advanced_introspective_assistant')) {
        return (
            <PremiumFeatureModal
                isOpen={isOpen}
                onClose={onClose}
                onUpgrade={onUpgradeClick}
                featureName="Asistente Introspectivo Avanzado"
                featureDescription="Combina el poder del chat terapéutico con asistencia de escritura avanzada para una experiencia de reflexión personal completa."
                featureIcon="🧠"
            />
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl h-[80vh] mx-4 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-300">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">🧠</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Asistente Introspectivo</h2>
                            <p className="text-sm text-gray-700 font-medium">Terapeuta + Ayuda para escribir</p>
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

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                    message.type === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-900'
                                }`}
                            >
                                <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{message.content}</p>
                                <p className="text-xs text-gray-600 mt-1 font-medium">
                                    {message.timestamp.toLocaleTimeString()}
                                </p>
                                
                                {/* Options for therapist messages */}
                                {message.options && (
                                    <div className="mt-3 space-y-2">
                                        {message.options.map((option) => (
                                            <button
                                                key={option.id}
                                                onClick={() => handleOptionClick(option)}
                                                disabled={isLoading}
                                                className="w-full text-left px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                            >
                                                {option.text}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-200 rounded-lg px-4 py-2">
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-300">
                    <div className="flex gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Escribe tu mensaje..."
                            className="flex-1 border border-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-600 font-medium"
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