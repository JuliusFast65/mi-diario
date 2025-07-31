import { useState, useEffect } from 'react';
import { collection, onSnapshot, setDoc, addDoc, doc, deleteDoc, getDocs } from 'firebase/firestore';

export default function useActivities(db, user, appId, subscription) {
    const [activities, setActivities] = useState({});

    useEffect(() => {
        if (!db || !user?.uid) return;
        const activitiesCol = collection(db, 'artifacts', appId, 'users', user.uid, 'activities');
        const unsubscribe = onSnapshot(activitiesCol, (snapshot) => {
            const fetchedActivities = {};
            snapshot.forEach(doc => { 
                const activityData = { id: doc.id, ...doc.data() };
                
                // Para usuarios gratuitos: ocultar subniveles pero preservar datos originales
                if (subscription?.plan === 'free' && activityData.options && activityData.options.length > 0) {
                    activityData.isSimple = true;
                    activityData.originalOptions = activityData.options;
                    activityData.originalPoints = activityData.points;
                    activityData.options = [];
                    activityData.points = {};
                }
                
                // Para usuarios premium: restaurar subniveles si existen datos originales
                if (subscription?.plan === 'premium' && activityData.isSimple && activityData.originalOptions) {
                    activityData.options = activityData.originalOptions;
                    activityData.points = activityData.originalPoints || {};
                    delete activityData.isSimple;
                    delete activityData.originalOptions;
                    delete activityData.originalPoints;
                }
                
                fetchedActivities[doc.id] = activityData;
            });
            setActivities(fetchedActivities);
        });
        
        return () => unsubscribe();
    }, [db, user, appId, subscription]);

    // Migrar metas de usuarios gratuitos en un useEffect separado
    useEffect(() => {
        if (subscription?.plan === 'free' && Object.keys(activities).length > 0) {
            migrateFreeUserGoals();
        }
    }, [subscription?.plan, activities]);

    // Crear o editar actividad
    const handleSaveActivity = async (activityData) => {
        if (!db || !user?.uid) return;
        
        const isFreePlan = subscription?.plan === 'free';
        
        if (activityData.id) {
            // Editar actividad existente
            const activityRef = doc(db, 'artifacts', appId, 'users', user.uid, 'activities', activityData.id);
            const { id, ...dataToSave } = activityData;
            
            if (isFreePlan) {
                // Para usuarios gratuitos: simplificar pero preservar datos originales
                const simplifiedActivity = {
                    name: activityData.name,
                    isSimple: true,
                    originalOptions: activityData.options || [],
                    originalPoints: activityData.points || {},
                    options: [],
                    points: {},
                    createdAt: activityData.createdAt || new Date()
                };
                await setDoc(activityRef, simplifiedActivity, { merge: true });
            } else {
                // Para usuarios premium: guardar con funcionalidad completa
                await setDoc(activityRef, dataToSave, { merge: true });
            }
        } else {
            // Crear nueva actividad
            const activitiesCol = collection(db, 'artifacts', appId, 'users', user.uid, 'activities');
            
            if (isFreePlan) {
                // Para usuarios gratuitos: crear actividad simple
                const simplifiedActivity = {
                    name: activityData.name,
                    isSimple: true,
                    options: [],
                    points: {},
                    createdAt: new Date()
                };
                await addDoc(activitiesCol, simplifiedActivity);
            } else {
                // Para usuarios premium: crear con funcionalidad completa
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
        const currentActivity = activities[activityId];
        const currentOptions = currentActivity?.options || [];
        
        if (!currentOptions.includes(newOption.trim())) {
            const currentPoints = currentActivity?.points || {};
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
        const currentActivity = activities[activityId];
        const currentOptions = currentActivity?.options || [];
        const currentPoints = currentActivity?.points || {};
        const newOptions = currentOptions.filter(opt => opt !== optionToDelete);
        const newPoints = { ...currentPoints };
        delete newPoints[optionToDelete];
        await setDoc(activityRef, { options: newOptions, points: newPoints }, { merge: true });
    };

    // Guardar meta (solo para premium)
    const handleSaveGoal = async (activityId, goal) => {
        if (!db || !user?.uid || !activityId) return;
        
        const isFreePlan = subscription?.plan === 'free';
        const activity = activities[activityId];
        const isSimple = !activity?.options || activity.options.length === 0;
        
        // Para usuarios gratuitos con actividades simples, permitir metas por veces
        if (isFreePlan && isSimple) {
            const activityRef = doc(db, 'artifacts', appId, 'users', user.uid, 'activities', activityId);
            await setDoc(activityRef, { goal }, { merge: true });
            return;
        }
        
        if (isFreePlan) {
            console.warn('Los usuarios gratuitos no pueden configurar metas complejas');
            return;
        }
        
        const activityRef = doc(db, 'artifacts', appId, 'users', user.uid, 'activities', activityId);
        await setDoc(activityRef, { goal }, { merge: true });
    };

    // Migrar metas existentes de usuarios gratuitos de puntos a veces
    const migrateFreeUserGoals = async () => {
        if (!db || !user?.uid || subscription?.plan !== 'free') return;
        
        const activitiesCol = collection(db, 'artifacts', appId, 'users', user.uid, 'activities');
        const snapshot = await getDocs(activitiesCol);
        
        const migrationPromises = snapshot.docs.map(async (docSnapshot) => {
            const activityData = docSnapshot.data();
            const isSimple = !activityData.options || activityData.options.length === 0;
            
            // Solo migrar actividades simples que tengan metas por puntos
            if (isSimple && activityData.goal && activityData.goal.target) {
                const activityRef = doc(db, 'artifacts', appId, 'users', user.uid, 'activities', docSnapshot.id);
                // La meta ya está en el formato correcto, solo asegurar que se entienda como veces
                await setDoc(activityRef, { 
                    goal: {
                        ...activityData.goal,
                        // Agregar un flag para indicar que es por veces
                        isCountBased: true
                    }
                }, { merge: true });
            }
        });
        
        await Promise.all(migrationPromises);
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
        const currentPoints = currentActivity?.points || {};
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

    // Verificar si una actividad es simple (sin subniveles disponibles)
    const isSimpleActivity = (activityId) => {
        const activity = activities[activityId];
        
        // Si la actividad tiene subniveles disponibles, no es simple
        if (activity?.options && activity.options.length > 0) {
            return false;
        }
        
        // Si el usuario es gratuito y la actividad no tiene subniveles, es simple
        if (subscription?.plan === 'free') {
            return true;
        }
        
        // Para usuarios premium, solo es simple si explícitamente está marcada como simple
        return activity?.isSimple || false;
    };

    // Obtener puntos para una actividad (1 punto para actividades simples)
    const getActivityPoints = (activityId, selectedValue) => {
        const activity = activities[activityId];
        if (isSimpleActivity(activityId)) {
            return selectedValue ? 1 : 0; // 1 punto si está registrada, 0 si no
        }
        return activity?.points?.[selectedValue] || 0;
    };

    // Obtener conteo de veces para una actividad (nuevo método para actividades simples)
    const getActivityCount = (activityId, selectedValue) => {
        const activity = activities[activityId];
        if (isSimpleActivity(activityId)) {
            return selectedValue ? 1 : 0; // 1 vez si está registrada, 0 si no
        }
        return 0; // Para actividades con subniveles, no aplica conteo simple
    };

    // Verificar si una actividad usa conteo de veces en lugar de puntos
    const usesCountInsteadOfPoints = (activityId) => {
        return isSimpleActivity(activityId);
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
        getActivityPoints,
        getActivityCount,
        usesCountInsteadOfPoints,
        migrateFreeUserGoals
    };
} 