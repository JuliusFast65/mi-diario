import React from 'react';

const SubscriptionStatus = ({ subscription, isSubscriptionActive, onUpgradeClick }) => {
    // Usar el plan real de la suscripción
    const currentPlan = subscription?.plan || 'free';
    
    const getPlanDisplayName = (plan) => {
        switch (plan) {
            case 'free': return 'Gratuito';
            case 'premium': return 'Premium';
            default: return 'Gratuito';
        }
    };

    const getPlanColor = (plan) => {
        switch (plan) {
            case 'free': return 'text-gray-400';
            case 'premium': return 'text-yellow-400';
            default: return 'text-gray-400';
        }
    };

    const getPlanIcon = (plan) => {
        switch (plan) {
            case 'free': return '⭐';
            case 'premium': return '💎';
            default: return '⭐';
        }
    };

    return (
        <div className="flex items-center gap-2 text-xs">
            <button 
                onClick={onUpgradeClick}
                className={`${getPlanColor(currentPlan)} hover:underline cursor-pointer flex items-center gap-1`}
                title="Ver planes de suscripción"
            >
                <span>{getPlanIcon(currentPlan)}</span>
                <span>{getPlanDisplayName(currentPlan)}</span>
            </button>
        </div>
    );
};

export default SubscriptionStatus; 