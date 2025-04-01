import React from 'react';
import { 
  FaRegFile, FaRegFileImage, FaRegFilePdf, FaRegFileCode, 
  FaRegFileAlt, FaRegFileArchive, FaRegFileWord, FaRegFileExcel, 
  FaRegFilePowerpoint, FaRegFileVideo, FaRegFileAudio, 
  FaDatabase, FaChartBar, FaProjectDiagram, FaCode
} from 'react-icons/fa';
import { SiGraphql, SiJsonwebtokens } from 'react-icons/si';

interface FileTypeIconProps {
  mimeType?: string;
  extension?: string;
  size?: number;
  className?: string;
}

/**
 * Component that displays an icon based on file type
 * Uses mime type or extension to determine the appropriate icon
 */
export const FileTypeIcon: React.FC<FileTypeIconProps> = ({ 
  mimeType, 
  extension, 
  size = 16,
  className = ""
}) => {
  // Get color based on file type
  const getIconColor = (): string => {
    if (!mimeType && !extension) return "#6c757d"; // Default gray
    
    // Image files - blue hue
    if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(extension || '')) {
      return "#0d6efd";
    }
    
    // Document files - green hue
    if (mimeType?.includes('pdf') || extension === 'pdf') {
      return "#198754";
    }
    
    // Office files - orange hue
    if (mimeType?.includes('word') || ['doc', 'docx'].includes(extension || '')) {
      return "#0d47a1";
    }
    if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel') || ['xls', 'xlsx'].includes(extension || '')) {
      return "#1b5e20";
    }
    if (mimeType?.includes('presentation') || mimeType?.includes('powerpoint') || ['ppt', 'pptx'].includes(extension || '')) {
      return "#e65100";
    }
    
    // Code files - purple hue
    if (mimeType?.includes('json') || extension === 'json') {
      return "#673ab7";
    }
    
    // Diagram files - teal hue
    if (['mmd', 'puml', 'dot'].includes(extension || '') || 
        mimeType?.includes('mermaid') || 
        mimeType?.includes('plantuml') || 
        mimeType?.includes('graphviz')) {
      return "#009688";
    }
    
    // Archive files - yellow hue
    if (mimeType?.includes('zip') || mimeType?.includes('compressed') || 
        ['zip', 'rar', 'gz', 'tar', '7z'].includes(extension || '')) {
      return "#ffc107";
    }
    
    // Database files - red hue
    if (mimeType?.includes('sqlite') || extension === 'db' || extension === 'sqlite' || extension === 'parquet') {
      return "#dc3545";
    }
    
    // Default color for other types
    return "#6c757d";
  };
  
  // Get icon component based on file type
  const Icon = (): React.ReactElement => {
    if (!mimeType && !extension) {
      return <FaRegFile color={getIconColor()} size={size} />;
    }
    
    // Image files
    if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(extension || '')) {
      return <FaRegFileImage color={getIconColor()} size={size} />;
    }
    
    // Document files
    if (mimeType?.includes('pdf') || extension === 'pdf') {
      return <FaRegFilePdf color={getIconColor()} size={size} />;
    }
    
    // Office files
    if (mimeType?.includes('word') || ['doc', 'docx'].includes(extension || '')) {
      return <FaRegFileWord color={getIconColor()} size={size} />;
    }
    if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel') || ['xls', 'xlsx'].includes(extension || '')) {
      return <FaRegFileExcel color={getIconColor()} size={size} />;
    }
    if (mimeType?.includes('presentation') || mimeType?.includes('powerpoint') || ['ppt', 'pptx'].includes(extension || '')) {
      return <FaRegFilePowerpoint color={getIconColor()} size={size} />;
    }
    
    // Code and data files
    if (mimeType?.includes('json') || extension === 'json') {
      return <SiJsonwebtokens color={getIconColor()} size={size} />;
    }
    if (['html', 'htm', 'xml', 'js', 'jsx', 'ts', 'tsx', 'css', 'scss', 'py', 'java', 'c', 'cpp', 'php', 'rb'].includes(extension || '')) {
      return <FaRegFileCode color={getIconColor()} size={size} />;
    }
    
    // Diagram files
    if (mimeType?.includes('mermaid') || extension === 'mmd') {
      return <FaChartBar color={getIconColor()} size={size} />;
    }
    if (mimeType?.includes('plantuml') || extension === 'puml') {
      return <FaProjectDiagram color={getIconColor()} size={size} />;
    }
    if (mimeType?.includes('graphviz') || extension === 'dot') {
      return <SiGraphql color={getIconColor()} size={size} />;
    }
    
    // Archive files
    if (mimeType?.includes('zip') || mimeType?.includes('compressed') || 
        ['zip', 'rar', 'gz', 'tar', '7z'].includes(extension || '')) {
      return <FaRegFileArchive color={getIconColor()} size={size} />;
    }
    
    // Database files
    if (mimeType?.includes('sqlite') || extension === 'db' || extension === 'sqlite' || extension === 'parquet') {
      return <FaDatabase color={getIconColor()} size={size} />;
    }
    
    // Text files
    if (mimeType?.includes('text/plain') || extension === 'txt') {
      return <FaRegFileAlt color={getIconColor()} size={size} />;
    }
    
    // Video files
    if (mimeType?.includes('video') || ['mp4', 'webm', 'avi', 'mov', 'wmv'].includes(extension || '')) {
      return <FaRegFileVideo color={getIconColor()} size={size} />;
    }
    
    // Audio files
    if (mimeType?.includes('audio') || ['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(extension || '')) {
      return <FaRegFileAudio color={getIconColor()} size={size} />;
    }
    
    // Default file icon
    return <FaRegFile color={getIconColor()} size={size} />;
  };
  
  return (
    <span className={className} title={mimeType || extension}>
      {Icon()}
    </span>
  );
};

// Helper function to get file extension from a filename
export const getFileExtension = (filename: string): string => {
  if (!filename) return '';
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

// Helper function to infer mime type from file extension
export const inferMimeTypeFromExtension = (extension: string): string | null => {
  const extensionMap: Record<string, string> = {
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp',
    'ico': 'image/x-icon',
    
    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    
    // Code and data
    'json': 'application/json',
    'html': 'text/html',
    'htm': 'text/html',
    'xml': 'application/xml',
    'js': 'text/javascript',
    'jsx': 'text/javascript',
    'ts': 'text/typescript',
    'tsx': 'text/typescript',
    'css': 'text/css',
    'scss': 'text/scss',
    'py': 'text/x-python',
    'java': 'text/x-java',
    'c': 'text/x-c',
    'cpp': 'text/x-c++',
    'php': 'text/x-php',
    'rb': 'text/x-ruby',
    
    // Diagrams
    'mmd': 'text/x-mermaid',
    'puml': 'text/x-plantuml',
    'dot': 'text/vnd.graphviz',
    
    // Archives
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    'gz': 'application/gzip',
    'tar': 'application/x-tar',
    '7z': 'application/x-7z-compressed',
    
    // Database
    'db': 'application/x-sqlite3',
    'sqlite': 'application/x-sqlite3',
    'parquet': 'application/x-parquet',
    
    // Text
    'txt': 'text/plain',
    
    // Media
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    'wmv': 'video/x-ms-wmv',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'flac': 'audio/flac',
    'm4a': 'audio/mp4'
  };
  
  const lowerExt = extension.toLowerCase();
  return extensionMap[lowerExt] || null;
};
