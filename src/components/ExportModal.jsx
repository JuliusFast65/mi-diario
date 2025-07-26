import React, { useState } from 'react';

const ExportModal = ({ isOpen, onClose, onExport, currentTheme = 'dark' }) => {
    if (!isOpen) return null;

    const [exportType, setExportType] = useState('all'); // 'all' or 'range'
    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [isExporting, setIsExporting] = useState(false);

    const handleExportClick = async () => {
        setIsExporting(true);
        if (exportType === 'all') {
            await onExport(null, null);
        } else {
            if (startDate > endDate) {
                alert("La fecha de inicio no puede ser posterior a la fecha de fin.");
                setIsExporting(false);
                return;
            }
            await onExport(startDate, endDate);
        }
        setIsExporting(false);
        onClose();
    };

    return (
        <div className={`fixed inset-0 ${currentTheme === 'dark' ? 'bg-black bg-opacity-75' : 'bg-black bg-opacity-50'} flex items-center justify-center z-50 p-4`}>
            <div className={`${currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl p-6 w-full max-w-md`}>
                <h2 className={`text-2xl font-bold ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>Exportar Entradas</h2>
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <input type="radio" id="all" name="exportType" value="all" checked={exportType === 'all'} onChange={() => setExportType('all')} />
                        <label htmlFor="all" className={currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}>Exportar todo</label>
                    </div>
                    <div className="flex items-center gap-4">
                        <input type="radio" id="range" name="exportType" value="range" checked={exportType === 'range'} onChange={() => setExportType('range')} />
                        <label htmlFor="range" className={currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}>Seleccionar período</label>
                    </div>
                    {exportType === 'range' && (
                        <div className="pl-8 flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <label htmlFor="start-date-export" className={`block text-sm font-medium ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Desde</label>
                                <input 
                                    type="date" 
                                    id="start-date-export" 
                                    value={startDate} 
                                    onChange={(e) => setStartDate(e.target.value)} 
                                    className={`w-full ${currentTheme === 'dark' ? 'bg-gray-600 text-white border-gray-500' : 'bg-white text-gray-900 border-gray-300'} rounded-md p-2 border`} 
                                />
                            </div>
                            <div className="flex-1">
                                <label htmlFor="end-date-export" className={`block text-sm font-medium ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Hasta</label>
                                <input 
                                    type="date" 
                                    id="end-date-export" 
                                    value={endDate} 
                                    onChange={(e) => setEndDate(e.target.value)} 
                                    className={`w-full ${currentTheme === 'dark' ? 'bg-gray-600 text-white border-gray-500' : 'bg-white text-gray-900 border-gray-300'} rounded-md p-2 border`} 
                                />
                            </div>
                        </div>
                    )}
                </div>
                <div className={`flex justify-end space-x-3 pt-6 mt-4 border-t ${currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className={`px-4 py-2 ${currentTheme === 'dark' ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} rounded-lg transition-colors`}
                    >
                        Cancelar
                    </button>
                    <button 
                        type="button" 
                        onClick={handleExportClick} 
                        disabled={isExporting}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 font-bold rounded-lg disabled:bg-gray-500 disabled:cursor-wait text-white"
                    >
                        {isExporting ? 'Exportando...' : 'Descargar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportModal; 