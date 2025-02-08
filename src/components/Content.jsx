import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  addContent, 
  deleteContent, 
  selectContent,
  updateContentMetadata,
  updateContentRelationships
} from '../features/contentSlice';

const Content = () => {
  const dispatch = useDispatch();
  const { items, search, selected } = useSelector(state => state.content);
  const searchResults = search.results;

  const handleContentSelect = (hash) => {
    dispatch(selectContent(hash));
  };

  const handleContentDelete = (hash) => {
    dispatch(deleteContent(hash));
  };

  const handleUpdateMetadata = (hash, metadata) => {
    dispatch(updateContentMetadata({ 
      hash, 
      metadata 
    }));
  };

  const handleUpdateRelationships = (hash, relationships) => {
    dispatch(updateContentRelationships({ 
      hash, 
      relationships 
    }));
  };

  const [newContent, setNewContent] = useState('');
  const [newContentRelationships, setNewContentRelationships] = useState({
    parentHash: '',
    childHashes: [],
    relatedHashes: []
  });

  const handleCreateContent = (e) => {
    e.preventDefault();
    if (newContent.trim()) {
      dispatch(addContent({ 
        content: newContent,
        relationships: newContentRelationships
      }));
      
      // Reset form
      setNewContent('');
      setNewContentRelationships({
        parentHash: '',
        childHashes: [],
        relatedHashes: []
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Content Creation Form */}
      <form onSubmit={handleCreateContent} className="space-y-2 p-4 border rounded">
        <textarea 
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Enter new content..."
          className="w-full p-2 border rounded"
          rows="4"
        />
        
        {/* Optional Relationships */}
        <div className="grid grid-cols-3 gap-2">
          <input 
            type="text"
            value={newContentRelationships.parentHash}
            onChange={(e) => setNewContentRelationships(prev => ({
              ...prev, 
              parentHash: e.target.value
            }))}
            placeholder="Parent Hash (optional)"
            className="p-2 border rounded"
          />
          <input 
            type="text"
            value={newContentRelationships.childHashes.join(',')}
            onChange={(e) => setNewContentRelationships(prev => ({
              ...prev, 
              childHashes: e.target.value.split(',').filter(Boolean)
            }))}
            placeholder="Child Hashes (comma-separated)"
            className="p-2 border rounded"
          />
          <input 
            type="text"
            value={newContentRelationships.relatedHashes.join(',')}
            onChange={(e) => setNewContentRelationships(prev => ({
              ...prev, 
              relatedHashes: e.target.value.split(',').filter(Boolean)
            }))}
            placeholder="Related Hashes (comma-separated)"
            className="p-2 border rounded"
          />
        </div>

        <button 
          type="submit" 
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Create Content
        </button>
      </form>

      {/* Content List */}
      <div className="space-y-2">
        {searchResults.length === 0 ? (
          <p className="text-gray-500 text-center">No content found</p>
        ) : (
          searchResults.map(hash => {
            const content = items[hash];
            const isSelected = selected === hash;

            return (
              <div 
                key={hash} 
                className={`
                  flex flex-col p-2 border rounded 
                  ${isSelected ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-100'}
                `}
              >
                {/* Content Preview */}
                <div 
                  onClick={() => handleContentSelect(hash)}
                  className="cursor-pointer mb-2"
                >
                  {content.content.substring(0, 200)}...
                </div>

                {/* Metadata and Actions */}
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Hash: {hash.substring(0, 10)}...
                  </div>
                  <div className="space-x-2">
                    <button 
                      onClick={() => handleContentDelete(hash)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Content;
