import React, { useState, useRef, useEffect } from 'react';
import PremiumFeatureModal from './PremiumFeatureModal';

export default function TherapistChat({ 
    isOpen, 
    onClose, 
    db, 
    user, 
    onUpgradeClick, 
    hasFeature,
    currentEntry,
    selectedDate,
    callAI,
    activities
}) {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [conversationHistory, setConversationHistory] = useState([]);
    const [showOptions, setShowOptions] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen) {
            initializeChat();
        }
    }, [isOpen, currentEntry, selectedDate]);

    const initializeChat = async () => {
        // Cargar historial de conversaciones
        await loadConversationHistory();
        
        // Analizar entrada del día y generar mensaje inicial
        const initialMessage = await generateInitialMessage();
        setMessages([initialMessage]);
    };

    const loadConversationHistory = async () => {
        try {
            const historyRef = db.collection('artifacts').doc('introspect').collection('users').doc(user.uid).collection('therapy_conversations');
            const snapshot = await historyRef.orderBy('timestamp', 'desc').limit(5).get();
            
            const history = [];
            snapshot.forEach(doc => {
                history.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            setConversationHistory(history);
        } catch (error) {
            console.error('Error loading conversation history:', error);
            setConversationHistory([]);
        }
    };

    const generateInitialMessage = async () => {
        const userName = user?.displayName?.split(' ')[0] || 'Usuario';
        const hasTodayEntry = currentEntry?.text && currentEntry.text.trim().length > 0;
        const emotions = hasTodayEntry ? analyzeEmotions(currentEntry.text) : [];
        
        if (hasTodayEntry) {
            // Mensaje inicial corto y directo
            let initialMessage = `Hola ${userName}, veo que escribiste hoy. `;
            
            if (emotions.length > 0) {
                const emotionNames = {
                    sadness: 'tristeza',
                    anxiety: 'ansiedad',
                    anger: 'enojo',
                    joy: 'alegría',
                    gratitude: 'gratitud',
                    confusion: 'confusión'
                };
                const detectedEmotion = emotionNames[emotions[0]]; // Solo la primera emoción
                initialMessage += `¿Te gustaría hablar sobre cómo te sientes?`;
            } else {
                initialMessage += `¿Cómo te sientes hoy?`;
            }
            
            return {
                id: Date.now(),
                type: 'therapist',
                content: initialMessage,
                timestamp: new Date(),
                showOptions: true,
                options: [
                    { id: 'analyze_entry', text: '🧠 Analiza mi entrada profundamente', action: 'analyze_entry' },
                    { id: 'chat', text: '💬 Conversar sobre lo que escribí', action: 'start_chat' },
                    { id: 'general_chat', text: '💭 Hablar de otra cosa', action: 'start_chat' }
                ]
            };
        } else {
            // Mostrar opciones para usuarios sin entrada
            return {
                id: Date.now(),
                type: 'therapist',
                content: `Hola ${userName}, soy tu terapeuta virtual. ¿Cómo te sientes hoy? ¿En qué puedo ayudarte?`,
                timestamp: new Date(),
                showOptions: true,
                options: [
                    { id: 'chat', text: '💬 Quiero conversar', action: 'start_chat' },
                    { id: 'write', text: '✍️ Ayúdame a escribir', action: 'help_write' },
                    { id: 'reflection', text: '🤔 Necesito reflexionar', action: 'start_reflection' },
                    { id: 'support', text: '🫂 Necesito apoyo', action: 'start_support' }
                ]
            };
        }
    };

    const analyzeTodayEntry = async (entryText) => {
        const userName = user?.displayName?.split(' ')[0] || 'Usuario';
        
        // Usar el mismo prompt que la reflexión del terapeuta del plan básico
        const trackedActivitiesSummary = Object.entries(currentEntry?.tracked || {}).map(([activityId, option]) => `- ${activities[activityId]?.name || 'Actividad'}: ${option}`).join('\n');
        
        const prompt = `Actúa como un terapeuta empático y perspicaz. Analiza la siguiente entrada de diario y las actividades registradas. Ofrece una reflexión amable, identifica posibles patrones o sentimientos subyacentes y proporciona una o dos sugerencias constructivas o preguntas para la autorreflexión. Sé conciso y alentador.\n\n**Entrada del Diario:**\n"${entryText || 'No se escribió nada.'}"\n\n**Actividades Registradas:**\n${trackedActivitiesSummary || 'No se registraron actividades.'}`;
        
        try {
            // Usar directamente la API de IA como lo hace callAI
            if (import.meta.env.VITE_GEMINI_API_KEY) {
                const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await response.json();
                const aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || null;
                
                if (aiResponse && aiResponse !== "No se pudo procesar la respuesta.") {
                    return `Hola ${userName}, ${aiResponse}`;
                }
            }
            
            // Fallback: análisis local mejorado
            const emotions = analyzeEmotions(entryText);
            const entryLength = entryText.length;
            
            let analysis = `Hola ${userName}, he analizado lo que escribiste hoy. `;
            
            if (emotions.length > 0) {
                const emotionNames = {
                    sadness: 'tristeza',
                    anxiety: 'ansiedad',
                    anger: 'enojo',
                    joy: 'alegría',
                    gratitude: 'gratitud',
                    confusion: 'confusión'
                };
                
                const detectedEmotions = emotions.map(e => emotionNames[e]).join(', ');
                analysis += `Detecto que estás experimentando ${detectedEmotions}. `;
            }
            
            if (entryLength > 500) {
                analysis += `Has escrito bastante hoy, lo que sugiere que tienes mucho en mente. `;
            } else if (entryLength > 100) {
                analysis += `Has empezado a expresar tus pensamientos. `;
            } else {
                analysis += `Has escrito una entrada breve. `;
            }
            
            // Agregar análisis de actividades si las hay
            if (currentEntry?.tracked && Object.keys(currentEntry.tracked).length > 0) {
                analysis += `También veo que registraste algunas actividades hoy. `;
            }
            
            analysis += `¿Te gustaría que profundicemos en algún aspecto específico de lo que escribiste o hay algo más en lo que pueda ayudarte?`;
            
            return analysis;
        } catch (error) {
            console.error('Error analyzing entry:', error);
            return `Hola ${userName}, he revisado tu entrada de hoy. ¿Te gustaría que conversemos sobre lo que escribiste o hay algo más en lo que pueda ayudarte?`;
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
            const response = await handleOptionAction(option.action);
            setMessages(prev => [...prev, response]);
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

    const handleOptionAction = async (action) => {
        const userName = user?.displayName?.split(' ')[0] || 'Usuario';
        
        switch (action) {
            case 'start_chat':
                return {
                    id: Date.now() + 1,
                    type: 'therapist',
                    content: `Perfecto, ${userName}. Estoy aquí para escucharte. Cuéntame más sobre cómo te sientes y qué está pasando en tu vida.`,
                    timestamp: new Date(),
                    showOptions: false
                };
            case 'help_write':
                return {
                    id: Date.now() + 1,
                    type: 'therapist',
                    content: `Te ayudo a escribir en tu diario. ¿Sobre qué te gustaría escribir hoy? Puedes contarme y te daré sugerencias para empezar.`,
                    timestamp: new Date(),
                    showOptions: false
                };
            case 'start_reflection':
                return {
                    id: Date.now() + 1,
                    type: 'therapist',
                    content: `Excelente, ${userName}. La reflexión es una herramienta muy poderosa. ¿Qué tema te gustaría explorar o sobre qué necesitas reflexionar?`,
                    timestamp: new Date(),
                    showOptions: false
                };
            case 'start_support':
                return {
                    id: Date.now() + 1,
                    type: 'therapist',
                    content: `Entiendo que necesitas apoyo, ${userName}. Estoy aquí para ti. ¿Qué está pasando que te hace sentir que necesitas apoyo en este momento?`,
                    timestamp: new Date(),
                    showOptions: false
                };
            case 'analyze_entry':
                // Análisis profundo solo si el usuario lo pide
                const analysis = await analyzeTodayEntry(currentEntry.text);
                return {
                    id: Date.now() + 1,
                    type: 'therapist',
                    content: analysis,
                    timestamp: new Date(),
                    showOptions: false
                };
            default:
                return {
                    id: Date.now() + 1,
                    type: 'therapist',
                    content: `Gracias por compartir eso conmigo. ¿Puedes contarme más sobre esta situación?`,
                    timestamp: new Date(),
                    showOptions: false
                };
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
        setInputMessage('');
        setIsLoading(true);

        try {
            const therapistResponse = await generateIntelligentResponse(inputMessage);
            setMessages(prev => [...prev, therapistResponse]);
            
            // Guardar la conversación
            await saveConversation(userMessage, therapistResponse);
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

    const generateIntelligentResponse = async (userMessage) => {
        // Análisis básico de emociones y contexto
        const emotionAnalysis = analyzeEmotions(userMessage);
        const context = buildContext();
        
        // Generar respuesta basada en análisis
        const response = await generateContextualResponse(userMessage, emotionAnalysis, context);
        
        return {
            id: Date.now() + 1,
            type: 'therapist',
            content: response.content,
            timestamp: new Date(),
            suggestions: response.suggestions,
            showOptions: false
        };
    };

    const analyzeEmotions = (text) => {
        const emotions = {
            sadness: ['triste', 'tristeza', 'deprimido', 'melancolía', 'llorar', 'solo', 'vacío'],
            anxiety: ['ansiedad', 'nervioso', 'preocupado', 'estrés', 'tenso', 'inquieto', 'miedo'],
            anger: ['enojado', 'frustrado', 'irritado', 'molesto', 'rabia', 'furia'],
            joy: ['feliz', 'alegre', 'contento', 'emocionado', 'dichoso', 'satisfecho'],
            gratitude: ['agradecido', 'gratitud', 'bendecido', 'afortunado', 'agradezco'],
            confusion: ['confundido', 'perdido', 'indeciso', 'duda', 'no sé', 'confuso']
        };

        const detectedEmotions = [];
        const lowerText = text.toLowerCase();

        Object.entries(emotions).forEach(([emotion, keywords]) => {
            if (keywords.some(keyword => lowerText.includes(keyword))) {
                detectedEmotions.push(emotion);
            }
        });

        return detectedEmotions;
    };

    const buildContext = () => {
        const context = {
            userName: user?.displayName?.split(' ')[0] || 'Usuario',
            hasTodayEntry: currentEntry?.text && currentEntry.text.trim().length > 0,
            entryLength: currentEntry?.text?.length || 0,
            recentTopics: extractRecentTopics(),
            conversationCount: conversationHistory.length
        };

        return context;
    };

    const extractRecentTopics = () => {
        // Extraer temas de conversaciones recientes
        const topics = [];
        conversationHistory.slice(0, 3).forEach(conv => {
            if (conv.userMessage) {
                const words = conv.userMessage.toLowerCase().split(' ');
                const commonTopics = ['trabajo', 'familia', 'amigos', 'salud', 'estudio', 'relación', 'futuro', 'pasado'];
                commonTopics.forEach(topic => {
                    if (words.includes(topic) && !topics.includes(topic)) {
                        topics.push(topic);
                    }
                });
            }
        });
        return topics;
    };

    const generateContextualResponse = async (userMessage, emotions, context) => {
        // Simular latencia de IA
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500));

        let response = '';
        let suggestions = [];

        // Respuestas basadas en emociones detectadas
        if (emotions.includes('sadness')) {
            response = getSadnessResponse(userMessage, context);
            suggestions = getSadnessSuggestions();
        } else if (emotions.includes('anxiety')) {
            response = getAnxietyResponse(userMessage, context);
            suggestions = getAnxietySuggestions();
        } else if (emotions.includes('anger')) {
            response = getAngerResponse(userMessage, context);
            suggestions = getAngerSuggestions();
        } else if (emotions.includes('joy')) {
            response = getJoyResponse(userMessage, context);
            suggestions = getJoySuggestions();
        } else if (emotions.includes('gratitude')) {
            response = getGratitudeResponse(userMessage, context);
            suggestions = getGratitudeSuggestions();
        } else {
            response = getGeneralResponse(userMessage, context);
            suggestions = getGeneralSuggestions();
        }

        return { content: response, suggestions };
    };

    // Respuestas específicas por emoción
    const getSadnessResponse = (message, context) => {
        const responses = [
            `Entiendo que te sientes triste, ${context.userName}. Es completamente normal sentir estas emociones. ¿Puedes contarme más sobre qué está causando esta tristeza?`,
            `La tristeza que describes es válida y real. ¿Has notado si hay algo específico que desencadena estos sentimientos?`,
            `Es valiente de tu parte reconocer estos sentimientos de tristeza. ¿Cómo te gustaría manejar esta situación?`,
            `Veo que estás pasando por un momento difícil. ¿Qué te gustaría hacer para cuidarte en este momento?`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    };

    const getAnxietyResponse = (message, context) => {
        const responses = [
            `Entiendo que te sientes ansioso. La ansiedad puede ser muy abrumadora. ¿Puedes identificar qué está causando esta preocupación?`,
            `Es normal sentir ansiedad ante situaciones difíciles. ¿Qué te gustaría hacer para calmarte en este momento?`,
            `La ansiedad que describes suena muy real. ¿Has probado alguna técnica de respiración o relajación?`,
            `Veo que estás experimentando mucha ansiedad. ¿Qué te ayudaría a sentirte más tranquilo ahora mismo?`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    };

    const getAngerResponse = (message, context) => {
        const responses = [
            `Entiendo que te sientes frustrado. Es natural sentir enojo cuando las cosas no salen como esperamos. ¿Puedes contarme más sobre la situación?`,
            `El enojo que sientes es válido. ¿Qué crees que está causando estos sentimientos de frustración?`,
            `Es importante reconocer y expresar el enojo de manera saludable. ¿Cómo te gustaría manejar esta situación?`,
            `Veo que estás muy molesto. ¿Qué te ayudaría a sentirte mejor en este momento?`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    };

    const getJoyResponse = (message, context) => {
        const responses = [
            `¡Me alegra mucho que te sientas feliz! Es hermoso ver que estás experimentando momentos de alegría. ¿Qué está causando estos sentimientos positivos?`,
            `Es maravilloso que te sientas contento. ¿Te gustaría compartir más sobre lo que te está haciendo feliz?`,
            `La felicidad que describes suena muy genuina. ¿Cómo te gustaría celebrar o aprovechar estos momentos positivos?`,
            `Me encanta que estés experimentando alegría. ¿Qué has aprendido de estos momentos felices?`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    };

    const getGratitudeResponse = (message, context) => {
        const responses = [
            `Es hermoso que sientas gratitud. La gratitud es una emoción muy poderosa que puede transformar nuestra perspectiva. ¿Qué más te hace sentir agradecido?`,
            `Me encanta que reconozcas las cosas por las que estás agradecido. ¿Cómo te gustaría expresar esta gratitud?`,
            `La gratitud que expresas es muy valiosa. ¿Has notado cómo estos sentimientos de agradecimiento afectan tu día a día?`,
            `Es maravilloso que sientas agradecimiento. ¿Qué te gustaría hacer para cultivar más estos sentimientos?`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    };

    const getGeneralResponse = (message, context) => {
        const responses = [
            `Gracias por compartir eso conmigo, ${context.userName}. ¿Puedes contarme más sobre esta situación?`,
            `Entiendo lo que me cuentas. ¿Qué crees que está causando estos sentimientos?`,
            `Es importante lo que me compartes. ¿Cómo te gustaría manejar esta situación?`,
            `Veo que esto es significativo para ti. ¿Qué opciones has considerado?`,
            `Me parece que has estado reflexionando sobre esto. ¿Qué has aprendido de esta experiencia?`,
            `Es valiente de tu parte expresar estos pensamientos. ¿Cómo te gustaría proceder?`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    };

    // Sugerencias de ejercicios y estrategias
    const getSadnessSuggestions = () => [
        { id: 'breathing', text: '🌬️ Ejercicio de respiración profunda', description: 'Respira lentamente contando hasta 4, mantén 4, exhala 4' },
        { id: 'gratitude', text: '🙏 Lista de gratitud', description: 'Escribe 3 cosas por las que estés agradecido hoy' },
        { id: 'activity', text: '🚶 Caminata al aire libre', description: 'Sal a caminar 10 minutos para cambiar de ambiente' },
        { id: 'journal', text: '📝 Escribir sobre la tristeza', description: 'Describe tus sentimientos en el diario' }
    ];

    const getAnxietySuggestions = () => [
        { id: 'grounding', text: '🌍 Técnica de anclaje', description: 'Nombra 5 cosas que ves, 4 que tocas, 3 que oyes, 2 que hueles, 1 que saboreas' },
        { id: 'progressive', text: '💪 Relajación muscular', description: 'Tensa y relaja cada grupo muscular por 5 segundos' },
        { id: 'mindfulness', text: '🧘 Meditación de 5 minutos', description: 'Siéntate en silencio y observa tus pensamientos' },
        { id: 'planning', text: '📋 Plan de acción', description: 'Escribe un plan paso a paso para manejar la situación' }
    ];

    const getAngerSuggestions = () => [
        { id: 'timeout', text: '⏰ Pausa de 10 minutos', description: 'Tómate un tiempo antes de responder o actuar' },
        { id: 'physical', text: '💪 Actividad física', description: 'Haz ejercicio para liberar la energía del enojo' },
        { id: 'writing', text: '✍️ Escribir el enojo', description: 'Escribe todo lo que sientes sin filtros' },
        { id: 'perspective', text: '👁️ Cambiar perspectiva', description: 'Intenta ver la situación desde otro ángulo' }
    ];

    const getJoySuggestions = () => [
        { id: 'celebrate', text: '🎉 Celebrar el momento', description: 'Haz algo especial para celebrar tu felicidad' },
        { id: 'share', text: '💬 Compartir con otros', description: 'Comparte tu alegría con alguien cercano' },
        { id: 'savor', text: '😌 Saborear el momento', description: 'Tómate tiempo para disfrutar plenamente' },
        { id: 'gratitude', text: '🙏 Agradecer', description: 'Expresa gratitud por estos momentos felices' }
    ];

    const getGratitudeSuggestions = () => [
        { id: 'journal', text: '📝 Diario de gratitud', description: 'Escribe sobre lo que agradeces en tu diario' },
        { id: 'express', text: '💌 Expresar gratitud', description: 'Dile a alguien lo agradecido que estás' },
        { id: 'meditation', text: '🧘 Meditación de gratitud', description: 'Medita sobre las cosas que agradeces' },
        { id: 'acts', text: '🤝 Actos de bondad', description: 'Haz algo amable por otra persona' }
    ];

    const getGeneralSuggestions = () => [
        { id: 'reflection', text: '🤔 Reflexión profunda', description: 'Tómate tiempo para reflexionar sobre tus pensamientos' },
        { id: 'journal', text: '📝 Escribir en el diario', description: 'Expresa tus pensamientos por escrito' },
        { id: 'talk', text: '💬 Hablar con alguien', description: 'Comparte tus pensamientos con alguien de confianza' },
        { id: 'activity', text: '🎯 Actividad relajante', description: 'Haz algo que te ayude a relajarte' }
    ];

    const saveConversation = async (userMessage, therapistResponse) => {
        try {
            const conversationRef = db.collection('artifacts').doc('introspect').collection('users').doc(user.uid).collection('therapy_conversations');
            await conversationRef.add({
                userMessage: userMessage.content,
                therapistResponse: therapistResponse.content,
                timestamp: new Date(),
                emotions: analyzeEmotions(userMessage.content),
                suggestions: therapistResponse.suggestions || []
            });
        } catch (error) {
            console.error('Error saving conversation:', error);
        }
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
            <PremiumFeatureModal
                isOpen={isOpen}
                onClose={onClose}
                onUpgrade={onUpgradeClick}
                featureName="Chat con Terapeuta"
                featureDescription="Conecta con un terapeuta virtual disponible 24/7 para recibir apoyo emocional y reflexiones profesionales sobre tus pensamientos."
                featureIcon="👩‍⚕️"
            />
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl h-[80vh] mx-4 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-300">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 font-semibold">👩‍⚕️</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Terapeuta Virtual</h2>
                            <p className="text-sm text-gray-700 font-medium">Disponible 24/7</p>
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
                                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                    message.type === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-900'
                                }`}
                            >
                                <p className="text-sm font-medium leading-relaxed">{message.content}</p>
                                <p className="text-xs text-gray-600 mt-1 font-medium">
                                    {message.timestamp.toLocaleTimeString()}
                                </p>
                                
                                {/* Opciones para mensajes del terapeuta */}
                                {message.options && message.options.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        {message.options.map((option) => (
                                            <button
                                                key={option.id}
                                                onClick={() => handleOptionClick(option)}
                                                disabled={isLoading}
                                                className="w-full text-left px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
                                            >
                                                {option.text}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                
                                {/* Sugerencias para mensajes del terapeuta */}
                                {message.suggestions && message.suggestions.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        <p className="text-xs font-semibold text-gray-700 mb-2">💡 Sugerencias para ti:</p>
                                        {message.suggestions.map((suggestion) => (
                                            <div
                                                key={suggestion.id}
                                                className="bg-white border border-gray-300 rounded-lg p-2 text-xs"
                                            >
                                                <div className="font-medium text-gray-900">{suggestion.text}</div>
                                                <div className="text-gray-600 mt-1">{suggestion.description}</div>
                                            </div>
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
                        <textarea
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Escribe tu mensaje..."
                            className="flex-1 border border-gray-400 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-600 font-medium"
                            rows="2"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!inputMessage.trim() || isLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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