import { useState, useEffect } from 'react';
import { collection, onSnapshot, setDoc, addDoc, doc } from 'firebase/firestore';

export default function useActivities(db, user, appId) {
    const [activities, setActivities] = useState({});

    useEffect(() => {
        if (!db || !user?.uid) return;
        const activitiesCol = collection(db, 'artifacts', appId, 'users', user.uid, 'activities');
        const unsubscribe = onSnapshot(activitiesCol, (snapshot) => {
            const fetchedActivities = {};
            snapshot.forEach(doc => { fetchedActivities[doc.id] = { id: doc.id, ...doc.data() }; });
            setActivities(fetchedActivities);
        });
        return () => unsubscribe();
    }, [db, user, appId]);

    // Crear o editar actividad
    const handleSaveActivity = async (activityData) => {
        if (!db || !user?.uid) return;
        if (activityData.id) {
            const activityRef = doc(db, 'artifacts', appId, 'users', user.uid, 'activities', activityData.id);
            const { id, ...dataToSave } = activityData;
            await setDoc(activityRef, dataToSave, { merge: true });
        } else {
            const activitiesCol = collection(db, 'artifacts', appId, 'users', user.uid, 'activities');
            await addDoc(activitiesCol, activityData);
        }
    };

    return { activities, handleSaveActivity };
} 