import React, { useState, useRef } from 'react';

export default function ImportModal({ isOpen, onClose, onImportEntries, user, db, appId }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [fileInfo, setFileInfo] = useState(null);
    const [detectionResult, setDetectionResult] = useState(null);
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

    // Procesar archivo
    const processFile = async (file) => {
        setIsProcessing(true);
        setFileInfo(null);
        setDetectionResult(null);

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

        } catch (error) {
            console.error('Error procesando archivo:', error);
            alert('Error al procesar el archivo: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // Importar entradas
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
                        const success = await onImportEntries(parsedDate, title, content, activities);
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
                    const success = await onImportEntries(entry.date, entry.title, entry.content, '');
                    if (success) {
                        importedCount++;
                    } else {
                        skippedCount++;
                    }
                }
            }

            alert(`Importación completada:\n✅ ${importedCount} entradas importadas\n⏭️ ${skippedCount} entradas omitidas`);
            onClose();

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Importar Entradas</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Instrucciones */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">📋 Instrucciones:</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
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
                        dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
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
                            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <p className="text-lg text-gray-600 mb-2">
                                Arrastra tu archivo aquí o
                            </p>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                                selecciona un archivo
                            </button>
                            <p className="text-sm text-gray-500 mt-2">
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
                            <p className="text-lg font-medium text-gray-900 mb-2">
                                {fileInfo.name}
                            </p>
                            <p className="text-sm text-gray-600">
                                {(fileInfo.size / 1024).toFixed(1)} KB
                            </p>
                        </div>
                    )}
                </div>

                {/* Resultados de detección */}
                {detectionResult && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold text-gray-900 mb-3">🔍 Análisis del Archivo:</h3>
                        <div className="space-y-2 text-sm">
                            <p><strong>Tipo:</strong> {detectionResult.type.toUpperCase()}</p>
                            <p><strong>Formato de fecha:</strong> {detectionResult.dateFormat || 'No detectado'}</p>
                            <p><strong>Entradas encontradas:</strong> {detectionResult.totalLines}</p>
                            
                            {detectionResult.type === 'csv' && (
                                <div>
                                    <p><strong>Separador:</strong> {detectionResult.separator}</p>
                                    <p><strong>Columnas detectadas:</strong></p>
                                    <ul className="ml-4 space-y-1">
                                        {Object.entries(detectionResult.columnMapping).map(([key, index]) => (
                                            <li key={key}>
                                                • {key}: {index !== null ? detectionResult.headers[index] : 'No detectado'}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Botones de acción */}
                <div className="flex justify-end space-x-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                        disabled={isProcessing}
                    >
                        Cancelar
                    </button>
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
                            'Importar Entradas'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
} 