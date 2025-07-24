import React, { useState } from 'react';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, entry }) => {
    if (!isOpen || !entry) return null;

    const handleConfirm = () => {
        console.log('DeleteConfirmModal handleConfirm called');
        onConfirm();
        onClose();
    };

    const handleCancel = () => {
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Eliminar Entrada</h3>
                        <p className="text-sm text-gray-400">Esta acción no se puede deshacer</p>
                    </div>
                </div>
                
                <div className="mb-6">
                    <p className="text-gray-300 mb-3">
                        ¿Estás seguro de que quieres eliminar la entrada del <strong>{entry.id}</strong>?
                    </p>
                    
                    {entry.title && entry.title !== 'Sin Título' && (
                        <div className="bg-gray-700 rounded-lg p-3 mb-3">
                            <p className="text-sm text-gray-200 font-medium">"{entry.title}"</p>
                        </div>
                    )}
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800">
                            <strong>⚠️ Atención:</strong> Esta acción eliminará la entrada y todas las actividades registradas para este día.
                        </p>
                    </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal; 