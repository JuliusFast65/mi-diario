import React, { useState, useEffect } from 'react';
import PremiumFeatureModal from './PremiumFeatureModal';

export default function BehaviorAnalysis({ isOpen, onClose, entries, onUpgradeClick, hasFeature, currentTheme = 'dark' }) {
    const [analysis, setAnalysis] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [timeRange, setTimeRange] = useState('month');

    useEffect(() => {
        if (isOpen && entries.length > 0) {
            generateAnalysis();
        }
    }, [isOpen, entries, timeRange]);

    const generateAnalysis = async () => {
        setIsLoading(true);
        try {
            // Simulación de análisis de IA
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const filteredEntries = filterEntriesByTimeRange(entries, timeRange);
            
            const mockAnalysis = {
                emotionalTrends: analyzeEmotionalTrends(filteredEntries),
                writingPatterns: analyzeWritingPatterns(filteredEntries),
                activityCorrelations: analyzeActivityCorrelations(filteredEntries),
                insights: generateInsights(filteredEntries),
                recommendations: generateRecommendations(filteredEntries)
            };
            
            setAnalysis(mockAnalysis);
        } catch (error) {
            console.error('Error al generar análisis:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filterEntriesByTimeRange = (entries, range) => {
        const now = new Date();
        const daysAgo = range === 'week' ? 7 : range === 'month' ? 30 : 90;
        const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
        
        return entries.filter(entry => new Date(entry.date) >= cutoffDate);
    };

    const analyzeEmotionalTrends = (entries) => {
        // Simulación de análisis de emociones
        const emotions = ['feliz', 'triste', 'estresado', 'tranquilo', 'ansioso', 'motivado'];
        const emotionCounts = {};
        
        emotions.forEach(emotion => {
            emotionCounts[emotion] = Math.floor(Math.random() * 10) + 1;
        });
        
        const dominantEmotion = Object.keys(emotionCounts).length > 0 ? 
            Object.keys(emotionCounts).reduce((a, b) => 
                emotionCounts[a] > emotionCounts[b] ? a : b
            ) : 'tranquilo';
        
        return {
            dominantEmotion,
            emotionDistribution: emotionCounts,
            trend: Math.random() > 0.5 ? 'mejorando' : 'estable',
            moodStability: Math.floor(Math.random() * 40) + 60 // 60-100%
        };
    };

    const analyzeWritingPatterns = (entries) => {
        if (!entries || entries.length === 0) {
            return {
                totalEntries: 0,
                avgWordsPerEntry: 0,
                mostActiveHour: 0,
                consistency: 0,
                longestStreak: 0
            };
        }
        
        const totalWords = entries.reduce((sum, entry) => sum + (entry.content?.split(' ').length || 0), 0);
        const avgWordsPerEntry = totalWords / entries.length;
        
        const writingTimes = entries.map(entry => new Date(entry.date).getHours());
        const mostCommonHour = writingTimes.length > 0 ? writingTimes.reduce((a, b) => 
            writingTimes.filter(v => v === a).length >= writingTimes.filter(v => v === b).length ? a : b
        ) : 0;
        
        return {
            totalEntries: entries.length,
            avgWordsPerEntry: Math.round(avgWordsPerEntry),
            mostActiveHour: mostCommonHour,
            consistency: Math.floor(Math.random() * 30) + 70, // 70-100%
            longestStreak: Math.floor(Math.random() * 10) + 3
        };
    };

    const analyzeActivityCorrelations = (entries) => {
        // Simulación de correlaciones con actividades
        return [
            {
                activity: 'Ejercicio',
                correlation: 'positiva',
                strength: 'alta',
                description: 'Los días que haces ejercicio tiendes a escribir entradas más positivas.'
            },
            {
                activity: 'Trabajo',
                correlation: 'negativa',
                strength: 'media',
                description: 'Los días laborales muestran niveles más altos de estrés en tus escritos.'
            },
            {
                activity: 'Socialización',
                correlation: 'positiva',
                strength: 'alta',
                description: 'Las interacciones sociales mejoran significativamente tu estado de ánimo.'
            }
        ];
    };

    const generateInsights = (entries) => {
        return [
            {
                type: 'pattern',
                title: 'Patrón de escritura matutina',
                description: 'Escribes mejor y más reflexivamente en las mañanas.',
                confidence: 85
            },
            {
                type: 'emotion',
                title: 'Mejora en estabilidad emocional',
                description: 'Tu estado de ánimo se ha estabilizado un 15% en las últimas semanas.',
                confidence: 78
            },
            {
                type: 'habit',
                title: 'Consistencia creciente',
                description: 'Has mantenido una rutina de escritura más consistente.',
                confidence: 92
            }
        ];
    };

    const generateRecommendations = (entries) => {
        return [
            {
                category: 'Escritura',
                recommendation: 'Intenta escribir al menos 100 palabras por entrada para obtener mejores insights.',
                priority: 'alta'
            },
            {
                category: 'Emociones',
                recommendation: 'Considera practicar gratitud diaria para mejorar tu bienestar emocional.',
                priority: 'media'
            },
            {
                category: 'Hábitos',
                recommendation: 'Mantén tu rutina matutina de escritura, es cuando eres más productivo.',
                priority: 'alta'
            }
        ];
    };

    if (!isOpen) return null;

    if (!hasFeature('behavior_analysis')) {
        return (
            <PremiumFeatureModal
                isOpen={isOpen}
                onClose={onClose}
                onUpgrade={onUpgradeClick}
                featureName="Análisis de Comportamiento"
                featureDescription="Descubre patrones ocultos en tus pensamientos y emociones con análisis inteligente de tus entradas del diario."
                featureIcon="📊"
            />
        );
    }

    return (
        <div className={`fixed inset-0 ${currentTheme === 'dark' ? 'bg-black bg-opacity-50' : 'bg-black bg-opacity-50'} flex items-center justify-center z-50`}>
            <div className={`${currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg w-full max-w-6xl h-[90vh] mx-4 flex flex-col`}>
                {/* Header */}
                <div className={`flex items-center justify-between p-4 border-b ${currentTheme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${currentTheme === 'dark' ? 'bg-indigo-900' : 'bg-indigo-100'} rounded-full flex items-center justify-center`}>
                            <span className={`${currentTheme === 'dark' ? 'text-indigo-300' : 'text-indigo-600'} font-semibold`}>📊</span>
                        </div>
                        <div>
                            <h2 className={`text-xl font-bold ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Análisis de Comportamiento</h2>
                            <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} font-medium`}>Patrones e insights de tu diario</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            className={`border rounded-lg px-4 py-2 text-sm font-medium shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                                currentTheme === 'dark' 
                                    ? 'border-gray-600 text-white bg-gray-700' 
                                    : 'border-gray-400 text-gray-900 bg-white'
                            }`}
                        >
                            <option value="week">Última semana</option>
                            <option value="month">Último mes</option>
                            <option value="quarter">Último trimestre</option>
                        </select>
                        <button
                            onClick={onClose}
                            className={`${currentTheme === 'dark' ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'} p-2 rounded-lg transition-colors`}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                                <p className={`${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Analizando tus patrones de comportamiento...</p>
                                <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-400'} mt-2`}>Esto puede tomar unos momentos</p>
                            </div>
                        </div>
                    ) : analysis ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Emotional Trends */}
                            <div className={`${currentTheme === 'dark' ? 'bg-gradient-to-br from-blue-900 to-indigo-900' : 'bg-gradient-to-br from-blue-50 to-indigo-50'} rounded-lg p-6`}>
                                <h3 className={`text-lg font-semibold mb-4 ${currentTheme === 'dark' ? 'text-indigo-200' : 'text-indigo-800'}`}>Tendencias Emocionales</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className={`text-sm ${currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'} font-semibold`}>Emoción dominante:</span>
                                        <span className={`font-bold ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'} text-lg`}>{analysis.emotionalTrends.dominantEmotion}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className={`text-sm ${currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'} font-semibold`}>Tendencia:</span>
                                        <span className={`font-bold text-lg ${
                                            analysis.emotionalTrends.trend === 'mejorando' ? 'text-green-400' : 'text-blue-400'
                                        }`}>
                                            {analysis.emotionalTrends.trend}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className={`text-sm ${currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'} font-semibold`}>Estabilidad del ánimo:</span>
                                        <span className={`font-bold ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'} text-lg`}>{analysis.emotionalTrends.moodStability}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Writing Patterns */}
                            <div className={`${currentTheme === 'dark' ? 'bg-gradient-to-br from-green-900 to-emerald-900' : 'bg-gradient-to-br from-green-50 to-emerald-50'} rounded-lg p-6`}>
                                <h3 className={`text-lg font-semibold mb-4 ${currentTheme === 'dark' ? 'text-emerald-200' : 'text-emerald-800'}`}>Patrones de Escritura</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className={`text-sm ${currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'} font-semibold`}>Entradas analizadas:</span>
                                        <span className={`font-bold ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'} text-lg`}>{analysis.writingPatterns.totalEntries}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className={`text-sm ${currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'} font-semibold`}>Promedio de palabras:</span>
                                        <span className={`font-bold ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'} text-lg`}>{analysis.writingPatterns.avgWordsPerEntry}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className={`text-sm ${currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'} font-semibold`}>Hora más activa:</span>
                                        <span className={`font-bold ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'} text-lg`}>{analysis.writingPatterns.mostActiveHour}:00</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className={`text-sm ${currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'} font-semibold`}>Consistencia:</span>
                                        <span className={`font-bold ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'} text-lg`}>{analysis.writingPatterns.consistency}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Insights */}
                            <div className={`lg:col-span-2 ${currentTheme === 'dark' ? 'bg-gradient-to-br from-purple-900 to-pink-900' : 'bg-gradient-to-br from-purple-50 to-pink-50'} rounded-lg p-6`}>
                                <h3 className={`text-lg font-semibold mb-4 ${currentTheme === 'dark' ? 'text-purple-200' : 'text-purple-800'}`}>Insights Principales</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {analysis.insights.map((insight, index) => (
                                        <div key={index} className={`${currentTheme === 'dark' ? 'bg-gray-700' : 'bg-white'} rounded-lg p-4 shadow-sm`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`w-2 h-2 rounded-full ${
                                                    insight.type === 'pattern' ? 'bg-blue-500' :
                                                    insight.type === 'emotion' ? 'bg-green-500' : 'bg-purple-500'
                                                }`}></span>
                                                <span className={`text-xs font-medium ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{insight.confidence}% confianza</span>
                                            </div>
                                            <h4 className={`font-semibold text-sm mb-1 ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{insight.title}</h4>
                                            <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-800'} leading-relaxed`}>{insight.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recommendations */}
                            <div className={`lg:col-span-2 ${currentTheme === 'dark' ? 'bg-gradient-to-br from-yellow-900 to-orange-900' : 'bg-gradient-to-br from-yellow-50 to-orange-50'} rounded-lg p-6`}>
                                <h3 className={`text-lg font-semibold mb-4 ${currentTheme === 'dark' ? 'text-orange-200' : 'text-orange-800'}`}>Recomendaciones</h3>
                                <div className="space-y-3">
                                    {analysis.recommendations.map((rec, index) => (
                                        <div key={index} className={`flex items-start gap-3 ${currentTheme === 'dark' ? 'bg-gray-700' : 'bg-white'} rounded-lg p-4 shadow-sm`}>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                rec.priority === 'alta' ? 'bg-red-100 text-red-800' :
                                                rec.priority === 'media' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                                {rec.priority}
                                            </span>
                                            <div>
                                                <h4 className={`font-semibold text-sm mb-1 ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{rec.category}</h4>
                                                <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-800'} leading-relaxed`}>{rec.recommendation}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Activity Correlations */}
                            <div className={`lg:col-span-2 ${currentTheme === 'dark' ? 'bg-gradient-to-br from-teal-900 to-cyan-900' : 'bg-gradient-to-br from-teal-50 to-cyan-50'} rounded-lg p-6`}>
                                <h3 className={`text-lg font-semibold mb-4 ${currentTheme === 'dark' ? 'text-teal-200' : 'text-teal-800'}`}>Correlaciones con Actividades</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {analysis.activityCorrelations.map((correlation, index) => (
                                        <div key={index} className={`${currentTheme === 'dark' ? 'bg-gray-700' : 'bg-white'} rounded-lg p-4 shadow-sm`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-sm font-semibold ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{correlation.activity}</span>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    correlation.correlation === 'positiva' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {correlation.correlation}
                                                </span>
                                            </div>
                                            <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-800'} mb-2 leading-relaxed`}>{correlation.description}</p>
                                            <span className={`text-xs px-2 py-1 rounded font-medium ${
                                                correlation.strength === 'alta' ? 'bg-blue-100 text-blue-800' :
                                                correlation.strength === 'media' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {correlation.strength} correlación
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className={`text-center ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'} py-8`}>
                            <p>No hay suficientes datos para generar análisis.</p>
                            <p className={`text-sm mt-2 ${currentTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Escribe más entradas para obtener insights valiosos.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 