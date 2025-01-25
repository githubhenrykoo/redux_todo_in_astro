import React from 'react';
import { useSelector } from 'react-redux';
import { selectSelectedContent } from '../../features/todoSlice.js';
import ContentEditor from './ContentEditor';

const ContentDetailView = () => {
  const selectedContent = useSelector(selectSelectedContent);

  return (
    <ContentEditor
      content={selectedContent || ''}
      title="Content Viewer"
      isReadOnly={true}
      showLineNumbers={true}
      theme="light"
    />
  );
};

export default ContentDetailView;