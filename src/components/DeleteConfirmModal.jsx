import React, { useState } from 'react';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, entry }) => {
    const [deleteActivities, setDeleteActivities] = useState(false);

    if (!isOpen || !entry) return null;

    const handleConfirm = () => {
        onConfirm(deleteActivities);
        setDeleteActivities(false); // Reset checkbox
        onClose();
    };

    const handleCancel = () => {
        setDeleteActivities(false); // Reset checkbox
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex items-center mb-4">
                    <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-lg font-medium text-gray-900">
                            Eliminar Entrada
                        </h3>
                    </div>
                </div>

                <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                        ¿Estás seguro de que quieres eliminar la entrada del <strong>{entry.id}</strong>?
                    </p>
                    <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-800 font-medium">"{entry.title}"</p>
                    </div>
                    <p className="text-xs text-red-600 mt-2">
                        Esta acción no se puede deshacer.
                    </p>
                </div>

                <div className="mb-6">
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={deleteActivities}
                            onChange={(e) => setDeleteActivities(e.target.checked)}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                            Eliminar también las actividades registradas para este día
                        </span>
                    </label>
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                    >
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal; 