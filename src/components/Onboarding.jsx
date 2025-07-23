import React, { useState, useEffect, useRef } from 'react';

const Onboarding = ({ isOpen, onClose, mode = 'manual' }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [highlightedElement, setHighlightedElement] = useState(null);
    const overlayRef = useRef(null);

    const steps = [
        {
            type: 'welcome',
            title: '¡Bienvenido a Introspect!',
            content: 'Tu diario personal para guardar tus pensamientos y cultivar tus hábitos con propósito.',
            showLogo: true
        },
        {
            target: 'textarea.writing-area',
            content: 'Escribe aquí las reflexiones y experiencias de tu día',
            title: 'Área de Escritura'
        },
        {
            target: '.writing-assistant-btn',
            content: 'Mejora tu redacción con sugerencias inteligentes',
            title: 'Asistente de Escritura'
        },
        {
            target: '.ai-consult-btn',
            content: 'Deja que la IA te ayude a reflexionar más profundamente',
            title: 'Terapeuta IA'
        },
        {
            target: '.activities-tab',
            content: 'Registra y da seguimiento a tus actividades diarias',
            title: 'Registro de Actividades',
            action: () => {
                const activitiesTab = document.querySelector('.activities-tab');
                if (activitiesTab) activitiesTab.click();
            }
        },
        {
            target: '.stats-tab',
            content: 'Evalúa el progreso hacia tus metas y objetivos',
            title: 'Estadísticas',
            action: () => {
                const statsTab = document.querySelector('.stats-tab');
                if (statsTab) statsTab.click();
            }
        },
        {
            target: '.archive-tab',
            content: 'Revisa y busca en todas tus entradas anteriores',
            title: 'Archivo',
            action: () => {
                const archiveTab = document.querySelector('.archive-tab');
                if (archiveTab) archiveTab.click();
            }
        },
        {
            target: '.export-btn',
            content: 'Guarda y comparte tus entradas en diferentes formatos',
            title: 'Exportar'
        },
        {
            target: '.inspirational-btn',
            content: 'Lee un pensamiento inspirador para motivarte',
            title: 'Pensamiento Inspirador'
        },
        {
            type: 'goodbye',
            title: '¡Listo para comenzar!',
            content: 'Disfruta de tu introspección y crecimiento personal. ¡Que cada día sea una oportunidad para conocerte mejor!',
            showLogo: true
        }
    ];

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            setCurrentStep(0);
            // Verificar si es la primera vez
            if (mode === 'auto' && !localStorage.getItem('onboarding-completed')) {
                startAutoOnboarding();
            }
        } else {
            setIsVisible(false);
            setHighlightedElement(null);
        }
    }, [isOpen, mode]);

    useEffect(() => {
        if (isVisible && currentStep < steps.length) {
            highlightCurrentElement();
        }
    }, [currentStep, isVisible]);

    const startAutoOnboarding = () => {
        // Marcar como completado
        localStorage.setItem('onboarding-completed', 'true');
    };

    const highlightCurrentElement = () => {
        const currentStepData = steps[currentStep];
        
        // Si es un paso de bienvenida o despedida, no necesitamos resaltar elementos
        if (currentStepData.type === 'welcome' || currentStepData.type === 'goodbye') {
            setHighlightedElement(null);
            return;
        }
        
        // Ejecutar acción si existe (cambio de pestaña)
        if (currentStepData.action) {
            setTimeout(() => {
                currentStepData.action();
            }, 100);
        }

        // Esperar un poco más si hay acción para que se complete el cambio de pestaña
        const delay = currentStepData.action ? 800 : 300;
        
        setTimeout(() => {
            const element = document.querySelector(currentStepData.target);
            
            if (element) {
                setHighlightedElement(element);
                
                // Scroll suave al elemento
                element.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center',
                    inline: 'center'
                });
            } else {
                console.warn(`Elemento no encontrado: ${currentStepData.target}`);
                setHighlightedElement(null);
                // Si no se encuentra el elemento, continuar al siguiente paso
                if (currentStep < steps.length - 1) {
                    setTimeout(() => {
                        setCurrentStep(currentStep + 1);
                    }, 1000);
                }
            }
        }, delay);
    };

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            completeOnboarding();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const completeOnboarding = () => {
        setIsVisible(false);
        setHighlightedElement(null);
        
        // Volver a la pestaña de entrada al finalizar
        const diaryTab = document.querySelector('.diary-tab');
        if (diaryTab) {
            setTimeout(() => {
                diaryTab.click();
            }, 100);
        }
        
        onClose();
        if (mode === 'auto') {
            localStorage.setItem('onboarding-completed', 'true');
        }
    };

    const skipOnboarding = () => {
        completeOnboarding();
    };

    const currentStepData = steps[currentStep];

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50">
            {/* Overlay más claro */}
            <div 
                ref={overlayRef}
                className="absolute inset-0 bg-black bg-opacity-40"
                onClick={mode === 'manual' ? onClose : undefined}
            />
            
            {/* Tooltip centrado - siempre visible */}
            <div 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 text-white rounded-xl shadow-2xl max-w-sm p-4 border border-gray-600"
                style={{
                    maxWidth: '320px',
                    minWidth: '280px',
                    zIndex: 60
                }}
            >
                {/* Header con logo si es necesario */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        {currentStepData.showLogo && (
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        )}
                        <h3 className="font-semibold text-lg">{currentStepData.title}</h3>
                    </div>
                    <button 
                        onClick={skipOnboarding}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                {/* Contenido */}
                <p className="text-gray-300 mb-4 text-sm leading-relaxed">{currentStepData.content}</p>
                
                {/* Navegación */}
                <div className="flex items-center justify-between">
                    <div className="flex space-x-1">
                        {steps.map((_, index) => (
                            <div 
                                key={index}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                    index === currentStep ? 'bg-blue-500 scale-110' : 'bg-gray-600'
                                }`}
                            />
                        ))}
                    </div>
                    
                    <div className="flex space-x-2">
                        {currentStep > 0 && (
                            <button 
                                onClick={prevStep}
                                className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm transition-colors font-medium"
                            >
                                Anterior
                            </button>
                        )}
                        <button 
                            onClick={nextStep}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm transition-colors font-medium"
                        >
                            {currentStep === steps.length - 1 ? 'Finalizar' : 'Siguiente'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Onboarding; 