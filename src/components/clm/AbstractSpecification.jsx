import React from 'react';

/**
 * Component to display the Abstract Specification section of a CLM
 */
const AbstractSpecification = ({ context, goal, successCriteria }) => {
    // Helper function to format content based on type
    const formatContent = (content) => {
        if (!content) {
            return null;
        }
        
        if (typeof content === 'string') {
            return content;
        }
        
        if (Array.isArray(content)) {
            return content.join('\n');
        }
        
        if (typeof content === 'object') {
            try {
                return JSON.stringify(content, null, 2);
            } catch (e) {
                return `Error formatting content: ${e.message}`;
            }
        }
        
        return String(content);
    };

    return (
        <>
            <tr>
                <th colSpan={6}><a href="#abstract-specification">Abstract Specification</a></th>
            </tr>
            <tr>
                <th colSpan={1}><a href="#context">Context</a></th>
                <td colSpan={5} style={{ wordWrap: 'break-word' }}>
                    {formatContent(context) || 'No context available'}
                </td>
            </tr>
            <tr>
                <th colSpan={1}><a href="#goal">Goal</a></th>
                <td colSpan={5} style={{ wordWrap: 'break-word' }}>
                    {formatContent(goal) || 'No goal available'}
                </td>
            </tr>
            <tr>
                <th colSpan={1}><a href="#success-criteria">Success Criteria</a></th>
                <td colSpan={5} style={{ wordWrap: 'break-word' }}>
                    {formatContent(successCriteria) || 'No success criteria available'}
                </td>
            </tr>
        </>
    );
};

export default AbstractSpecification;
