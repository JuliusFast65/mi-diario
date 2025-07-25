import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { PAYMENT_CONFIG, createMockCheckoutSession } from '../utils/paymentConfig';

// Cargar Stripe
const stripePromise = loadStripe(PAYMENT_CONFIG.stripe.publishableKey);

export default function PaymentGateway({ 
    isOpen, 
    onClose, 
    selectedPlan, 
    onPaymentSuccess, 
    onPaymentError,
    user 
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [stripe, setStripe] = useState(null);
    const [elements, setElements] = useState(null);

    useEffect(() => {
        if (isOpen) {
            initializeStripe();
        }
    }, [isOpen]);

    const initializeStripe = async () => {
        try {
            const stripeInstance = await stripePromise;
            setStripe(stripeInstance);
        } catch (error) {
            console.error('Error al cargar Stripe:', error);
            setError('Error al cargar el sistema de pagos');
        }
    };

    const handlePayment = async () => {
        if (!stripe || !user) {
            setError('Sistema de pagos no disponible');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // En desarrollo, usamos una simulación
            const { sessionId, url } = await createMockCheckoutSession(selectedPlan, user);
            
            // Simular redirección a Stripe Checkout
            console.log('Redirigiendo a:', url);
            
            // En producción, esto sería:
            // const { error } = await stripe.redirectToCheckout({ sessionId });
            
            // Por ahora, simulamos el éxito del pago
            setTimeout(() => {
                onPaymentSuccess?.();
            }, 2000);

        } catch (error) {
            console.error('Error en el pago:', error);
            setError('Error al procesar el pago. Inténtalo de nuevo.');
            onPaymentError?.(error);
        } finally {
            setIsLoading(false);
        }
    };

    const getPlanDetails = (planId) => {
        const plans = {
            premium: {
                name: 'Premium',
                price: 4.99,
                period: 'mes',
                features: [
                    'Actividades ilimitadas',
                    'Exportación avanzada',
                    'Temas personalizados',
                    'Estadísticas detalladas',
                    'Chat con terapeuta virtual',
                    'Asistente de escritura con IA',
                    'Análisis de patrones de comportamiento',
                    'Autenticación de dos factores',
                    'Soporte prioritario',
                    'Acceso anticipado a nuevas funciones'
                ]
            }
        };
        return plans[planId] || plans.premium;
    };

    const planDetails = getPlanDetails(selectedPlan);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md mx-4 p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Confirmar Pago</h2>
                        <p className="text-sm text-gray-600">Plan {planDetails.name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                        disabled={isLoading}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Plan Summary */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-900">{planDetails.name}</span>
                        <span className="text-2xl font-bold text-gray-900">${planDetails.price}</span>
                    </div>
                    <p className="text-sm text-gray-600">por {planDetails.period}</p>
                    
                    <div className="mt-4">
                        <h4 className="font-medium text-gray-900 mb-2">Incluye:</h4>
                        <ul className="space-y-1">
                            {planDetails.features.map((feature, index) => (
                                <li key={index} className="flex items-center text-sm text-gray-700">
                                    <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Payment Info */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Subtotal:</span>
                        <span className="text-sm text-gray-900">${planDetails.price}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Impuestos:</span>
                        <span className="text-sm text-gray-900">$0.00</span>
                    </div>
                    <div className="border-t pt-2">
                        <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-900">Total:</span>
                            <span className="text-xl font-bold text-gray-900">${planDetails.price}</span>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                        disabled={isLoading}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handlePayment}
                        disabled={isLoading || !stripe}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Procesando...
                            </div>
                        ) : (
                            `Pagar $${planDetails.price}`
                        )}
                    </button>
                </div>

                {/* Security Notice */}
                <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500">
                        🔒 Pago seguro procesado por Stripe
                    </p>
                </div>
            </div>
        </div>
    );
} 