import React from 'react';

const SaveButton = ({ onSave, isSaving }) => {
    return (
        <button
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isSaving
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
            onClick={onSave}
            disabled={isSaving}
        >
            {isSaving ? 'Saving...' : 'Save'}
        </button>
    );
};

export default SaveButton;
