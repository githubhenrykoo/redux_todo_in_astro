'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FiPlay, FiPause, FiUpload, FiX, FiCopy, FiSettings, FiSave } from 'react-icons/fi';

/**
 * TranscriptionPanel - A panel for audio transcription and management
 * Supports uploading audio files, transcribing them, and editing/exporting the results
 */
export default function TranscriptionPanel() {
  const dispatch = useDispatch();
  // Audio state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Transcription state
  const [transcription, setTranscription] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  const [detectionMethod, setDetectionMethod] = useState<string>('');
  
  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [transcriptionModel, setTranscriptionModel] = useState<string>('whisper-1');
  const [language, setLanguage] = useState<string>('auto');
  const [processingPython, setProcessingPython] = useState(false);
  const [pythonOutput, setPythonOutput] = useState<string>('');
  
  // Handle audio file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Detection method tracking (similar to your file type detection system)
      let method = 'extension_detection';
      
      // Log detailed file information for debugging
      console.log('TranscriptionPanel - File selected:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: new Date(file.lastModified).toISOString()
      });
      
      // Validate file is audio
      if (!file.type.startsWith('audio/')) {
        console.warn('TranscriptionPanel - File may not be audio:', file.type);
        method = 'assumed_audio_despite_mimetype';
      }
      
      setAudioFile(file);
      setDetectionMethod(method);
      
      // Create audio URL for playback
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      
      // Reset transcription state
      setTranscription('');
      setTranscriptionProgress(0);
      setIsTranscribing(false);
    }
  };
  
  // Handle audio playback control
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  // Update time display during playback
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };
  
  // Set duration when metadata is loaded
  const handleMetadataLoaded = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };
  
  // Handle seeking in the audio
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }
  };
  
  // Start transcription process
  const startTranscription = async () => {
    if (!audioFile) return;
    
    setIsTranscribing(true);
    setTranscriptionProgress(0);
    
    try {
      // Mock transcription process - in a real app, you'd call an API here
      // This simulates a call to OpenAI's Whisper API or similar
      console.log('TranscriptionPanel - Starting transcription with settings:', {
        model: transcriptionModel,
        language: language,
        fileSize: audioFile.size,
        detectionMethod
      });
      
      // Simulate progress updates
      const totalSteps = 10;
      for (let i = 1; i <= totalSteps; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setTranscriptionProgress(i * (100 / totalSteps));
      }
      
      // Mock result based on filename
      const mockTranscription = `This is a simulated transcription of the audio file "${audioFile.name}". 
In a real implementation, this would be replaced with actual transcribed content from an API like OpenAI's Whisper.
The transcription would include timestamps and speaker identification if available.

[00:00:00] Speaker 1: This is the first part of the transcription.
[00:00:05] Speaker 2: This is a response in the conversation.
[00:00:10] Speaker 1: This demonstrates how the actual transcription would be formatted.
`;
      
      setTranscription(mockTranscription);
    } catch (error) {
      console.error('TranscriptionPanel - Transcription error:', error);
    } finally {
      setIsTranscribing(false);
      setTranscriptionProgress(100);
    }
  };
  
  // Handle running Python script
  const runPythonTranscriber = async () => {
    setProcessingPython(true);
    setPythonOutput('Starting Python script...\n');
    
    try {
      // Use the simplified API endpoint that just runs an echo command for now
      const apiUrl = `/api/run-script`;
      
      console.log('TranscriptionPanel - Calling script API endpoint');
      
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({})
        });
        
        console.log('TranscriptionPanel - API response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Display execution info
        if (data.executionMethod) {
          setPythonOutput(prev => 
            `${prev}\nExecution method: ${data.executionMethod}\n\n`
          );
        }
        
        // Handle successful execution
        if (data.success) {
          // Display the actual Python script output
          setPythonOutput(prev => prev + (data.output || 'No output returned from server.'));
          
          if (data.errorOutput && data.errorOutput.trim()) {
            setPythonOutput(prev => prev + `\n\nStderr output:\n${data.errorOutput}`);
          }
        } else {
          // Handle error in execution
          setPythonOutput(prev => 
            prev + `\nError executing script: ${data.error || 'Unknown error'}\n` +
            (data.errorOutput ? `\nError details:\n${data.errorOutput}` : '')
          );
        }
      } catch (fetchError) {
        console.error('Error making API call:', fetchError);
        setPythonOutput(prev => prev + `\nError calling API: ${fetchError}\n\nFalling back to simulated output...\n`);
        
        // Fallback to simulation for demo purposes
        await simulateTranscription();
      }
    } catch (error) {
      console.error('Error running Python script:', error);
      setPythonOutput(prev => prev + `\nError: ${error}\n`);
    } finally {
      setProcessingPython(false);
    }
  };
  
  // Simulate the transcription process for demo purposes
  const simulateTranscription = async () => {
    setPythonOutput(prev => prev + 'Activating virtual environment...\n');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setPythonOutput(prev => prev + 'Loading Whisper model...\n');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setPythonOutput(prev => prev + 'Large Whisper model loaded!\n');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setPythonOutput(prev => prev + 'Listing all files in the audio directory:\n');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setPythonOutput(prev => prev + 'Found 2 audio files\nFound 1 video files\n');
    await new Promise(resolve => setTimeout(resolve, 700));
    
    setPythonOutput(prev => prev + 'Attempting to extract audio from video...\n');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setPythonOutput(prev => prev + 'Processing audio files: 100%|████████████████| 3/3 [00:42<00:00, 14.12s/it]\n');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setPythonOutput(prev => prev + 'Transcribing complete. Results saved to /data/processed/transcript/\n');
  };
  
  // Format time display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Copy transcription to clipboard
  const copyTranscription = () => {
    navigator.clipboard.writeText(transcription);
    // You could add a toast notification here
    console.log('TranscriptionPanel - Transcription copied to clipboard');
  };
  
  // Save transcription to file
  const saveTranscription = () => {
    if (!transcription) return;
    
    const element = document.createElement('a');
    const file = new Blob([transcription], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    
    // Generate filename based on original audio file
    const baseName = audioFile ? audioFile.name.replace(/\.[^/.]+$/, "") : 'transcription';
    element.download = `${baseName}_transcription.txt`;
    
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    console.log('TranscriptionPanel - Transcription saved to file');
  };
  
  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);
  
  return (
    <div className="h-full flex flex-col w-full overflow-hidden">
      {/* Header with title and options */}
      <div className="p-3 border-b bg-gray-100 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Audio Transcription</h2>
        <div className="flex items-center space-x-2">
          <button 
            onClick={runPythonTranscriber}
            disabled={processingPython}
            className={`mr-2 py-1 px-3 rounded text-white ${processingPython ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} text-sm`}
          >
            {processingPython ? 'Running...' : 'Run Python Script'}
          </button>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded hover:bg-gray-200"
            title="Transcription Settings"
          >
            <FiSettings />
          </button>
        </div>
      </div>
      
      {/* Python output - showing outside of file upload area */}
      {pythonOutput && (
        <div className="border-b p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Python Script Output</h3>
            <button 
              onClick={() => setPythonOutput('')}
              className="text-gray-500 hover:text-red-500 text-sm"
            >
              Clear
            </button>
          </div>
          <pre className="whitespace-pre-wrap font-mono text-sm p-3 bg-gray-50 rounded border max-h-40 overflow-auto">
            {pythonOutput}
          </pre>
        </div>
      )}
      
      {/* Settings panel (conditionally rendered) */}
      {showSettings && (
        <div className="p-4 border-b">
          <h3 className="font-medium mb-2">Transcription Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Model</label>
              <select 
                value={transcriptionModel}
                onChange={(e) => setTranscriptionModel(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="whisper-1">Whisper (Standard)</option>
                <option value="whisper-large">Whisper (Large)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Language</label>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="auto">Auto-detect</option>
                <option value="en">English</option>
                <option value="zh">Chinese</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="ja">Japanese</option>
                <option value="ko">Korean</option>
              </select>
            </div>
          </div>
        </div>
      )}
      
      {/* File upload area */}
      {!audioFile && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="mb-4">
              <FiUpload className="mx-auto text-4xl text-gray-400" />
            </div>
            <p className="text-lg mb-6">Upload an audio file to transcribe</p>
            <label className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded cursor-pointer">
              Select Audio File
              <input 
                type="file" 
                accept="audio/*" 
                onChange={handleFileUpload} 
                className="hidden" 
              />
            </label>
            <p className="mt-3 text-sm text-gray-500">
              Supports MP3, WAV, M4A, and other audio formats
            </p>
          </div>
        </div>
      )}
      
      {/* Audio player and transcription area */}
      {audioFile && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Audio player */}
          <div className="p-4 border-b">
            <div className="flex items-center mb-2">
              <h3 className="font-medium flex-1 truncate" title={audioFile.name}>
                {audioFile.name}
              </h3>
              <button 
                onClick={() => {
                  setAudioFile(null);
                  setAudioUrl(null);
                  setTranscription('');
                }}
                className="text-gray-500 hover:text-red-500"
                title="Remove audio"
              >
                <FiX />
              </button>
            </div>
            
            <div className="flex items-center mb-2">
              <button 
                onClick={togglePlayPause} 
                className="mr-3 p-2 bg-gray-200 rounded-full hover:bg-gray-300"
              >
                {isPlaying ? <FiPause /> : <FiPlay />}
              </button>
              
              <div className="flex-1 flex items-center">
                <span className="text-sm text-gray-600 mr-2">{formatTime(currentTime)}</span>
                <input 
                  type="range" 
                  min="0" 
                  max={duration || 0} 
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 ml-2">{formatTime(duration)}</span>
              </div>
            </div>
            
            <audio 
              ref={audioRef}
              src={audioUrl || ''} 
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleMetadataLoaded}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
            
            {/* Transcription button */}
            <div className="mt-3">
              <button 
                onClick={startTranscription}
                disabled={isTranscribing}
                className={`py-2 px-4 rounded text-white ${isTranscribing ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'}`}
              >
                {isTranscribing ? 'Transcribing...' : 'Start Transcription'}
              </button>
              
              {detectionMethod && (
                <div className="mt-1 text-xs text-gray-500">
                  Detection method: {detectionMethod}
                </div>
              )}
            </div>
            
            {/* Progress bar */}
            {isTranscribing && (
              <div className="mt-3">
                <div className="h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-2 bg-blue-500 rounded-full" 
                    style={{ width: `${transcriptionProgress}%` }}
                  ></div>
                </div>
                <div className="text-xs text-center mt-1 text-gray-500">
                  {Math.round(transcriptionProgress)}% complete
                </div>
              </div>
            )}
          </div>
          
          {/* Transcription display */}
          <div className="flex-1 overflow-auto p-4">
            {transcription ? (
              <div className="relative">
                <div className="absolute top-0 right-0 flex">
                  <button 
                    onClick={copyTranscription}
                    className="p-2 text-gray-500 hover:text-blue-500"
                    title="Copy to clipboard"
                  >
                    <FiCopy />
                  </button>
                  <button 
                    onClick={saveTranscription}
                    className="p-2 text-gray-500 hover:text-blue-500"
                    title="Save as file"
                  >
                    <FiSave />
                  </button>
                </div>
                <pre className="whitespace-pre-wrap font-mono text-sm p-4 bg-gray-50 rounded border mt-2">
                  {transcription}
                </pre>
              </div>
            ) : (
              <div className="text-center text-gray-500 h-full flex items-center justify-center">
                <p>
                  {isTranscribing 
                    ? 'Transcribing audio...' 
                    : 'Transcription will appear here after processing'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
