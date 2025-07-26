import React, { useState, useEffect, useRef } from 'react';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, setDoc, collection, getDocs, getDoc, query, where, documentId, deleteDoc } from 'firebase/firestore';

import { auth, db } from './firebase';
import DiaryEntryEditor from './components/DiaryEntryEditor';
import ArchiveView from './components/ArchiveView';
import StatisticsPanel from './components/StatisticsPanel';
import { decryptText } from './utils/crypto';
import CreateActivityModal from './components/CreateActivityModal';
import DefineActivitiesModal from './components/DefineActivitiesModal';
import ExportModal from './components/ExportModal';
import ImportModal from './components/ImportModal';
import UserProfileModal from './components/UserProfileModal';
import UpdateNotification from './components/UpdateNotification';

// Premium Components
import TherapistChat from './components/TherapistChat';
import WritingAssistant from './components/WritingAssistant';
import BehaviorAnalysis from './components/BehaviorAnalysis';
import TwoFactorAuth from './components/TwoFactorAuth';
import SubscriptionModal from './components/SubscriptionModal';
import PremiumFeatureModal from './components/PremiumFeatureModal';
import HamburgerMenu from './components/HamburgerMenu';
import ActivityLimitWarning from './components/ActivityLimitWarning';

import Onboarding from './components/Onboarding';
import useActivities from './hooks/useActivities';
import useDiary from './hooks/useDiary';
import useSubscription from './hooks/useSubscription';
import useTheme from './hooks/useTheme';
import SubscriptionStatus from './components/SubscriptionStatus';


// --- Configuración de Firebase ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const appId = firebaseConfig.projectId;

// --- Componente de Login ---
const LoginScreen = ({ onGoogleSignIn }) => (
    <div className="bg-gray-900 dark:bg-gray-900 bg-white text-gray-900 dark:text-gray-100 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center flex flex-col items-center">
            <div className="mb-8">
                <img src="/favicon.svg" alt="Logo Diario Personal" className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-6" />
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">Introspect</h1>
                <p className="text-gray-600 dark:text-gray-300 text-lg md:text-xl mb-2">Tu Diario Personal</p>
                <p className="text-gray-600 dark:text-gray-300 text-lg md:text-xl">Guarda tus pensamientos y sigue tus hábitos con propósito.</p>
                <span className="block mt-4 text-xs text-gray-500 dark:text-gray-400">V {APP_VERSION}</span>
            </div>
            <button
                onClick={onGoogleSignIn}
                className="bg-indigo-600 dark:bg-white text-white dark:text-gray-800 font-semibold py-3 px-6 rounded-lg shadow-lg hover:bg-indigo-700 dark:hover:bg-gray-200 transition-colors duration-300 inline-flex items-center gap-3 text-lg"
            >
                <svg className="w-6 h-6" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>
                Iniciar sesión con Google
            </button>
        </div>
    </div>
);

