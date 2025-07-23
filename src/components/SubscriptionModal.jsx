import { useState } from 'react';

export default function SubscriptionModal({ isOpen, onClose, db, user }) {
    const [selectedPlan, setSelectedPlan] = useState('premium');
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Simulación de suscripción (temporal)
    const subscription = {
        isPremium: false,
        plan: 'free',
        expiresAt: null,
        features: ['basic']
    };
    
    const updateSubscription = async (newSubscription) => {
        console.log('Actualizando suscripción:', newSubscription);
        // En una implementación real, esto se guardaría en Firebase
    };

    const plans = [
        {
            id: 'free',
            name: 'Gratis',
            price: 0,
            period: 'para siempre',
            features: [
                'Entradas de diario ilimitadas',
                'Actividades básicas (3 máximo por día)',
                'Exportación básica',
                'Temas básicos',
                'Sincronización entre dispositivos'
            ],
            color: 'gray',
            popular: false
        },
        {
            id: 'premium',
            name: 'Premium',
            price: 4.99,
            period: 'por mes',
            features: [
                'Todo del plan Gratis',
                'Actividades ilimitadas',
                'Exportación avanzada (PDF, Word)',
                'Temas personalizados',
                'Estadísticas detalladas',
                'Respaldo automático'
            ],
            color: 'blue',
            popular: true
        },
        {
            id: 'pro',
            name: 'Pro',
            price: 9.99,
            period: 'por mes',
            features: [
                'Todo del plan Premium',
                'Chat con terapeuta virtual',
                'Asistente de escritura con IA',
                'Análisis de patrones de comportamiento',
                'Autenticación de dos factores',
                'Soporte prioritario',
                'Acceso anticipado a nuevas funciones'
            ],
            color: 'purple',
            popular: false
        }
    ];

    const handleUpgrade = async () => {
        if (selectedPlan === subscription.plan) return;
        
        setIsProcessing(true);
        try {
            // Simulación de proceso de actualización
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const newSubscription = {
                isPremium: selectedPlan !== 'free',
                plan: selectedPlan,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
                features: getPlanFeatures(selectedPlan),
                updatedAt: new Date()
            };
            
            await updateSubscription(newSubscription);
            onClose();
            
            // En una implementación real, aquí se integraría con un sistema de pagos
            alert(`¡Plan ${selectedPlan} activado exitosamente!`);
        } catch (error) {
            console.error('Error al actualizar suscripción:', error);
            alert('Error al actualizar la suscripción. Inténtalo de nuevo.');
        } finally {
            setIsProcessing(false);
        }
    };

    const getPlanFeatures = (planId) => {
        const plan = plans.find(p => p.id === planId);
        return plan ? plan.features : [];
    };

    const getCurrentPlan = () => {
        return plans.find(p => p.id === subscription.plan) || plans[0];
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-2xl font-bold">Planes de Suscripción</h2>
                        <p className="text-gray-600">Elige el plan que mejor se adapte a tus necesidades</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Current Plan Info */}
                <div className="p-6 bg-blue-50 border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-blue-800">Plan Actual</h3>
                            <p className="text-blue-600">{getCurrentPlan().name}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-blue-600">
                                {subscription.isPremium ? 'Premium activo' : 'Plan gratuito'}
                            </p>
                            {subscription.expiresAt && (
                                <p className="text-xs text-blue-500">
                                    Expira: {subscription.expiresAt.toLocaleDateString()}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Plans */}
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`relative border rounded-lg p-6 ${
                                    selectedPlan === plan.id
                                        ? `border-${plan.color}-500 ring-2 ring-${plan.color}-200`
                                        : 'border-gray-200'
                                } ${plan.popular ? 'ring-2 ring-yellow-400' : ''}`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                        <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-medium">
                                            Más Popular
                                        </span>
                                    </div>
                                )}
                                
                                <div className="text-center mb-6">
                                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                                    <div className="mb-4">
                                        <span className="text-3xl font-bold">
                                            ${plan.price}
                                        </span>
                                        <span className="text-gray-500">/{plan.period}</span>
                                    </div>
                                    
                                    {subscription.plan === plan.id ? (
                                        <button
                                            disabled
                                            className="w-full px-4 py-2 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                                        >
                                            Plan Actual
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setSelectedPlan(plan.id)}
                                            className={`w-full px-4 py-2 rounded-lg font-medium ${
                                                selectedPlan === plan.id
                                                    ? `bg-${plan.color}-600 text-white`
                                                    : `bg-${plan.color}-100 text-${plan.color}-700 hover:bg-${plan.color}-200`
                                            }`}
                                        >
                                            {subscription.plan === 'free' && plan.id !== 'free' ? 'Actualizar' : 'Seleccionar'}
                                        </button>
                                    )}
                                </div>
                                
                                <ul className="space-y-3">
                                    {plan.features.map((feature, index) => (
                                        <li key={index} className="flex items-start">
                                            <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="text-sm text-gray-600">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="p-6 border-t bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">
                                Plan seleccionado: <span className="font-medium">{plans.find(p => p.id === selectedPlan)?.name}</span>
                            </p>
                            {selectedPlan !== 'free' && (
                                <p className="text-xs text-gray-500">
                                    Se te cobrará ${plans.find(p => p.id === selectedPlan)?.price} al confirmar
                                </p>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleUpgrade}
                                disabled={isProcessing || selectedPlan === subscription.plan}
                                className={`px-6 py-2 rounded-lg font-medium ${
                                    selectedPlan === subscription.plan
                                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                            >
                                {isProcessing ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Procesando...
                                    </div>
                                ) : (
                                    selectedPlan === subscription.plan ? 'Plan Actual' : 'Confirmar Actualización'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 