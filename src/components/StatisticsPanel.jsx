import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, documentId, getDocs } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const StatisticsPanel = ({ db, userId, appId, activities, subscription, onUpgradeClick }) => {
    const [rawEntries, setRawEntries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedActivityId, setSelectedActivityId] = useState(null);
    const [selectedRange, setSelectedRange] = useState('this_week');

    const dateRanges = useMemo(() => {
        const getFormattedDate = (date) => date.toISOString().split('T')[0];
        const today = new Date();
        const ranges = {
            this_week: {
                name: 'Esta semana',
                startDate: (() => {
                    const d = new Date(today);
                    const day = d.getDay();
                    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                    return getFormattedDate(new Date(d.setDate(diff)));
                })(),
                endDate: getFormattedDate(today)
            },
            this_month: {
                name: 'Este mes',
                startDate: getFormattedDate(new Date(today.getFullYear(), today.getMonth(), 1)),
                endDate: getFormattedDate(today)
            },
            this_year: {
                name: 'Este año',
                startDate: getFormattedDate(new Date(today.getFullYear(), 0, 1)),
                endDate: getFormattedDate(today)
            },
            last_year: {
                name: 'Año anterior',
                startDate: getFormattedDate(new Date(today.getFullYear() - 1, 0, 1)),
                endDate: getFormattedDate(new Date(today.getFullYear() - 1, 11, 31))
            },
            since_last_year: {
                name: 'Desde el año pasado',
                startDate: getFormattedDate(new Date(today.getFullYear() - 1, 0, 1)),
                endDate: getFormattedDate(today)
            }
        };
        return ranges;
    }, []);

    const { startDate, endDate } = dateRanges[selectedRange];

    useEffect(() => {
        const fetchEntries = async () => {
            if (!db || !userId || !startDate || !endDate) return;
            setIsLoading(true);
            setError(null);
            try {
                const entriesRef = collection(db, 'artifacts', appId, 'users', userId, 'entries');
                const entriesQuery = query(entriesRef, where(documentId(), '>=', startDate), where(documentId(), '<=', endDate));
                const querySnapshot = await getDocs(entriesQuery);
                const entries = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setRawEntries(entries);
            } catch (err) {
                console.error("Error fetching statistics:", err);
                setError("No se pudieron cargar las estadísticas.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchEntries();
    }, [db, userId, appId, startDate, endDate]);

    const handleBarClick = (data) => {
        // Verificar si el usuario es premium
        if (subscription?.plan !== 'premium') {
            // Mostrar modal de características premium
            if (onUpgradeClick) {
                onUpgradeClick();
            }
            return;
        }
        
        let activityId = null;
        if (data && data.activeLabel) {
            activityId = Object.keys(activities).find(id => activities[id]?.name === data.activeLabel);
        } else if (data && data.activePayload && data.activePayload[0]) {
            activityId = data.activePayload[0].payload.id;
        }
        if (activityId && activities[activityId]) {
            setSelectedActivityId(activityId);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-400">Cargando estadísticas...</div>;
    if (error) return <div className="p-8 text-center text-red-400">{error}</div>;

    if (selectedActivityId) {
        return <ActivityDetailView activity={activities[selectedActivityId]} entries={rawEntries} onBack={() => setSelectedActivityId(null)} />;
    }

    return <StatisticsOverview rawEntries={rawEntries} activities={activities} onBarClick={handleBarClick} dateRanges={dateRanges} selectedRange={selectedRange} onRangeChange={setSelectedRange} subscription={subscription} onUpgradeClick={onUpgradeClick} />;
};

// --- StatisticsOverview ---
const StatisticsOverview = ({ rawEntries, activities, onBarClick, dateRanges, selectedRange, onRangeChange, subscription, onUpgradeClick }) => {
    const [chartType, setChartType] = useState('bars');
    const [showGoals, setShowGoals] = useState(true);

    const overviewData = useMemo(() => {
        const activityStats = {};
        rawEntries.forEach(entry => {
            if (entry.tracked) {
                Object.entries(entry.tracked).forEach(([activityId, option]) => {
                    if (!activityStats[activityId]) {
                        activityStats[activityId] = {
                            id: activityId,
                            name: activities[activityId]?.name || 'Actividad Desconocida',
                            totalPoints: 0,
                            daysCount: 0,
                            goal: activities[activityId]?.goal
                        };
                    }
                    const points = activities[activityId]?.points?.[option] || 0;
                    activityStats[activityId].totalPoints += points;
                    activityStats[activityId].daysCount += 1;
                });
            }
        });
        Object.values(activityStats).forEach(activity => {
            if (activity.goal) {
                const goalTarget = activity.goal.target;
                activity.completionPercentage = Math.round((activity.totalPoints / goalTarget) * 100);
                activity.isGoalMet = activity.totalPoints >= goalTarget;
            }
        });
        return Object.values(activityStats)
            .sort((a, b) => b.totalPoints - a.totalPoints);
    }, [rawEntries, activities]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
                    <p className="text-white font-semibold">{data.name}</p>
                    <p className="text-gray-300">Puntos totales: <span className="text-green-400 font-bold">{data.totalPoints}</span></p>
                    <p className="text-gray-300">Días registrados: <span className="text-blue-400">{data.daysCount}</span></p>
                    {data.goal && (
                        <div className="mt-2 pt-2 border-t border-gray-600">
                            <p className="text-yellow-300">Meta: {data.goal.target} puntos</p>
                            <p className={`font-bold ${data.isGoalMet ? 'text-green-400' : 'text-red-400'}`}>{data.completionPercentage}% cumplido{data.isGoalMet ? ' ✅' : ' ❌'}</p>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                    <h3 className="text-xl font-semibold text-white">Desempeño de Actividades</h3>
                    <div className="flex items-center gap-4">
                        <select
                            value={selectedRange}
                            onChange={(e) => onRangeChange(e.target.value)}
                            className="bg-gray-700 text-white rounded-md p-2 border border-gray-600"
                        >
                            {Object.entries(dateRanges).map(([key, value]) => (
                                <option key={key} value={key}>{value.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                {overviewData.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {overviewData.map(activity => (
                            <div 
                                key={activity.id} 
                                className="bg-gray-700 p-4 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
                                onClick={() => {
                                    if (subscription?.plan !== 'premium') {
                                        if (onUpgradeClick) {
                                            onUpgradeClick();
                                        }
                                    } else {
                                        onBarClick({ activePayload: [{ payload: activity }] });
                                    }
                                }}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-white font-medium text-lg">{activity.name}</span>
                                    {activity.goal && (
                                        <span className={`text-sm font-bold ${activity.isGoalMet ? 'text-green-400' : 'text-red-400'}`}>{activity.isGoalMet ? '✅' : '❌'}</span>
                                    )}
                                </div>
                                <div className="text-sm text-gray-300 space-y-2">
                                    <div className="flex justify-between">
                                        <span>Puntos:</span>
                                        <span className="text-green-400 font-bold">{activity.totalPoints}</span>
                                    </div>
                                    {activity.goal && (
                                        <>
                                            <div className="flex justify-between">
                                                <span>Meta:</span>
                                                <span className="text-yellow-400">{activity.goal.target}</span>
                                            </div>
                                            <div className="mt-2">
                                                <div className="w-full bg-gray-600 rounded-full h-2">
                                                    <div 
                                                        className={`h-2 rounded-full ${activity.isGoalMet ? 'bg-green-500' : 'bg-red-500'}`}
                                                        style={{ width: `${Math.min(activity.completionPercentage, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs">{activity.completionPercentage}%</span>
                                            </div>
                                        </>
                                    )}
                                    <div className="text-xs text-gray-400 mt-2">
                                        {subscription?.plan === 'premium' ? 'Haz clic para ver detalles' : '💎 Haz clic para ver detalles (Premium)'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-400 italic">No hay datos para el rango de fechas seleccionado.</p>
                )}
            </div>
        </div>
    );
};

// --- ActivityDetailView ---
const ActivityDetailView = ({ activity, entries, onBack }) => {
    const [timeGroup, setTimeGroup] = useState('weekly');
    const [selectedPeriod, setSelectedPeriod] = useState(null);

    const processedData = useMemo(() => {
        if (!activity || !entries) return [];
        const getWeek = (d) => {
            const date = new Date(d.getTime());
            date.setHours(0, 0, 0, 0);
            date.setDate(date.getDate() + 4 - (date.getDay() || 7));
            const yearStart = new Date(date.getFullYear(), 0, 1);
            const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
            return `${date.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
        };
        const getMonth = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const relevantEntries = entries.filter(e => e.tracked && e.tracked[activity.id]);
        const groupedData = relevantEntries.reduce((acc, entry) => {
            const date = new Date(`${entry.id}T00:00:00`);
            const key = timeGroup === 'weekly' ? getWeek(date) : getMonth(date);
            const option = entry.tracked[activity.id] || 'N/A';
            const points = activity.points?.[option] || 0;
            if (!acc[key]) {
                acc[key] = { 
                    timePeriod: key, 
                    totalPoints: 0,
                    daysCount: 0,
                    activities: []
                };
            }
            acc[key].totalPoints += points;
            acc[key].daysCount += 1;
            acc[key].activities.push({
                date: entry.id,
                option: option,
                points: points
            });
            return acc;
        }, {});
        return Object.values(groupedData).sort((a,b) => a.timePeriod.localeCompare(b.timePeriod));
    }, [activity, entries, timeGroup]);

    const calculateGoalForPeriod = useMemo(() => {
        if (!activity.goal || processedData.length === 0) return null;
        const { type, target } = activity.goal;
        if (type === 'weekly') {
            const weeksCount = processedData.length;
            return target * weeksCount;
        } else if (type === 'monthly') {
            const monthsCount = processedData.length;
            return target * monthsCount;
        } else if (type === 'custom') {
            return target;
        }
        return null;
    }, [activity.goal, processedData]);

    const totalPoints = processedData.reduce((sum, period) => sum + period.totalPoints, 0);
    const goalMet = calculateGoalForPeriod ? totalPoints >= calculateGoalForPeriod : false;
    const completionPercentage = calculateGoalForPeriod ? Math.round((totalPoints / calculateGoalForPeriod) * 100) : 0;

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
                    <p className="text-white font-semibold">{data.timePeriod}</p>
                    <p className="text-gray-300">Puntos: <span className="text-green-400 font-bold">{data.totalPoints}</span></p>
                    <p className="text-gray-300">Días: <span className="text-blue-400">{data.daysCount}</span></p>
                    <p className="text-gray-300">Actividades: <span className="text-purple-400">{data.activities.length}</span></p>
                </div>
            );
        }
        return null;
    };

    const handlePeriodClick = (data) => {
        let period = null;
        if (data && data.activePayload && data.activePayload[0]) {
            period = data.activePayload[0].payload;
        } else if (data && data.activeLabel) {
            period = processedData.find(p => p.timePeriod === data.activeLabel);
        }
        if (period) {
            setSelectedPeriod(period);
        }
    };

    if (selectedPeriod) {
        return (
            <ActivityPeriodDetail 
                period={selectedPeriod} 
                activity={activity}
                onBack={() => setSelectedPeriod(null)}
            />
        );
    }
    return (
        <div className="p-4 md:p-6">
            <button onClick={onBack} className="text-indigo-400 hover:text-indigo-300 mb-4 inline-flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Volver a todas las actividades
            </button>
            <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                    <h3 className="text-xl font-semibold text-white">Análisis de: {activity.name}</h3>
                    <div className="flex items-center gap-2 bg-gray-700/50 p-1 rounded-lg">
                        <button onClick={() => setTimeGroup('weekly')} className={`px-3 py-1 text-sm font-medium rounded-md ${timeGroup === 'weekly' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Semanal</button>
                        <button onClick={() => setTimeGroup('monthly')} className={`px-3 py-1 text-sm font-medium rounded-md ${timeGroup === 'monthly' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Mensual</button>
                    </div>
                </div>
                <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-400">{totalPoints}</div>
                            <div className="text-sm text-gray-300">Puntos Totales</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-400">{processedData.length}</div>
                            <div className="text-sm text-gray-300">{timeGroup === 'weekly' ? 'Semanas' : 'Meses'}</div>
                        </div>
                        {calculateGoalForPeriod && (
                            <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-400">{calculateGoalForPeriod}</div>
                                <div className="text-sm text-gray-300">Meta del Periodo</div>
                                <div className={`text-sm font-bold ${goalMet ? 'text-green-400' : 'text-red-400'}`}>{completionPercentage}% {goalMet ? '✅' : '❌'}</div>
                            </div>
                        )}
                    </div>
                </div>
                {processedData.length > 0 ? (
                    <div>
                        <div style={{ width: '100%', height: 400 }}>
                            <ResponsiveContainer>
                                <BarChart data={processedData} margin={{top: 20, right: 30, left: 20, bottom: 5}} onClick={handlePeriodClick}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#4A5568"/>
                                    <XAxis dataKey="timePeriod" stroke="#A0AEC0" tick={{fontSize: 12}}/>
                                    <YAxis stroke="#A0AEC0" allowDecimals={false}/>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ color: '#E2E8F0' }} />
                                    <Bar 
                                        dataKey="totalPoints" 
                                        name="Puntos Totales" 
                                        fill="#667EEA" 
                                        cursor="pointer"
                                        radius={[4, 4, 0, 0]}
                                    />
                                    {calculateGoalForPeriod && (
                                        <ReferenceLine 
                                            y={calculateGoalForPeriod} 
                                            stroke="#FFD700" 
                                            strokeDasharray="3 3" 
                                            strokeWidth={2}
                                            label={{ value: 'Meta', position: 'insideTopRight', fill: '#FFD700' }}
                                        />
                                    )}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                ) : (
                    <p className="text-center text-gray-400 italic">No hay datos de esta actividad para el rango y período seleccionados.</p>
                )}
            </div>
        </div>
    );
};

// --- ActivityPeriodDetail ---
const ActivityPeriodDetail = ({ period, activity, onBack }) => {
    const totalPoints = period.activities.reduce((sum, act) => sum + act.points, 0);
    return (
        <div className="p-4 md:p-6">
            <button onClick={onBack} className="text-indigo-400 hover:text-indigo-300 mb-4 inline-flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Volver al análisis de {activity.name}
            </button>
            <div className="bg-gray-800 rounded-lg p-6">
                <div className="mb-6">
                    <h3 className="text-xl font-semibold text-white mb-2">Detalle del Periodo: {period.timePeriod}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-gray-700 rounded-lg">
                            <div className="text-2xl font-bold text-green-400">{totalPoints}</div>
                            <div className="text-sm text-gray-300">Puntos Totales</div>
                        </div>
                        <div className="text-center p-3 bg-gray-700 rounded-lg">
                            <div className="text-2xl font-bold text-blue-400">{period.daysCount}</div>
                            <div className="text-sm text-gray-300">Días Registrados</div>
                        </div>
                        <div className="text-center p-3 bg-gray-700 rounded-lg">
                            <div className="text-2xl font-bold text-purple-400">{period.activities.length}</div>
                            <div className="text-sm text-gray-300">Actividades</div>
                        </div>
                    </div>
                </div>
                <div>
                    <h4 className="text-lg font-semibold text-white mb-4">Actividades del Periodo</h4>
                    <div className="space-y-3">
                        {[...period.activities].sort((a, b) => a.date.localeCompare(b.date)).map((act, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className="text-sm text-gray-400 w-20">{act.date}</div>
                                    <div className="text-white font-medium">{act.option}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-green-400 font-bold">{act.points} pts</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatisticsPanel; 