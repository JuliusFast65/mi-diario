import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PremiumFeatureModal from './PremiumFeatureModal';
import { collection, doc, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { detectLanguage, getLanguageInstruction } from '../utils/languageUtils';

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
    textareaRef,
    activities,
    currentTheme = 'dark',
    userPrefs = {} // Agregar userPrefs como prop
}) {
    const { t } = useTranslation();
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingSession, setIsLoadingSession] = useState(false);
    const [currentStep, setCurrentStep] = useState('initial');
    const [conversationHistory, setConversationHistory] = useState([]);
    const [userContext, setUserContext] = useState({});
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Función para obtener el estilo del terapeuta basado en las preferencias
    const getTherapistStyle = () => {
        const style = userPrefs.therapistStyle || 'empatico';
        
        const styleConfigs = {
            'empatico': {
                tone: 'empático y comprensivo',
                approach: 'enfocado en la validación emocional y el apoyo',
                personality: 'cálido, comprensivo y validante',
                techniques: 'escucha activa y validación emocional'
            },
            'directo': {
                tone: 'directo y analítico',
                approach: 'enfocado en el análisis objetivo y la claridad',
                personality: 'directo, analítico y claro',
                techniques: 'análisis objetivo y clarificación'
            },
            'motivacional': {
                tone: 'motivacional y alentador',
                approach: 'enfocado en el empoderamiento y la motivación',
                personality: 'energético, motivacional y alentador',
                techniques: 'refuerzo positivo y empoderamiento'
            },
            'cognitivo': {
                tone: 'cognitivo-conductual',
                approach: 'enfocado en patrones de pensamiento y comportamiento',
                personality: 'analítico, estructurado y orientado a soluciones',
                techniques: 'identificación de patrones y reestructuración cognitiva'
            },
            'psicodinamico': {
                tone: 'psicodinámico',
                approach: 'enfocado en exploración profunda y autoconocimiento',
                personality: 'reflexivo, explorador y orientado al insight',
                techniques: 'exploración profunda y autoconocimiento'
            },
            'mindfulness': {
                tone: 'mindfulness y meditación',
                approach: 'enfocado en la presencia y la conciencia plena',
                personality: 'tranquilo, presente y consciente',
                techniques: 'mindfulness y técnicas de presencia'
            }
        };
        
        return styleConfigs[style] || styleConfigs['empatico'];
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const focusInput = () => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Scroll más agresivo cuando se cargan mensajes existentes
    useEffect(() => {
        if (messages.length > 0) {
            // Scroll inmediato para mensajes cargados
            messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
            // Luego scroll suave para mejor UX
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 50);
        }
    }, [messages.length]);

    // Focus en el input cuando se abre el modal
    useEffect(() => {
        if (isOpen && inputRef.current) {
            // Pequeño delay para asegurar que el modal esté completamente renderizado
            setTimeout(() => {
                inputRef.current.focus();
            }, 100);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && db && user) {
            console.log('Modal opened, initializing session...');
            initializeSession();
        } else if (isOpen && (!db || !user)) {
            console.log('Modal opened but DB or user not ready yet');
        } else {
            console.log('Modal closed');
        }
    }, [isOpen, db, user]);

    // Efecto separado para manejar cambios de fecha
    useEffect(() => {
        if (isOpen && db && user) {
            console.log('Date changed to:', selectedDate, '- reloading session...');
            // Limpiar mensajes actuales antes de cargar la nueva sesión
            setMessages([]);
            setCurrentStep('initial');
            initializeSession();
        }
    }, [selectedDate]);



    useEffect(() => {
        console.log('Messages changed:', messages.length, 'messages');
        if (messages.length > 0) {
            console.log('Last message:', messages[messages.length - 1]);
        }
    }, [messages]);

    const initializeSession = async () => {
        console.log('Initializing session for date:', selectedDate);
        setIsLoadingSession(true);
        
        try {
            // Cargar contexto del usuario y historial
            await loadUserContext();
            await loadConversationHistory();
            
            // Verificar si se cargó una sesión existente
            const sessionLoaded = await loadCurrentSession();
            console.log('Session loaded:', sessionLoaded);
        
        // Si no hay sesión cargada, mostrar mensaje inicial
        if (!sessionLoaded) {
            console.log('No session found, showing initial message');
            const hasExistingEntry = currentEntry?.text && currentEntry.text.trim().length > 0;
            
            if (hasExistingEntry) {
                const initialMessage = {
                    id: 1,
                    type: 'therapist',
                    content: t('advancedIntrospectiveAssistant.existingEntryGreeting', { name: user?.displayName?.split(' ')[0] || 'Usuario' }),
                    timestamp: new Date(),
                    options: [
                        { id: 'analyze', text: t('advancedIntrospectiveAssistant.analyzeWhatIWrote'), action: 'analyze_existing' },
                        { id: 'write_more', text: t('advancedIntrospectiveAssistant.helpMeWriteMore'), action: 'help_write_more' },
                        { id: 'chat', text: t('advancedIntrospectiveAssistant.justChat'), action: 'start_chat' }
                    ]
                };
                setMessages([initialMessage]);
                setCurrentStep('existing_entry');
                
                // Guardar la sesión inicial
                setTimeout(() => {
                    saveCurrentSession();
                }, 100);
            } else {
                const initialMessage = {
                    id: 1,
                    type: 'therapist',
                    content: t('advancedIntrospectiveAssistant.initialGreeting', { name: user?.displayName?.split(' ')[0] || 'Usuario' }),
                    timestamp: new Date(),
                    options: [
                        { id: 'tell', text: t('advancedIntrospectiveAssistant.tellMeHowYouFeel'), action: 'start_chat' },
                        { id: 'write', text: t('advancedIntrospectiveAssistant.helpMeWrite'), action: 'help_write' }
                    ]
                };
                setMessages([initialMessage]);
                setCurrentStep('initial');
                
                // Guardar la sesión inicial
                setTimeout(() => {
                    saveCurrentSession();
                }, 100);
            }
                    } else {
                console.log('Session restored successfully');
            }
        } catch (error) {
            console.error('Error initializing session:', error);
        } finally {
            setIsLoadingSession(false);
        }
    };

    const loadUserContext = async () => {
        const context = {
            userName: user?.displayName?.split(' ')[0] || 'Usuario',
            hasTodayEntry: currentEntry?.text && currentEntry.text.trim().length > 0,
            entryLength: currentEntry?.text?.length || 0,
            selectedDate: selectedDate,
            activities: activities || {}
        };
        console.log('User context updated for date:', selectedDate, context);
        setUserContext(context);
    };

    const loadConversationHistory = async () => {
        try {
            if (!db || !user) {
                console.log('DB or user not available yet');
                return;
            }
            
            // Cargar conversaciones previas para contexto
            const historyRef = collection(db, 'artifacts', 'introspect', 'users', user.uid, 'advanced_assistant_conversations');
            const q = query(historyRef, orderBy('timestamp', 'desc'), limit(5));
            const snapshot = await getDocs(q);
            
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

    const loadCurrentSession = async () => {
        try {
            if (!db || !user) {
                console.log('DB or user not available yet');
                return false;
            }
            
            console.log('Loading session for date:', selectedDate);
            const sessionRef = collection(db, 'artifacts', 'introspect', 'users', user.uid, 'advanced_assistant_sessions');
            const q = query(sessionRef, where('date', '==', selectedDate), limit(1));
            const snapshot = await getDocs(q);
            
            console.log('Found sessions:', snapshot.size);
            
            if (!snapshot.empty) {
                const sessionDoc = snapshot.docs[0];
                const sessionData = sessionDoc.data();
                
                console.log('Session data loaded:', sessionData);
                
                // Restaurar mensajes de la sesión
                if (sessionData.messages && sessionData.messages.length > 0) {
                    console.log('Restoring', sessionData.messages.length, 'messages');
                    
                    const restoredMessages = sessionData.messages.map(msg => {
                        let timestamp;
                        if (msg.timestamp && typeof msg.timestamp === 'string') {
                            timestamp = new Date(msg.timestamp);
                        } else if (msg.timestamp && msg.timestamp.seconds) {
                            timestamp = new Date(msg.timestamp.seconds * 1000);
                        } else {
                            timestamp = new Date();
                        }
                        
                        return {
                            ...msg,
                            timestamp: timestamp
                        };
                    });
                    
                    console.log('Restored messages:', restoredMessages);
                    setMessages(restoredMessages);
                    setCurrentStep(sessionData.currentStep || 'initial');
                    
                    return true;
                } else {
                    console.log('No messages in session data');
                }
            } else {
                console.log('No session found for date:', selectedDate);
            }
            
            return false;
        } catch (error) {
            console.error('Error loading current session:', error);
            return false;
        }
    };

    const saveConversation = async (userMessage, therapistResponse, step) => {
        try {
            if (!db || !user) {
                console.log('DB or user not available yet, cannot save conversation');
                return;
            }
            
            const conversationRef = collection(db, 'artifacts', 'introspect', 'users', user.uid, 'advanced_assistant_conversations');
            await addDoc(conversationRef, {
                userMessage: userMessage.content,
                therapistResponse: therapistResponse.content,
                timestamp: new Date(),
                step: step,
                context: userContext
            });
            
            // También guardar la sesión actual
            await saveCurrentSession();
        } catch (error) {
            console.error('Error saving conversation:', error);
        }
    };

    const saveCurrentSession = async () => {
        try {
            if (!db || !user) {
                console.log('DB or user not available yet, cannot save session');
                return;
            }
            
            console.log('Saving session with', messages.length, 'messages');
            
            const sessionRef = collection(db, 'artifacts', 'introspect', 'users', user.uid, 'advanced_assistant_sessions');
            
            // Buscar si ya existe una sesión para esta fecha
            const q = query(sessionRef, where('date', '==', selectedDate), limit(1));
            const snapshot = await getDocs(q);
            
            // Convertir timestamps a formato compatible con Firestore
            const messagesForStorage = messages.map(msg => ({
                ...msg,
                timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp
            }));
            
            const sessionData = {
                date: selectedDate,
                messages: messagesForStorage,
                currentStep: currentStep,
                lastUpdated: new Date(),
                userContext: userContext
            };
            
            console.log('Session data to save:', {
                date: sessionData.date,
                messageCount: sessionData.messages.length,
                currentStep: sessionData.currentStep
            });
            
            if (!snapshot.empty) {
                // Actualizar sesión existente
                const sessionDoc = snapshot.docs[0];
                await updateDoc(doc(db, 'artifacts', 'introspect', 'users', user.uid, 'advanced_assistant_sessions', sessionDoc.id), sessionData);
                console.log('Session updated successfully');
            } else {
                // Crear nueva sesión
                await addDoc(sessionRef, sessionData);
                console.log('New session created successfully');
            }
        } catch (error) {
            console.error('Error saving current session:', error);
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
            let response;
            switch (option.action) {
                case 'start_chat':
                    response = await handleStartChat();
                    break;
                case 'continue_chat':
                    response = await handleContinueChat();
                    break;
                case 'help_write':
                    response = await handleHelpWrite();
                    break;
                case 'help_write_more':
                    response = await handleHelpWriteMore();
                    break;
                case 'analyze_existing':
                    response = await handleAnalyzeExisting();
                    break;
                case 'focus_diary':
                    response = await handleFocusDiary();
                    break;
                case 'end_session':
                    response = await handleEndSession();
                    break;
                default:
                    response = {
                        id: Date.now() + 1,
                        type: 'therapist',
                        content: t('advancedIntrospectiveAssistant.generalContinue'),
                        timestamp: new Date()
                    };
            }
            
            setMessages(prev => [...prev, response]);
            await saveConversation(userMessage, response, currentStep);
            
            // Guardar sesión después de cada interacción
            setTimeout(() => {
                saveCurrentSession();
            }, 100);
        } catch (error) {
            console.error('Error en la acción:', error);
            const errorMessage = {
                id: Date.now() + 1,
                type: 'therapist',
                content: t('advancedIntrospectiveAssistant.errorTechnicalDifficulties'),
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            // Focus en el input después de la respuesta
            setTimeout(() => {
                focusInput();
            }, 100);
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
            const therapistResponse = await generateIntelligentResponse(userInput, currentStep);
            setMessages(prev => [...prev, therapistResponse]);
            await saveConversation(userMessage, therapistResponse, currentStep);
            
            // Guardar sesión después de cada interacción
            setTimeout(() => {
                saveCurrentSession();
            }, 100);
        } catch (error) {
            console.error('Error al generar respuesta:', error);
            const errorMessage = {
                id: Date.now() + 1,
                type: 'therapist',
                content: t('advancedIntrospectiveAssistant.errorTechnicalDifficulties'),
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            // Focus en el input después de la respuesta
            setTimeout(() => {
                focusInput();
            }, 100);
        }
    };

    const handleStartChat = async () => {
        const therapistResponse = {
            id: Date.now() + 1,
            type: 'therapist',
            content: t('advancedIntrospectiveAssistant.perfectListening'),
            timestamp: new Date()
        };
        setCurrentStep('chat');
        return therapistResponse;
    };

    const handleContinueChat = async () => {
        // Obtener el último mensaje del terapeuta para continuar el hilo
        const lastTherapistMessage = messages
            .filter(msg => msg.type === 'therapist')
            .pop();
        
        let response = '';
        
        if (lastTherapistMessage && (lastTherapistMessage.content.includes('análisis') || lastTherapistMessage.content.includes('analicé'))) {
                    // Si el último mensaje fue un análisis, continuar basándose en él
        response = t('advancedIntrospectiveAssistant.continueBasedOnAnalysis');
    } else if (lastTherapistMessage) {
        // Continuar basándose en el último mensaje del terapeuta
        const lastUserMessage = messages
            .filter(msg => msg.type === 'user')
            .pop();
        
        if (lastUserMessage) {
            // Usar IA para continuar la conversación con contexto
            const emotionAnalysis = analyzeEmotions(lastUserMessage.content);
            const context = buildContext();
            const aiResponse = await generateAIResponse(lastUserMessage.content, emotionAnalysis, context);
            response = aiResponse.content;
        } else {
            response = t('advancedIntrospectiveAssistant.generalContinue');
        }
    } else {
        // Respuesta general para continuar conversando
        response = t('advancedIntrospectiveAssistant.generalContinue');
    }
        
        const therapistResponse = {
            id: Date.now() + 1,
            type: 'therapist',
            content: response,
            timestamp: new Date()
        };
        setCurrentStep('chat');
        return therapistResponse;
    };

    const handleHelpWrite = async () => {
        const therapistResponse = {
            id: Date.now() + 1,
            type: 'therapist',
            content: t('advancedIntrospectiveAssistant.helpWriteMessage'),
            timestamp: new Date()
        };
        setCurrentStep('helping_write');
        return therapistResponse;
    };

    const handleHelpWriteMore = async () => {
        // Obtener el último mensaje del terapeuta para continuar el hilo
        const lastTherapistMessage = messages
            .filter(msg => msg.type === 'therapist')
            .pop();
        
        let response = '';
        
        if (lastTherapistMessage && (lastTherapistMessage.content.includes('análisis') || lastTherapistMessage.content.includes('analicé'))) {
            // Si el último mensaje fue un análisis, continuar basándose en él
            response = t('advancedIntrospectiveAssistant.exploreAnalysisAspect');
        } else if (lastTherapistMessage) {
            // Continuar basándose en el contexto de la conversación
            const lastUserMessage = messages
                .filter(msg => msg.type === 'user')
                .pop();
            
            if (lastUserMessage) {
                // Usar IA para generar sugerencias de escritura basadas en la conversación
                const emotionAnalysis = analyzeEmotions(lastUserMessage.content);
                const context = buildContext();
                
                // Crear prompt específico para ayuda de escritura
                const conversationHistory = messages
                    .slice(-6)
                    .map(msg => `${msg.type === 'user' ? 'Usuario' : 'Terapeuta'}: ${msg.content}`)
                    .join('\n');
                
                const prompt = `Ayuda al usuario a escribir en su diario basándote en la conversación reciente.

**Contexto:**
- Nombre: ${context.userName}
- Entrada de hoy: ${context.hasTodayEntry ? 'Sí' : 'No'}
- Emociones: ${emotionAnalysis.map(e => e).join(', ') || 'No detectadas'}

**Conversación:**
${conversationHistory}

**Usuario dijo:** "${lastUserMessage.content}"

**Instrucciones:**
- Sugiere qué podría escribir en su diario
- Sé específico pero conciso
- No uses lenguaje formal
- Mantén un tono natural y de apoyo

Sugiere qué escribir:`;

                try {
                    if (import.meta.env.VITE_GEMINI_API_KEY) {
                        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
                        const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });
                        const result = await apiResponse.json();
                        const aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || null;
                        
                        if (aiResponse && aiResponse !== "No se pudo procesar la respuesta.") {
                            response = aiResponse;
                        } else {
                            response = t('advancedIntrospectiveAssistant.developConversationAspect');
                        }
                    } else {
                        response = t('advancedIntrospectiveAssistant.developConversationAspect');
                    }
                } catch (error) {
                    console.error('Error generating writing assistance:', error);
                    response = t('advancedIntrospectiveAssistant.developConversationAspect');
                }
            } else {
                response = t('advancedIntrospectiveAssistant.addMoreToWriting');
            }
        } else {
            // Respuesta general para continuar escribiendo
            response = t('advancedIntrospectiveAssistant.addMoreToWriting');
        }
        
        const therapistResponse = {
            id: Date.now() + 1,
            type: 'therapist',
            content: response,
            timestamp: new Date()
        };
        setCurrentStep('helping_write_more');
        return therapistResponse;
    };

    const handleAnalyzeExisting = async () => {
        // Análisis profundo con IA real (sin mensaje intermedio)
        const analysis = await generateDeepAnalysis(currentEntry.text);
        const analysisMessage = {
            id: Date.now() + 1,
            type: 'therapist',
            content: analysis,
            timestamp: new Date(),
            options: [
                { id: 'help_write_more', text: t('advancedIntrospectiveAssistant.helpMeWriteMore'), action: 'help_write_more' },
                { id: 'focus_diary', text: t('advancedIntrospectiveAssistant.goToDiary'), action: 'focus_diary' },
                { id: 'continue_chat', text: t('advancedIntrospectiveAssistant.continueConversing'), action: 'continue_chat' }
            ]
        };
        setCurrentStep('analysis_complete');
        return analysisMessage;
    };

    const handleFocusDiary = async () => {
        const therapistResponse = {
            id: Date.now() + 1,
            type: 'therapist',
            content: t('advancedIntrospectiveAssistant.focusDiaryMessage'),
            timestamp: new Date()
        };
        
        // Cerrar el modal y enfocar el textarea del diario
        setTimeout(() => {
            handleClose();
            if (textareaRef?.current) {
                textareaRef.current.focus();
            }
        }, 2000);
        
        return therapistResponse;
    };

    const handleEndSession = async () => {
        const therapistResponse = {
            id: Date.now() + 1,
            type: 'therapist',
            content: t('advancedIntrospectiveAssistant.sessionEnded'),
            timestamp: new Date()
        };
        setCurrentStep('session_ended');
        
        // Cerrar el modal después de un delay
        setTimeout(() => {
            handleClose();
        }, 3000);
        
        return therapistResponse;
    };

    const generateIntelligentResponse = async (userInput, step) => {
        // Análisis básico de emociones y contexto
        const emotionAnalysis = analyzeEmotions(userInput);
        const context = buildContext();
        
        // Usar IA real para respuestas de conversación
        if (step === 'chat' || step === 'initial') {
            return await generateAIResponse(userInput, emotionAnalysis, context);
        } else {
            // Para ayuda de escritura, usar respuestas contextuales
            const response = await generateContextualResponse(userInput, emotionAnalysis, context, step);
            return response;
        }
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
            userName: userContext.userName,
            hasTodayEntry: userContext.hasTodayEntry,
            entryLength: userContext.entryLength,
            recentTopics: extractRecentTopics(),
            conversationCount: conversationHistory.length,
            currentStep: currentStep
        };

        return context;
    };

    const extractRecentTopics = () => {
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

    const generateAIResponse = async (userInput, emotions, context) => {
        try {
            // Usar IA real para respuestas de conversación
            if (import.meta.env.VITE_GEMINI_API_KEY) {
                const styleConfig = getTherapistStyle();
                const emotionNames = {
                    sadness: 'tristeza',
                    anxiety: 'ansiedad', 
                    anger: 'enojo',
                    joy: 'alegría',
                    gratitude: 'gratitud',
                    confusion: 'confusión'
                };
                
                const detectedEmotions = emotions.map(e => emotionNames[e]).join(', ');
                const hasTodayEntry = context.hasTodayEntry ? 'Sí' : 'No';
                const entryLength = context.entryLength;
                
                // Obtener historial de la conversación actual (últimos 6 mensajes)
                const conversationHistory = messages
                    .slice(-6)
                    .map(msg => `${msg.type === 'user' ? 'Usuario' : 'Terapeuta'}: ${msg.content}`)
                    .join('\n');
                
                // Detectar idioma del input del usuario
                const detectedLanguage = detectLanguage(userInput);
                const languageInstruction = getLanguageInstruction(detectedLanguage);
                
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

                const prompt = `Eres un terapeuta con un enfoque ${styleConfig.approach}. Tu personalidad es ${styleConfig.personality} y utilizas técnicas de ${styleConfig.techniques}.

${languageInstruction}

**Contexto:**
- Nombre: ${context.userName}${demographicContext}
- Entrada de hoy: ${hasTodayEntry ? 'Sí' : 'No'}
- Emociones: ${detectedEmotions || 'No detectadas'}

**Conversación reciente:**
${conversationHistory}

**Usuario dice:** "${userInput}"

**Instrucciones importantes:**
- Mantén un tono ${styleConfig.tone} de manera NATURAL y SUTIL
- NO exageres ni fuerces el estilo - debe sentirse auténtico
- Utiliza técnicas de ${styleConfig.techniques} de forma orgánica
- Responde de manera natural, como en una conversación real
- Mantén respuestas CONCISAS (máximo 2-3 frases)
- Haz preguntas abiertas que inviten a la reflexión
- Mantén continuidad con la conversación anterior
- Adapta tu lenguaje según la edad y contexto del usuario
- No uses lenguaje formal o terapéutico excesivo

Responde de manera natural y auténtica:`;

                const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await response.json();
                const aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || null;
                
                if (aiResponse && aiResponse !== "No se pudo procesar la respuesta.") {
                    return {
                        id: Date.now() + 1,
                        type: 'therapist',
                        content: aiResponse,
                        timestamp: new Date()
                    };
                }
            }
            
            // Fallback: usar respuestas contextuales
            const response = await generateConversationResponse(userInput, emotions, context);
            return {
                id: Date.now() + 1,
                type: 'therapist',
                content: response,
                timestamp: new Date()
            };
        } catch (error) {
            console.error('Error generating AI response:', error);
            // Fallback: usar respuestas contextuales
            const response = await generateConversationResponse(userInput, emotions, context);
            return {
                id: Date.now() + 1,
                type: 'therapist',
                content: response,
                timestamp: new Date()
            };
        }
    };

    const generateContextualResponse = async (userInput, emotions, context, step) => {
        // Simular latencia de IA
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

        let response = '';
        let options = [];

        if (step === 'helping_write' || step === 'helping_write_more') {
            // Respuestas específicas para ayudar a escribir
            response = await generateWritingAssistance(userInput, context);
            options = [
                { id: 'focus_diary', text: t('advancedIntrospectiveAssistant.goToWrite'), action: 'focus_diary' },
                { id: 'continue_chat', text: t('advancedIntrospectiveAssistant.followConversation'), action: 'start_chat' }
            ];
        } else {
            // Respuestas generales de conversación
            response = await generateConversationResponse(userInput, emotions, context);
        }

        return {
            id: Date.now() + 1,
            type: 'therapist',
            content: response,
            timestamp: new Date(),
            options: options.length > 0 ? options : undefined
        };
    };

    const generateWritingAssistance = async (userInput, context) => {
        // Detectar idioma del input del usuario
        const detectedLanguage = detectLanguage(userInput);
        
        const writingPrompts = {
            'es': [
                `Basándome en lo que me contaste, te sugiero empezar escribiendo sobre: "${userInput}". Puedes expandir esto en tu diario explorando tus sentimientos más profundos.`,
                `Me parece que "${userInput}" es un tema importante para ti. ¿Por qué no escribes sobre cómo te hace sentir y cuándo empezaste a notar estos sentimientos?`,
                `"${userInput}" suena muy significativo. Te sugiero escribir sobre cuándo empezaste a sentir esto, cómo ha evolucionado, y qué has aprendido de esta experiencia.`,
                `Excelente tema. Sobre "${userInput}", podrías escribir sobre qué aprendiste de esta experiencia y cómo te ha cambiado.`,
                `"${userInput}" es muy interesante. ¿Qué te gustaría explorar más sobre esto en tu diario? Considera escribir sobre tus pensamientos, sentimientos y reflexiones.`
            ],
            'en': [
                `Based on what you told me, I suggest you start writing about: "${userInput}". You can expand this in your diary by exploring your deeper feelings.`,
                `I think "${userInput}" is an important topic for you. Why don't you write about how it makes you feel and when you started noticing these feelings?`,
                `"${userInput}" sounds very significant. I suggest you write about when you started feeling this, how it has evolved, and what you've learned from this experience.`,
                `Excellent topic. About "${userInput}", you could write about what you learned from this experience and how it has changed you.`,
                `"${userInput}" is very interesting. What would you like to explore more about this in your diary? Consider writing about your thoughts, feelings, and reflections.`
            ],
            'fr': [
                `Basé sur ce que vous m'avez dit, je vous suggère de commencer à écrire sur : "${userInput}". Vous pouvez développer cela dans votre journal en explorant vos sentiments plus profonds.`,
                `Je pense que "${userInput}" est un sujet important pour vous. Pourquoi ne pas écrire sur comment cela vous fait sentir et quand vous avez commencé à remarquer ces sentiments ?`,
                `"${userInput}" semble très significatif. Je vous suggère d'écrire sur quand vous avez commencé à ressentir cela, comment cela a évolué, et ce que vous avez appris de cette expérience.`,
                `Excellent sujet. À propos de "${userInput}", vous pourriez écrire sur ce que vous avez appris de cette expérience et comment cela vous a changé.`,
                `"${userInput}" est très intéressant. Qu'aimeriez-vous explorer davantage à ce sujet dans votre journal ? Considérez écrire sur vos pensées, sentiments et réflexions.`
            ]
        };
        
        const prompts = writingPrompts[detectedLanguage] || writingPrompts['es'];
        return prompts[Math.floor(Math.random() * prompts.length)];
    };

    const generateConversationResponse = async (userInput, emotions, context) => {
        // Detectar idioma del input del usuario
        const detectedLanguage = detectLanguage(userInput);
        
        const emotionResponses = {
            'es': {
                sadness: [
                    `Entiendo que te sientes triste, ${context.userName}. Es completamente normal sentir estas emociones. ¿Puedes contarme más sobre qué está causando esta tristeza?`,
                    `La tristeza que describes es válida y real. ¿Has notado si hay algo específico que desencadena estos sentimientos?`,
                    `Es valiente de tu parte reconocer estos sentimientos de tristeza. ¿Cómo te gustaría manejar esta situación?`
                ],
                anxiety: [
                    `Entiendo que te sientes ansioso. La ansiedad puede ser muy abrumadora. ¿Puedes identificar qué está causando esta preocupación?`,
                    `Es normal sentir ansiedad ante situaciones difíciles. ¿Qué te gustaría hacer para calmarte en este momento?`,
                    `La ansiedad que describes suena muy real. ¿Has probado alguna técnica de respiración o relajación?`
                ],
                joy: [
                    `¡Me alegra mucho que te sientas feliz! Es hermoso ver que estás experimentando momentos de alegría. ¿Qué está causando estos sentimientos positivos?`,
                    `Es maravilloso que te sientas contento. ¿Te gustaría compartir más sobre lo que te está haciendo feliz?`,
                    `La felicidad que describes suena muy genuina. ¿Cómo te gustaría celebrar o aprovechar estos momentos positivos?`
                ],
                general: [
                    `Gracias por compartir eso conmigo, ${context.userName}. ¿Puedes contarme más sobre esta situación?`,
                    `Entiendo lo que me cuentas. ¿Qué crees que está causando estos sentimientos?`,
                    `Es importante lo que me compartes. ¿Cómo te gustaría manejar esta situación?`,
                    `Veo que esto es significativo para ti. ¿Qué opciones has considerado?`,
                    `Me parece que has estado reflexionando sobre esto. ¿Qué has aprendido de esta experiencia?`,
                    `Es valiente de tu parte expresar estos pensamientos. ¿Cómo te gustaría proceder?`
                ]
            },
            'en': {
                sadness: [
                    `I understand you're feeling sad, ${context.userName}. It's completely normal to feel these emotions. Can you tell me more about what's causing this sadness?`,
                    `The sadness you describe is valid and real. Have you noticed if there's something specific that triggers these feelings?`,
                    `It's brave of you to acknowledge these feelings of sadness. How would you like to handle this situation?`
                ],
                anxiety: [
                    `I understand you're feeling anxious. Anxiety can be very overwhelming. Can you identify what's causing this worry?`,
                    `It's normal to feel anxious in difficult situations. What would you like to do to calm yourself right now?`,
                    `The anxiety you describe sounds very real. Have you tried any breathing or relaxation techniques?`
                ],
                joy: [
                    `I'm so glad you're feeling happy! It's beautiful to see you experiencing moments of joy. What's causing these positive feelings?`,
                    `It's wonderful that you're feeling content. Would you like to share more about what's making you happy?`,
                    `The happiness you describe sounds very genuine. How would you like to celebrate or take advantage of these positive moments?`
                ],
                general: [
                    `Thank you for sharing that with me, ${context.userName}. Can you tell me more about this situation?`,
                    `I understand what you're telling me. What do you think is causing these feelings?`,
                    `It's important what you're sharing with me. How would you like to handle this situation?`,
                    `I see this is significant for you. What options have you considered?`,
                    `It seems like you've been reflecting on this. What have you learned from this experience?`,
                    `It's brave of you to express these thoughts. How would you like to proceed?`
                ]
            },
            'fr': {
                sadness: [
                    `Je comprends que vous vous sentez triste, ${context.userName}. Il est tout à fait normal de ressentir ces émotions. Pouvez-vous me dire plus sur ce qui cause cette tristesse ?`,
                    `La tristesse que vous décrivez est valide et réelle. Avez-vous remarqué s'il y a quelque chose de spécifique qui déclenche ces sentiments ?`,
                    `C'est courageux de votre part de reconnaître ces sentiments de tristesse. Comment aimeriez-vous gérer cette situation ?`
                ],
                anxiety: [
                    `Je comprends que vous vous sentez anxieux. L'anxiété peut être très accablante. Pouvez-vous identifier ce qui cause cette inquiétude ?`,
                    `Il est normal de se sentir anxieux dans des situations difficiles. Que voudriez-vous faire pour vous calmer en ce moment ?`,
                    `L'anxiété que vous décrivez semble très réelle. Avez-vous essayé des techniques de respiration ou de relaxation ?`
                ],
                joy: [
                    `Je suis si content que vous vous sentiez heureux ! C'est beau de voir que vous vivez des moments de joie. Qu'est-ce qui cause ces sentiments positifs ?`,
                    `C'est merveilleux que vous vous sentiez content. Voudriez-vous partager plus sur ce qui vous rend heureux ?`,
                    `Le bonheur que vous décrivez semble très authentique. Comment aimeriez-vous célébrer ou profiter de ces moments positifs ?`
                ],
                general: [
                    `Merci de partager cela avec moi, ${context.userName}. Pouvez-vous me dire plus sur cette situation ?`,
                    `Je comprends ce que vous me dites. Que pensez-vous qui cause ces sentiments ?`,
                    `C'est important ce que vous partagez avec moi. Comment aimeriez-vous gérer cette situation ?`,
                    `Je vois que c'est significatif pour vous. Quelles options avez-vous considérées ?`,
                    `Il semble que vous ayez réfléchi à cela. Qu'avez-vous appris de cette expérience ?`,
                    `C'est courageux de votre part d'exprimer ces pensées. Comment aimeriez-vous procéder ?`
                ]
            }
        };
        
        const responses = emotionResponses[detectedLanguage] || emotionResponses['es'];
        let response = '';
        
        if (emotions.includes('sadness')) {
            response = responses.sadness[Math.floor(Math.random() * responses.sadness.length)];
        } else if (emotions.includes('anxiety')) {
            response = responses.anxiety[Math.floor(Math.random() * responses.anxiety.length)];
        } else if (emotions.includes('joy')) {
            response = responses.joy[Math.floor(Math.random() * responses.joy.length)];
        } else {
            response = responses.general[Math.floor(Math.random() * responses.general.length)];
        }
        
        return response;
    };

    const generateDeepAnalysis = async (text) => {
        try {
            // Usar directamente la API de IA para análisis profundo
            if (import.meta.env.VITE_GEMINI_API_KEY) {
                const styleConfig = getTherapistStyle();
                const trackedActivitiesSummary = Object.entries(currentEntry?.tracked || {}).map(([activityId, option]) => `- ${activities[activityId]?.name || 'Actividad'}: ${option}`).join('\n');
                
                // Detectar idioma del texto
                const detectedLanguage = detectLanguage(text);
                const languageInstruction = getLanguageInstruction(detectedLanguage);
                
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

                const prompt = `Analiza esta entrada de diario con un enfoque ${styleConfig.approach}.

${languageInstruction}

**Entrada:**
"${text || 'No se escribió nada.'}"

**Actividades:**
${trackedActivitiesSummary || 'No se registraron actividades.'}

**Usuario:** ${userContext.userName}${demographicContext}

**Instrucciones:**
- Mantén una personalidad ${styleConfig.personality} de manera NATURAL
- Utiliza técnicas de ${styleConfig.techniques} de forma orgánica
- Ofrece una reflexión amable y concisa
- Identifica patrones o sentimientos importantes
- Proporciona 1-2 sugerencias constructivas
- Mantén un tono natural y de apoyo
- NO exageres el estilo - debe sentirse auténtico
- Adapta tu análisis según la edad y contexto del usuario
- No uses lenguaje formal excesivo

Analiza de manera terapéutica natural:`;

                const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await response.json();
                const aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || null;
                
                if (aiResponse && aiResponse !== "No se pudo procesar la respuesta.") {
                    return aiResponse;
                }
            }
            
            // Fallback: análisis local mejorado
            const emotions = analyzeEmotions(text);
            const entryLength = text.length;
            
            // Detectar idioma del texto
            const detectedLanguage = detectLanguage(text);
            
            const fallbackAnalysis = {
                'es': {
                    start: 'He analizado lo que escribiste hoy. ',
                    emotions: {
                        sadness: 'tristeza',
                        anxiety: 'ansiedad',
                        anger: 'enojo',
                        joy: 'alegría',
                        gratitude: 'gratitud',
                        confusion: 'confusión'
                    },
                    length: {
                        long: 'Has escrito bastante hoy, lo que sugiere que tienes mucho en mente. ',
                        medium: 'Has empezado a expresar tus pensamientos. ',
                        short: 'Has escrito una entrada breve. '
                    },
                    end: '¿Te gustaría que profundicemos en algún aspecto específico de lo que escribiste?',
                    error: 'He revisado tu entrada de hoy. ¿Te gustaría que conversemos sobre lo que escribiste?'
                },
                'en': {
                    start: 'I have analyzed what you wrote today. ',
                    emotions: {
                        sadness: 'sadness',
                        anxiety: 'anxiety',
                        anger: 'anger',
                        joy: 'joy',
                        gratitude: 'gratitude',
                        confusion: 'confusion'
                    },
                    length: {
                        long: 'You have written quite a bit today, which suggests you have a lot on your mind. ',
                        medium: 'You have started to express your thoughts. ',
                        short: 'You have written a brief entry. '
                    },
                    end: 'Would you like to explore any specific aspect of what you wrote?',
                    error: 'I have reviewed your entry today. Would you like to discuss what you wrote?'
                },
                'fr': {
                    start: 'J\'ai analysé ce que vous avez écrit aujourd\'hui. ',
                    emotions: {
                        sadness: 'tristesse',
                        anxiety: 'anxiété',
                        anger: 'colère',
                        joy: 'joie',
                        gratitude: 'gratitude',
                        confusion: 'confusion'
                    },
                    length: {
                        long: 'Vous avez écrit pas mal aujourd\'hui, ce qui suggère que vous avez beaucoup en tête. ',
                        medium: 'Vous avez commencé à exprimer vos pensées. ',
                        short: 'Vous avez écrit une entrée brève. '
                    },
                    end: 'Aimeriez-vous explorer un aspect spécifique de ce que vous avez écrit ?',
                    error: 'J\'ai examiné votre entrée aujourd\'hui. Aimeriez-vous discuter de ce que vous avez écrit ?'
                }
            };
            
            const analysis = fallbackAnalysis[detectedLanguage] || fallbackAnalysis['es'];
            let result = analysis.start;
            
            if (emotions.length > 0) {
                const emotionNames = emotions.map(e => analysis.emotions[e]).join(', ');
                const emotionMessages = {
                    'es': `Detecto que estás experimentando ${emotionNames}. `,
                    'en': `I detect that you are experiencing ${emotionNames}. `,
                    'fr': `Je détecte que vous ressentez ${emotionNames}. `
                };
                result += emotionMessages[detectedLanguage] || emotionMessages['es'];
            }
            
            if (entryLength > 500) {
                result += analysis.length.long;
            } else if (entryLength > 100) {
                result += analysis.length.medium;
            } else {
                result += analysis.length.short;
            }
            
            result += analysis.end;
            
            return result;
        } catch (error) {
            console.error('Error analyzing entry:', error);
            const detectedLanguage = detectLanguage(text);
            const fallbackAnalysis = {
                'es': 'He revisado tu entrada de hoy. ¿Te gustaría que conversemos sobre lo que escribiste?',
                'en': 'I have reviewed your entry today. Would you like to discuss what you wrote?',
                'fr': 'J\'ai examiné votre entrée aujourd\'hui. Aimeriez-vous discuter de ce que vous avez écrit ?'
            };
            return fallbackAnalysis[detectedLanguage] || fallbackAnalysis['es'];
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!isOpen) return null;

    // Guardar sesión cuando se cierre el modal
    const handleClose = async () => {
        if (messages.length > 0) {
            await saveCurrentSession();
        }
        onClose();
    };

    if (!hasFeature('advanced_introspective_assistant')) {
        return (
            <PremiumFeatureModal
                isOpen={isOpen}
                onClose={handleClose}
                onUpgrade={onUpgradeClick}
                featureName="Asistente Introspectivo Avanzado"
                featureDescription="Combina el poder del chat terapéutico con asistencia de escritura avanzada para una experiencia de reflexión personal completa."
                featureIcon="🧠"
                currentTheme={currentTheme}
            />
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg w-full max-w-2xl h-[80vh] mx-4 flex flex-col`}>
                {/* Header */}
                <div className={`flex items-center justify-between p-4 border-b ${currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">🧠</span>
                        </div>
                        <div>
                            <h2 className={`text-xl font-bold ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('advancedIntrospectiveAssistant.title')}</h2>
                            <p className="text-xs text-blue-600 font-medium">
                                📅 {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { 
                                    day: 'numeric', 
                                    month: 'short', 
                                    year: 'numeric' 
                                })}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={async () => {
                                if (confirm(t('advancedIntrospectiveAssistant.clearConversationConfirm', { date: new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES') }))) {
                                    console.log('Clearing session for date:', selectedDate);
                                    setMessages([]);
                                    setCurrentStep('initial');
                                    // Limpiar sesión de Firestore
                                    const sessionRef = collection(db, 'artifacts', 'introspect', 'users', user.uid, 'advanced_assistant_sessions');
                                    const q = query(sessionRef, where('date', '==', selectedDate), limit(1));
                                    const snapshot = await getDocs(q);
                                    if (!snapshot.empty) {
                                        await deleteDoc(doc(db, 'artifacts', 'introspect', 'users', user.uid, 'advanced_assistant_sessions', snapshot.docs[0].id));
                                        console.log('Session cleared for date:', selectedDate);
                                    }
                                }
                            }}
                            className={`text-red-600 hover:text-red-900 p-2 rounded-lg transition-colors text-xs ${currentTheme === 'dark' ? 'hover:bg-red-900 hover:bg-opacity-20' : 'hover:bg-red-100'}`}
                            title={t('advancedIntrospectiveAssistant.clearConversation', { date: new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES') })}
                        >
                            🗑️
                        </button>
                        <button
                            onClick={handleClose}
                            className={`${currentTheme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'} p-2 rounded-lg transition-colors`}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {isLoadingSession && (
                        <div className="flex justify-center items-center py-8">
                            <div className="text-center">
                                <div className="flex space-x-1 justify-center mb-2">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                </div>
                                <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('advancedIntrospectiveAssistant.loadingConversation', { date: new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES') })}</p>
                            </div>
                        </div>
                    )}
                    
                    {!isLoadingSession && messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                    message.type === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : currentTheme === 'dark' 
                                            ? 'bg-gray-700 text-white' 
                                            : 'bg-gray-200 text-gray-900'
                                }`}
                            >
                                <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{message.content}</p>
                                <p className={`text-xs mt-1 font-medium ${message.type === 'user' ? 'text-blue-100' : currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
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
                                                className={`w-full text-left px-3 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors ${
                                                    currentTheme === 'dark' 
                                                        ? 'bg-gray-600 border-gray-500 text-white hover:bg-gray-500' 
                                                        : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                                                }`}
                                            >
                                                {option.text}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {!isLoadingSession && isLoading && (
                        <div className="flex justify-start">
                            <div className={`${currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} rounded-lg px-4 py-2`}>
                                <div className="flex space-x-1">
                                    <div className={`w-2 h-2 rounded-full animate-bounce ${currentTheme === 'dark' ? 'bg-gray-400' : 'bg-gray-600'}`}></div>
                                    <div className={`w-2 h-2 rounded-full animate-bounce ${currentTheme === 'dark' ? 'bg-gray-400' : 'bg-gray-600'}`} style={{animationDelay: '0.1s'}}></div>
                                    <div className={`w-2 h-2 rounded-full animate-bounce ${currentTheme === 'dark' ? 'bg-gray-400' : 'bg-gray-600'}`} style={{animationDelay: '0.2s'}}></div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className={`p-4 border-t ${currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
                    <div className="flex gap-2">
                                                    <input
                                ref={inputRef}
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder={t('advancedIntrospectiveAssistant.writeMessage')}
                                className={`flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium ${
                                    currentTheme === 'dark' 
                                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                        : 'border-gray-400 text-gray-900 placeholder-gray-600'
                                }`}
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