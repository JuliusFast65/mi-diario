import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, setDoc, collection, addDoc, getDocs, getDoc, deleteDoc, query, where, documentId } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, LineChart, Line } from 'recharts';
import { auth, db } from './firebase';

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

// --- Funciones de Encriptación ---
const getCryptoKey = async (uid) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(uid);
    const hash = await window.crypto.subtle.digest('SHA-256', data);
    return window.crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
};

const encryptText = async (text, uid) => {
    if (!text) return '';
    try {
        const key = await getCryptoKey(uid);
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encryptedData = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
        const buffer = new Uint8Array(iv.length + encryptedData.byteLength);
        buffer.set(iv, 0);
        buffer.set(new Uint8Array(encryptedData), iv.length);
        return btoa(String.fromCharCode.apply(null, buffer));
    } catch (error) {
        console.error("Encryption failed:", error);
        return text;
    }
};

const decryptText = async (encryptedBase64, uid) => {
    if (!encryptedBase64) return '';
    try {
        const key = await getCryptoKey(uid);
        const buffer = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
        const iv = buffer.slice(0, 12);
        const data = buffer.slice(12);
        const decryptedData = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
        const decoder = new TextDecoder();
        return decoder.decode(decryptedData);
    } catch (error) {
        console.error("Decryption failed:", error);
        return encryptedBase64;
    }
};

