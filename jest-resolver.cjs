const path = require('path');
const fs = require('fs');

function resolveModule(request, options) {
  // Handle src imports
  if (request.startsWith('src/')) {
    const rootDir = options.rootDir;
    const fullPath = path.resolve(rootDir, request);
    
    // Check .js and .mjs extensions
    const jsPath = fullPath.endsWith('.js') ? fullPath : `${fullPath}.js`;
    const mjsPath = fullPath.endsWith('.mjs') ? fullPath : `${fullPath}.mjs`;
    
    if (fs.existsSync(jsPath)) return jsPath;
    if (fs.existsSync(mjsPath)) return mjsPath;
    
    // Fallback to original path
    return fullPath;
  }
  
  // Default resolver
  return options.defaultResolver(request, options);
}

module.exports = {
  sync: resolveModule,
  async: resolveModule
};
