import React, { useState, useRef, useEffect } from 'react';

export default function ImportModal({ isOpen, onClose, onImportEntries, user, db, appId, currentTheme = 'dark' }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [fileInfo, setFileInfo] = useState(null);
    const [detectionResult, setDetectionResult] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [conflictMode, setConflictMode] = useState('overwrite'); // 'overwrite', 'skip', 'create_new'
    const [selectedEntries, setSelectedEntries] = useState([]);
    const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
    const [showPreview, setShowPreview] = useState(false);
    const fileInputRef = useRef(null);

    // Detección de formatos de fecha
    const detectDateFormat = (dateString) => {
        const patterns = [
            { regex: /^\d{4}-\d{2}-\d{2}$/, format: 'YYYY-MM-DD' },
            { regex: /^\d{2}\/\d{2}\/\d{4}$/, format: 'DD/MM/YYYY' },
            { regex: /^\d{2}-\d{2}-\d{4}$/, format: 'DD-MM-YYYY' },
            { regex: /^\d{4}\/\d{2}\/\d{2}$/, format: 'YYYY/MM/DD' },
            { regex: /^\d{1,2}\/\d{1,2}\/\d{4}$/, format: 'MM/DD/YYYY' }
        ];

        for (const pattern of patterns) {
            if (pattern.regex.test(dateString)) {
                return pattern.format;
            }
        }
        return null;
    };

    // Parsear fecha según formato
    const parseDate = (dateString, format) => {
        try {
            let year, month, day;
            
            switch (format) {
                case 'YYYY-MM-DD':
                    [year, month, day] = dateString.split('-');
                    break;
                case 'DD/MM/YYYY':
                    [day, month, year] = dateString.split('/');
                    break;
                case 'DD-MM-YYYY':
                    [day, month, year] = dateString.split('-');
                    break;
                case 'YYYY/MM/DD':
                    [year, month, day] = dateString.split('/');
                    break;
                case 'MM/DD/YYYY':
                    [month, day, year] = dateString.split('/');
                    break;
                default:
                    return null;
            }

            const date = new Date(year, month - 1, day);
            return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
        } catch (error) {
            return null;
        }
    };

    // Detectar tipo de archivo y estructura
    const detectFileStructure = (content) => {
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length === 0) return null;

        // Detectar si es CSV
        const firstLine = lines[0];
        const hasCommas = firstLine.includes(',');
        const hasQuotes = firstLine.includes('"');
        
        if (hasCommas || hasQuotes) {
            return detectCSVStructure(lines);
        } else {
            return detectTXTStructure(lines);
        }
    };

    // Detectar estructura CSV
    const detectCSVStructure = (lines) => {
        const firstLine = lines[0];
        const headers = firstLine.split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
        
        // Mapeo inteligente de columnas
        const columnMapping = {
            date: null,
            title: null,
            content: null,
            activities: null
        };

        headers.forEach((header, index) => {
            if (['fecha', 'date', 'dia', 'fecha_entrada'].includes(header)) {
                columnMapping.date = index;
            } else if (['titulo', 'title', 'encabezado', 'asunto'].includes(header)) {
                columnMapping.title = index;
            } else if (['contenido', 'content', 'texto', 'entrada', 'body'].includes(header)) {
                columnMapping.content = index;
            } else if (['actividades', 'activities', 'habitos', 'tracked'].includes(header)) {
                columnMapping.activities = index;
            }
        });

        // Detectar formato de fecha
        let dateFormat = null;
        if (columnMapping.date !== null && lines.length > 1) {
            const secondLine = lines[1];
            const dateValue = secondLine.split(',')[columnMapping.date]?.trim().replace(/"/g, '');
            if (dateValue) {
                dateFormat = detectDateFormat(dateValue);
            }
        }

        return {
            type: 'csv',
            headers,
            columnMapping,
            dateFormat,
            separator: ',',
            totalLines: lines.length - 1 // Excluir header
        };
    };

    // Detectar estructura TXT
    const detectTXTStructure = (lines) => {
        let dateFormat = null;
        let entries = [];
        let currentEntry = null;
        let inEntry = false;

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            // Detectar formato personalizado con ##### DATE: YYYY-MM-DD ##########
            const dateMatch = trimmedLine.match(/^#####\s*DATE:\s*(\d{4}-\d{2}-\d{2})\s*##########$/);
            if (dateMatch) {
                if (currentEntry) {
                    entries.push(currentEntry);
                }
                const dateStr = dateMatch[1];
                currentEntry = {
                    date: parseDate(dateStr, 'YYYY-MM-DD'),
                    title: '',
                    content: '',
                    activities: {}
                };
                dateFormat = 'YYYY-MM-DD';
                inEntry = true;
                continue;
            }

            // Detectar fin de entrada con ##### END #######################
            if (trimmedLine.match(/^#####\s*END\s*#######################$/)) {
                if (currentEntry) {
                    entries.push(currentEntry);
                    currentEntry = null;
                }
                inEntry = false;
                continue;
            }

            // Si estamos dentro de una entrada y no es una línea de separación
            if (inEntry && currentEntry && !trimmedLine.match(/^-+$/)) {
                if (!currentEntry.title) {
                    currentEntry.title = trimmedLine;
                } else {
                    currentEntry.content += (currentEntry.content ? '\n' : '') + trimmedLine;
                }
            }

            // Detectar formato simple de fecha (fallback)
            if (!inEntry) {
                const detectedFormat = detectDateFormat(trimmedLine);
                if (detectedFormat) {
                    if (currentEntry) {
                        entries.push(currentEntry);
                    }
                    currentEntry = {
                        date: parseDate(trimmedLine, detectedFormat),
                        title: '',
                        content: '',
                        activities: {}
                    };
                    dateFormat = detectedFormat;
                } else if (currentEntry) {
                    if (!currentEntry.title) {
                        currentEntry.title = trimmedLine;
                    } else {
                        currentEntry.content += (currentEntry.content ? '\n' : '') + trimmedLine;
                    }
                }
            }
        }

        if (currentEntry) {
            entries.push(currentEntry);
        }

        return {
            type: 'txt',
            dateFormat,
            entries: entries.filter(entry => entry.date),
            totalLines: entries.length
        };
    };

    // Validar fecha
    const isValidDate = (dateString) => {
        const date = new Date(dateString);
        return !isNaN(date.getTime()) && dateString.length === 10;
    };

    // Generar datos de previsualización
    const generatePreviewData = async (structure) => {
        if (!structure) return null;

        let entries = [];
        
        if (structure.type === 'csv') {
            // Procesar CSV para previsualización
            const content = await fileInputRef.current.files[0].text();
            const lines = content.split('\n').filter(line => line.trim());
            
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
                
                const date = values[structure.columnMapping.date];
                const title = values[structure.columnMapping.title] || '';
                const content = values[structure.columnMapping.content] || '';
                const activities = values[structure.columnMapping.activities] || '';

                const parsedDate = parseDate(date, structure.dateFormat);
                if (parsedDate) {
                    entries.push({
                        id: i,
                        date: parsedDate,
                        title: title || 'Sin título',
                        content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
                        fullContent: content,
                        activities: activities,
                        isValid: isValidDate(parsedDate),
                        hasConflict: false // Se verificará después
                    });
                }
            }
        } else {
            // Procesar TXT para previsualización
            entries = structure.entries.map((entry, index) => ({
                id: index,
                date: entry.date,
                title: entry.title || 'Sin título',
                content: entry.content.substring(0, 100) + (entry.content.length > 100 ? '...' : ''),
                fullContent: entry.content,
                activities: '',
                isValid: isValidDate(entry.date),
                hasConflict: false // Se verificará después
            }));
        }

        return {
            entries: entries,
            total: entries.length,
            valid: entries.filter(e => e.isValid).length,
            invalid: entries.filter(e => !e.isValid).length
        };
    };

    // Procesar archivo
    const processFile = async (file) => {
        setIsProcessing(true);
        setFileInfo(null);
        setDetectionResult(null);
        setPreviewData(null);
        setShowPreview(false);
        setSelectedEntries([]);

        try {
            const content = await file.text();
            const structure = detectFileStructure(content);

            if (!structure) {
                throw new Error('No se pudo detectar la estructura del archivo');
            }

            setFileInfo({
                name: file.name,
                size: file.size,
                type: file.type
            });

            setDetectionResult(structure);

            // Generar datos de previsualización
            const preview = await generatePreviewData(structure);
            setPreviewData(preview);

        } catch (error) {
            console.error('Error procesando archivo:', error);
            alert('Error al procesar el archivo: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // Manejar selección de entradas
    const handleSelectEntry = (entryId) => {
        setSelectedEntries(prev => 
            prev.includes(entryId) 
                ? prev.filter(id => id !== entryId)
                : [...prev, entryId]
        );
    };

    const handleSelectAll = () => {
        if (previewData) {
            const validEntries = previewData.entries.filter(e => e.isValid);
            setSelectedEntries(validEntries.map(e => e.id));
        }
    };

    const handleSelectNone = () => {
        setSelectedEntries([]);
    };

    const handleSelectAllVisible = () => {
        const filteredEntries = getFilteredEntries();
        const validFilteredEntries = filteredEntries.filter(e => e.isValid);
        setSelectedEntries(validFilteredEntries.map(e => e.id));
    };

    const handleSelectNoneVisible = () => {
        const filteredEntries = getFilteredEntries();
        const filteredIds = filteredEntries.map(e => e.id);
        setSelectedEntries(prev => prev.filter(id => !filteredIds.includes(id)));
    };

    const isAllVisibleSelected = () => {
        const filteredEntries = getFilteredEntries();
        const validFilteredEntries = filteredEntries.filter(e => e.isValid);
        return validFilteredEntries.length > 0 && 
               validFilteredEntries.every(entry => selectedEntries.includes(entry.id));
    };

    const isSomeVisibleSelected = () => {
        const filteredEntries = getFilteredEntries();
        const validFilteredEntries = filteredEntries.filter(e => e.isValid);
        return validFilteredEntries.some(entry => selectedEntries.includes(entry.id));
    };

    // Resetear estado del modal
    const resetModal = () => {
        setFileInfo(null);
        setDetectionResult(null);
        setPreviewData(null);
        setShowPreview(false);
        setSelectedEntries([]);
        setDateFilter({ start: '', end: '' });
        setConflictMode('overwrite');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Resetear modal cuando se abre
    useEffect(() => {
        if (isOpen) {
            resetModal();
        }
    }, [isOpen]);

    // Filtrar entradas por fecha
    const getFilteredEntries = () => {
        if (!previewData) return [];
        
        return previewData.entries.filter(entry => {
            if (!entry.isValid) return false;
            
            if (dateFilter.start && entry.date < dateFilter.start) return false;
            if (dateFilter.end && entry.date > dateFilter.end) return false;
            
            return true;
        });
    };

    // Importar entradas seleccionadas
    const importSelectedEntries = async () => {
        if (!previewData || selectedEntries.length === 0) return;

        setIsProcessing(true);

        try {
            const content = await fileInputRef.current.files[0].text();
            const lines = content.split('\n').filter(line => line.trim());
            
            let importedCount = 0;
            let skippedCount = 0;

            // Obtener entradas seleccionadas
            const entriesToImport = previewData.entries.filter(entry => 
                selectedEntries.includes(entry.id) && entry.isValid
            );

            for (const entry of entriesToImport) {
                let success = false;
                
                if (detectionResult.type === 'csv') {
                    // Para CSV, usar los datos de previsualización
                    success = await onImportEntries(entry.date, entry.title, entry.fullContent, entry.activities, conflictMode);
                } else {
                    // Para TXT, usar los datos de previsualización
                    success = await onImportEntries(entry.date, entry.title, entry.fullContent, '', conflictMode);
                }

                if (success) {
                    importedCount++;
                } else {
                    skippedCount++;
                }
            }

            alert(`Importación completada:\n✅ ${importedCount} entradas importadas\n⏭️ ${skippedCount} entradas omitidas`);
            // No cerrar el modal, solo resetear la selección
            setSelectedEntries([]);

        } catch (error) {
            console.error('Error importando entradas:', error);
            alert('Error durante la importación: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // Importar entradas (función original para compatibilidad)
    const importEntries = async () => {
        if (!detectionResult || !fileInfo) return;

        setIsProcessing(true);

        try {
            const content = await fileInputRef.current.files[0].text();
            const lines = content.split('\n').filter(line => line.trim());
            
            let importedCount = 0;
            let skippedCount = 0;

            if (detectionResult.type === 'csv') {
                // Procesar CSV
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i];
                    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
                    
                    const date = values[detectionResult.columnMapping.date];
                    const title = values[detectionResult.columnMapping.title] || '';
                    const content = values[detectionResult.columnMapping.content] || '';
                    const activities = values[detectionResult.columnMapping.activities] || '';

                    const parsedDate = parseDate(date, detectionResult.dateFormat);
                    if (parsedDate) {
                        const success = await onImportEntries(parsedDate, title, content, activities, conflictMode);
                        if (success) {
                            importedCount++;
                        } else {
                            skippedCount++;
                        }
                    }
                }
            } else {
                // Procesar TXT
                for (const entry of detectionResult.entries) {
                    const success = await onImportEntries(entry.date, entry.title, entry.content, '', conflictMode);
                    if (success) {
                        importedCount++;
                    } else {
                        skippedCount++;
                    }
                }
            }

            alert(`Importación completada:\n✅ ${importedCount} entradas importadas\n⏭️ ${skippedCount} entradas omitidas`);
            // No cerrar el modal, solo resetear la selección
            setSelectedEntries([]);

        } catch (error) {
            console.error('Error importando entradas:', error);
            alert('Error durante la importación: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // Event handlers
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type === 'text/plain' || file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
                processFile(file);
            } else {
                alert('Por favor, selecciona un archivo TXT o CSV');
            }
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            processFile(file);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 ${currentTheme === 'dark' ? 'bg-black bg-opacity-50' : 'bg-black bg-opacity-50'} flex items-center justify-center z-50`}>
            <div className={`${currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto`}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className={`text-2xl font-bold ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Importar Entradas</h2>
                    <button
                        onClick={onClose}
                        className={`${currentTheme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Instrucciones */}
                <div className={`mb-6 p-4 ${currentTheme === 'dark' ? 'bg-blue-900 bg-opacity-20' : 'bg-blue-50'} rounded-lg`}>
                    <h3 className={`font-semibold ${currentTheme === 'dark' ? 'text-blue-200' : 'text-blue-900'} mb-2`}>📋 Instrucciones:</h3>
                    <ul className={`text-sm ${currentTheme === 'dark' ? 'text-blue-100' : 'text-blue-800'} space-y-1`}>
                        <li>• <strong>TXT Simple:</strong> Una fecha por línea, seguida del contenido</li>
                        <li>• <strong>TXT Estructurado:</strong> ##### DATE: YYYY-MM-DD ########## seguido del contenido y ##### END #######################</li>
                        <li>• <strong>CSV:</strong> Columnas: fecha, título, contenido, actividades</li>
                        <li>• <strong>Formatos de fecha:</strong> YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY</li>
                        <li>• <strong>⚠️ Advertencia:</strong> Las entradas existentes serán sobrescritas</li>
                    </ul>
                </div>

                {/* Área de drag & drop */}
                <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        dragActive 
                            ? `${currentTheme === 'dark' ? 'border-blue-400 bg-blue-900 bg-opacity-20' : 'border-blue-500 bg-blue-50'}` 
                            : `${currentTheme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.csv"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    
                    {!fileInfo ? (
                        <div>
                            <svg className={`mx-auto h-12 w-12 ${currentTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'} mb-4`} stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <p className={`text-lg ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                                Arrastra tu archivo aquí o
                            </p>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                                selecciona un archivo
                            </button>
                            <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-2`}>
                                Soporta archivos TXT y CSV
                            </p>
                        </div>
                    ) : (
                        <div>
                            <div className="text-green-600 mb-4">
                                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className={`text-lg font-medium ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
                                {fileInfo.name}
                            </p>
                            <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                {(fileInfo.size / 1024).toFixed(1)} KB
                            </p>
                        </div>
                    )}
                </div>

                {/* Resultados de detección */}
                                            {detectionResult && (
                                <div className={`mt-4 p-3 ${currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                                    <h3 className={`font-semibold ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'} text-sm mb-3`}>🔍 Análisis del Archivo</h3>
                                    {previewData && (
                                        <button
                                            onClick={() => setShowPreview(!showPreview)}
                                            className="w-full mb-3 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            {showPreview ? 'Ocultar' : 'Mostrar'} Previsualización
                                        </button>
                                    )}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className={currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}><strong>Tipo:</strong> {detectionResult.type.toUpperCase()}</div>
                            <div className={currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}><strong>Formato:</strong> {detectionResult.dateFormat || 'No detectado'}</div>
                            <div className={currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}><strong>Entradas:</strong> {detectionResult.totalLines}</div>
                            
                            {detectionResult.type === 'csv' && (
                                <div className={currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}><strong>Separador:</strong> {detectionResult.separator}</div>
                            )}
                        </div>
                        
                        {detectionResult.type === 'csv' && (
                            <div className={`mt-2 pt-2 border-t ${currentTheme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                                <div className={`text-xs ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}><strong>Columnas:</strong></div>
                                <div className={`grid grid-cols-2 gap-1 text-xs ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {Object.entries(detectionResult.columnMapping).map(([key, index]) => (
                                        <div key={key}>
                                            • {key}: {index !== null ? detectionResult.headers[index] : 'No detectado'}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Previsualización de entradas */}
                {showPreview && previewData && (
                    <div className={`mt-6 p-4 ${currentTheme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border rounded-lg`}>
                        <h3 className={`font-semibold ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>📋 Previsualización de Entradas</h3>
                        
                        {/* Estadísticas */}
                        <div className={`mb-4 p-3 ${currentTheme === 'dark' ? 'bg-blue-900 bg-opacity-20' : 'bg-blue-50'} rounded-lg`}>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div className="text-center">
                                    <div className="font-bold text-blue-600">{previewData.total}</div>
                                    <div className={currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Total</div>
                                </div>
                                <div className="text-center">
                                    <div className="font-bold text-green-600">{previewData.valid}</div>
                                    <div className={currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Válidas</div>
                                </div>
                                <div className="text-center">
                                    <div className="font-bold text-red-600">{previewData.invalid}</div>
                                    <div className={currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Inválidas</div>
                                </div>
                            </div>
                        </div>

                        {/* Filtros */}
                        <div className={`mb-4 p-3 ${currentTheme === 'dark' ? 'bg-gray-600' : 'bg-gray-50'} rounded-lg`}>
                            <h4 className={`font-medium ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Filtros</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-sm font-medium ${currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'} mb-1`}>Desde:</label>
                                    <input
                                        type="date"
                                        value={dateFilter.start}
                                        onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                                        className={`w-full px-3 py-2 border rounded-md text-sm ${currentTheme === 'dark' ? 'border-gray-500 text-white bg-gray-700' : 'border-gray-300 text-gray-900 bg-white'}`}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium ${currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'} mb-1`}>Hasta:</label>
                                    <input
                                        type="date"
                                        value={dateFilter.end}
                                        onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                                        className={`w-full px-3 py-2 border rounded-md text-sm ${currentTheme === 'dark' ? 'border-gray-500 text-white bg-gray-700' : 'border-gray-300 text-gray-900 bg-white'}`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Opciones de conflicto */}
                        <div className={`mb-4 p-3 ${currentTheme === 'dark' ? 'bg-yellow-900 bg-opacity-20' : 'bg-yellow-50'} rounded-lg`}>
                            <h4 className={`font-medium ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Modo de Conflicto</h4>
                            <div className="space-y-2">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        value="overwrite"
                                        checked={conflictMode === 'overwrite'}
                                        onChange={(e) => setConflictMode(e.target.value)}
                                        className="mr-2"
                                    />
                                    <span className={`text-sm ${currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'} font-medium`}>Sobrescribir entradas existentes</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        value="skip"
                                        checked={conflictMode === 'skip'}
                                        onChange={(e) => setConflictMode(e.target.value)}
                                        className="mr-2"
                                    />
                                    <span className={`text-sm ${currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'} font-medium`}>Saltar entradas existentes</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        value="create_new"
                                        checked={conflictMode === 'create_new'}
                                        onChange={(e) => setConflictMode(e.target.value)}
                                        className="mr-2"
                                    />
                                    <span className={`text-sm ${currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'} font-medium`}>Crear nueva versión (agregar sufijo)</span>
                                </label>
                            </div>
                        </div>

                        {/* Contador de selección */}
                        <div className="mb-4 flex justify-end">
                            <span className={`text-sm ${currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'} font-medium`}>
                                {selectedEntries.length} de {getFilteredEntries().length} seleccionadas
                            </span>
                        </div>

                        {/* Tabla de entradas */}
                        <div className="max-h-96 overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className={`${currentTheme === 'dark' ? 'bg-gray-600' : 'bg-gray-50'} sticky top-0`}>
                                    <tr>
                                        <th className={`px-2 py-2 text-left font-semibold ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            <input
                                                type="checkbox"
                                                checked={isAllVisibleSelected()}
                                                ref={(input) => {
                                                    if (input) {
                                                        input.indeterminate = isSomeVisibleSelected() && !isAllVisibleSelected();
                                                    }
                                                }}
                                                onChange={() => {
                                                    if (isAllVisibleSelected()) {
                                                        handleSelectNoneVisible();
                                                    } else {
                                                        handleSelectAllVisible();
                                                    }
                                                }}
                                                className="mr-2"
                                                title="Seleccionar todas las entradas visibles"
                                            />
                                        </th>
                                        <th className={`px-2 py-2 text-left font-semibold ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Fecha</th>
                                        <th className={`px-2 py-2 text-left font-semibold ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Título</th>
                                        <th className={`px-2 py-2 text-left font-semibold ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Contenido</th>
                                        <th className={`px-2 py-2 text-left font-semibold ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {getFilteredEntries().map((entry) => (
                                        <tr key={entry.id} className={`border-b ${currentTheme === 'dark' ? 'border-gray-600 hover:bg-gray-600' : 'border-gray-100 hover:bg-gray-50'}`}>
                                            <td className="px-2 py-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedEntries.includes(entry.id)}
                                                    onChange={() => handleSelectEntry(entry.id)}
                                                    disabled={!entry.isValid}
                                                    className="mr-2"
                                                />
                                            </td>
                                            <td className={`px-2 py-2 font-mono text-xs font-semibold ${currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                                                {entry.date}
                                            </td>
                                            <td className={`px-2 py-2 max-w-32 truncate font-medium ${currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`} title={entry.title}>
                                                {entry.title}
                                            </td>
                                            <td className={`px-2 py-2 max-w-48 truncate ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`} title={entry.content}>
                                                {entry.content}
                                            </td>
                                            <td className="px-2 py-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                    entry.isValid 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {entry.isValid ? 'Válida' : 'Inválida'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Botones de acción */}
                <div className="flex justify-end space-x-3 mt-6">
                    {fileInfo && (
                        <button
                            onClick={resetModal}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                                currentTheme === 'dark' 
                                    ? 'text-blue-300 bg-blue-900 hover:bg-blue-800' 
                                    : 'text-blue-700 bg-blue-100 hover:bg-blue-200'
                            }`}
                            disabled={isProcessing}
                            title="Cargar un archivo diferente"
                        >
                            Nuevo Archivo
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            currentTheme === 'dark' 
                                ? 'text-gray-200 bg-gray-600 hover:bg-gray-500' 
                                : 'text-gray-700 bg-gray-200 hover:bg-gray-300'
                        }`}
                        disabled={isProcessing}
                    >
                        Cancelar
                    </button>
                    
                    {showPreview && previewData ? (
                        <button
                            onClick={importSelectedEntries}
                            disabled={selectedEntries.length === 0 || isProcessing}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Importando...
                                </span>
                            ) : (
                                `Importar ${selectedEntries.length} Seleccionadas`
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={importEntries}
                            disabled={!detectionResult || isProcessing}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Importando...
                                </span>
                            ) : (
                                'Importar Todas las Entradas'
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
} 