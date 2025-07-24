import React, { useState, useEffect } from 'react';
import { decryptText } from '../utils/crypto';
import DeleteConfirmModal from './DeleteConfirmModal';

const ArchiveView = ({ allEntries, onSelectEntry, onDeleteEntry, user, selectedDate }) => {
    const [deleteModalEntry, setDeleteModalEntry] = useState(null);
    const [decryptedEntries, setDecryptedEntries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [focusAfterDelete, setFocusAfterDelete] = useState(null);
    const [focusOnLoad, setFocusOnLoad] = useState(null);

    useEffect(() => {
        const decryptTitles = async () => {
            setIsLoading(true);
            const decrypted = await Promise.all(
                allEntries.map(async (entry) => {
                    const decryptedTitle = await decryptText(entry.title, user.uid);
                    return { ...entry, title: decryptedTitle || 'Sin Título' };
                })
            );
            decrypted.sort((a, b) => b.id.localeCompare(a.id)); // Sort descending
            setDecryptedEntries(decrypted);
            setIsLoading(false);
        };
        if (allEntries.length > 0) {
            decryptTitles();
        } else {
            setIsLoading(false);
            setDecryptedEntries([]);
        }
    }, [allEntries, user.uid]);

    // Efecto para manejar el foco después de eliminar una entrada
    useEffect(() => {
        if (focusAfterDelete && decryptedEntries.length > 0) {
            console.log('FocusAfterDelete effect triggered:', { focusAfterDelete, entriesCount: decryptedEntries.length });
            
            // Buscar la entrada que debe recibir el foco
            const targetEntry = decryptedEntries.find(entry => entry.id === focusAfterDelete);
            
            if (targetEntry) {
                console.log('Target entry found, focusing:', targetEntry.id);
                // Usar setTimeout para asegurar que el DOM esté listo
                setTimeout(() => {
                    const element = document.querySelector(`[data-entry-id="${targetEntry.id}"]`);
                    if (element) {
                        element.focus();
                        console.log('Element focused successfully');
                    } else {
                        console.log('Element not found in DOM');
                    }
                }, 100);
            } else {
                console.log('Target entry not found in decryptedEntries');
            }
            
            // Limpiar el estado de foco
            setFocusAfterDelete(null);
        }
    }, [focusAfterDelete, decryptedEntries]);

    // Efecto para enfocar la entrada seleccionada cuando se carga la vista
    useEffect(() => {
        // Solo enfocar basado en selectedDate si NO hay un foco pendiente después de eliminar
        if (selectedDate && decryptedEntries.length > 0 && !isLoading && !focusAfterDelete) {
            // Buscar la entrada que coincide con la fecha seleccionada
            const targetEntry = decryptedEntries.find(entry => entry.id === selectedDate);
            
            if (targetEntry) {
                // Usar setTimeout para asegurar que el DOM esté listo
                setTimeout(() => {
                    const element = document.querySelector(`[data-entry-id="${targetEntry.id}"]`);
                    if (element) {
                        element.focus();
                        // Hacer scroll suave hasta el elemento
                        element.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'center' 
                        });
                    }
                }, 100);
            } else {
                // Si la entrada seleccionada no existe en la lista, limpiar el foco
                console.log('Selected entry not found in list, clearing focus');
            }
        }
    }, [selectedDate, decryptedEntries, isLoading, focusAfterDelete]);

    if (isLoading) {
        return <div className="p-8 text-center text-gray-400">Cargando archivo...</div>;
    }

    return (
        <div className="p-2 md:p-6">
            <div className="bg-gray-800 rounded-lg p-4 md:p-6">
                <h3 className="text-xl font-semibold text-white mb-6">Archivo de Entradas</h3>
                {decryptedEntries.length > 0 ? (
                    <ul className="space-y-3">
                        {decryptedEntries.map(entry => (
                            <li key={entry.id}>
                                <div className="relative group">
                                    <div
                                        onClick={() => onSelectEntry(entry.id)}
                                        className="w-full text-left p-4 bg-gray-700 hover:bg-indigo-900 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-indigo-800"
                                        data-entry-id={entry.id}
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                onSelectEntry(entry.id);
                                            }
                                        }}
                                    >
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-indigo-300 text-sm md:text-base">{entry.id}</div>
                                                <p className="text-gray-200 text-sm md:text-base mt-1 truncate">{entry.title}</p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteModalEntry(entry);
                                                }}
                                                className="flex-shrink-0 p-2 bg-gray-600 hover:bg-red-500 text-gray-300 hover:text-white rounded transition-colors text-sm"
                                                title="Eliminar entrada"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-gray-400 italic">Aún no has escrito ninguna entrada.</p>
                )}
            </div>
            
            <DeleteConfirmModal
                isOpen={!!deleteModalEntry}
                onClose={() => setDeleteModalEntry(null)}
                onConfirm={async () => {
                    console.log('DeleteConfirmModal onConfirm called with entry:', deleteModalEntry);
                    if (deleteModalEntry) {
                        // Encontrar el índice de la entrada que se va a eliminar
                        const currentIndex = decryptedEntries.findIndex(entry => entry.id === deleteModalEntry.id);
                        
                        // Calcular qué entrada debe recibir el foco después de eliminar
                        let targetEntryId = null;
                        if (currentIndex !== -1) {
                            if (currentIndex === 0) {
                                // Si es la primera entrada, enfocar la siguiente (ahora primera)
                                if (decryptedEntries.length > 1) {
                                    targetEntryId = decryptedEntries[1].id;
                                }
                            } else if (currentIndex === decryptedEntries.length - 1) {
                                // Si es la última entrada, enfocar la anterior (ahora última)
                                targetEntryId = decryptedEntries[currentIndex - 1].id;
                            } else {
                                // Si está en medio, enfocar la entrada anterior
                                targetEntryId = decryptedEntries[currentIndex - 1].id;
                            }
                        }
                        
                        console.log('FocusAfterDelete calculation:', { 
                            currentIndex, 
                            totalEntries: decryptedEntries.length, 
                            targetEntryId 
                        });
                        
                        // Guardar la entrada que debe recibir el foco
                        setFocusAfterDelete(targetEntryId);
                        
                        console.log('Calling onDeleteEntry with id:', deleteModalEntry.id);
                        await onDeleteEntry(deleteModalEntry.id);
                    }
                }}
                entry={deleteModalEntry}
            />
        </div>
    );
};

export default ArchiveView; 