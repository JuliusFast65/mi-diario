import React, { useState, useEffect, useRef } from 'react';

const Onboarding = ({ isOpen, onClose, mode = 'manual', currentTheme = 'dark' }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [highlightedElement, setHighlightedElement] = useState(null);
    const overlayRef = useRef(null);

    const steps = [
        {
            type: 'welcome',
            title: 'Introspect',
            content: 'Tu diario personal para guardar tus pensamientos y cultivar tus hábitos con propósito.',
            showLogo: true
        },
        {
            target: 'textarea.writing-area',
            content: 'Escribe aquí las reflexiones y experiencias de tu día',
            title: 'Entrada'
        },
        {
            target: '.writing-assistant-btn',
            content: 'Mejora tu redacción con sugerencias inteligentes',
            title: 'Asistente de Escritura',
            icon: (
                <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                    <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                </svg>
            )
        },
        {
            target: '.ai-consult-btn',
            content: 'Deja que la IA te ayude a reflexionar más profundamente',
            title: 'Terapeuta IA',
            icon: (
                <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a2 2 0 100 4 2 2 0 000-4z" clipRule="evenodd" />
                </svg>
            )
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
            title: 'Exportar',
            icon: (
                <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            )
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

        // Para el área de escritura, hacer scroll suave
        if (currentStepData.target === 'textarea.writing-area') {
            setTimeout(() => {
                const textarea = document.querySelector('textarea.writing-area');
                if (textarea) {
                    textarea.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center'
                    });
                }
            }, 300);
        }
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
                
                // Después de cambiar a la pestaña de entrada, enfocar el área de escritura
                setTimeout(() => {
                    const textarea = document.querySelector('textarea.writing-area');
                    if (textarea) {
                        textarea.focus();
                        textarea.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'center'
                        });
                    }
                }, 300);
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
                className={`absolute inset-0 ${currentTheme === 'dark' ? 'bg-black bg-opacity-40' : 'bg-black bg-opacity-50'}`}
                onClick={mode === 'manual' ? onClose : undefined}
            />
            
            {/* Tooltip centrado - siempre visible */}
            <div 
                className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${currentTheme === 'dark' ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} rounded-xl shadow-2xl max-w-sm p-4 border`}
                style={{
                    maxWidth: '320px',
                    minWidth: '280px',
                    zIndex: 60
                }}
            >
                {/* Header con logo o icono */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        {currentStepData.showLogo && (
                            <div className="w-8 h-8 flex items-center justify-center">
                                <img src="/favicon.svg" alt="Introspect" className="w-6 h-6" />
                            </div>
                        )}
                        {currentStepData.icon && !currentStepData.showLogo && (
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                currentStepData.title === 'Asistente de Escritura' ? 'bg-cyan-600' :
                                currentStepData.title === 'Terapeuta IA' ? 'bg-purple-600' :
                                'bg-gray-600'
                            }`}>
                                <div className="text-white">
                                    {currentStepData.icon}
                                </div>
                            </div>
                        )}
                        <h3 className="font-semibold text-lg">{currentStepData.title}</h3>
                    </div>
                    <button 
                        onClick={skipOnboarding}
                        className={`${currentTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                {/* Contenido */}
                <p className={`${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-4 text-sm leading-relaxed`}>{currentStepData.content}</p>
                
                {/* Navegación */}
                <div className="flex items-center justify-between">
                    <div className="flex space-x-1">
                        {steps.map((_, index) => (
                            <div 
                                key={index}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                    index === currentStep ? 'bg-blue-500 scale-110' : `${currentTheme === 'dark' ? 'bg-gray-600' : 'bg-gray-400'}`
                                }`}
                            />
                        ))}
                    </div>
                    
                    <div className="flex space-x-2">
                        {currentStep > 0 && (
                            <button 
                                onClick={prevStep}
                                className={`px-3 py-1.5 ${currentTheme === 'dark' ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'} rounded-lg text-sm transition-colors font-medium ${currentTheme === 'dark' ? 'text-white' : 'text-gray-700'}`}
                            >
                                Anterior
                            </button>
                        )}
                        <button 
                            onClick={nextStep}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm transition-colors font-medium text-white"
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