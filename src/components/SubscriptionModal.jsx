import React, { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import PaymentGateway from './PaymentGateway';

export default function SubscriptionModal({ isOpen, onClose, db, user, subscription, updateSubscription }) {
    const [selectedPlan, setSelectedPlan] = useState(subscription?.plan || 'premium');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    
    // Actualizar selectedPlan cuando cambie la suscripción
    useEffect(() => {
        if (subscription?.plan) {
            setSelectedPlan(subscription.plan);
        }
    }, [subscription?.plan]);
    


    const plans = [
        {
            id: 'free',
            name: 'Gratis',
            price: 0,
            period: 'para siempre',
            features: [
                'Entradas de diario ilimitadas',
                'Actividades básicas (3 máximo por día)',
                'Asistente de escritura IA',
                'Consejo del Terapeuta IA',
                'Estadísticas básicas',
                'Importación desde txt o css',
                'Exportación básica',
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
                'Estadísticas detalladas',
                'Chat con terapeuta virtual',
                'Asistente avanzado de escritura con IA',
                'Análisis de patrones de comportamiento',
                'Autenticación de dos factores',
                'Exportación avanzada (PDF, Word)',
                'Temas personalizados',
                'Soporte prioritario',
                'Acceso anticipado a nuevas funciones'
            ],
            color: 'blue',
            popular: true
        }
    ];

    const handleUpgrade = async () => {
        if (selectedPlan === subscription.plan) {
            alert('Ya tienes este plan activo');
            return;
        }
        
        if (selectedPlan === 'free') {
            // Downgrade a plan gratuito
            setIsProcessing(true);
            try {
                const newSubscription = {
                    isPremium: false,
                    plan: 'free',
                    expiresAt: null,
                    features: ['basic'],
                    updatedAt: new Date()
                };
                
                await updateSubscription(newSubscription);
                onClose();
                alert('Plan gratuito activado exitosamente');
            } catch (error) {
                console.error('Error al actualizar suscripción:', error);
                alert('Error al actualizar la suscripción. Inténtalo de nuevo.');
            } finally {
                setIsProcessing(false);
            }
        } else {
            // Abrir modal de pago para planes de pago
            setIsPaymentModalOpen(true);
        }
    };

    const handlePaymentSuccess = async () => {
        setIsProcessing(true);
        try {
            const newSubscription = {
                isPremium: true,
                plan: selectedPlan,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
                features: getPlanFeatures(selectedPlan),
                updatedAt: new Date()
            };
            
            await updateSubscription(newSubscription);
            setIsPaymentModalOpen(false);
            onClose();
            alert(`¡Plan ${selectedPlan} activado exitosamente!`);
        } catch (error) {
            console.error('Error al actualizar suscripción después del pago:', error);
            alert('Error al activar el plan. El pago fue exitoso pero hubo un problema al actualizar tu suscripción.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePaymentError = (error) => {
        console.error('Error en el pago:', error);
        setIsPaymentModalOpen(false);
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
                <div className="flex items-center justify-between p-6 border-b border-gray-300">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Planes de Suscripción</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
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
                                    <h3 className="text-2xl font-bold mb-2 text-gray-900">{plan.name}</h3>
                                    <div className="mb-4">
                                        <span className="text-3xl font-bold text-gray-900">
                                            ${plan.price}
                                        </span>
                                        <span className="text-gray-700 font-medium">/{plan.period}</span>
                                    </div>
                                    
                                    <button
                                        onClick={() => setSelectedPlan(plan.id)}
                                        className={`w-full px-4 py-2 rounded-lg font-medium ${
                                            selectedPlan === plan.id
                                                ? `bg-${plan.color}-600 text-white`
                                                : subscription.plan === plan.id
                                                ? `bg-gray-200 text-gray-600`
                                                : `bg-${plan.color}-100 text-${plan.color}-700 hover:bg-${plan.color}-200`
                                        }`}
                                    >
                                        {selectedPlan === plan.id 
                                            ? (subscription.plan === plan.id ? 'Plan Actual' : 'Seleccionado')
                                            : subscription.plan === plan.id 
                                            ? 'Plan Actual' 
                                            : (subscription.plan === 'free' && plan.id !== 'free' ? 'Actualizar' : 'Seleccionar')
                                        }
                                    </button>
                                </div>
                                
                                <ul className="space-y-3">
                                    {plan.features.map((feature, index) => (
                                        <li key={index} className="flex items-start">
                                            <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="text-sm text-gray-800 font-medium">{feature}</span>
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
                                disabled={isProcessing}
                                className={`px-6 py-2 rounded-lg font-medium ${
                                    isProcessing
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
            
            {/* Payment Gateway Modal */}
            <PaymentGateway
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                selectedPlan={selectedPlan}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
                user={user}
            />
        </div>
    );
} 