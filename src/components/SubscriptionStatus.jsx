import React from 'react';

const SubscriptionStatus = ({ subscription, isSubscriptionActive, onUpgradeClick }) => {
    const getPlanDisplayName = (plan) => {
        switch (plan) {
            case 'free': return 'Gratuito';
            case 'premium': return 'Premium';
            case 'pro': return 'Pro';
            default: return 'Gratuito';
        }
    };

    const getPlanColor = (plan) => {
        switch (plan) {
            case 'free': return 'text-gray-400';
            case 'premium': return 'text-yellow-400';
            case 'pro': return 'text-purple-400';
            default: return 'text-gray-400';
        }
    };

    const getPlanIcon = (plan) => {
        switch (plan) {
            case 'free': return '⭐';
            case 'premium': return '💎';
            case 'pro': return '👑';
            default: return '⭐';
        }
    };

    return (
        <div className="flex items-center gap-2 text-xs">
            <button 
                onClick={onUpgradeClick}
                className={`${getPlanColor(subscription.plan)} hover:underline cursor-pointer flex items-center gap-1`}
                title="Ver planes de suscripción"
            >
                <span>{getPlanIcon(subscription.plan)}</span>
                <span>{getPlanDisplayName(subscription.plan)}</span>
            </button>
            {subscription.expiresAt && isSubscriptionActive() && (
                <span className="text-gray-500">
                    • Expira {subscription.expiresAt.toLocaleDateString()}
                </span>
            )}
            {!isSubscriptionActive() && subscription.isPremium && (
                <span className="text-red-400">
                    • Expirada
                </span>
            )}
        </div>
    );
};

export default SubscriptionStatus; 