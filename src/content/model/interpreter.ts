import { encodeText } from '../../utils/textEncoderPolyfill.js';

/**
 * Content Type Interpreter for Client-Side Use
 * Lightweight and efficient content type detection
 */
export interface ContentTypeResult {
  type: string;
  subtype: string;
  label: string;
  preview: string;
}

export class ContentTypeInterpreter {
  /**
   * Supported content type signatures
   */
  private static readonly SIGNATURES: Record<string, Uint8Array[]> = {
    'image/png': [new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])],
    'image/jpeg': [new Uint8Array([0xFF, 0xD8, 0xFF])],
    'image/gif': [
      new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]), // GIF87a
      new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])  // GIF89a
    ],
    'audio/wav': [new Uint8Array([0x52, 0x49, 0x46, 0x46])], // RIFF
    'audio/mpeg': [new Uint8Array([0x49, 0x44, 0x33])], // ID3 tag for MP3
    'application/pdf': [new Uint8Array([0x25, 0x50, 0x44, 0x46])] // %PDF
  };

  /**
   * Convert input to Uint8Array with robust type handling
   * @param input Input content to convert
   * @returns Converted Uint8Array
   */
  private static convertToUint8Array(input: any): Uint8Array {
    // Handle various input types
    if (input instanceof Uint8Array) {
      return input;
    }

    if (input instanceof ArrayBuffer) {
      return new Uint8Array(input);
    }

    if (typeof input === 'string') {
      return encodeText(input);
    }

    // Handle Node.js Buffer
    if (input && typeof input === 'object' && 'buffer' in input) {
      return new Uint8Array(input.buffer);
    }

    // Handle JSON objects by stringifying
    if (typeof input === 'object') {
      try {
        const jsonString = JSON.stringify(input);
        return encodeText(jsonString);
      } catch {
        throw new Error('Failed to convert object to Uint8Array');
      }
    }

    throw new Error(`Unsupported input type for conversion: ${typeof input}`);
  }

  /**
   * Calculate the ratio of non-printable characters in a buffer
   * @param buffer Uint8Array to analyze
   * @returns Ratio of non-printable characters (0-1)
   */
  private static calculateNonPrintableRatio(buffer: Uint8Array): number {
    if (!buffer || buffer.length === 0) return 0;

    // Optimize by sampling the buffer instead of full iteration
    const sampleSize = Math.min(1024, buffer.length);
    const sampleStep = Math.max(1, Math.floor(buffer.length / sampleSize));

    let nonPrintableCount = 0;
    for (let i = 0; i < buffer.length; i += sampleStep) {
      const byte = buffer[i];
      // Consider bytes outside of printable ASCII range as non-printable
      if (byte < 32 || byte > 126) {
        nonPrintableCount++;
      }
    }

    return nonPrintableCount / sampleSize;
  }

  /**
   * Detect binary type with enhanced signature and non-printable character analysis
   * @param buffer Uint8Array containing the first bytes of the file
   * @returns Detected binary type or null
   */
  private static detectBinaryType(buffer: Uint8Array): ContentTypeResult | null {
    // Early return for empty buffer
    if (buffer.length === 0) {
      return null;
    }

    // Optimize signature checking
    const knownSignatures = this.SIGNATURES;
    const bufferLength = buffer.length;

    for (const [type, signatures] of Object.entries(knownSignatures)) {
      for (const signature of signatures) {
        const sigLength = signature.length;
        if (bufferLength >= sigLength) {
          let matches = true;
          for (let i = 0; i < sigLength; i++) {
            if (buffer[i] !== signature[i]) {
              matches = false;
              break;
            }
          }
          
          if (matches) {
            const subtypes = {
              'image/jpeg': { label: 'JPEG', subtype: 'jpeg' },
              'image/gif': { label: 'GIF', subtype: 'gif' },
              'audio/wav': { label: 'WAV', subtype: 'wav' },
              'audio/mpeg': { label: 'MP3', subtype: 'mp3' },
              'application/pdf': { label: 'PDF', subtype: 'pdf' }
            } as const;

            const defaultLabel = type.split('/')[1].toUpperCase();
            const defaultSubtype = type.split('/')[1];

            const { label = defaultLabel, subtype = defaultSubtype } = 
              (subtypes as Record<string, { label: string; subtype: string }>)[type] || 
              { label: defaultLabel, subtype: defaultSubtype };

            return {
              type: type,
              subtype: subtype,
              label: label,
              preview: `${label} file, ${buffer.length} bytes`
            };
          }
        }
      }
    }

    // Check for high non-printable character ratio with sampling
    const nonPrintableRatio = this.calculateNonPrintableRatio(buffer);

    // If high ratio of non-printable characters, likely binary
    if (nonPrintableRatio > 0.6) {
      return {
        type: 'application/octet-stream',
        subtype: 'binary',
        label: 'BIN',
        preview: `Binary data, ${buffer.length} bytes`
      };
    }

    return null;
  }

  /**
   * Detect text type with enhanced type recognition
   * @param previewText Preview text to analyze
   * @returns Detailed text type information
   */
  private static detectTextType(previewText: string): ContentTypeResult {
    // XML detection
    if (previewText.trim().startsWith('<?xml')) {
      return {
        type: 'text/xml',
        subtype: 'xml',
        label: 'XML',
        preview: previewText.slice(0, 100)
      };
    }

    // Markdown detection
    if (/^(#|\[|\*|\-|\+)/.test(previewText) || 
        /\[.*\]\(.*\)/.test(previewText)) {
      return {
        type: 'text/markdown',
        subtype: 'markdown',
        label: 'MD',
        preview: previewText.slice(0, 100)
      };
    }

    // JSON detection (more strict)
    try {
      const trimmedText = previewText.trim();
      if ((trimmedText.startsWith('{') && trimmedText.endsWith('}')) ||
          (trimmedText.startsWith('[') && trimmedText.endsWith(']'))) {
        JSON.parse(trimmedText);
        return {
          type: 'text/json',
          subtype: 'json',
          label: 'JSON',
          preview: trimmedText.slice(0, 100)
        };
      }
    } catch {}

    // CSV detection (more robust)
    if (/^[^,\n]+,[^,\n]+/.test(previewText) && 
        previewText.split('\n').length > 1 && 
        previewText.split('\n')[0].includes(',')) {
      return {
        type: 'text/csv',
        subtype: 'csv',
        label: 'CSV',
        preview: `CSV, ${previewText.split('\n').length} rows, ${previewText.length} bytes`
      };
    }

    // Plain text fallback
    return {
      type: 'text/plain',
      subtype: 'plain',
      label: 'TXT',
      preview: previewText.slice(0, 100)
    };
  }

  /**
   * Detect content type with enhanced type recognition
   * @param input Input content to detect type
   * @returns Detailed content type information
   */
  static detectContentType(input: any): ContentTypeResult {
    const startTime = performance.now();

    // Direct handling for string inputs
    if (typeof input === 'string') {
      const trimmedInput = input.trim();
      
      // Handle empty input
      if (trimmedInput === '') {
        return {
          type: 'text/plain',
          subtype: 'plain',
          label: 'TXT',
          preview: ''
        };
      }

      // Direct type detection for strings
      if (this.isJSONContent(trimmedInput)) {
        return {
          type: 'text/json',
          subtype: 'json',
          label: 'JSON',
          preview: trimmedInput.slice(0, 100)
        };
      }

      if (this.isMarkdownContent(trimmedInput)) {
        return {
          type: 'text/markdown',
          subtype: 'markdown',
          label: 'MD',
          preview: trimmedInput.slice(0, 100)
        };
      }

      if (this.isCSVContent(trimmedInput)) {
        return {
          type: 'text/csv',
          subtype: 'csv',
          label: 'CSV',
          preview: `CSV, ${trimmedInput.split('\n').length} rows, ${trimmedInput.length} bytes`
        };
      }

      if (this.isXMLContent(trimmedInput)) {
        return {
          type: 'text/xml',
          subtype: 'xml',
          label: 'XML',
          preview: trimmedInput.slice(0, 100)
        };
      }
    }

    let buffer: Uint8Array;
    try {
      buffer = this.convertToUint8Array(input);
    } catch (conversionError) {
      return {
        type: 'application/octet-stream',
        subtype: 'unknown',
        label: 'ERR',
        preview: `Conversion error: ${conversionError}`
      };
    }

    // Attempt binary detection first
    const binaryResult = this.detectBinaryType(buffer);
    if (binaryResult) {
      const endTime = performance.now();
      return binaryResult;
    }

    // Helper to convert buffer to string (first 1000 chars)
    const bufferToPreviewString = (buf: Uint8Array) => {
      try {
        const decoder = new TextDecoder('utf-8', { fatal: false });
        const decoded = decoder.decode(buf.slice(0, 1000));
        return decoded.trim();
      } catch {
        return '';
      }
    };

    // Attempt text decoding
    try {
      const decoder = new TextDecoder('utf-8', { fatal: true });
      const decodedText = decoder.decode(buffer);
      
      const previewText = bufferToPreviewString(buffer);
      
      // Enhanced text type detection with more robust checks
      // Check for specific text types in order of specificity
      if (this.isXMLContent(previewText)) {
        return {
          type: 'text/xml',
          subtype: 'xml',
          label: 'XML',
          preview: previewText.slice(0, 100)
        };
      }

      if (this.isJSONContent(previewText)) {
        return {
          type: 'text/json',
          subtype: 'json',
          label: 'JSON',
          preview: previewText.slice(0, 100)
        };
      }

      if (this.isMarkdownContent(previewText)) {
        return {
          type: 'text/markdown',
          subtype: 'markdown',
          label: 'MD',
          preview: previewText.slice(0, 100)
        };
      }

      if (this.isCSVContent(previewText)) {
        return {
          type: 'text/csv',
          subtype: 'csv',
          label: 'CSV',
          preview: `CSV, ${previewText.split('\n').length} rows, ${previewText.length} bytes`
        };
      }
      
      // Fallback to text/plain if no specific type is detected
      const endTime = performance.now();
      return {
        type: 'text/plain',
        subtype: 'plain',
        label: 'TXT',
        preview: previewText.slice(0, 100)
      };
    } catch (textDecodeError) {
      // Completely unrecognized
      const endTime = performance.now();
      return {
        type: 'application/octet-stream',
        subtype: 'unknown',
        label: 'BIN',
        preview: `Unrecognized data, ${buffer.length} bytes`
      };
    }
  }

  /**
   * Check if content is HTML
   * @param content - Text content to check
   * @returns Whether content appears to be HTML
   */
  private static isHTMLContent(content: string): boolean {
    // Simple HTML detection
    return /^\s*<!DOCTYPE\s+html|<html\b/i.test(content.trim()) || 
           /<(html|head|body|div|span|p)\b/i.test(content);
  }

  /**
   * Check if content is JSON
   * @param content - Content to check
   * @returns Whether content is JSON
   */
  private static isJSONContent(content: string): boolean {
    try {
      const trimmed = content.trim();
      const isJsonStructure = 
        (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']'));
      
      if (!isJsonStructure) return false;
      
      // Validate JSON structure
      const parsed = JSON.parse(trimmed);
      
      // Additional checks for JSON validity
      if (typeof parsed === 'object' && parsed !== null) {
        return true;
      }
      
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Check if content is Markdown
   * @param content - Content to check
   * @returns Whether content is Markdown
   */
  private static isMarkdownContent(content: string): boolean {
    const markdownPatterns = [
      /^#+\s/m,  // Headings
      /^\s*-\s/m,  // Unordered list
      /^\s*\d+\.\s/m,  // Ordered list
      /`{3}/,  // Code blocks
      /\[.*\]\(.*\)/,  // Links
      /\*{1,2}.*\*{1,2}/,  // Bold or italic
      /_{1,2}.*_{1,2}/     // Underline or italic
    ];

    // Require at least two markdown-specific patterns to match
    const matchCount = markdownPatterns.filter(pattern => pattern.test(content)).length;
    return matchCount >= 2;
  }

  /**
   * Check if content is CSV
   * @param content - Content to check
   * @returns Whether content is CSV
   */
  private static isCSVContent(content: string): boolean {
    const csvPatterns = [
      /^.*,(?=.*\n)/m,  // Comma-separated values
      /^.*\t.*\n/m,  // Tab-separated values
      /^[^,\n]+,[^,\n]+/  // At least two comma-separated columns
    ];

    // Require multiple rows and multiple columns
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const hasMultipleRows = lines.length > 1;
    const hasMultipleColumns = lines.some(line => {
      const cols = line.split(',');
      return cols.length > 1 && cols.every(col => col.trim() !== '');
    });
    
    const patternMatches = csvPatterns.filter(pattern => pattern.test(content)).length;
    return hasMultipleRows && hasMultipleColumns && patternMatches > 0;
  }

  /**
   * Check if content is XML
   * @param content - Content to check
   * @returns Whether content is XML
   */
  private static isXMLContent(content: string): boolean {
    const xmlPatterns = [
      /^\s*<\?xml\s+version=/,  // XML declaration
      /^\s*<\w+\s*xmlns:/,      // XML with namespace
      /^\s*<!DOCTYPE\s+\w+/,    // DOCTYPE declaration
      /<\w+>.*<\/\w+>/,         // Basic tag structure
      /&\w+;/                   // XML entities
    ];

    // Require at least two XML-specific patterns to match
    const matchCount = xmlPatterns.filter(pattern => pattern.test(content)).length;
    return matchCount >= 2;
  }

  /**
   * Check if content is printable text
   * @param content - Content to check
   * @returns Whether content is printable text
   */
  private static isPrintableText(content: string): boolean {
    // Check for a minimum number of printable characters
    const printableChars = content.match(/[\x20-\x7E\n\r\t]/g) || [];
    const printableRatio = printableChars.length / content.length;

    // Require at least 80% printable characters
    return printableRatio > 0.8;
  }

  /**
   * Determine if input is likely a binary or text content
   * @param input - Content to analyze
   * @returns Detailed content type information
   */
  static analyzeContentType(input: any): {
    isString: boolean;
    isBinary: boolean;
    contentType: string;
    length: number;
    firstBytes?: number[];
  } {
    // Handle string input
    if (typeof input === 'string') {
      return {
        isString: true,
        isBinary: false,
        contentType: 'text/plain',
        length: input.length,
      };
    }

    // Convert to Uint8Array for analysis
    let buffer: Uint8Array;
    try {
      if (input instanceof ArrayBuffer) {
        buffer = new Uint8Array(input);
      } else if (input instanceof Uint8Array) {
        buffer = input;
      } else if (input && typeof input === 'object' && 'buffer' in input) {
        // Handle Node.js Buffer
        buffer = new Uint8Array(input.buffer);
      } else {
        return {
          isString: false,
          isBinary: false,
          contentType: 'unknown',
          length: 0
        };
      }

      // Analyze binary content
      const firstBytes = Array.from(buffer.slice(0, 16)).map(b => parseInt(b.toString(16).padStart(2, '0'), 16));
      
      // More aggressive binary detection
      const isBinary = buffer.length > 0 && 
        (this.isPotentialBinaryContent(buffer) || 
         this.detectBinaryType(buffer) !== null);

      // Attempt to detect specific binary type
      const detectedType = this.detectContentType(buffer);

      return {
        isString: false,
        isBinary: isBinary,
        contentType: detectedType?.type || 'application/octet-stream',
        length: buffer.length,
        firstBytes: firstBytes
      };
    } catch (error) {
      return {
        isString: false,
        isBinary: false,
        contentType: 'error',
        length: 0
      };
    }
  }

  /**
   * Determine if content is likely binary
   * @param buffer - Buffer to check
   * @returns Whether content appears to be binary
   */
  private static isPotentialBinaryContent(buffer: Uint8Array): boolean {
    // If buffer is too small, it's likely not binary
    if (buffer.length < 16) return false;

    // Check for non-printable characters
    const nonPrintableThreshold = 0.3; // 30% non-printable chars
    const nonPrintableCount = buffer.reduce((count, byte) => 
      (byte < 32 || byte > 126) ? count + 1 : count, 0);
    
    const nonPrintableRatio = nonPrintableCount / buffer.length;

    return nonPrintableRatio > nonPrintableThreshold;
  }
}
