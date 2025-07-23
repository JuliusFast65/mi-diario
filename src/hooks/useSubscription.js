import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export default function useSubscription(db, user, appId) {
    const [subscription, setSubscription] = useState({
        isPremium: false,
        plan: 'free',
        expiresAt: null,
        features: ['basic']
    });

    useEffect(() => {
        if (!db || !user?.uid) return;
        
        const subscriptionDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'subscription', 'status');
        const unsubscribe = onSnapshot(subscriptionDocRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setSubscription({
                    isPremium: data.isPremium || false,
                    plan: data.plan || 'free',
                    expiresAt: data.expiresAt ? new Date(data.expiresAt.toDate()) : null,
                    features: data.features || ['basic']
                });
            } else {
                // Crear documento de suscripción por defecto
                setDoc(subscriptionDocRef, {
                    isPremium: false,
                    plan: 'free',
                    expiresAt: null,
                    features: ['basic'],
                    createdAt: new Date()
                });
            }
        });
        
        return () => unsubscribe();
    }, [db, user, appId]);

    const updateSubscription = async (newSubscription) => {
        if (!db || !user?.uid) return;
        
        const subscriptionDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'subscription', 'status');
        await setDoc(subscriptionDocRef, {
            ...newSubscription,
            updatedAt: new Date()
        }, { merge: true });
    };

    const hasFeature = (feature) => {
        return subscription.features.includes(feature);
    };

    const isSubscriptionActive = () => {
        if (!subscription.isPremium) return false;
        if (!subscription.expiresAt) return true; // Sin fecha de expiración = permanente
        return new Date() < subscription.expiresAt;
    };

    const getAvailableFeatures = () => {
        const baseFeatures = ['basic'];
        const premiumFeatures = ['unlimited_activities', 'advanced_export', 'custom_themes'];
        const proFeatures = ['therapy_chat', 'writing_assistant', 'behavior_analysis', 'two_factor'];
        
        if (subscription.plan === 'pro') {
            return [...baseFeatures, ...premiumFeatures, ...proFeatures];
        } else if (subscription.plan === 'premium') {
            return [...baseFeatures, ...premiumFeatures];
        } else {
            return baseFeatures;
        }
    };

    return {
        subscription,
        updateSubscription,
        hasFeature,
        isSubscriptionActive,
        getAvailableFeatures
    };
} 