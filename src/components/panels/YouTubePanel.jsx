import React, { useState } from 'react';

const YouTubePanel = () => {
  const [inputUrl, setInputUrl] = useState('');
  const [embedUrl, setEmbedUrl] = useState('');
  const [error, setError] = useState('');

  // Convert YouTube URL to embed URL
  const convertToEmbedUrl = (url) => {
    if (!url) return '';

    try {
      // Handle different YouTube URL formats
      let videoId = '';
      
      // youtube.com/watch?v=VIDEO_ID
      if (url.includes('youtube.com/watch')) {
        const urlParams = new URLSearchParams(new URL(url).search);
        videoId = urlParams.get('v');
      } 
      // youtu.be/VIDEO_ID
      else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
      }
      // youtube.com/embed/VIDEO_ID
      else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('youtube.com/embed/')[1].split('?')[0];
      }

      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }

      // Return the embed URL
      return `https://www.youtube.com/embed/${videoId}`;
    } catch (err) {
      setError('Invalid YouTube URL. Please enter a valid YouTube link.');
      return '';
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    setError('');
    if (!inputUrl) {
      setError('Please enter a YouTube URL');
      return;
    }

    const newEmbedUrl = convertToEmbedUrl(inputUrl);
    if (newEmbedUrl) {
      setEmbedUrl(newEmbedUrl);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background p-4 overflow-hidden">
      <h2 className="text-2xl font-bold mb-4 text-foreground">YouTube Video Player</h2>
      
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Enter YouTube URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID)"
            className="flex-1 px-3 py-2 border rounded-md bg-background text-foreground"
          />
          <button 
            type="submit"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Load
          </button>
        </div>
        {error && <p className="text-red-500 mt-1">{error}</p>}
      </form>
      
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden rounded-md border">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title="YouTube Video Player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-muted">
            <p className="text-muted-foreground">Enter a YouTube URL above to watch a video</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default YouTubePanel;
