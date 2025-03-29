import React from 'react';

const DimensionNavigation = ({ activeDimension, onDimensionChange }) => {
    const dimensions = [
        { key: 'abstractSpecification', label: 'Abstract Specification' },
        { key: 'concreteImplementation', label: 'Concrete Implementation' },
        { key: 'balancedExpectations', label: 'Balanced Expectations' }
    ];

    return (
        <div className="flex space-x-4">
            {dimensions.map(dimension => (
                <button
                    key={dimension.key}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                        activeDimension === dimension.key 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    onClick={() => onDimensionChange(dimension.key)}
                >
                    {dimension.label}
                </button>
            ))}
        </div>
    );
};

export default DimensionNavigation;
