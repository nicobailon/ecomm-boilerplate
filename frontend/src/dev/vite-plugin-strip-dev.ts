import type { Plugin } from 'vite';

export function stripDevPlugin(): Plugin {
  return {
    name: 'strip-dev',
    enforce: 'pre',
    load(id) {
      if (process.env.NODE_ENV === 'production') {
        if (id.includes('/dev/') || id.includes('\\dev\\')) {
          return 'export default {}';
        }
      }
      return null;
    },
    transform(code, id) {
      if (process.env.NODE_ENV === 'production') {
        if (id.includes('/dev/') || id.includes('\\dev\\')) {
          return {
            code: 'export default {}',
            map: null
          };
        }
        
        const devImportRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"](?:\.\.?\/)*dev\/[^'"]*['"]\s*;?/g;
        const devDynamicImportRegex = /import\s*\(\s*['"](?:\.\.?\/)*dev\/[^'"]*['"]\s*\)/g;
        
        if (devImportRegex.test(code) || devDynamicImportRegex.test(code)) {
          let transformedCode = code;
          transformedCode = transformedCode.replace(devImportRegex, '');
          transformedCode = transformedCode.replace(devDynamicImportRegex, '{}');
          
          return {
            code: transformedCode,
            map: null
          };
        }
      }
      return null;
    }
  };
}