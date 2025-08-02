import React, { useState, useEffect, useRef } from 'react';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, setDoc, collection, getDocs, getDoc, query, where, documentId, deleteDoc, updateDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

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

// Security Components
import AppLock from './components/AppLock';
import SecuritySettings from './components/SecuritySettings';

// Premium Components
import AdvancedIntrospectiveAssistant from './components/AdvancedIntrospectiveAssistant';
import TherapistReflection from './components/TherapistReflection';

import WritingAssistant from './components/WritingAssistant';
import BasicWritingAssistant from './components/BasicWritingAssistant';
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
import { useAppSecurity } from './hooks/useAppSecurity';
import SubscriptionStatus from './components/SubscriptionStatus';
import { APP_VERSION } from './config/version';


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

// Función para obtener la fecha actual en zona horaria local
const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// --- Componente Principal de la App ---
const DiaryApp = ({ user }) => {
    const { t } = useTranslation();
    const [db, setDb] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null); // Inicializar como null para evitar parpadeo
    const [isInitializingDate, setIsInitializingDate] = useState(true); // Estado de carga inicial
    
    // Ref para evitar ciclos de navegación
    const isNavigatingFromDeleteRef = useRef(false);
    
    // Security hook
    const securityHook = useAppSecurity();
    
    // Usar hook de suscripción real
    const { subscription, updateSubscription, hasFeature, isSubscriptionActive, isLoading: isLoadingSubscription } = useSubscription(db, user, appId);
    
    const { currentEntry, setCurrentEntry, isLoadingEntry, importEntry, saveData } = useDiary(db, user, appId, selectedDate);
    
    // Debug: Verificar cambios en currentEntry
    useEffect(() => {
        console.log('📝 currentEntry en App.jsx actualizado:', {
            textLength: (currentEntry?.text || '').length,
            textPreview: (currentEntry?.text || '').substring(0, 50) + '...',
            activitiesCount: Object.keys(currentEntry?.tracked || {}).length
        });
    }, [currentEntry]);
    const { activities, handleSaveActivity, handleDeleteActivity, handleAddOptionToActivity, 
        handleDeleteOptionFromActivity, handleSaveGoal, handleUpdatePoints, 
        getActivityLimits, isSimpleActivity, getActivityPoints, getActivityCount, usesCountInsteadOfPoints } = useActivities(db, user, appId, subscription);

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
        theme: 'dark',
        lastVisitedDate: null
    });
    const [allEntries, setAllEntries] = useState([]);
    
    // Hook para manejo de tema
    const { currentTheme, systemTheme, setTheme } = useTheme(userPrefs);
    
    // State de Modales
    const [isDefineActivitiesModalOpen, setDefineActivitiesModalOpen] = useState(false);
    const [isExportModalOpen, setExportModalOpen] = useState(false);
    const [isImportModalOpen, setImportModalOpen] = useState(false);
    const [isUserProfileModalOpen, setUserProfileModalOpen] = useState(false);
    const [isSecuritySettingsOpen, setIsSecuritySettingsOpen] = useState(false);
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

    // Premium Modals State
    const [isAdvancedIntrospectiveAssistantOpen, setIsAdvancedIntrospectiveAssistantOpen] = useState(false);
    const [isTherapistReflectionOpen, setIsTherapistReflectionOpen] = useState(false);

    const [isBasicWritingAssistantOpen, setIsBasicWritingAssistantOpen] = useState(false);
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

    // Función para determinar la fecha inicial basada en la última visita
    const getInitialDate = (lastVisitedDate) => {
        const today = getLocalDateString();
        
        console.log('getInitialDate called with:', { lastVisitedDate, today });
        
        if (!lastVisitedDate) {
            console.log('No last visited date, returning today:', today);
            return today; // Si no hay fecha guardada, ir a hoy
        }
        
        // Calcular ayer en zona horaria local
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayDate = getLocalDateString(yesterday);
        
        console.log('Comparing dates:', { lastVisitedDate, yesterdayDate, today });
        
        // Si la última visita fue exactamente ayer, ir a hoy
        if (lastVisitedDate === yesterdayDate) {
            console.log('Last visited was yesterday, returning today:', today);
            return today;
        }
        
        // En cualquier otro caso, ir a la última fecha visitada
        console.log('Returning last visited date:', lastVisitedDate);
        return lastVisitedDate;
    };



    useEffect(() => {
        if (!db || !user?.uid) return;
        const prefsDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'preferences', 'settings');
        const unsubscribe = onSnapshot(prefsDocRef, (doc) => {
            if (doc.exists()) {
                const prefsData = doc.data();
                console.log('Preferences loaded:', prefsData);
                setUserPrefs(prev => ({ ...prev, ...prefsData }));
                
                // Determinar la fecha inicial SOLO si aún no se ha establecido
                if (selectedDate === null) {
                    const initialDate = getInitialDate(prefsData.lastVisitedDate);
                    console.log('Initial date determined:', initialDate);
                    setSelectedDate(initialDate);
                    setIsInitializingDate(false);
                }
                // Si ya hay una fecha seleccionada, NO hacer nada
            } else {
                // Si no existen preferencias, establecer fecha de hoy y terminar inicialización
                if (selectedDate === null) {
                    const today = getLocalDateString();
                    console.log('No preferences found, setting today as initial date:', today);
                    setSelectedDate(today);
                    setIsInitializingDate(false);
                }
            }
        });
        return () => unsubscribe();
    }, [db, user]);

    // Función para guardar la fecha actual como última visitada
    const saveLastVisitedDate = async (date) => {
        if (!db || !user?.uid) return;
        try {
            console.log('Saving last visited date:', date);
            const prefsDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'preferences', 'settings');
            
            await setDoc(prefsDocRef, { 
                ...userPrefs, 
                lastVisitedDate: date 
            }, { merge: true });
            console.log('Last visited date saved successfully');
        } catch (error) {
            console.error('Error saving last visited date:', error);
        }
    };

    // Función para manejar el cambio de fecha
    const handleDateChange = (newDate, fromArchive = false) => {
        console.log('handleDateChange called with:', newDate, 'fromArchive:', fromArchive);
        
        setSelectedDate(newDate);
        // Solo guardar la fecha si no estamos navegando desde una eliminación Y no viene del archivo
        if (!isNavigatingFromDeleteRef.current && !fromArchive) {
            saveLastVisitedDate(newDate);
        } else {
            console.log('Skipping save in handleDateChange due to delete navigation or archive navigation');
        }
    };



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
            return textResponse; // Retornar la respuesta para poder guardarla
        } catch (error) { 
            setAiResponse("Error al conectar con la IA."); 
            return null;
        } finally { 
            setAILoading(false); 
        }
    };
    const handleConsultAI = () => {
        console.log('🔍 Abriendo reflexión del terapeuta con currentEntry:', {
            textLength: (currentEntry?.text || '').length,
            textPreview: (currentEntry?.text || '').substring(0, 100) + '...',
            activitiesCount: Object.keys(currentEntry?.tracked || {}).length
        });
        
        // Verificar si hay texto en el textarea
        if (typeof window !== 'undefined') {
            const textarea = document.querySelector('textarea[data-testid="diary-textarea"]') || 
                            document.querySelector('textarea') ||
                            document.querySelector('.diary-textarea');
            if (textarea) {
                console.log('🔍 Texto en textarea:', {
                    textLength: textarea.value.length,
                    textPreview: textarea.value.substring(0, 100) + '...'
                });
            }
        }
        
        setIsTherapistReflectionOpen(true);
    };

    const handleInspirationalMessage = () => {
        // Obtener el tono motivacional basado en las preferencias del usuario
        const motivationalTone = userPrefs.motivationalTone || 'espiritual';
        
        const toneConfigs = {
            'espiritual': 'sabio espiritual y trascendental',
            'filosofico': 'filósofo reflexivo y profundo',
            'motivacional': 'entrenador motivacional y energético',
            'mindfulness': 'maestro de mindfulness y presencia',
            'cientifico': 'científico racional y analítico',
            'poetico': 'poeta artístico y creativo',
            'practico': 'mentor práctico y aplicable'
        };
        
        const selectedTone = toneConfigs[motivationalTone] || toneConfigs['espiritual'];
        
        const prompt = `Actúa como un ${selectedTone}. Escribe una frase inspiradora, corta y única para empezar el día. Sé profundo pero conciso. No añadas introducciones, saludos, ni comillas, solo la frase.`;
        callAI(prompt, t('inspirationalMessage.title'));
    };
    
    const handleImportEntries = async (date, title, content, activities, conflictMode = 'overwrite') => {
        return await importEntry(date, title, content, activities, conflictMode);
    };

    const handleDeleteEntry = async (date, nextDate = null) => {
        console.log('handleDeleteEntry called with:', { date, nextDate });
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
            
            // Manejar la navegación después de eliminar
            console.log('Handling navigation after delete');
            if (nextDate) {
                // Si se proporciona una fecha específica, ir a esa fecha
                console.log('Navigating to specific date:', nextDate);
                // Activar la bandera ANTES de llamar handleDateChange
                isNavigatingFromDeleteRef.current = true;
                console.log('Delete navigation flag set to true');
                handleDateChange(nextDate);
                // Limpiar la bandera después de un breve delay
                setTimeout(() => {
                    isNavigatingFromDeleteRef.current = false;
                    console.log('Delete navigation flag cleared');
                }, 1000);
            } else if (selectedDate === date) {
                // Si no se proporciona fecha y la entrada eliminada es la seleccionada, ir a hoy
                console.log('Navigating to today (default behavior)');
                // Activar la bandera ANTES de llamar handleDateChange
                isNavigatingFromDeleteRef.current = true;
                console.log('Delete navigation flag set to true');
                handleDateChange(getLocalDateString());
                // Limpiar la bandera después de un breve delay
                setTimeout(() => {
                    isNavigatingFromDeleteRef.current = false;
                    console.log('Delete navigation flag cleared');
                }, 1000);
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
        try {
            // Usar saveData del hook useDiary para guardar correctamente
            if (currentEntry && currentEntry.text) {
                await saveData(currentEntry);
            }
            await signOut(auth);
        } catch (error) {
            console.error("Error en logout o guardado:", error);
        }
        // No pongas setIsLoggingOut(false)
    };

    return (
        <AppLock
            isLocked={securityHook.isLocked}
            isPinSet={securityHook.isPinSet}
            onUnlock={securityHook.unlockApp}
            onSetupPin={securityHook.setupPin}
            onResetPin={securityHook.resetPin}
            pinLength={securityHook.pinLength}
            currentTheme={currentTheme}
        >
            <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen font-sans flex flex-col">
                <UpdateNotification />
                <div className="max-w-5xl mx-auto w-full flex flex-col flex-grow">
                <header className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0 bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center gap-4">
                        <img src={user.photoURL} alt="Foto de perfil" className="w-10 h-10 rounded-full" />
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Mi Diario</h1>
                            <SubscriptionStatus 
                                subscription={subscription} 
                                isSubscriptionActive={isSubscriptionActive} 
                                onUpgradeClick={() => setIsSubscriptionModalOpen(true)}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <HamburgerMenu 
                            onAdvancedIntrospectiveAssistant={() => {
                                if (subscription?.plan === 'premium') {
                                    setIsAdvancedIntrospectiveAssistantOpen(true);
                                } else {
                                    setPremiumFeatureInfo({
                                        name: 'Asistente Introspectivo Avanzado',
                                        description: 'Combina el poder del chat terapéutico con asistencia de escritura avanzada para una experiencia de reflexión personal completa.',
                                        icon: '🧠'
                                    });
                                    setIsPremiumFeatureModalOpen(true);
                                }
                            }}

                            onWritingAssistant={() => {
                                if (subscription?.plan === 'premium') {
                                    setIsWritingAssistantOpen(true);
                                } else {
                                    setPremiumFeatureInfo({
                                        name: 'Asistente de Escritura Avanzado',
                                        description: 'Obtén análisis detallado de tu escritura, sugerencias de mejora y prompts personalizados para desarrollar tu estilo.',
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
                            {/* Botón de configuración de seguridad */}
                            <button 
                                onClick={() => setIsSecuritySettingsOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm"
                                title="Configuración de seguridad"
                            >
                                🔒
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
                        <button onClick={() => setView('diary')} className={`px-4 py-2 text-sm font-medium rounded-md diary-tab ${view === 'diary' ? 'bg-indigo-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>{t('navigation.diary')}</button>
                        <button onClick={() => setView('archive')} className={`px-4 py-2 text-sm font-medium rounded-md archive-tab ${view === 'archive' ? 'bg-indigo-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>{t('navigation.archive')}</button>
                        <button onClick={() => setView('stats')} className={`px-4 py-2 text-sm font-medium rounded-md stats-tab ${view === 'stats' ? 'bg-indigo-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>{t('navigation.statistics')}</button>
                    </div>
                </nav>

                {/* Advertencia de límite de actividades */}
                <ActivityLimitWarning 
                    activityLimits={getActivityLimits()}
                    onUpgradeClick={() => setIsSubscriptionModalOpen(true)}
                />

                <main className="flex-grow flex flex-col">
                    {isInitializingDate ? (
                        <div className="flex items-center justify-center flex-grow">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                                <p className={`text-lg ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Cargando tu diario...
                                </p>
                            </div>
                        </div>
                    ) : view === 'diary' ? (
                        <DiaryEntryEditor 
                            currentEntry={currentEntry} 
                            onTextChange={handleTextChange} 
                            activities={activities} 
                            onTrackActivity={handleTrackActivity} 
                            onAddOption={handleAddOptionToActivity} 
                            onOpenDefineActivitiesModal={() => setDefineActivitiesModalOpen(true)} 
                            onConsultAI={handleConsultAI} 
                            onWritingAssistant={() => setIsBasicWritingAssistantOpen(true)} 
                            onUntrackActivity={handleUntrackActivity} 
                            userPrefs={userPrefs} 
                            onUpdateUserPrefs={handleUpdateUserPrefs} 
                            selectedDate={selectedDate} 
                            onDateChange={handleDateChange} 
                            textareaRef={textareaRef} 
                            onDeleteEntry={handleDeleteEntry}
                            isSimpleActivity={isSimpleActivity}
                            getActivityPoints={getActivityPoints}
                            getActivityCount={getActivityCount}
                            usesCountInsteadOfPoints={usesCountInsteadOfPoints}
                            currentTheme={currentTheme}
                        />
                    ) : view === 'archive' ? (
                                                 <ArchiveView 
                             allEntries={allEntries} 
                             onSelectEntry={(date) => { handleDateChange(date, true); setView('diary'); }} 
                             onDeleteEntry={(date, nextDate) => handleDeleteEntry(date, nextDate)} 
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
            <AdvancedIntrospectiveAssistant 
                isOpen={isAdvancedIntrospectiveAssistantOpen} 
                onClose={() => setIsAdvancedIntrospectiveAssistantOpen(false)} 
                db={db} 
                user={user} 
                onUpgradeClick={() => setIsSubscriptionModalOpen(true)}
                hasFeature={hasFeature}
                currentEntry={currentEntry}
                onUpdateEntry={setCurrentEntry}
                selectedDate={selectedDate}
                textareaRef={textareaRef}
                activities={activities}
                currentTheme={currentTheme}
                userPrefs={userPrefs}
            />

            <TherapistReflection 
                isOpen={isTherapistReflectionOpen} 
                onClose={() => setIsTherapistReflectionOpen(false)} 
                db={db} 
                user={user} 
                appId={appId}
                selectedDate={selectedDate}
                currentEntry={currentEntry}
                activities={activities}
                currentTheme={currentTheme}
                userPrefs={userPrefs}
            />

            <BasicWritingAssistant 
                isOpen={isBasicWritingAssistantOpen} 
                onClose={() => setIsBasicWritingAssistantOpen(false)} 
                currentEntry={currentEntry}
                onUpdateEntry={setCurrentEntry}
                currentTheme={currentTheme}
                userPrefs={userPrefs}
            />
            <WritingAssistant 
                isOpen={isWritingAssistantOpen} 
                onClose={() => setIsWritingAssistantOpen(false)} 
                currentEntry={currentEntry}
                onUpdateEntry={setCurrentEntry}
                onUpgradeClick={() => setIsSubscriptionModalOpen(true)}
                hasFeature={hasFeature}
                textareaRef={textareaRef}
                db={db}
                user={user}
                appId={appId}
                selectedDate={selectedDate}
                currentTheme={currentTheme}
                userPrefs={userPrefs}
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
            
            {/* Security Settings Modal */}
            <SecuritySettings 
                isOpen={isSecuritySettingsOpen} 
                onClose={() => setIsSecuritySettingsOpen(false)} 
                securityHook={securityHook}
                onLockApp={securityHook.lockApp}
                currentTheme={currentTheme}
            />
        </div>
        </AppLock>
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





// APP_VERSION ahora se importa desde ./config/version.js


