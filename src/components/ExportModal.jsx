import React, { useState } from 'react';

const ExportModal = ({ isOpen, onClose, onExport }) => {
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
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md">
                <h2 className="text-2xl font-bold text-white mb-4">Exportar Entradas</h2>
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <input type="radio" id="all" name="exportType" value="all" checked={exportType === 'all'} onChange={() => setExportType('all')} />
                        <label htmlFor="all" className="text-white">Exportar todo</label>
                    </div>
                    <div className="flex items-center gap-4">
                        <input type="radio" id="range" name="exportType" value="range" checked={exportType === 'range'} onChange={() => setExportType('range')} />
                        <label htmlFor="range" className="text-white">Seleccionar período</label>
                    </div>
                    {exportType === 'range' && (
                        <div className="pl-8 flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <label htmlFor="start-date-export" className="block text-sm font-medium text-gray-300 mb-1">Desde</label>
                                <input type="date" id="start-date-export" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-gray-600 text-white rounded-md p-2 border border-gray-500" />
                            </div>
                            <div className="flex-1">
                                <label htmlFor="end-date-export" className="block text-sm font-medium text-gray-300 mb-1">Hasta</label>
                                <input type="date" id="end-date-export" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-gray-600 text-white rounded-md p-2 border border-gray-500" />
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex justify-end space-x-3 pt-6 mt-4 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg">Cancelar</button>
                    <button 
                        type="button" 
                        onClick={handleExportClick} 
                        disabled={isExporting}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 font-bold rounded-lg disabled:bg-gray-500 disabled:cursor-wait"
                    >
                        {isExporting ? 'Exportando...' : 'Descargar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportModal; 