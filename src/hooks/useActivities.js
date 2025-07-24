import { useState, useEffect } from 'react';
import { collection, onSnapshot, setDoc, addDoc, doc, deleteDoc } from 'firebase/firestore';

export default function useActivities(db, user, appId, subscription) {
    const [activities, setActivities] = useState({});

    useEffect(() => {
        if (!db || !user?.uid) return;
        const activitiesCol = collection(db, 'artifacts', appId, 'users', user.uid, 'activities');
        const unsubscribe = onSnapshot(activitiesCol, (snapshot) => {
            const fetchedActivities = {};
            snapshot.forEach(doc => { 
                const activityData = { id: doc.id, ...doc.data() };
                // Migrar actividades existentes al nuevo formato si es necesario
                if (subscription?.plan === 'free' && activityData.options && activityData.options.length > 0) {
                    // Convertir actividad premium a simple para usuarios gratuitos
                    activityData.isSimple = true;
                    activityData.originalOptions = activityData.options;
                    activityData.options = [];
                    activityData.points = {};
                }
                fetchedActivities[doc.id] = activityData;
            });
            setActivities(fetchedActivities);
        });
        return () => unsubscribe();
    }, [db, user, appId, subscription]);

    // Crear o editar actividad
    const handleSaveActivity = async (activityData) => {
        if (!db || !user?.uid) return;
        
        const isFreePlan = subscription?.plan === 'free';
        
        // Para usuarios gratuitos, simplificar la actividad
        if (isFreePlan) {
            const simplifiedActivity = {
                name: activityData.name,
                isSimple: true,
                createdAt: activityData.createdAt || new Date()
            };
            
            if (activityData.id) {
                const activityRef = doc(db, 'artifacts', appId, 'users', user.uid, 'activities', activityData.id);
                const { id, ...dataToSave } = simplifiedActivity;
                await setDoc(activityRef, dataToSave, { merge: true });
            } else {
                const activitiesCol = collection(db, 'artifacts', appId, 'users', user.uid, 'activities');
                await addDoc(activitiesCol, simplifiedActivity);
            }
        } else {
            // Para usuarios premium, mantener la funcionalidad completa
            if (activityData.id) {
                const activityRef = doc(db, 'artifacts', appId, 'users', user.uid, 'activities', activityData.id);
                const { id, ...dataToSave } = activityData;
                await setDoc(activityRef, dataToSave, { merge: true });
            } else {
                const activitiesCol = collection(db, 'artifacts', appId, 'users', user.uid, 'activities');
                await addDoc(activitiesCol, activityData);
            }
        }
    };

    // Eliminar actividad
    const handleDeleteActivity = async (activityId) => {
        if (!db || !user?.uid || !activityId) return;
        const activityRef = doc(db, 'artifacts', appId, 'users', user.uid, 'activities', activityId);
        await deleteDoc(activityRef);
    };

    // Agregar opción a actividad (solo para premium)
    const handleAddOptionToActivity = async (activityId, newOption) => {
        if (!db || !user?.uid || !newOption.trim()) return;
        
        const isFreePlan = subscription?.plan === 'free';
        if (isFreePlan) {
            console.warn('Los usuarios gratuitos no pueden agregar opciones a las actividades');
            return;
        }
        
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

    // Eliminar opción de actividad (solo para premium)
    const handleDeleteOptionFromActivity = async (activityId, optionToDelete) => {
        if (!db || !user?.uid) return;
        
        const isFreePlan = subscription?.plan === 'free';
        if (isFreePlan) {
            console.warn('Los usuarios gratuitos no pueden eliminar opciones de las actividades');
            return;
        }
        
        const activityRef = doc(db, 'artifacts', appId, 'users', user.uid, 'activities', activityId);
        const currentOptions = activities[activityId]?.options || [];
        const currentPoints = activities[activityId]?.points || {};
        const newOptions = currentOptions.filter(opt => opt !== optionToDelete);
        const newPoints = { ...currentPoints };
        delete newPoints[optionToDelete];
        await setDoc(activityRef, { options: newOptions, points: newPoints }, { merge: true });
    };

    // Guardar meta (solo para premium)
    const handleSaveGoal = async (activityId, goal) => {
        if (!db || !user?.uid || !activityId) return;
        
        const isFreePlan = subscription?.plan === 'free';
        if (isFreePlan) {
            console.warn('Los usuarios gratuitos no pueden configurar metas complejas');
            return;
        }
        
        const activityRef = doc(db, 'artifacts', appId, 'users', user.uid, 'activities', activityId);
        await setDoc(activityRef, { goal }, { merge: true });
    };

    // Actualizar puntos (solo para premium)
    const handleUpdatePoints = async (activityId, option, points) => {
        if (!db || !user?.uid || !activityId || !option) return;
        
        const isFreePlan = subscription?.plan === 'free';
        if (isFreePlan) {
            console.warn('Los usuarios gratuitos no pueden asignar puntos personalizados');
            return;
        }
        
        const activityRef = doc(db, 'artifacts', appId, 'users', user.uid, 'activities', activityId);
        const currentActivity = activities[activityId];
        const currentPoints = currentActivity.points || {};
        const updatedPoints = { ...currentPoints, [option]: points };
        await setDoc(activityRef, { points: updatedPoints }, { merge: true });
    };

    // Obtener información sobre límites de actividades
    const getActivityLimits = () => {
        const currentCount = Object.keys(activities).length;
        const isFreePlan = subscription?.plan === 'free';
        
        // No hay límite para definir actividades - los usuarios pueden definir todas las que quieran
        // El límite se aplica solo al registro diario de actividades
        const canAddMore = true; // Siempre permitir definir nuevas actividades
        
        return {
            currentCount,
            maxActivities: Infinity, // Sin límite para definir actividades
            canAddMore,
            isFreePlan
        };
    };

    // Verificar si una actividad es simple (para usuarios gratuitos)
    const isSimpleActivity = (activityId) => {
        const activity = activities[activityId];
        return activity?.isSimple || subscription?.plan === 'free';
    };

    // Obtener puntos para una actividad (1 punto para actividades simples)
    const getActivityPoints = (activityId, selectedValue) => {
        const activity = activities[activityId];
        if (isSimpleActivity(activityId)) {
            return selectedValue ? 1 : 0; // 1 punto si está registrada, 0 si no
        }
        return activity?.points?.[selectedValue] || 0;
    };

    return {
        activities,
        handleSaveActivity,
        handleDeleteActivity,
        handleAddOptionToActivity,
        handleDeleteOptionFromActivity,
        handleSaveGoal,
        handleUpdatePoints,
        getActivityLimits,
        isSimpleActivity,
        getActivityPoints
    };
} 