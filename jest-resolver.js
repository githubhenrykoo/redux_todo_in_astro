import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function resolver(request, options) {
  // Handle src imports
  if (request.startsWith('src/')) {
    const fullPath = path.resolve(__dirname, request);
    return fullPath;
  }
  
  // Default resolver
  return options.defaultResolver(request, options);
}
