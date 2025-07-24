import React, { useState, useEffect } from 'react';
import { decryptText } from '../utils/crypto';
import DeleteConfirmModal from './DeleteConfirmModal';

const ArchiveView = ({ allEntries, onSelectEntry, onDeleteEntry, user }) => {
    const [deleteModalEntry, setDeleteModalEntry] = useState(null);
    const [decryptedEntries, setDecryptedEntries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

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
                                    <button
                                        onClick={() => onSelectEntry(entry.id)}
                                        className="w-full text-left p-4 bg-gray-700 hover:bg-indigo-900 rounded-lg transition-colors"
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
                                    </button>
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