import React from 'react';
import { useSelector } from 'react-redux';
import { selectSelectedContent } from '../../../features/todoSlice';

const ContentDetailView = ({ content }) => {

    const selectedContent = useSelector(selectSelectedContent);


  return (
    <div className="content-detail-view">
      <h2 className="text-lg font-bold">Detailed Content Value</h2>
      {selectedContent ? (
        <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded">
          {selectedContent}
        </pre>
      ) : (
        <h2 className="text-gray-500">Content value is null</h2>
      )}
    </div>
  );
};

export default ContentDetailView;