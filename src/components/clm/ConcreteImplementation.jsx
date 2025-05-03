import React from 'react';
import LinkedFiles from './LinkedFiles';

/**
 * Component to display the Concrete Implementation section of a CLM
 */
const ConcreteImplementation = ({ 
    inputs, 
    activities, 
    outputs, 
    cards
}) => {
    return (
        <>
            <tr>
                <th colSpan={6}><a href="#concrete-implementation">Concrete Implementation</a></th>
            </tr>
            <tr>
                <th colSpan={2}><a href="#inputs">Inputs</a></th>
                <th colSpan={2}><a href="#activities">Activities</a></th>
                <th colSpan={2}><a href="#outputs">Outputs</a></th>
            </tr>
            <tr>
                <td colSpan={2} style={{ wordWrap: 'break-word' }}>
                    <LinkedFiles 
                        content={inputs} 
                        cards={cards} 
                        sectionName="inputs"
                    />
                </td>
                <td colSpan={2} style={{ wordWrap: 'break-word' }}>
                    <LinkedFiles 
                        content={activities} 
                        cards={cards} 
                        sectionName="activities"
                    />
                </td>
                <td colSpan={2} style={{ wordWrap: 'break-word' }}>
                    <LinkedFiles 
                        content={outputs} 
                        cards={cards} 
                        sectionName="outputs"
                    />
                </td>
            </tr>
        </>
    );
};

export default ConcreteImplementation;
