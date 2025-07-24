import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { encryptText, decryptText } from '../utils/crypto';

export default function useDiary(db, user, appId, selectedDate) {
    const [currentEntry, setCurrentEntry] = useState({ text: '', tracked: {} });
    const [isLoadingEntry, setIsLoadingEntry] = useState(false);

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
    }, [db, user, appId, selectedDate]);

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

    // Función para importar entradas
    const importEntry = useCallback(async (date, title, content, activities) => {
        if (!db || !user?.uid) return false;
        
        try {
            const entryDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'entries', date);
            
            // Combinar título y contenido
            const fullText = title ? `${title}\n${content}` : content;
            
            // Encriptar datos
            const [titleLine, ...bodyLines] = fullText.split('\n');
            const bodyText = bodyLines.join('\n');
            const [encryptedTitle, encryptedText] = await Promise.all([
                encryptText(titleLine, user.uid),
                encryptText(bodyText, user.uid)
            ]);
            
            // Procesar actividades si existen
            let trackedActivities = {};
            if (activities) {
                try {
                    // Intentar parsear como JSON primero
                    trackedActivities = JSON.parse(activities);
                } catch {
                    // Si no es JSON, procesar como string simple
                    const activityList = activities.split(',').map(a => a.trim());
                    activityList.forEach(activity => {
                        if (activity) {
                            trackedActivities[activity] = true;
                        }
                    });
                }
            }
            
            // Guardar entrada
            await setDoc(entryDocRef, {
                title: encryptedTitle,
                text: encryptedText,
                tracked: trackedActivities
            }, { merge: true });
            
            return true;
        } catch (error) {
            console.error('Error importing entry:', error);
            return false;
        }
    }, [db, user, appId]);

    return { currentEntry, setCurrentEntry, isLoadingEntry, saveData, importEntry };
} 