import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import DeleteConfirmModal from './DeleteConfirmModal';

const DiaryEntryEditor = ({ 
    currentEntry, 
    onTextChange, 
    userPrefs, 
    onUpdateUserPrefs, 
    textareaRef, 
    onDeleteEntry, 
    onConsultAI, 
    onWritingAssistant, 
    onOpenStatistics,
    onOpenAnalysis,
    subscription,
    currentTheme = 'dark' 
}) => {
    const { t } = useTranslation();
    const [focusMode, setFocusMode] = useState(false);
    const [deleteModalEntry, setDeleteModalEntry] = useState(null);

    const fontClassMap = {
        'patrick-hand': 'font-patrick-hand',
        'caveat': 'font-caveat',
        'indie-flower': 'font-indie-flower',
        'kalam': 'font-kalam',
        'gochi-hand': 'font-gochi-hand',
        'lora': 'font-lora',
        'sans': 'font-sans',
    };

    const fontSizeClassMap = {
        'text-lg': 'text-lg',
        'text-xl': 'text-xl',
        'text-2xl': 'text-2xl',
        'text-3xl': 'text-3xl',
        'text-4xl': 'text-4xl',
    };

    return (
        <>
            <div className="flex flex-col flex-grow relative">
                {/* Modo enfoque - pantalla completa */}
                {focusMode && (
                    <div className={`fixed inset-0 z-50 flex flex-col ${currentTheme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
                        {/* Botón para salir del modo enfoque */}
                        <button
                            className="absolute top-4 right-4 z-[60] bg-cyan-600 hover:bg-cyan-700 text-white rounded-full p-2 shadow-lg"
                            title={t('diary.exitFocusMode')}
                            onClick={() => setFocusMode(false)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        
                        {/* Área de escritura en modo enfoque */}
                        <div className="flex-1 flex items-center justify-center p-4">
                            <div className="w-full max-w-4xl h-full">
                                <textarea
                                    ref={textareaRef}
                                    value={currentEntry?.text || ''}
                                    onChange={onTextChange}
                                    placeholder={t('diary.writeTitlePlaceholder')}
                                    className={`w-full h-full rounded-md p-6 border-none focus:ring-0 transition resize-none notebook journal-editor leading-[1.5] ${fontSizeClassMap[userPrefs.fontSize]} ${fontClassMap[userPrefs.font]} writing-area`}
                                    style={{minHeight: '80vh'}}
                                />
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Vista normal */}
                {!focusMode && (
                    <>
                        {/* Botón de modo enfoque */}
                        <button
                            className="absolute top-2 right-2 z-20 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full p-2 shadow-lg focus-mode-btn"
                            title={t('diary.focusMode')}
                            onClick={() => setFocusMode(true)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V6a2 2 0 012-2h2m8 0h2a2 2 0 012 2v2m0 8v2a2 2 0 01-2 2h-2m-8 0H6a2 2 0 01-2-2v-2" />
                            </svg>
                        </button>
                        
                        {/* Área de escritura */}
                        <div className={`${currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-2 flex flex-col flex-grow mb-4 md:mb-6 relative border ${currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                            <textarea
                                ref={textareaRef}
                                value={currentEntry?.text || ''}
                                onChange={onTextChange}
                                placeholder={t('diary.writeTitlePlaceholder')}
                                className={`w-full flex-grow rounded-md p-3 border-none focus:ring-0 transition resize-none notebook journal-editor leading-[1.5] ${fontSizeClassMap[userPrefs.fontSize]} ${fontClassMap[userPrefs.font]} writing-area`}
                            />
                            
                            {/* Botón de eliminar sobrepuesto en esquina inferior izquierda */}
                            {currentEntry?.text && (
                                <button 
                                    title={t('diary.deleteEntry')} 
                                    onClick={() => setDeleteModalEntry({ id: 'current', title: currentEntry?.text?.split('\n')[0] || t('diary.noTitle') })} 
                                    className="absolute bottom-20 left-3 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-lg transition-colors z-30 pointer-events-auto"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            )}
                            
                            {/* Controles */}
                            <div className={`flex justify-between items-center mt-4 pt-4 border-t flex-wrap gap-4 flex-shrink-0 ${currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                                {/* Lado izquierdo - Estadísticas, Análisis y Tutorial */}
                                <div className="flex items-center gap-2">
                                    <button title="Estadísticas" onClick={onOpenStatistics} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2 rounded-lg text-sm flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2zm0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </button>
                                    <button 
                                        title={subscription?.plan === 'premium' ? 'Análisis de Comportamiento' : 'Función Premium - Análisis de Comportamiento'} 
                                        onClick={onOpenAnalysis} 
                                        className={`font-bold p-2 rounded-lg text-sm flex items-center gap-2 ${
                                            subscription?.plan === 'premium'
                                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                        }`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </button>
                                    <button 
                                        onClick={() => window.dispatchEvent(new CustomEvent('openOnboarding'))} 
                                        title={t('diary.helpTutorial')} 
                                        className={`${currentTheme === 'dark' ? 'text-gray-400 hover:text-blue-300' : 'text-gray-600 hover:text-blue-600'} transition-colors p-1`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </button>
                                </div>
                                
                                {/* Lado derecho - Asistente y Reflexión */}
                                <div className="flex gap-2">
                                    <button title={t('diary.writingAssistant')} onClick={onWritingAssistant} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold p-2 rounded-lg text-sm flex items-center gap-2 writing-assistant-btn">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                                            <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    <button title={t('diary.aiConsult')} onClick={onConsultAI} className="bg-purple-600 hover:bg-purple-700 text-white font-bold p-2 rounded-lg text-sm flex items-center gap-2 ai-consult-btn">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a2 2 0 100 4 2 2 0 000-4z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
                
                <DeleteConfirmModal
                    isOpen={!!deleteModalEntry}
                    onClose={() => setDeleteModalEntry(null)}
                    onConfirm={async () => {
                        if (deleteModalEntry) {
                            await onDeleteEntry(deleteModalEntry.id);
                        }
                    }}
                    entry={deleteModalEntry}
                    currentTheme={currentTheme}
                />
            </div>
        </>
    );
};

export default DiaryEntryEditor; 