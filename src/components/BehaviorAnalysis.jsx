import { useState, useEffect } from 'react';

export default function BehaviorAnalysis({ isOpen, onClose, entries, onUpgradeClick }) {
    const [analysis, setAnalysis] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [timeRange, setTimeRange] = useState('month');
    
    // Verificación de suscripción
    const hasFeature = (feature) => {
        // Bloquear acceso para usuarios gratuitos
        return false; // Cambiar a true solo para usuarios Premium/Pro
    };

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
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md mx-4">
                    <h2 className="text-xl font-semibold mb-4">Característica Premium</h2>
                    <p className="text-gray-600 mb-4">
                        El análisis de patrones de comportamiento es una característica exclusiva para usuarios Pro.
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                        >
                            Cerrar
                        </button>
                        <button
                            onClick={() => {
                                onClose();
                                if (onUpgradeClick) onUpgradeClick();
                            }}
                            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                            Actualizar a Pro
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] mx-4 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-indigo-600 font-semibold">📊</span>
                        </div>
                        <div>
                            <h2 className="font-semibold">Análisis de Comportamiento</h2>
                            <p className="text-sm text-gray-500">Patrones e insights de tu diario</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            className="border rounded px-3 py-1 text-sm"
                        >
                            <option value="week">Última semana</option>
                            <option value="month">Último mes</option>
                            <option value="quarter">Último trimestre</option>
                        </select>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
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
                                <p className="text-gray-500">Analizando tus patrones de comportamiento...</p>
                                <p className="text-sm text-gray-400 mt-2">Esto puede tomar unos momentos</p>
                            </div>
                        </div>
                    ) : analysis ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Emotional Trends */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
                                <h3 className="text-lg font-semibold mb-4 text-indigo-800">Tendencias Emocionales</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Emoción dominante:</span>
                                        <span className="font-medium">{analysis.emotionalTrends.dominantEmotion}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Tendencia:</span>
                                        <span className={`font-medium ${
                                            analysis.emotionalTrends.trend === 'mejorando' ? 'text-green-600' : 'text-blue-600'
                                        }`}>
                                            {analysis.emotionalTrends.trend}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Estabilidad del ánimo:</span>
                                        <span className="font-medium">{analysis.emotionalTrends.moodStability}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Writing Patterns */}
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6">
                                <h3 className="text-lg font-semibold mb-4 text-emerald-800">Patrones de Escritura</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Entradas analizadas:</span>
                                        <span className="font-medium">{analysis.writingPatterns.totalEntries}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Promedio de palabras:</span>
                                        <span className="font-medium">{analysis.writingPatterns.avgWordsPerEntry}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Hora más activa:</span>
                                        <span className="font-medium">{analysis.writingPatterns.mostActiveHour}:00</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Consistencia:</span>
                                        <span className="font-medium">{analysis.writingPatterns.consistency}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Insights */}
                            <div className="lg:col-span-2 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6">
                                <h3 className="text-lg font-semibold mb-4 text-purple-800">Insights Principales</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {analysis.insights.map((insight, index) => (
                                        <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`w-2 h-2 rounded-full ${
                                                    insight.type === 'pattern' ? 'bg-blue-500' :
                                                    insight.type === 'emotion' ? 'bg-green-500' : 'bg-purple-500'
                                                }`}></span>
                                                <span className="text-xs text-gray-500">{insight.confidence}% confianza</span>
                                            </div>
                                            <h4 className="font-medium text-sm mb-1">{insight.title}</h4>
                                            <p className="text-xs text-gray-600">{insight.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recommendations */}
                            <div className="lg:col-span-2 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-6">
                                <h3 className="text-lg font-semibold mb-4 text-orange-800">Recomendaciones</h3>
                                <div className="space-y-3">
                                    {analysis.recommendations.map((rec, index) => (
                                        <div key={index} className="flex items-start gap-3 bg-white rounded-lg p-4 shadow-sm">
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                rec.priority === 'alta' ? 'bg-red-100 text-red-800' :
                                                rec.priority === 'media' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                                {rec.priority}
                                            </span>
                                            <div>
                                                <h4 className="font-medium text-sm mb-1">{rec.category}</h4>
                                                <p className="text-sm text-gray-600">{rec.recommendation}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Activity Correlations */}
                            <div className="lg:col-span-2 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-6">
                                <h3 className="text-lg font-semibold mb-4 text-teal-800">Correlaciones con Actividades</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {analysis.activityCorrelations.map((correlation, index) => (
                                        <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-sm font-medium">{correlation.activity}</span>
                                                <span className={`px-2 py-1 rounded-full text-xs ${
                                                    correlation.correlation === 'positiva' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {correlation.correlation}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600 mb-2">{correlation.description}</p>
                                            <span className={`text-xs px-2 py-1 rounded ${
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
                        <div className="text-center text-gray-500 py-8">
                            <p>No hay suficientes datos para generar análisis.</p>
                            <p className="text-sm mt-2">Escribe más entradas para obtener insights valiosos.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 