// --- Componente de Login ---
const LoginScreen = ({ onGoogleSignIn }) => (
    <div className="bg-gray-900 text-gray-100 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center flex flex-col items-center">
            <div className="mb-8">
                <img src="/favicon.svg" alt="Logo Diario Personal" className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-6" />
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Introspect</h1>
                <p className="text-gray-300 text-lg md:text-xl mb-2">Tu Diario Personal</p>
                <p className="text-gray-300 text-lg md:text-xl">Guarda tus pensamientos y sigue tus hábitos con propósito.</p>
                <span className="block mt-4 text-xs text-gray-400">Versión {APP_VERSION}</span>
            </div>
            <button
                onClick={onGoogleSignIn}
                className="bg-white text-gray-800 font-semibold py-3 px-6 rounded-lg shadow-lg hover:bg-gray-200 transition-colors duration-300 inline-flex items-center gap-3 text-lg"
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
    const [currentEntry, setCurrentEntry] = useState({ text: '', tracked: {} });
    const [activities, setActivities] = useState({});
    const [view, setView] = useState('diary');
    const [userPrefs, setUserPrefs] = useState({ font: 'patrick-hand', fontSize: 'text-3xl' });
    const [allEntries, setAllEntries] = useState([]);
    
    // State de Modales
    const [isNewActivityModalOpen, setNewActivityModalOpen] = useState(false);
    const [isManageModalOpen, setManageModalOpen] = useState(false);
    const [isDefineActivitiesModalOpen, setDefineActivitiesModalOpen] = useState(false);
    const [isExportModalOpen, setExportModalOpen] = useState(false);

    const [isAIModalOpen, setAIModalOpen] = useState(false);
    const [aiResponse, setAiResponse] = useState('');
    const [isAILoading, setAILoading] = useState(false);
    const [aiModalTitle, setAIModalTitle] = useState('');
    const [writingAssistantSuggestion, setWritingAssistantSuggestion] = useState('');
    const [isLoadingEntry, setIsLoadingEntry] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
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
            const fetchedActivities = {};
            snapshot.forEach(doc => { fetchedActivities[doc.id] = { id: doc.id, ...doc.data() }; });
            setActivities(fetchedActivities);
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
        setIsLoadingEntry(true);
        setCurrentEntry({ text: '', tracked: {} });
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
                        const combinedText = decryptedTitle + (decryptedText ? '\n' + decryptedText : '');
                        setCurrentEntry({ text: combinedText, tracked: data.tracked || {} });
                    } else {
                        setCurrentEntry({ text: '', tracked: {} });
                    }
                    setIsLoadingEntry(false);
                }
            } catch (error) {
                if (isMounted) setIsLoadingEntry(false);
                console.error("Error fetching entry:", error);
            }
        };
        fetchEntry();
        return () => { isMounted = false; };
    }, [db, user, selectedDate]);

    // Guardado automático de datos
    const saveData = useCallback(async (entryData) => {
        if (!db || !user?.uid || !selectedDate) return;
        const entryDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'entries', selectedDate);
        
        const [titleLine, ...bodyLines] = (entryData.text || '').split('\n');
        const bodyText = bodyLines.join('\n');

        const [encryptedTitle, encryptedText] = await Promise.all([
            encryptText(titleLine, user.uid),
            encryptText(bodyText, user.uid)
        ]);

        const { text, ...restOfEntry } = entryData;
        const dataToSave = { ...restOfEntry, title: encryptedTitle, text: encryptedText };
        
        await setDoc(entryDocRef, dataToSave, { merge: true });
    }, [db, user, selectedDate]);

    
    useEffect(() => {
        if (isLoadingEntry) return;
        const handler = setTimeout(() => {
            if (currentEntry) saveData(currentEntry);
        }, 1500);
        return () => clearTimeout(handler);
    }, [currentEntry, saveData, isLoadingEntry]);

    // Manejadores de eventos y lógica de la aplicación
    const handleUpdateUserPrefs = async (newPrefs) => {
        if (!db || !user?.uid) return;
        const prefsDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'preferences', 'settings');
        await setDoc(prefsDocRef, newPrefs, { merge: true });
    };
    const handleTextChange = (e) => setCurrentEntry(prev => ({ ...prev, text: e.target.value }));
    const handleTrackActivity = (activityId, value) => {
        setCurrentEntry(prev => ({ ...prev, tracked: { ...prev.tracked, [activityId]: value } }));
    };
    const handleUntrackActivity = (activityId) => {
        setCurrentEntry(prev => {
            const newTracked = { ...prev.tracked };
            delete newTracked[activityId];
            return { ...prev, tracked: newTracked };
        });
    };
    const handleAddOptionToActivity = async (activityId, newOption) => {
        if (!db || !user?.uid || !newOption.trim()) return;
        const activityRef = doc(db, 'artifacts', appId, 'users', user.uid, 'activities', activityId);
        const currentOptions = activities[activityId].options || [];
        if (!currentOptions.includes(newOption.trim())) {
            const currentPoints = activities[activityId].points || {};
            const updatedPoints = { ...currentPoints, [newOption.trim()]: 0 };
            await setDoc(activityRef, { 
                options: [...currentOptions, newOption.trim()],
                points: updatedPoints
            }, { merge: true });
        }
    };
    const handleCreateNewActivity = async (activityData) => {
        if (!db || !user?.uid) return;
        
        try {
            const activitiesCol = collection(db, 'artifacts', appId, 'users', user.uid, 'activities');
            const newActivityRef = await addDoc(activitiesCol, activityData);
            
            // Actualizar el estado local
            setActivities(prev => ({
                ...prev,
                [newActivityRef.id]: {
                    id: newActivityRef.id,
                    ...activityData
                }
            }));
            
            setNewActivityModalOpen(false);
        } catch (error) {
            console.error("Error al crear la actividad:", error);
            alert("No se pudo crear la actividad. Inténtalo de nuevo.");
        }
    };
    const handleDeleteOptionFromActivity = async (activityId, optionToDelete) => {
        if (!db || !user?.uid) return;
        try {
            const activityRef = doc(db, 'artifacts', appId, 'users', user.uid, 'activities', activityId);
            const currentOptions = activities[activityId]?.options || [];
            const currentPoints = activities[activityId]?.points || {};
            const newOptions = currentOptions.filter(opt => opt !== optionToDelete);
            const newPoints = { ...currentPoints };
            delete newPoints[optionToDelete];
            await setDoc(activityRef, { options: newOptions, points: newPoints }, { merge: true });
        } catch (error) { console.error("Error borrando la opción:", error); alert("No se pudo borrar la opción."); }
    };
    const handleDeleteActivity = async (activityId) => {
        if (!window.confirm(`¿Estás seguro de que quieres eliminar la actividad "${activities[activityId]?.name}"? Esta acción no se puede deshacer.`)) return;
        if (!db || !user?.uid || !activityId) return;
        try {
            const activityRef = doc(db, 'artifacts', appId, 'users', user.uid, 'activities', activityId);
            await deleteDoc(activityRef);
            setActivities(prev => {
                const newActivities = { ...prev };
                delete newActivities[activityId];
                return newActivities;
            });
            setCurrentEntry(prev => {
                const newTracked = { ...prev.tracked };
                if (newTracked[activityId]) delete newTracked[activityId];
                return { ...prev, tracked: newTracked };
            });
        } catch (error) { console.error("Error al eliminar la actividad:", error); alert("No se pudo eliminar la actividad."); }
    };
    const handleSaveGoal = async (activityId, goal) => {
        if (!db || !user?.uid || !activityId) return;
        const activityRef = doc(db, 'artifacts', appId, 'users', user.uid, 'activities', activityId);
        await setDoc(activityRef, { goal }, { merge: true });
    };
    
    const handleUpdatePoints = async (activityId, option, points) => {
        if (!db || !user?.uid || !activityId || !option) return;
        const activityRef = doc(db, 'artifacts', appId, 'users', user.uid, 'activities', activityId);
        const currentActivity = activities[activityId];
        const currentPoints = currentActivity.points || {};
        const updatedPoints = { ...currentPoints, [option]: points };
        await setDoc(activityRef, { points: updatedPoints }, { merge: true });
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
        setIsLoggingOut(true);
        const textarea = textareaRef.current;
        let text = textarea ? textarea.value : (currentEntry?.text || '');
        const entry = { ...currentEntry, text };
        try {
            await saveData(entry);
            await signOut(auth);
        } catch (error) {
            console.error("Error en logout o guardado:", error);
        }
        // No pongas setIsLoggingOut(false)
    };

    return (
        <div className="bg-gray-900 text-gray-100 min-h-screen font-sans flex flex-col">
            <div className="max-w-5xl mx-auto w-full flex flex-col flex-grow">
                <header className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <img src={user.photoURL} alt="Foto de perfil" className="w-10 h-10 rounded-full" />
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-white">Mi Diario</h1>
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg>
                                100% Encrip
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={handleInspirationalMessage} title="Mensaje Inspirador" className="text-gray-300 hover:text-yellow-300 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 100 2h.01a1 1 0 100-2H11zM10 16a1 1 0 102 0 1 1 0 00-2 0zM5.414 5.414a1 1 0 00-1.414 1.414L5.414 8.243a1 1 0 001.414-1.414L5.414 5.414zM13.757 14.586a1 1 0 00-1.414 1.414l1.414 1.414a1 1 0 001.414-1.414l-1.414-1.414zM4 11a1 1 0 102 0 1 1 0 00-2 0zM15 11a1 1 0 102 0 1 1 0 00-2 0zM8.243 5.414a1 1 0 00-1.414-1.414L5.414 5.414a1 1 0 001.414 1.414L8.243 5.414zM14.586 13.757a1 1 0 00-1.414-1.414l-1.414 1.414a1 1 0 001.414 1.414l1.414-1.414zM10 4a6 6 0 100 12 6 6 0 000-12zM3 10a7 7 0 1114 0 7 7 0 01-14 0z" /></svg>
                        </button>
                        <a href="mailto:tu-email-aqui@example.com?subject=Feedback sobre la App de Diario" title="Enviar Feedback" className="text-gray-300 hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.874 8.874 0 01-4.083-.98L2 17l1.02-3.06A8.008 8.008 0 012 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM4.416 14.242l.03-.028a6.002 6.002 0 008.487-7.854l.028-.03A6.002 6.002 0 004.416 14.242z" clipRule="evenodd" /></svg>
                        </a>
                        <button onClick={() => setExportModalOpen(true)} title="Exportar Entradas" className="text-gray-300 hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </button>
                        <button 
                            onClick={handleLogout}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                            disabled={isLoggingOut}
                        >
                            {isLoggingOut ? 'Guardando...' : 'Salir'}
                        </button>
                    </div>
                </header>
                
                <nav className="flex flex-wrap justify-between items-center p-2 bg-gray-800 gap-2 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setView('diary')} className={`px-4 py-2 text-sm font-medium rounded-md ${view === 'diary' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Diario</button>
                        <button onClick={() => setView('archive')} className={`px-4 py-2 text-sm font-medium rounded-md ${view === 'archive' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Archivo</button>
                        <button onClick={() => setView('stats')} className={`px-4 py-2 text-sm font-medium rounded-md ${view === 'stats' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Estadísticas</button>
                    </div>
                </nav>

                <main className="flex-grow flex flex-col">
                    {view === 'diary' ? (
                        <DiaryPanel currentEntry={currentEntry} onTextChange={handleTextChange} activities={activities} onTrackActivity={handleTrackActivity} onAddOption={handleAddOptionToActivity} onOpenDefineActivitiesModal={() => setDefineActivitiesModalOpen(true)} onConsultAI={handleConsultAI} onWritingAssistant={handleWritingAssistant} onUntrackActivity={handleUntrackActivity} userPrefs={userPrefs} onUpdateUserPrefs={handleUpdateUserPrefs} selectedDate={selectedDate} onDateChange={setSelectedDate} textareaRef={textareaRef} />
                    ) : view === 'archive' ? (
                        <ArchiveView allEntries={allEntries} onSelectEntry={(date) => { setSelectedDate(date); setView('diary'); }} user={user} />
                    ) : (
                       <StatisticsPanel db={db} userId={user.uid} appId={appId} activities={activities} />
                    )}
                </main>
            </div>
            
            {/* Modals */}
            {isNewActivityModalOpen && (
                <CreateActivityModal 
                    isOpen={isNewActivityModalOpen}
                    onClose={() => setNewActivityModalOpen(false)}
                    onCreateActivity={handleCreateNewActivity}
                />
            )}
            {isAIModalOpen && <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"><div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-lg flex flex-col"><h2 className="text-2xl font-bold text-purple-300 mb-4">{aiModalTitle}</h2><div className="overflow-y-auto max-h-[60vh] pr-2">{isAILoading ? <div className="text-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div><p className="mt-4 text-gray-300">Analizando...</p></div> : <div className="text-gray-200 whitespace-pre-wrap prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: aiResponse.replace(/\n/g, '<br />') }} />}</div><div className="flex justify-end mt-6 pt-4 border-t border-gray-700 gap-3">{aiModalTitle === 'Sugerencias del Asistente' && !isAILoading && <button onClick={acceptWritingSuggestion} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition">Usar esta versión</button>}<button onClick={() => setAIModalOpen(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg">Cerrar</button></div></div></div>}
            <DefineActivitiesModal 
                isOpen={isDefineActivitiesModalOpen} 
                onClose={() => setDefineActivitiesModalOpen(false)} 
                activities={activities} 
                onCreateActivity={handleCreateNewActivity}
                onDeleteActivity={handleDeleteActivity} 
                onAddOption={handleAddOptionToActivity} 
                onDeleteOption={handleDeleteOptionFromActivity} 
                onSaveGoal={handleSaveGoal} 
                onUpdatePoints={handleUpdatePoints} 
            />
            <ExportModal isOpen={isExportModalOpen} onClose={() => setExportModalOpen(false)} onExport={handleExportEntries} />
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
const DiaryPanel = ({ currentEntry, onTextChange, activities, onTrackActivity, onAddOption, onOpenDefineActivitiesModal, onConsultAI, onWritingAssistant, onUntrackActivity, userPrefs, onUpdateUserPrefs, selectedDate, onDateChange, textareaRef }) => {
    const [activeTab, setActiveTab] = useState('entrada');

    const fontOptions = [
        { id: 'patrick-hand', name: 'Patrick Hand' },
        { id: 'caveat', name: 'Caveat' },
        { id: 'indie-flower', name: 'Indie Flower' },
        { id: 'kalam', name: 'Kalam' },
        { id: 'gochi-hand', name: 'Gochi Hand' },
        { id: 'lora', name: 'Lora (Serif)' },
        { id: 'sans', name: 'Nunito Sans (Simple)' },
    ];

    const fontSizeOptions = [
        { id: 'text-lg', name: 'Muy Pequeño'},
        { id: 'text-xl', name: 'Pequeño' },
        { id: 'text-2xl', name: 'Mediano' },
        { id: 'text-3xl', name: 'Grande' },
        { id: 'text-4xl', name: 'Extra Grande' },
    ];

    // --- MAPA DE CLASES PARA TAILWIND ---
    const fontClassMap = {
        'patrick-hand': 'font-patrick-hand',
        'caveat': 'font-caveat',
        'indie-flower': 'font-indie-flower',
        'kalam': 'font-kalam',
        'gochi-hand': 'font-gochi-hand',
        'lora': 'font-lora',
        'sans': 'font-sans',
    };

    const fontSizeClassMap = {
        'text-lg': 'text-lg',
        'text-xl': 'text-xl',
        'text-2xl': 'text-2xl',
        'text-3xl': 'text-3xl',
        'text-4xl': 'text-4xl',
    };

    const [trackedActivityIds, untrackedActivities] = useMemo(() => {
        const trackedIds = Object.keys(currentEntry?.tracked || {});
        const untracked = Object.values(activities).filter(act => !trackedIds.includes(act.id));
        return [trackedIds, untracked];
    }, [currentEntry, activities]);

    const handleAddActivitySelect = (e) => {
        const activityId = e.target.value;
        if (!activityId || !activities[activityId]) { e.target.value = ""; return; }
        const activity = activities[activityId];
        const initialValue = activity.options?.[0] || '';
        onTrackActivity(activityId, initialValue);
        e.target.value = "";
    };

    const tabBaseStyle = "px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-200";
    const tabActiveStyle = "bg-gray-800 text-white";
    const tabInactiveStyle = "bg-gray-700 text-gray-400 hover:bg-gray-600";

    return (
        <div className="flex flex-col flex-grow">
            <div className="flex justify-between items-center flex-shrink-0 px-4 md:px-6 pt-4">
                <div className="flex border-b border-gray-700">
                    <button onClick={() => setActiveTab('entrada')} className={`${tabBaseStyle} ${activeTab === 'entrada' ? tabActiveStyle : tabInactiveStyle}`}>Entrada</button>
                    <button onClick={() => setActiveTab('actividades')} className={`${tabBaseStyle} ${activeTab === 'actividades' ? tabActiveStyle : tabInactiveStyle}`}>Actividades</button>
                </div>
                <input type="date" value={selectedDate} onChange={(e) => onDateChange(e.target.value)} className="bg-gray-700 border-gray-600 text-white rounded-lg p-2 focus:ring-2 focus:ring-indigo-500" />
            </div>
            
            {activeTab === 'entrada' && (
                <div className="bg-gray-800 rounded-b-lg p-4 flex flex-col flex-grow mx-4 md:mx-6 mb-4 md:mb-6">
                    <textarea 
                        ref={textareaRef}
                        value={currentEntry?.text || ''} 
                        onChange={onTextChange} 
                        placeholder="Escribe un título en la primera línea..." 
                        className={`w-full flex-grow rounded-md p-3 border-none focus:ring-0 transition resize-none notebook journal-editor leading-[0.5] ${fontSizeClassMap[userPrefs.fontSize]} ${fontClassMap[userPrefs.font]}`} 
                    />
                    
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700 flex-wrap gap-4 flex-shrink-0">
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                           <div className="flex items-center gap-1 min-w-0">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10.755 2.168A.75.75 0 009.245 2.168L3.32 13.5h2.978l1.035-2.5h4.334l1.035 2.5h2.978L10.755 2.168zm-2.034 7.5L10 4.17l1.279 5.5H8.721z" /></svg>
                               <select 
                                 id="font-select"
                                 value={userPrefs.font}
                                 onChange={(e) => onUpdateUserPrefs({ font: e.target.value })}
                                 className="bg-gray-700 text-white rounded p-0.5 border border-gray-600 text-xs min-w-0"
                                 style={{maxWidth:'90px'}}
                               >
                                   {fontOptions.map(font => (
                                       <option key={font.id} value={font.id}>{font.name}</option>
                                   ))}
                               </select>
                           </div>
                           <div className="flex items-center gap-1 min-w-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path d="M8.25 3.75a.75.75 0 01.75.75v10.5a.75.75 0 01-1.5 0V4.5a.75.75 0 01.75-.75zM13.25 5.75a.75.75 0 01.75.75v8.5a.75.75 0 01-1.5 0V6.5a.75.75 0 01.75-.75zM4.25 8.75a.75.75 0 01.75.75v2.5a.75.75 0 01-1.5 0v-2.5a.75.75 0 01.75-.75z" /></svg>
                               <select 
                                 id="fontsize-select"
                                 value={userPrefs.fontSize}
                                 onChange={(e) => onUpdateUserPrefs({ fontSize: e.target.value })}
                                 className="bg-gray-700 text-white rounded p-0.5 border border-gray-600 text-xs min-w-0"
                                 style={{maxWidth:'70px'}}
                               >
                                   {fontSizeOptions.map(size => (
                                       <option key={size.id} value={size.id}>{size.name}</option>
                                   ))}
                               </select>
                           </div>
                        </div>
                        <div className="flex gap-2">
                            <button title="Recibe sugerencias para mejorar tu escritura" onClick={onWritingAssistant} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold p-2 rounded-lg text-sm flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                            </button>
                            <button title="Recibe una reflexión sobre tu entrada y actividades" onClick={onConsultAI} className="bg-purple-600 hover:bg-purple-700 text-white font-bold p-2 rounded-lg text-sm flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a2 2 0 100 4 2 2 0 000-4z" clipRule="evenodd" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'actividades' && (
                 <div className="bg-gray-800 rounded-b-lg p-4 mx-4 md:mx-6 mb-4 md:mb-6">
                    <div className="space-y-4 min-h-[50px]">
                        {trackedActivityIds.length > 0 ? (
                            trackedActivityIds.map(id => activities[id]).filter(Boolean).sort((a,b) => a.name.localeCompare(b.name)).map(activity => (
                                <ActivityTrackerItem key={activity.id} activity={activity} selectedValue={currentEntry?.tracked?.[activity.id] || ''} onValueChange={(value) => onTrackActivity(activity.id, value)} onUntrack={onUntrackActivity} />
                            ))
                        ) : (<div className="text-center py-4 text-gray-400 italic">No hay actividades registradas para este día.</div>)}
                    </div>
                    <div className="mt-6 border-t border-gray-700 pt-4 flex flex-col sm:flex-row items-center gap-4">
                        <select onChange={handleAddActivitySelect} defaultValue="" className="w-full sm:flex-grow bg-gray-600 text-white rounded-md p-2 border border-gray-500 focus:ring-1 focus:ring-indigo-400"><option value="" disabled>+ Registrar una actividad...</option>{untrackedActivities.sort((a,b) => a.name.localeCompare(b.name)).map(act => (<option key={act.id} value={act.id}>{act.name}</option>))}</select>
                        <div className="flex items-center gap-4">
                            <button onClick={onOpenDefineActivitiesModal} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 whitespace-nowrap">Definir Actividades</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ArchiveView = ({ allEntries, onSelectEntry, user }) => {
    const [decryptedEntries, setDecryptedEntries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const decryptTitles = async () => {
            setIsLoading(true);
            const decrypted = await Promise.all(
                allEntries.map(async (entry) => {
                    const decryptedTitle = await decryptText(entry.title, user.uid);
                    return { ...entry, title: decryptedTitle || 'Sin Título' };
                })
            );
            decrypted.sort((a, b) => b.id.localeCompare(a.id)); // Sort descending
            setDecryptedEntries(decrypted);
            setIsLoading(false);
        };
        if (allEntries.length > 0) {
            decryptTitles();
        } else {
            setIsLoading(false);
            setDecryptedEntries([]);
        }
    }, [allEntries, user.uid]);

    if (isLoading) {
        return <div className="p-8 text-center text-gray-400">Cargando archivo...</div>;
    }

    return (
        <div className="p-4 md:p-6">
            <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-6">Archivo de Entradas</h3>
                {decryptedEntries.length > 0 ? (
                    <ul className="space-y-2">
                        {decryptedEntries.map(entry => (
                            <li key={entry.id}>
                                <button
                                    onClick={() => onSelectEntry(entry.id)}
                                    className="w-full text-left p-3 bg-gray-700 hover:bg-indigo-900 rounded-lg transition-colors"
                                >
                                    <span className="font-bold text-indigo-300">{entry.id}</span>
                                    <p className="text-gray-200">{entry.title}</p>
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-gray-400 italic">Aún no has escrito ninguna entrada.</p>
                )}
            </div>
        </div>
    );
};


const ActivityTrackerItem = ({ activity, selectedValue, onValueChange, onUntrack }) => {
    const hasOptions = Array.isArray(activity.options) && activity.options.length > 0;
    const selectedPoints = activity.points?.[selectedValue] || 0;
    
    return (
        <div className="flex items-center gap-3 bg-gray-700 p-3 rounded-lg">
            <div className="flex-grow flex flex-col sm:flex-row items-center gap-3">
                <span className="font-semibold text-white flex-shrink-0 w-full sm:w-1/3">{activity.name}</span>
                <div className="flex-grow w-full">
                    {hasOptions ? (
                        <select 
                            value={selectedValue} 
                            onChange={(e) => onValueChange(e.target.value)} 
                            className="w-full bg-gray-600 text-white rounded-md p-2 border border-gray-500"
                        >
                            {activity.options.map(opt => (
                                <option key={opt} value={opt}>
                                    {opt} {activity.points?.[opt] ? `(${activity.points[opt]} pts)` : ''}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input 
                            type="text" 
                            placeholder="Añade un valor (ej: 30 mins)" 
                            value={selectedValue} 
                            onChange={(e) => onValueChange(e.target.value)} 
                            className="w-full bg-gray-600 text-white rounded-md p-2 border border-gray-500" 
                        />
                    )}
                </div>
            </div>
            {selectedPoints > 0 && (
                <div className="flex-shrink-0 bg-green-600 text-white px-2 py-1 rounded text-sm font-semibold">
                    {selectedPoints} pts
                </div>
            )}
            <button 
                onClick={() => onUntrack(activity.id)} 
                className="p-1 bg-gray-600 hover:bg-red-800 rounded-full text-gray-300 hover:text-white transition-colors flex-shrink-0" 
                aria-label={`Quitar ${activity.name} de este día`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

// --- Modal de creación completa de actividades ---
const CreateActivityModal = ({ isOpen, onClose, onCreateActivity }) => {
    const [activityName, setActivityName] = useState('');
    const [options, setOptions] = useState(['']);
    const [points, setPoints] = useState({});
    const [goalType, setGoalType] = useState('weekly');
    const [goalTarget, setGoalTarget] = useState('');
    const [goalStartDate, setGoalStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [goalEndDate, setGoalEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [showGoalSection, setShowGoalSection] = useState(false);

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
        
        // Actualizar puntos para la nueva opción
        const newPoints = { ...points };
        if (value.trim()) {
            if (!newPoints[value]) {
                newPoints[value] = 0;
            }
        }
        setPoints(newPoints);
    };

    const addOption = () => {
        setOptions([...options, '']);
    };

    const removeOption = (index) => {
        const newOptions = options.filter((_, i) => i !== index);
        setOptions(newOptions);
        
        // Remover puntos de la opción eliminada
        const removedOption = options[index];
        if (removedOption && points[removedOption]) {
            const newPoints = { ...points };
            delete newPoints[removedOption];
            setPoints(newPoints);
        }
    };

    const handlePointChange = (option, value) => {
        setPoints(prev => ({
            ...prev,
            [option]: parseInt(value) || 0
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!activityName.trim()) {
            alert('Por favor ingresa un nombre para la actividad.');
            return;
        }

        const finalOptions = options.map(o => o.trim()).filter(o => o !== '');
        
        // Crear objeto de actividad
        const activityData = {
            name: activityName.trim(),
            options: finalOptions,
            points: points,
            createdAt: new Date()
        };

        // Agregar meta si está configurada
        if (showGoalSection && goalTarget && !isNaN(goalTarget) && goalTarget > 0) {
            const goalData = {
                type: goalType,
                target: parseInt(goalTarget)
            };

            if (goalType === 'custom') {
                if (goalStartDate > goalEndDate) {
                    alert('La fecha de inicio no puede ser posterior a la fecha de fin.');
                    return;
                }
                goalData.startDate = goalStartDate;
                goalData.endDate = goalEndDate;
            }

            activityData.goal = goalData;
        }

        // Llamar a la función de creación
        onCreateActivity(activityData);
        
        // Resetear el formulario
        setActivityName('');
        setOptions(['']);
        setPoints({});
        setGoalType('weekly');
        setGoalTarget('');
        setShowGoalSection(false);
        onClose();
    };

    const handleCancel = () => {
        setActivityName('');
        setOptions(['']);
        setPoints({});
        setGoalType('weekly');
        setGoalTarget('');
        setShowGoalSection(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">Crear Nueva Actividad</h2>
                    <button onClick={handleCancel} className="p-1 rounded-full hover:bg-gray-700">
                        <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="overflow-y-auto space-y-6 pr-2">
                    {/* Nombre de la actividad */}
                    <div>
                        <label htmlFor="activity-name" className="block text-sm font-medium text-gray-300 mb-2">
                            Nombre de la Actividad *
                        </label>
                        <input 
                            id="activity-name"
                            type="text" 
                            value={activityName} 
                            onChange={(e) => setActivityName(e.target.value)} 
                            placeholder="Ej: Leer, Ejercicio, Meditación..." 
                            className="w-full bg-gray-700 text-white rounded-md p-3 border border-gray-600 focus:ring-2 focus:ring-indigo-500" 
                            required 
                        />
                    </div>

                    {/* Opciones/Subniveles */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                            Subniveles/Opciones
                        </label>
                        <div className="space-y-3">
                            {options.map((option, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <input 
                                        type="text" 
                                        value={option} 
                                        onChange={(e) => handleOptionChange(index, e.target.value)} 
                                        placeholder={`Opción ${index + 1}`} 
                                        className="flex-grow bg-gray-700 text-white rounded-md p-2 border border-gray-600" 
                                    />
                                    {option.trim() && (
                                        <input 
                                            type="number" 
                                            min="0"
                                            placeholder="Puntos" 
                                            value={points[option] || ''} 
                                            onChange={(e) => handlePointChange(option, e.target.value)} 
                                            className="w-20 bg-gray-700 text-white rounded-md p-2 border border-gray-600 text-center" 
                                        />
                                    )}
                                    <button 
                                        type="button" 
                                        onClick={() => removeOption(index)} 
                                        className="p-2 bg-red-600 hover:bg-red-700 rounded-full text-white"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                            <button 
                                type="button" 
                                onClick={addOption} 
                                className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold flex items-center gap-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Añadir opción
                            </button>
                        </div>
                    </div>

                    {/* Sección de Meta */}
                    <div className="border-t border-gray-700 pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium text-gray-300">
                                Configurar Meta (Opcional)
                            </label>
                            <button 
                                type="button"
                                onClick={() => setShowGoalSection(!showGoalSection)}
                                className={`px-3 py-1 rounded-md text-sm font-medium ${
                                    showGoalSection 
                                        ? 'bg-yellow-600 text-white' 
                                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                }`}
                            >
                                {showGoalSection ? 'Ocultar' : 'Mostrar'}
                            </button>
                        </div>
                        
                        {showGoalSection && (
                            <div className="space-y-4 p-4 bg-gray-700 rounded-lg">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Tipo de Meta
                                        </label>
                                        <select 
                                            value={goalType} 
                                            onChange={(e) => setGoalType(e.target.value)}
                                            className="w-full bg-gray-600 text-white rounded-md p-2 border border-gray-500"
                                        >
                                            <option value="weekly">Semanal</option>
                                            <option value="monthly">Mensual</option>
                                            <option value="custom">Personalizada</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Puntos Objetivo *
                                        </label>
                                        <input 
                                            type="number" 
                                            min="1"
                                            value={goalTarget} 
                                            onChange={(e) => setGoalTarget(e.target.value)} 
                                            placeholder="Ej: 100" 
                                            className="w-full bg-gray-600 text-white rounded-md p-2 border border-gray-500" 
                                            required={showGoalSection}
                                        />
                                    </div>
                                </div>
                                
                                {goalType === 'custom' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Fecha de Inicio
                                            </label>
                                            <input 
                                                type="date" 
                                                value={goalStartDate} 
                                                onChange={(e) => setGoalStartDate(e.target.value)} 
                                                className="w-full bg-gray-600 text-white rounded-md p-2 border border-gray-500" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Fecha de Fin
                                            </label>
                                            <input 
                                                type="date" 
                                                value={goalEndDate} 
                                                onChange={(e) => setGoalEndDate(e.target.value)} 
                                                className="w-full bg-gray-600 text-white rounded-md p-2 border border-gray-500" 
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                        <button 
                            type="button" 
                            onClick={handleCancel} 
                            className="px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 font-bold rounded-lg text-white"
                        >
                            Crear Actividad
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ManageActivitiesModal = ({ isOpen, onClose, activities, onDeleteActivity, onAddOption, onDeleteOption, onSaveGoal, onUpdatePoints }) => {
    if (!isOpen) return null;
    const [newOptionValues, setNewOptionValues] = useState({});
    const [newPointValues, setNewPointValues] = useState({});
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [selectedActivityForGoal, setSelectedActivityForGoal] = useState(null);
    
    const handleNewOptionChange = (activityId, value) => {
        setNewOptionValues(prev => ({ ...prev, [activityId]: value }));
    };
    
    const handleNewPointChange = (activityId, option, value) => {
        setNewPointValues(prev => ({ 
            ...prev, 
            [`${activityId}-${option}`]: value 
        }));
    };
    
    const handleAddNewOption = (activityId) => {
        const newOption = newOptionValues[activityId];
        if (newOption && newOption.trim()) {
            onAddOption(activityId, newOption.trim());
            handleNewOptionChange(activityId, '');
        }
    };
    
    const handleUpdatePoints = (activityId, option, points) => {
        if (points && !isNaN(points) && points >= 0) {
            onUpdatePoints(activityId, option, parseInt(points));
        }
    };
    
    const handleOpenGoalModal = (activity) => {
        setSelectedActivityForGoal(activity);
        setIsGoalModalOpen(true);
    };
    
    const sortedActivities = Object.values(activities).sort((a, b) => a.name.localeCompare(b.name));
    
    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[80vh] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-white">Gestor de Actividades y Metas</h2>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
                            <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="overflow-y-auto space-y-4 pr-2">
                        {sortedActivities.map(activity => (
                            <div key={activity.id} className="bg-gray-700 p-4 rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="font-bold text-lg text-white">{activity.name}</span>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => handleOpenGoalModal(activity)}
                                            className="p-2 bg-yellow-600 hover:bg-yellow-700 rounded-full text-white"
                                            title="Configurar meta"
                                        >
                                            🎯
                                        </button>
                                        <button 
                                            onClick={() => onDeleteActivity(activity.id)} 
                                            className="p-2 bg-red-800 hover:bg-red-700 rounded-full text-white" 
                                            aria-label={`Eliminar permanentemente ${activity.name}`}
                                        >
                                            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Meta actual */}
                                {activity.goal && (
                                    <div className="mb-3 p-2 bg-yellow-900/30 border border-yellow-600/50 rounded-lg">
                                        <div className="flex items-center gap-2 text-yellow-300 text-sm">
                                            <span>🎯 Meta:</span>
                                            <span className="font-semibold">
                                                {activity.goal.target} puntos
                                                {activity.goal.type === 'weekly' && ' (semanal)'}
                                                {activity.goal.type === 'monthly' && ' (mensual)'}
                                                {activity.goal.type === 'custom' && ` (${activity.goal.startDate} a ${activity.goal.endDate})`}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="border-t border-gray-600 pt-3">
                                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Subniveles y Puntos:</h4>
                                    <div className="space-y-2">
                                        {(activity.options && activity.options.length > 0) ? (
                                            activity.options.map(option => (
                                                <div key={option} className="flex items-center gap-2 bg-gray-600 px-3 py-2 rounded">
                                                    <span className="text-gray-200 flex-grow">{option}</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        placeholder="Puntos"
                                                        value={activity.points?.[option] || ''}
                                                        onChange={(e) => handleUpdatePoints(activity.id, option, e.target.value)}
                                                        className="w-16 bg-gray-700 text-white rounded px-2 py-1 text-sm border border-gray-500"
                                                    />
                                                    <button 
                                                        onClick={() => onDeleteOption(activity.id, option)} 
                                                        className="p-1 text-gray-400 hover:text-white"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-gray-400 italic">Sin subniveles predefinidos.</p>
                                        )}
                                    </div>
                                    <div className="mt-3 flex gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="Añadir nuevo subnivel" 
                                            value={newOptionValues[activity.id] || ''} 
                                            onChange={(e) => handleNewOptionChange(activity.id, e.target.value)} 
                                            className="flex-grow bg-gray-600 text-white rounded-md p-2 text-sm border border-gray-500" 
                                        />
                                        <button 
                                            onClick={() => handleAddNewOption(activity.id)} 
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 rounded-lg text-sm"
                                        >
                                            Añadir
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Modal de configuración de metas */}
            {isGoalModalOpen && (
                <GoalConfigModal 
                    activity={selectedActivityForGoal}
                    onClose={() => setIsGoalModalOpen(false)}
                    onSaveGoal={onSaveGoal}
                />
            )}
        </>
    );
};

// --- Modal de configuración de metas ---
const GoalConfigModal = ({ activity, onClose, onSaveGoal }) => {
    const [goalType, setGoalType] = useState(activity?.goal?.type || 'weekly');
    const [targetPoints, setTargetPoints] = useState(activity?.goal?.target || '');
    const [startDate, setStartDate] = useState(activity?.goal?.startDate || new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(activity?.goal?.endDate || new Date().toISOString().split('T')[0]);

    const handleSave = () => {
        if (!targetPoints || isNaN(targetPoints) || targetPoints <= 0) {
            alert('Por favor ingresa un número válido de puntos objetivo.');
            return;
        }

        if (goalType === 'custom' && startDate > endDate) {
            alert('La fecha de inicio no puede ser posterior a la fecha de fin.');
            return;
        }

        const goalData = {
            type: goalType,
            target: parseInt(targetPoints)
        };

        if (goalType === 'custom') {
            goalData.startDate = startDate;
            goalData.endDate = endDate;
        }

        onSaveGoal(activity.id, goalData);
        onClose();
    };

    const handleDeleteGoal = () => {
        if (window.confirm('¿Estás seguro de que quieres eliminar la meta de esta actividad?')) {
            onSaveGoal(activity.id, null);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">Configurar Meta: {activity?.name}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
                        <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Meta:</label>
                        <div className="space-y-2">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="goalType"
                                    value="weekly"
                                    checked={goalType === 'weekly'}
                                    onChange={(e) => setGoalType(e.target.value)}
                                    className="mr-2"
                                />
                                <span className="text-white">Semanal</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="goalType"
                                    value="monthly"
                                    checked={goalType === 'monthly'}
                                    onChange={(e) => setGoalType(e.target.value)}
                                    className="mr-2"
                                />
                                <span className="text-white">Mensual</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="goalType"
                                    value="custom"
                                    checked={goalType === 'custom'}
                                    onChange={(e) => setGoalType(e.target.value)}
                                    className="mr-2"
                                />
                                <span className="text-white">Rango personalizado</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Puntos Objetivo:</label>
                        <input
                            type="number"
                            min="1"
                            value={targetPoints}
                            onChange={(e) => setTargetPoints(e.target.value)}
                            placeholder="Ej: 50"
                            className="w-full bg-gray-700 text-white rounded-md p-2 border border-gray-600"
                        />
                    </div>

                    {goalType === 'custom' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Desde:</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded-md p-2 border border-gray-600"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Hasta:</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded-md p-2 border border-gray-600"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-between mt-6 pt-4 border-t border-gray-700">
                    <button
                        onClick={handleDeleteGoal}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg"
                    >
                        Eliminar Meta
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg"
                        >
                            Guardar Meta
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Modal de Definición de Actividades ---
const DefineActivitiesModal = ({ isOpen, onClose, activities, onCreateActivity, onDeleteActivity, onAddOption, onDeleteOption, onSaveGoal, onUpdatePoints }) => {
    const [view, setView] = useState('list'); // 'list' or 'edit' or 'create'
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [newOptionValues, setNewOptionValues] = useState({});
    const [newPointValues, setNewPointValues] = useState({});

    const handleNewOptionChange = (activityId, value) => {
        setNewOptionValues(prev => ({ ...prev, [activityId]: value }));
    };

    const handleAddNewOption = (activityId) => {
        const newOption = newOptionValues[activityId];
        if (newOption && newOption.trim()) {
            onAddOption(activityId, newOption.trim());
            handleNewOptionChange(activityId, '');
        }
    };

    const handleUpdatePoints = (activityId, option, points) => {
        if (points && !isNaN(points) && points >= 0) {
            onUpdatePoints(activityId, option, parseInt(points));
        }
    };

    const handleOpenGoalModal = (activity) => {
        setSelectedActivity(activity);
        setIsGoalModalOpen(true);
    };

    const handleEditActivity = (activity) => {
        setSelectedActivity(activity);
        setView('edit');
    };

    const handleCreateNew = () => {
        setSelectedActivity(null);
        setView('create');
    };

    const handleBackToList = () => {
        setView('list');
        setSelectedActivity(null);
    };

    const sortedActivities = Object.values(activities).sort((a, b) => a.name.localeCompare(b.name));

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[80vh] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-white">
                            {view === 'list' && 'Definir Actividades'}
                            {view === 'edit' && `Editar: ${selectedActivity?.name}`}
                            {view === 'create' && 'Crear Nueva Actividad'}
                        </h2>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
                            <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="overflow-y-auto space-y-4 pr-2">
                        {view === 'list' && (
                            <>
                                <div className="mb-4">
                                    <button 
                                        onClick={handleCreateNew}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                        </svg>
                                        Crear Nueva Actividad
                                    </button>
                                </div>
                                
                                {sortedActivities.length > 0 ? (
                                    <div className="space-y-3">
                                        {sortedActivities.map(activity => (
                                            <div key={activity.id} className="bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer" onClick={() => handleEditActivity(activity)}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-grow">
                                                        <h3 className="font-bold text-lg text-white mb-1">{activity.name}</h3>
                                                        <div className="flex items-center gap-4 text-sm text-gray-300">
                                                            <span>{activity.options?.length || 0} subniveles</span>
                                                            {activity.goal && (
                                                                <span className="text-yellow-400">🎯 Meta: {activity.goal.target} pts</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenGoalModal(activity);
                                                            }}
                                                            className="p-2 bg-yellow-600 hover:bg-yellow-700 rounded-full text-white"
                                                            title="Configurar meta"
                                                        >
                                                            🎯
                                                        </button>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onDeleteActivity(activity.id);
                                                            }}
                                                            className="p-2 bg-red-800 hover:bg-red-700 rounded-full text-white" 
                                                            aria-label={`Eliminar ${activity.name}`}
                                                        >
                                                            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-400">
                                        <p className="text-lg mb-2">No hay actividades definidas</p>
                                        <p className="text-sm">Crea tu primera actividad para comenzar a hacer seguimiento</p>
                                    </div>
                                )}
                            </>
                        )}

                        {view === 'edit' && selectedActivity && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 mb-4">
                                    <button onClick={handleBackToList} className="text-blue-400 hover:text-blue-300 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                        </svg>
                                        Volver a la lista
                                    </button>
                                </div>

                                <div className="bg-gray-700 p-4 rounded-lg">
                                    <h3 className="font-bold text-xl text-white mb-4">{selectedActivity.name}</h3>
                                    
                                    {/* Meta actual */}
                                    {selectedActivity.goal && (
                                        <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-600/50 rounded-lg">
                                            <div className="flex items-center gap-2 text-yellow-300 text-sm">
                                                <span>🎯 Meta:</span>
                                                <span className="font-semibold">
                                                    {selectedActivity.goal.target} puntos
                                                    {selectedActivity.goal.type === 'weekly' && ' (semanal)'}
                                                    {selectedActivity.goal.type === 'monthly' && ' (mensual)'}
                                                    {selectedActivity.goal.type === 'custom' && ` (${selectedActivity.goal.startDate} a ${selectedActivity.goal.endDate})`}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="border-t border-gray-600 pt-4">
                                        <h4 className="text-sm font-semibold text-gray-300 mb-3">Subniveles y Puntos:</h4>
                                        <div className="space-y-2">
                                            {(selectedActivity.options && selectedActivity.options.length > 0) ? (
                                                selectedActivity.options.map(option => (
                                                    <div key={option} className="flex items-center gap-2 bg-gray-600 px-3 py-2 rounded">
                                                        <span className="text-gray-200 flex-grow">{option}</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            placeholder="Puntos"
                                                            value={selectedActivity.points?.[option] || ''}
                                                            onChange={(e) => handleUpdatePoints(selectedActivity.id, option, e.target.value)}
                                                            className="w-16 bg-gray-700 text-white rounded px-2 py-1 text-sm border border-gray-500"
                                                        />
                                                        <button 
                                                            onClick={() => onDeleteOption(selectedActivity.id, option)} 
                                                            className="p-1 text-gray-400 hover:text-white"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-gray-400 italic">Sin subniveles predefinidos.</p>
                                            )}
                                        </div>
                                        <div className="mt-3 flex gap-2">
                                            <input 
                                                type="text" 
                                                placeholder="Añadir nuevo subnivel" 
                                                value={newOptionValues[selectedActivity.id] || ''} 
                                                onChange={(e) => handleNewOptionChange(selectedActivity.id, e.target.value)} 
                                                className="flex-grow bg-gray-600 text-white rounded-md p-2 text-sm border border-gray-500" 
                                            />
                                            <button 
                                                onClick={() => handleAddNewOption(selectedActivity.id)} 
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 rounded-lg text-sm"
                                            >
                                                Añadir
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {view === 'create' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 mb-4">
                                    <button onClick={handleBackToList} className="text-blue-400 hover:text-blue-300 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                        </svg>
                                        Volver a la lista
                                    </button>
                                </div>
                                
                                <CreateActivityModal 
                                    isOpen={true}
                                    onClose={handleBackToList}
                                    onCreateActivity={(activityData) => {
                                        onCreateActivity(activityData);
                                        handleBackToList();
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Modal de configuración de metas */}
            {isGoalModalOpen && selectedActivity && (
                <GoalConfigModal 
                    activity={selectedActivity}
                    onClose={() => setIsGoalModalOpen(false)}
                    onSaveGoal={onSaveGoal}
                />
            )}
        </>
    );
};

// --- Componente del Modal de Exportación ---
const ExportModal = ({ isOpen, onClose, onExport }) => {
    if (!isOpen) return null;

    const [exportType, setExportType] = useState('all'); // 'all' or 'range'
    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [isExporting, setIsExporting] = useState(false);

    const handleExportClick = async () => {
        setIsExporting(true);
        if (exportType === 'all') {
            await onExport(null, null);
        } else {
            if (startDate > endDate) {
                alert("La fecha de inicio no puede ser posterior a la fecha de fin.");
                setIsExporting(false);
                return;
            }
            await onExport(startDate, endDate);
        }
        setIsExporting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md">
                <h2 className="text-2xl font-bold text-white mb-4">Exportar Entradas</h2>
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <input type="radio" id="all" name="exportType" value="all" checked={exportType === 'all'} onChange={() => setExportType('all')} />
                        <label htmlFor="all" className="text-white">Exportar todo</label>
                    </div>
                    <div className="flex items-center gap-4">
                        <input type="radio" id="range" name="exportType" value="range" checked={exportType === 'range'} onChange={() => setExportType('range')} />
                        <label htmlFor="range" className="text-white">Seleccionar período</label>
                    </div>
                    {exportType === 'range' && (
                        <div className="pl-8 flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <label htmlFor="start-date-export" className="block text-sm font-medium text-gray-300 mb-1">Desde</label>
                                <input type="date" id="start-date-export" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-gray-600 text-white rounded-md p-2 border border-gray-500" />
                            </div>
                            <div className="flex-1">
                                <label htmlFor="end-date-export" className="block text-sm font-medium text-gray-300 mb-1">Hasta</label>
                                <input type="date" id="end-date-export" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-gray-600 text-white rounded-md p-2 border border-gray-500" />
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex justify-end space-x-3 pt-6 mt-4 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg">Cancelar</button>
                    <button 
                        type="button" 
                        onClick={handleExportClick} 
                        disabled={isExporting}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 font-bold rounded-lg disabled:bg-gray-500 disabled:cursor-wait"
                    >
                        {isExporting ? 'Exportando...' : 'Descargar'}
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Panel de Estadísticas (con lógica mejorada) ---
const StatisticsPanel = ({ db, userId, appId, activities }) => {
    const [rawEntries, setRawEntries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedActivityId, setSelectedActivityId] = useState(null);
    const [selectedRange, setSelectedRange] = useState('this_week');

    const dateRanges = useMemo(() => {
        const getFormattedDate = (date) => date.toISOString().split('T')[0];
        const today = new Date();
        const ranges = {
            this_week: {
                name: 'Esta semana',
                startDate: (() => {
                    const d = new Date(today);
                    const day = d.getDay();
                    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
                    return getFormattedDate(new Date(d.setDate(diff)));
                })(),
                endDate: getFormattedDate(today)
            },
            this_month: {
                name: 'Este mes',
                startDate: getFormattedDate(new Date(today.getFullYear(), today.getMonth(), 1)),
                endDate: getFormattedDate(today)
            },
            this_year: {
                name: 'Este año',
                startDate: getFormattedDate(new Date(today.getFullYear(), 0, 1)),
                endDate: getFormattedDate(today)
            },
            last_year: {
                name: 'Año anterior',
                startDate: getFormattedDate(new Date(today.getFullYear() - 1, 0, 1)),
                endDate: getFormattedDate(new Date(today.getFullYear() - 1, 11, 31))
            },
            since_last_year: {
                name: 'Desde el año pasado',
                startDate: getFormattedDate(new Date(today.getFullYear() - 1, 0, 1)),
                endDate: getFormattedDate(today)
            }
        };
        return ranges;
    }, []);

    const { startDate, endDate } = dateRanges[selectedRange];

    useEffect(() => {
        const fetchEntries = async () => {
            if (!db || !userId || !startDate || !endDate) return;
            setIsLoading(true);
            setError(null);
            try {
                const entriesRef = collection(db, 'artifacts', appId, 'users', userId, 'entries');
                const entriesQuery = query(entriesRef, where(documentId(), '>=', startDate), where(documentId(), '<=', endDate));
                const querySnapshot = await getDocs(entriesQuery);
                const entries = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setRawEntries(entries);
            } catch (err) {
                console.error("Error fetching statistics:", err);
                setError("No se pudieron cargar las estadísticas.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchEntries();
    }, [db, userId, appId, startDate, endDate]);

    const handleBarClick = (data) => {
        console.log('Bar clicked:', data);
        
        // Buscar la actividad por nombre (activeLabel) o por payload
        let activityId = null;
        
        if (data && data.activeLabel) {
            // Buscar por nombre de actividad
            activityId = Object.keys(activities).find(id => 
                activities[id]?.name === data.activeLabel
            );
        } else if (data && data.activePayload && data.activePayload[0]) {
            // Buscar por payload (para los botones de prueba)
            activityId = data.activePayload[0].payload.id;
        }
        
        console.log('Selected activity ID:', activityId);
        console.log('Available activities:', Object.keys(activities));
        
        if (activityId && activities[activityId]) {
            setSelectedActivityId(activityId);
        } else {
            console.error('Activity not found:', activityId);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-400">Cargando estadísticas...</div>;
    if (error) return <div className="p-8 text-center text-red-400">{error}</div>;

    if (selectedActivityId) {
        return <ActivityDetailView activity={activities[selectedActivityId]} entries={rawEntries} onBack={() => setSelectedActivityId(null)} />;
    }

    return <StatisticsOverview rawEntries={rawEntries} activities={activities} onBarClick={handleBarClick} dateRanges={dateRanges} selectedRange={selectedRange} onRangeChange={setSelectedRange} />;
};

const StatisticsOverview = ({ rawEntries, activities, onBarClick, dateRanges, selectedRange, onRangeChange }) => {
    const [chartType, setChartType] = useState('bars'); // 'bars' or 'lines'
    const [showGoals, setShowGoals] = useState(true);

    const overviewData = useMemo(() => {
        const activityStats = {};
        
        // Calcular puntos totales por actividad
        rawEntries.forEach(entry => {
            if (entry.tracked) {
                Object.entries(entry.tracked).forEach(([activityId, option]) => {
                    if (!activityStats[activityId]) {
                        activityStats[activityId] = {
                            id: activityId,
                            name: activities[activityId]?.name || 'Actividad Desconocida',
                            totalPoints: 0,
                            daysCount: 0,
                            goal: activities[activityId]?.goal
                        };
                    }
                    
                    const points = activities[activityId]?.points?.[option] || 0;
                    activityStats[activityId].totalPoints += points;
                    activityStats[activityId].daysCount += 1;
                });
            }
        });

        // Calcular porcentaje de cumplimiento para cada actividad
        Object.values(activityStats).forEach(activity => {
            if (activity.goal) {
                const goalTarget = activity.goal.target;
                activity.completionPercentage = Math.round((activity.totalPoints / goalTarget) * 100);
                activity.isGoalMet = activity.totalPoints >= goalTarget;
            }
        });

        return Object.values(activityStats)
            .sort((a, b) => b.totalPoints - a.totalPoints);
    }, [rawEntries, activities]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
                    <p className="text-white font-semibold">{data.name}</p>
                    <p className="text-gray-300">Puntos totales: <span className="text-green-400 font-bold">{data.totalPoints}</span></p>
                    <p className="text-gray-300">Días registrados: <span className="text-blue-400">{data.daysCount}</span></p>
                    {data.goal && (
                        <div className="mt-2 pt-2 border-t border-gray-600">
                            <p className="text-yellow-300">Meta: {data.goal.target} puntos</p>
                            <p className={`font-bold ${data.isGoalMet ? 'text-green-400' : 'text-red-400'}`}>
                                {data.completionPercentage}% cumplido
                                {data.isGoalMet ? ' ✅' : ' ❌'}
                            </p>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                    <h3 className="text-xl font-semibold text-white">Desempeño de Actividades</h3>
                    <div className="flex items-center gap-4">


                        <select
                            value={selectedRange}
                            onChange={(e) => onRangeChange(e.target.value)}
                            className="bg-gray-700 text-white rounded-md p-2 border border-gray-600"
                        >
                            {Object.entries(dateRanges).map(([key, value]) => (
                                <option key={key} value={key}>{value.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                
                                {overviewData.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {overviewData.map(activity => (
                            <div 
                                key={activity.id} 
                                className="bg-gray-700 p-4 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
                                onClick={() => onBarClick({ activePayload: [{ payload: activity }] })}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-white font-medium text-lg">{activity.name}</span>
                                    {activity.goal && (
                                        <span className={`text-sm font-bold ${activity.isGoalMet ? 'text-green-400' : 'text-red-400'}`}>
                                            {activity.isGoalMet ? '✅' : '❌'}
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm text-gray-300 space-y-2">
                                    <div className="flex justify-between">
                                        <span>Puntos:</span>
                                        <span className="text-green-400 font-bold">{activity.totalPoints}</span>
                                    </div>
                                    {activity.goal && (
                                        <>
                                            <div className="flex justify-between">
                                                <span>Meta:</span>
                                                <span className="text-yellow-400">{activity.goal.target}</span>
                                            </div>
                                            <div className="mt-2">
                                                <div className="w-full bg-gray-600 rounded-full h-2">
                                                    <div 
                                                        className={`h-2 rounded-full ${activity.isGoalMet ? 'bg-green-500' : 'bg-red-500'}`}
                                                        style={{ width: `${Math.min(activity.completionPercentage, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs">{activity.completionPercentage}%</span>
                                            </div>
                                        </>
                                    )}
                                    <div className="text-xs text-gray-400 mt-2">
                                        Haz clic para ver detalles
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-400 italic">No hay datos para el rango de fechas seleccionado.</p>
                )}
                

            </div>
        </div>
    );
};

const ActivityDetailView = ({ activity, entries, onBack }) => {
    const [timeGroup, setTimeGroup] = useState('weekly'); // 'weekly' or 'monthly'
    const [selectedPeriod, setSelectedPeriod] = useState(null);

    const processedData = useMemo(() => {
        if (!activity || !entries) return [];
        
        const getWeek = (d) => {
            const date = new Date(d.getTime());
            date.setHours(0, 0, 0, 0);
            date.setDate(date.getDate() + 4 - (date.getDay() || 7));
            const yearStart = new Date(date.getFullYear(), 0, 1);
            const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
            return `${date.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
        };

        const getMonth = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        
        const relevantEntries = entries.filter(e => e.tracked && e.tracked[activity.id]);
        
        const groupedData = relevantEntries.reduce((acc, entry) => {
            const date = new Date(`${entry.id}T00:00:00`);
            const key = timeGroup === 'weekly' ? getWeek(date) : getMonth(date);
            const option = entry.tracked[activity.id] || 'N/A';
            const points = activity.points?.[option] || 0;
            
            if (!acc[key]) {
                acc[key] = { 
                    timePeriod: key, 
                    totalPoints: 0,
                    daysCount: 0,
                    activities: []
                };
            }
            
            acc[key].totalPoints += points;
            acc[key].daysCount += 1;
            acc[key].activities.push({
                date: entry.id,
                option: option,
                points: points
            });
            
            return acc;
        }, {});

        return Object.values(groupedData).sort((a,b) => a.timePeriod.localeCompare(b.timePeriod));
    }, [activity, entries, timeGroup]);

    // Calcular meta para el periodo seleccionado
    const calculateGoalForPeriod = useMemo(() => {
        if (!activity.goal || processedData.length === 0) return null;
        
        const { type, target } = activity.goal;
        const totalDays = processedData.reduce((sum, period) => sum + period.daysCount, 0);
        
        if (type === 'weekly') {
            const weeksCount = processedData.length;
            return target * weeksCount;
        } else if (type === 'monthly') {
            const monthsCount = processedData.length;
            return target * monthsCount;
        } else if (type === 'custom') {
            // Para metas personalizadas, usar el target total
            return target;
        }
        
        return null;
    }, [activity.goal, processedData]);

    const totalPoints = processedData.reduce((sum, period) => sum + period.totalPoints, 0);
    const goalMet = calculateGoalForPeriod ? totalPoints >= calculateGoalForPeriod : false;
    const completionPercentage = calculateGoalForPeriod ? Math.round((totalPoints / calculateGoalForPeriod) * 100) : 0;

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
                    <p className="text-white font-semibold">{data.timePeriod}</p>
                    <p className="text-gray-300">Puntos: <span className="text-green-400 font-bold">{data.totalPoints}</span></p>
                    <p className="text-gray-300">Días: <span className="text-blue-400">{data.daysCount}</span></p>
                    <p className="text-gray-300">Actividades: <span className="text-purple-400">{data.activities.length}</span></p>
                </div>
            );
        }
        return null;
    };

    const handlePeriodClick = (data) => {
        console.log('Period clicked:', data);
        
        let period = null;
        
        if (data && data.activePayload && data.activePayload[0]) {
            // Para botones de prueba
            period = data.activePayload[0].payload;
        } else if (data && data.activeLabel) {
            // Para clic en barras - buscar por timePeriod
            period = processedData.find(p => p.timePeriod === data.activeLabel);
        }
        
        console.log('Selected period:', period);
        
        if (period) {
            setSelectedPeriod(period);
        } else {
            console.error('Period not found');
        }
    };

    if (selectedPeriod) {
        return (
            <ActivityPeriodDetail 
                period={selectedPeriod} 
                activity={activity}
                onBack={() => setSelectedPeriod(null)}
            />
        );
    }
    
    return (
        <div className="p-4 md:p-6">
            <button onClick={onBack} className="text-indigo-400 hover:text-indigo-300 mb-4 inline-flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Volver a todas las actividades
            </button>
            
            <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                    <h3 className="text-xl font-semibold text-white">Análisis de: {activity.name}</h3>
                    <div className="flex items-center gap-2 bg-gray-700/50 p-1 rounded-lg">
                        <button onClick={() => setTimeGroup('weekly')} className={`px-3 py-1 text-sm font-medium rounded-md ${timeGroup === 'weekly' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>
                            Semanal
                        </button>
                        <button onClick={() => setTimeGroup('monthly')} className={`px-3 py-1 text-sm font-medium rounded-md ${timeGroup === 'monthly' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>
                            Mensual
                        </button>
                    </div>
                </div>

                {/* Resumen de la actividad */}
                <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-400">{totalPoints}</div>
                            <div className="text-sm text-gray-300">Puntos Totales</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-400">{processedData.length}</div>
                            <div className="text-sm text-gray-300">{timeGroup === 'weekly' ? 'Semanas' : 'Meses'}</div>
                        </div>
                        {calculateGoalForPeriod && (
                            <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-400">{calculateGoalForPeriod}</div>
                                <div className="text-sm text-gray-300">Meta del Periodo</div>
                                <div className={`text-sm font-bold ${goalMet ? 'text-green-400' : 'text-red-400'}`}>
                                    {completionPercentage}% {goalMet ? '✅' : '❌'}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                                {processedData.length > 0 ? (
                    <div>
                        {/* Botones de prueba removidos */}
                        
                        <div style={{ width: '100%', height: 400 }}>
                            <ResponsiveContainer>
                                <BarChart data={processedData} margin={{top: 20, right: 30, left: 20, bottom: 5}} onClick={handlePeriodClick}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#4A5568"/>
                                    <XAxis dataKey="timePeriod" stroke="#A0AEC0" tick={{fontSize: 12}}/>
                                    <YAxis stroke="#A0AEC0" allowDecimals={false}/>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ color: '#E2E8F0' }} />
                                    <Bar 
                                        dataKey="totalPoints" 
                                        name="Puntos Totales" 
                                        fill="#667EEA" 
                                        cursor="pointer"
                                        radius={[4, 4, 0, 0]}
                                    />
                                    {calculateGoalForPeriod && (
                                        <ReferenceLine 
                                            y={calculateGoalForPeriod} 
                                            stroke="#FFD700" 
                                            strokeDasharray="3 3" 
                                            strokeWidth={2}
                                            label={{ value: 'Meta', position: 'insideTopRight', fill: '#FFD700' }}
                                        />
                                    )}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                ) : (
                    <p className="text-center text-gray-400 italic">No hay datos de esta actividad para el rango y período seleccionados.</p>
                )}
            </div>
        </div>
    );
};

// --- Componente para mostrar el detalle de un periodo específico ---
const ActivityPeriodDetail = ({ period, activity, onBack }) => {
    const totalPoints = period.activities.reduce((sum, act) => sum + act.points, 0);
    
    return (
        <div className="p-4 md:p-6">
            <button onClick={onBack} className="text-indigo-400 hover:text-indigo-300 mb-4 inline-flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Volver al análisis de {activity.name}
            </button>
            
            <div className="bg-gray-800 rounded-lg p-6">
                <div className="mb-6">
                    <h3 className="text-xl font-semibold text-white mb-2">
                        Detalle del Periodo: {period.timePeriod}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-gray-700 rounded-lg">
                            <div className="text-2xl font-bold text-green-400">{totalPoints}</div>
                            <div className="text-sm text-gray-300">Puntos Totales</div>
                        </div>
                        <div className="text-center p-3 bg-gray-700 rounded-lg">
                            <div className="text-2xl font-bold text-blue-400">{period.daysCount}</div>
                            <div className="text-sm text-gray-300">Días Registrados</div>
                        </div>
                        <div className="text-center p-3 bg-gray-700 rounded-lg">
                            <div className="text-2xl font-bold text-purple-400">{period.activities.length}</div>
                            <div className="text-sm text-gray-300">Actividades</div>
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="text-lg font-semibold text-white mb-4">Actividades del Periodo</h4>
                    <div className="space-y-3">
                        {[...period.activities].sort((a, b) => a.date.localeCompare(b.date)).map((act, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className="text-sm text-gray-400 w-20">{act.date}</div>
                                    <div className="text-white font-medium">{act.option}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-green-400 font-bold">{act.points} pts</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const APP_VERSION = 'V 1.08'; // Cambia este valor en cada iteración
