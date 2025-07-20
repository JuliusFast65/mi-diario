import { useState, useEffect } from 'react';
import { collection, onSnapshot, setDoc, addDoc, doc, deleteDoc } from 'firebase/firestore';

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

    // Eliminar actividad
    const handleDeleteActivity = async (activityId) => {
        if (!db || !user?.uid || !activityId) return;
        const activityRef = doc(db, 'artifacts', appId, 'users', user.uid, 'activities', activityId);
        await deleteDoc(activityRef);
    };

    // Agregar opción a actividad
    const handleAddOptionToActivity = async (activityId, newOption) => {
        if (!db || !user?.uid || !newOption.trim()) return;
        const activityRef = doc(db, 'artifacts', appId, 'users', user.uid, 'activities', activityId);
        const currentOptions = activities[activityId]?.options || [];
        if (!currentOptions.includes(newOption.trim())) {
            const currentPoints = activities[activityId]?.points || {};
            const updatedPoints = { ...currentPoints, [newOption.trim()]: 0 };
            await setDoc(activityRef, {
                options: [...currentOptions, newOption.trim()],
                points: updatedPoints
            }, { merge: true });
        }
    };

    // Eliminar opción de actividad
    const handleDeleteOptionFromActivity = async (activityId, optionToDelete) => {
        if (!db || !user?.uid) return;
        const activityRef = doc(db, 'artifacts', appId, 'users', user.uid, 'activities', activityId);
        const currentOptions = activities[activityId]?.options || [];
        const currentPoints = activities[activityId]?.points || {};
        const newOptions = currentOptions.filter(opt => opt !== optionToDelete);
        const newPoints = { ...currentPoints };
        delete newPoints[optionToDelete];
        await setDoc(activityRef, { options: newOptions, points: newPoints }, { merge: true });
    };

    // Guardar meta
    const handleSaveGoal = async (activityId, goal) => {
        if (!db || !user?.uid || !activityId) return;
        const activityRef = doc(db, 'artifacts', appId, 'users', user.uid, 'activities', activityId);
        await setDoc(activityRef, { goal }, { merge: true });
    };

    // Actualizar puntos
    const handleUpdatePoints = async (activityId, option, points) => {
        if (!db || !user?.uid || !activityId || !option) return;
        const activityRef = doc(db, 'artifacts', appId, 'users', user.uid, 'activities', activityId);
        const currentActivity = activities[activityId];
        const currentPoints = currentActivity.points || {};
        const updatedPoints = { ...currentPoints, [option]: points };
        await setDoc(activityRef, { points: updatedPoints }, { merge: true });
    };

    return {
        activities,
        handleSaveActivity,
        handleDeleteActivity,
        handleAddOptionToActivity,
        handleDeleteOptionFromActivity,
        handleSaveGoal,
        handleUpdatePoints
    };
} 