import React from 'react';

const SubscriptionStatus = ({ subscription, isSubscriptionActive }) => {
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
            <span className={getPlanColor(subscription.plan)}>
                {getPlanIcon(subscription.plan)} {getPlanDisplayName(subscription.plan)}
            </span>
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