// --- Componente Principal de la App ---
const DiaryApp = ({ user }) => {
    const [db, setDb] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    
    // Usar hook de suscripción real
    const { subscription, updateSubscription, hasFeature, isSubscriptionActive, isLoading: isLoadingSubscription } = useSubscription(db, user, appId);
    
    const { currentEntry, setCurrentEntry, isLoadingEntry, importEntry } = useDiary(db, user, appId, selectedDate);
    const { activities, handleSaveActivity, handleDeleteActivity, handleAddOptionToActivity, handleDeleteOptionFromActivity, handleSaveGoal, handleUpdatePoints, getActivityLimits, isSimpleActivity, getActivityPoints } = useActivities(db, user, appId, subscription);

    // Manejo de errores para límite de actividades
    const handleSaveActivityWithLimit = async (activityData) => {
        try {
            await handleSaveActivity(activityData);
        } catch (error) {
            console.error('Error al guardar actividad:', error);
            if (error.message.includes('Plan gratuito limitado')) {
                alert(error.message);
                setIsSubscriptionModalOpen(true);
            } else {
                alert('Error al guardar la actividad. Inténtalo de nuevo.');
            }
        }
    };
    
    // const { subscription, updateSubscription, hasFeature, isSubscriptionActive } = useSubscription(db, user, appId);
    const [view, setView] = useState('diary');
    const [userPrefs, setUserPrefs] = useState({ 
        font: 'patrick-hand', 
        fontSize: 'text-3xl',
        theme: 'dark'
    });
    const [allEntries, setAllEntries] = useState([]);
    
    // Hook para manejo de tema
    const { currentTheme, systemTheme, setTheme } = useTheme(userPrefs);
    
    // State de Modales
    const [isDefineActivitiesModalOpen, setDefineActivitiesModalOpen] = useState(false);
    const [isExportModalOpen, setExportModalOpen] = useState(false);
    const [isImportModalOpen, setImportModalOpen] = useState(false);
    const [isUserProfileModalOpen, setUserProfileModalOpen] = useState(false);
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

    // Premium Modals State
    const [isTherapistChatOpen, setIsTherapistChatOpen] = useState(false);
    const [isWritingAssistantOpen, setIsWritingAssistantOpen] = useState(false);
    const [isBehaviorAnalysisOpen, setIsBehaviorAnalysisOpen] = useState(false);
    const [isTwoFactorAuthOpen, setIsTwoFactorAuthOpen] = useState(false);
    const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
    const [isPremiumFeatureModalOpen, setIsPremiumFeatureModalOpen] = useState(false);
    const [premiumFeatureInfo, setPremiumFeatureInfo] = useState({ name: '', description: '', icon: '' });

    const [isAIModalOpen, setAIModalOpen] = useState(false);
    const [aiResponse, setAiResponse] = useState('');
    const [isAILoading, setAILoading] = useState(false);
    const [aiModalTitle, setAIModalTitle] = useState('');
    const [writingAssistantSuggestion, setWritingAssistantSuggestion] = useState('');
    const textareaRef = useRef();

    useEffect(() => {
        const firestoreDb = getFirestore();
        setDb(firestoreDb);
    }, []);

    // Listeners de Firestore
    useEffect(() => {
        if (!db || !user?.uid) return;
        const activitiesCol = collection(db, 'artifacts', appId, 'users', user.uid, 'activities');
        const unsubscribe = onSnapshot(activitiesCol, (snapshot) => {
            // La lógica de actualización de actividades ahora está en el hook useActivities
        });
        return () => unsubscribe();
    }, [db, user]);

    useEffect(() => {
        if (!db || !user?.uid) return;
        const prefsDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'preferences', 'settings');
        const unsubscribe = onSnapshot(prefsDocRef, (doc) => {
            if (doc.exists()) {
                setUserPrefs(prev => ({ ...prev, ...doc.data() }));
            }
        });
        return () => unsubscribe();
    }, [db, user]);

    // Onboarding automático en primera vez
    useEffect(() => {
        if (user && !localStorage.getItem('onboarding-completed')) {
            // Pequeño delay para que la app se cargue completamente
            const timer = setTimeout(() => {
                setIsOnboardingOpen(true);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [user]);

    // Listener para abrir onboarding manualmente
    useEffect(() => {
        const handleOpenOnboarding = () => {
            setIsOnboardingOpen(true);
        };

        window.addEventListener('openOnboarding', handleOpenOnboarding);
        return () => window.removeEventListener('openOnboarding', handleOpenOnboarding);
    }, []);

    useEffect(() => {
        if (!db || !user?.uid) return;
        const entriesRef = collection(db, 'artifacts', appId, 'users', user.uid, 'entries');
        const unsubscribe = onSnapshot(entriesRef, (snapshot) => {
            const entriesData = snapshot.docs.map(doc => ({
                id: doc.id,
                title: doc.data().title || ''
            }));
            setAllEntries(entriesData);
        });
        return () => unsubscribe();
    }, [db, user]);

    useEffect(() => {
        if (!db || !user?.uid || !selectedDate) return;
        let isMounted = true;
        const fetchEntry = async () => {
            const entryDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'entries', selectedDate);
            try {
                const docSnap = await getDoc(entryDocRef);
                if (isMounted) {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        const [decryptedTitle, decryptedText] = await Promise.all([
                            decryptText(data.title || '', user.uid),
                            decryptText(data.text || '', user.uid)
                        ]);
                        // Combinar título y texto solo si el texto no empieza con el título
                        let combinedText = decryptedText;
                        if (decryptedTitle && !decryptedText.startsWith(decryptedTitle)) {
                            combinedText = decryptedTitle + (decryptedText ? '\n' + decryptedText : '');
                        }
                        setCurrentEntry({ text: combinedText, tracked: data.tracked || {} });
                    } else {
                        setCurrentEntry({ text: '', tracked: {} });
                    }
                }
            } catch (error) {
                if (isMounted) console.error("Error fetching entry:", error);
            }
        };
        fetchEntry();
        return () => { isMounted = false; };
    }, [db, user, selectedDate, setCurrentEntry]);

    // Manejadores de eventos y lógica de la aplicación
    const handleUpdateUserPrefs = async (newPrefs) => {
        if (!db || !user?.uid) return;
        const prefsDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'preferences', 'settings');
        await setDoc(prefsDocRef, newPrefs, { merge: true });
    };
    const handleTextChange = (e) => setCurrentEntry(prev => ({ ...prev, text: e.target.value }));
    const handleTrackActivity = (activityId, value) => {
        // Verificar límite de actividades registradas para plan gratuito
        const currentTracked = currentEntry?.tracked || {};
        const currentTrackedCount = Object.keys(currentTracked).length;
        const isFreePlan = subscription?.plan === 'free';
        const maxTrackedActivities = isFreePlan ? 3 : Infinity;
        
        // Si ya está trackeada esta actividad, permitir cambiar el valor
        const isAlreadyTracked = currentTracked[activityId];
        
        // Si no está trackeada y ya alcanzamos el límite, mostrar modal de características premium
        if (!isAlreadyTracked && currentTrackedCount >= maxTrackedActivities) {
            setPremiumFeatureInfo({
                name: 'Actividades Ilimitadas',
                description: 'Registra todas las actividades que quieras cada día sin límites. Desbloquea el seguimiento completo de tus hábitos.',
                icon: '📊'
            });
            setIsPremiumFeatureModalOpen(true);
            return;
        }
        
        setCurrentEntry(prev => ({ ...prev, tracked: { ...prev.tracked, [activityId]: value } }));
    };
    const handleUntrackActivity = (activityId) => {
        setCurrentEntry(prev => {
            const newTracked = { ...prev.tracked };
            delete newTracked[activityId];
            return { ...prev, tracked: newTracked };
        });
    };
    
    const callAI = async (prompt, title) => {
        setAIModalTitle(title);
        setAIModalOpen(true);
        setAILoading(true);
        setAiResponse('');
        setWritingAssistantSuggestion('');
        try {
            const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo procesar la respuesta.";
            if (title === "Sugerencias del Asistente" && textResponse.includes('@@@')) {
                const match = textResponse.match(/@@@(.*?)@@@/s);
                const suggestion = match ? match[1].trim() : '';
                setWritingAssistantSuggestion(suggestion);
            }
            setAiResponse(textResponse);
        } catch (error) { setAiResponse("Error al conectar con la IA."); } finally { setAILoading(false); }
    };
    const handleConsultAI = async () => {
        const trackedActivitiesSummary = Object.entries(currentEntry.tracked || {}).map(([activityId, option]) => `- ${activities[activityId]?.name || 'Actividad'}: ${option}`).join('\n');
        const prompt = `Actúa como un terapeuta empático y perspicaz. Analiza la siguiente entrada de diario y las actividades registradas. Ofrece una reflexión amable, identifica posibles patrones o sentimientos subyacentes y proporciona una o dos sugerencias constructivas o preguntas para la autorreflexión. Sé conciso y alentador.\n\n**Entrada del Diario:**\n"${currentEntry.text || 'No se escribió nada.'}"\n\n**Actividades Registradas:**\n${trackedActivitiesSummary || 'No se registraron actividades.'}`;
        callAI(prompt, "Reflexión del Terapeuta IA");
    };
    const handleWritingAssistant = async () => {
        const prompt = `Eres un editor de texto. Revisa la siguiente entrada de diario. - Corrige gramática y ortografía y mejora el flujo. - No cambies la voz del autor. - Ofrece tus explicaciones o comentarios si lo deseas. - Al final, presenta la versión mejorada del texto envuelta entre tres arrobas. Ejemplo: "Aquí tienes una versión mejorada. @@@El texto mejorado va aquí dentro.@@@" - Si el texto de entrada está vacío, devuelve un mensaje indicándolo.\n\n**Texto Original:**\n"${currentEntry.text || ''}"`;
        callAI(prompt, "Sugerencias del Asistente");
    };
    const acceptWritingSuggestion = () => {
        if (writingAssistantSuggestion) setCurrentEntry(prev => ({ ...prev, text: writingAssistantSuggestion }));
        setAIModalOpen(false);
    };
    const handleInspirationalMessage = () => {
        const prompt = "Actúa como un sabio filósofo. Escribe una frase inspiradora, corta y única para empezar el día. Sé profundo pero conciso. No añadas introducciones, saludos, ni comillas, solo la frase.";
        callAI(prompt, "Mensaje del Día");
    };
    
    const handleImportEntries = async (date, title, content, activities, conflictMode = 'overwrite') => {
        return await importEntry(date, title, content, activities, conflictMode);
    };

    const handleDeleteEntry = async (date) => {
        console.log('handleDeleteEntry called with:', { date });
        if (!db || !user?.uid) {
            console.error('Missing db or user.uid');
            return false;
        }
        
        try {
            const entryDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'entries', date);
            console.log('Entry doc ref:', entryDocRef.path);
            
            // Obtener los datos de la entrada antes de eliminar
            const entryDoc = await getDoc(entryDocRef);
            if (!entryDoc.exists()) {
                console.log('Entry does not exist');
                return false;
            }
            
            const entryData = entryDoc.data();
            const trackedActivities = entryData.tracked || {};
            console.log('Current entry data:', { trackedActivities });
            
            // Eliminar la entrada completa (incluye actividades)
            console.log('Deleting entry with activities...');
            await deleteDoc(entryDocRef);
            console.log('Entry and activities deleted successfully');
            console.log(`Eliminadas ${Object.keys(trackedActivities).length} actividades registradas junto con la entrada`);
            
            // Limpiar estado local si la entrada eliminada es la que se está editando actualmente
            if (selectedDate === date) {
                console.log('Clearing current entry state for deleted entry');
                setCurrentEntry({ text: '', tracked: {} });
            }
            
            // Siempre limpiar selectedDate si coincide con la entrada eliminada
            // para evitar problemas en la vista de archivo
            if (selectedDate === date) {
                console.log('Clearing selectedDate for deleted entry');
                setSelectedDate(new Date().toISOString().split('T')[0]);
            }
            
            return true;
        } catch (error) {
            console.error('Error deleting entry:', error);
            return false;
        }
    };

    const handleExportEntries = async (startDate, endDate) => {
        if (!db || !user?.uid) return;
        let entriesQuery;
        const entriesRef = collection(db, 'artifacts', appId, 'users', user.uid, 'entries');
        if (startDate && endDate) {
            entriesQuery = query(entriesRef, where(documentId(), '>=', startDate), where(documentId(), '<=', endDate));
        } else {
            entriesQuery = query(entriesRef);
        }
        try {
            const querySnapshot = await getDocs(entriesQuery);
            const entries = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (entries.length === 0) {
                alert("No hay entradas en el período seleccionado para exportar.");
                return;
            }
            const decryptedEntries = await Promise.all(
                entries.map(async (entry) => {
                    const [decryptedTitle, decryptedText] = await Promise.all([
                        decryptText(entry.title || '', user.uid),
                        decryptText(entry.text || '', user.uid)
                    ]);
                    return { ...entry, title: decryptedTitle, text: decryptedText };
                })
            );
            decryptedEntries.sort((a, b) => a.id.localeCompare(b.id));
          //  let htmlContent = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Diario de ${user.displayName}</title><style>body{font-family:sans-serif;line-height:1.6;color:#333}h1{color:#2c3e50}h2{color:#34495e;border-bottom:2px solid #ecf0f1;padding-bottom:5px;margin-top:40px}h3{color:#3498db}p{white-space:pre-wrap}ul{list-style-type:none;padding-left:0}li{background-color:#f8f9f9;border-left:3px solid #3498db;margin-bottom:5px;padding:5px 10px}</style></head><body><h1>Diario de ${user.displayName}</h1>`;
            let htmlContent = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Diario de ${user.displayName}</title><style>body{font-family:sans-serif;line-height:1.6;color:#333}h1{color:#2c3e50}h2{color:#34495e;border-bottom:2px solid #ecf0f1;padding-bottom:5px;margin-top:40px}h3{color:#3498db}p{white-space:pre-wrap}ul{list-style-type:none;padding-left:0}li{background-color:#f8f9f9;border-left:3px solid #3498db;margin-bottom:5px;padding:5px 10px}</style></head><body><h1>Mi Diario</h1>`;
            decryptedEntries.forEach(entry => {
                htmlContent += `<h2>${entry.id}</h2>`;
                htmlContent += `<h3>${entry.title || 'Sin Título'}</h3>`;
                htmlContent += `<p>${entry.text || '<i>Sin entrada de texto.</i>'}</p>`;
                if (entry.tracked && Object.keys(entry.tracked).length > 0) {
                    htmlContent += '<h4>Actividades Registradas:</h4><ul>';
                    Object.entries(entry.tracked).forEach(([activityId, option]) => {
                        const activityName = activities[activityId]?.name || 'Actividad Desconocida';
                        htmlContent += `<li><strong>${activityName}:</strong> ${option}</li>`;
                    });
                    htmlContent += '</ul>';
                }
            });
            htmlContent += '</body></html>';
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `diario_${user.displayName.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error("Error al exportar las entradas:", error);
            alert("Ocurrió un error al exportar. Revisa la consola para más detalles.");
        }
    };

    const handleLogout = async () => {
        let text = currentEntry?.text || '';
        const entry = { ...currentEntry, text };
        try {
            await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'entries', selectedDate), entry, { merge: true });
            await signOut(auth);
        } catch (error) {
            console.error("Error en logout o guardado:", error);
        }
        // No pongas setIsLoggingOut(false)
    };

    return (
        <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen font-sans flex flex-col">
            <UpdateNotification />
            <div className="max-w-5xl mx-auto w-full flex flex-col flex-grow">
                <header className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0 bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center gap-4">
                        <img src={user.photoURL} alt="Foto de perfil" className="w-10 h-10 rounded-full" />
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Mi Diario</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">V {APP_VERSION}</span>
                                <SubscriptionStatus 
                                    subscription={subscription} 
                                    isSubscriptionActive={isSubscriptionActive} 
                                    onUpgradeClick={() => setIsSubscriptionModalOpen(true)}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <HamburgerMenu 
                            onTherapistChat={() => {
                                if (subscription?.plan === 'premium') {
                                    setIsTherapistChatOpen(true);
                                } else {
                                    setPremiumFeatureInfo({
                                        name: 'Chat con Terapeuta',
                                        description: 'Conecta con un terapeuta virtual para recibir orientación personalizada y apoyo emocional.',
                                        icon: '💬'
                                    });
                                    setIsPremiumFeatureModalOpen(true);
                                }
                            }}
                            onWritingAssistant={() => {
                                if (subscription?.plan === 'premium') {
                                    setIsWritingAssistantOpen(true);
                                } else {
                                    setPremiumFeatureInfo({
                                        name: 'Asistente de Escritura',
                                        description: 'Mejora tu escritura con sugerencias inteligentes y correcciones automáticas.',
                                        icon: '✍️'
                                    });
                                    setIsPremiumFeatureModalOpen(true);
                                }
                            }}
                            onBehaviorAnalysis={() => {
                                if (subscription?.plan === 'premium') {
                                    setIsBehaviorAnalysisOpen(true);
                                } else {
                                    setPremiumFeatureInfo({
                                        name: 'Análisis de Comportamiento',
                                        description: 'Descubre patrones en tus hábitos y comportamientos para mejorar tu bienestar.',
                                        icon: '📊'
                                    });
                                    setIsPremiumFeatureModalOpen(true);
                                }
                            }}
                            onTwoFactorAuth={() => {
                                if (subscription?.plan === 'premium') {
                                    setIsTwoFactorAuthOpen(true);
                                } else {
                                    setPremiumFeatureInfo({
                                        name: 'Autenticación 2FA',
                                        description: 'Protege tu diario con autenticación de dos factores para mayor seguridad.',
                                        icon: '🔒'
                                    });
                                    setIsPremiumFeatureModalOpen(true);
                                }
                            }}
                            onExport={() => setExportModalOpen(true)}
                            onImport={() => setImportModalOpen(true)}
                            onInspirationalMessage={handleInspirationalMessage}
                            onUserProfile={() => setUserProfileModalOpen(true)}
                            onSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
                            subscription={subscription}
                            currentTheme={currentTheme}
                        />

                        <div className="flex items-center gap-2">
                            {/* Botón de cambio de tema temporal para testing */}
                            <button 
                                onClick={() => {
                                    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                                    setTheme(newTheme);
                                    handleUpdateUserPrefs({ ...userPrefs, theme: newTheme });
                                }}
                                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm"
                                title={`Cambiar a modo ${currentTheme === 'dark' ? 'claro' : 'oscuro'}`}
                            >
                                {currentTheme === 'dark' ? '☀️' : '🌙'}
                            </button>
                            
                            <button 
                                onClick={handleLogout}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                                disabled={isLoadingEntry}
                            >
                                {isLoadingEntry ? 'Guardando...' : 'Salir'}
                            </button>
                        </div>
                    </div>
                </header>
                
                <nav className="flex flex-wrap justify-between items-center p-2 bg-gray-100 dark:bg-gray-800 gap-2 flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setView('diary')} className={`px-4 py-2 text-sm font-medium rounded-md diary-tab ${view === 'diary' ? 'bg-indigo-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>Diario</button>
                        <button onClick={() => setView('archive')} className={`px-4 py-2 text-sm font-medium rounded-md archive-tab ${view === 'archive' ? 'bg-indigo-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>Archivo</button>
                        <button onClick={() => setView('stats')} className={`px-4 py-2 text-sm font-medium rounded-md stats-tab ${view === 'stats' ? 'bg-indigo-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>Estadísticas</button>
                    </div>
                </nav>

                {/* Advertencia de límite de actividades */}
                <ActivityLimitWarning 
                    activityLimits={getActivityLimits()}
                    onUpgradeClick={() => setIsSubscriptionModalOpen(true)}
                />

                <main className="flex-grow flex flex-col">
                    {view === 'diary' ? (
                        <DiaryEntryEditor 
                            currentEntry={currentEntry} 
                            onTextChange={handleTextChange} 
                            activities={activities} 
                            onTrackActivity={handleTrackActivity} 
                            onAddOption={handleAddOptionToActivity} 
                            onOpenDefineActivitiesModal={() => setDefineActivitiesModalOpen(true)} 
                            onConsultAI={handleConsultAI} 
                            onWritingAssistant={handleWritingAssistant} 
                            onUntrackActivity={handleUntrackActivity} 
                            userPrefs={userPrefs} 
                            onUpdateUserPrefs={handleUpdateUserPrefs} 
                            selectedDate={selectedDate} 
                            onDateChange={setSelectedDate} 
                            textareaRef={textareaRef} 
                            onDeleteEntry={handleDeleteEntry}
                            isSimpleActivity={isSimpleActivity}
                            getActivityPoints={getActivityPoints}
                            currentTheme={currentTheme}
                        />
                    ) : view === 'archive' ? (
                        <ArchiveView 
                            allEntries={allEntries} 
                            onSelectEntry={(date) => { setSelectedDate(date); setView('diary'); }} 
                            onDeleteEntry={handleDeleteEntry} 
                            user={user}
                            selectedDate={selectedDate}
                            currentTheme={currentTheme}
                        />
                    ) : (
                       <StatisticsPanel 
                           db={db} 
                           userId={user.uid} 
                           appId={appId} 
                           activities={activities} 
                           subscription={subscription}
                           onUpgradeClick={() => {
                               setPremiumFeatureInfo({
                                   name: 'Estadísticas Detalladas',
                                   description: 'Explora estadísticas detalladas de cada actividad con análisis por períodos, tendencias y progreso hacia metas.',
                                   icon: '📊'
                               });
                               setIsPremiumFeatureModalOpen(true);
                           }}
                           currentTheme={currentTheme}
                       />
                    )}
                </main>
            </div>
            
            {/* Modals */}
            {isAIModalOpen && (
                <div className={`fixed inset-0 ${currentTheme === 'dark' ? 'bg-black bg-opacity-70' : 'bg-black bg-opacity-50'} flex items-center justify-center z-50 p-4`}>
                    <div className={`${currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl p-6 w-full max-w-lg flex flex-col`}>
                        <h2 className={`text-2xl font-bold ${currentTheme === 'dark' ? 'text-purple-300' : 'text-purple-600'} mb-4`}>{aiModalTitle}</h2>
                        <div className="overflow-y-auto max-h-[60vh] pr-2">
                            {isAILoading ? (
                                <div className="text-center py-10">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
                                    <p className={`mt-4 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Analizando...</p>
                                </div>
                            ) : (
                                <div className={`${currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'} whitespace-pre-wrap prose ${currentTheme === 'dark' ? 'prose-invert' : ''} max-w-none`} 
                                     dangerouslySetInnerHTML={{ __html: aiResponse.replace(/\n/g, '<br />') }} />
                            )}
                        </div>
                        <div className={`flex justify-end mt-6 pt-4 border-t ${currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-300'} gap-3`}>
                            {aiModalTitle === 'Sugerencias del Asistente' && !isAILoading && (
                                <button onClick={acceptWritingSuggestion} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition">
                                    Usar esta versión
                                </button>
                            )}
                            <button 
                                onClick={() => setAIModalOpen(false)} 
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
            )}
            <DefineActivitiesModal 
                isOpen={isDefineActivitiesModalOpen} 
                onClose={() => setDefineActivitiesModalOpen(false)} 
                activities={activities} 
                onCreateActivity={handleSaveActivityWithLimit}
                onDeleteActivity={handleDeleteActivity} 
                onAddOption={handleAddOptionToActivity} 
                onDeleteOption={handleDeleteOptionFromActivity} 
                onSaveGoal={handleSaveGoal} 
                onUpdatePoints={handleUpdatePoints} 
                activityLimits={getActivityLimits()}
                subscription={subscription}
                onUpgradeClick={() => setIsSubscriptionModalOpen(true)}
                currentTheme={currentTheme}
            />
            <ExportModal isOpen={isExportModalOpen} onClose={() => setExportModalOpen(false)} onExport={handleExportEntries} currentTheme={currentTheme} />
            <ImportModal 
                isOpen={isImportModalOpen} 
                onClose={() => setImportModalOpen(false)} 
                onImportEntries={handleImportEntries}
                user={user}
                db={db}
                appId={appId}
                currentTheme={currentTheme}
            />
            
            {/* Premium Modals */}
            <TherapistChat 
                isOpen={isTherapistChatOpen} 
                onClose={() => setIsTherapistChatOpen(false)} 
                db={db} 
                user={user} 
                onUpgradeClick={() => setIsSubscriptionModalOpen(true)}
                hasFeature={hasFeature}
            />
            <WritingAssistant 
                isOpen={isWritingAssistantOpen} 
                onClose={() => setIsWritingAssistantOpen(false)} 
                currentEntry={currentEntry}
                onUpdateEntry={setCurrentEntry}
                onUpgradeClick={() => setIsSubscriptionModalOpen(true)}
                hasFeature={hasFeature}
                textareaRef={textareaRef}
            />
            <BehaviorAnalysis 
                isOpen={isBehaviorAnalysisOpen} 
                onClose={() => setIsBehaviorAnalysisOpen(false)} 
                entries={allEntries}
                onUpgradeClick={() => setIsSubscriptionModalOpen(true)}
                hasFeature={hasFeature}
                currentTheme={currentTheme}
            />
            <TwoFactorAuth 
                isOpen={isTwoFactorAuthOpen} 
                onClose={() => setIsTwoFactorAuthOpen(false)} 
                user={user}
                onUpgradeClick={() => setIsSubscriptionModalOpen(true)}
                hasFeature={hasFeature}
            />
            <SubscriptionModal 
                isOpen={isSubscriptionModalOpen} 
                onClose={() => setIsSubscriptionModalOpen(false)} 
                db={db} 
                user={user}
                subscription={subscription}
                updateSubscription={updateSubscription}
            />
            <PremiumFeatureModal 
                isOpen={isPremiumFeatureModalOpen} 
                onClose={() => setIsPremiumFeatureModalOpen(false)} 
                onUpgrade={() => setIsSubscriptionModalOpen(true)}
                featureName={premiumFeatureInfo.name}
                featureDescription={premiumFeatureInfo.description}
                featureIcon={premiumFeatureInfo.icon}
            />
            
            <Onboarding 
                isOpen={isOnboardingOpen} 
                onClose={() => setIsOnboardingOpen(false)} 
                mode={localStorage.getItem('onboarding-completed') ? 'manual' : 'auto'}
                currentTheme={currentTheme}
            />
                        <UserProfileModal 
                isOpen={isUserProfileModalOpen} 
                onClose={() => setUserProfileModalOpen(false)} 
                user={user} 
                userPrefs={userPrefs} 
                onUpdateUserPrefs={handleUpdateUserPrefs} 
                subscription={subscription} 
                onUpgradeClick={() => setIsSubscriptionModalOpen(true)}
                currentTheme={currentTheme}
            />
        </div>
    );
};

// --- Componente de Orquestación Principal ---
export default function App() {
    const [user, setUser] = useState(null);
    const [auth, setAuth] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    useEffect(() => {
        try {
            const firebaseAuth = getAuth();
            setAuth(firebaseAuth);
            const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
                setUser(user);
                setIsAuthReady(true);
            });
            return () => unsubscribe();
        } catch(e) {
            console.error("Error de configuración de Firebase. Revisa tus variables en firebaseConfig.");
            setIsAuthReady(true); // Permite renderizar el mensaje de error
        }
    }, []);

    const handleGoogleSignIn = async () => {
        if (!auth) return;
        const provider = new GoogleAuthProvider();
        try { await signInWithPopup(auth, provider); } 
        catch (error) { console.error("Error al iniciar sesión con Google:", error); }
    };

    if (!isAuthReady) return <div className="bg-gray-900 text-gray-100 min-h-screen flex items-center justify-center">Cargando...</div>;
    return user ? <DiaryApp user={user} /> : <LoginScreen onGoogleSignIn={handleGoogleSignIn} />;
}

// --- Componentes de UI específicos ---





const APP_VERSION = '1.61'; // Cambia este valor en cada iteración


