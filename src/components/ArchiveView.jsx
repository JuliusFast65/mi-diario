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
        <div className="p-4 md:p-6">
            <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-6">Archivo de Entradas</h3>
                {decryptedEntries.length > 0 ? (
                    <ul className="space-y-2">
                        {decryptedEntries.map(entry => (
                            <li key={entry.id}>
                                <div className="relative group">
                                    <button
                                        onClick={() => onSelectEntry(entry.id)}
                                        className="w-full text-left p-3 bg-gray-700 hover:bg-indigo-900 rounded-lg transition-colors"
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-indigo-300">{entry.id}</span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteModalEntry(entry);
                                                }}
                                                className="p-1 bg-red-500 hover:bg-red-600 text-white rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 text-xs"
                                                title="Eliminar entrada"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        <p className="text-gray-200">{entry.title}</p>
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