const fs = require('fs');
const path = require('path');
const glob = require('glob');

const hardcodedColorPatterns = [
  /text-(gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}/g,
  /bg-(gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}/g,
  /border-(gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}/g,
  /text-(white|black)/g,
  /bg-(white|black)/g,
];

const allowedPatterns = [
  'bg-black/80', // For overlays
  'bg-white', // Only in specific contexts
];

const checkFile = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  hardcodedColorPatterns.forEach(pattern => {
    const matches = content.match(pattern) || [];
    matches.forEach(match => {
      if (!allowedPatterns.some(allowed => match.includes(allowed))) {
        const lineNumber = content.substring(0, content.indexOf(match)).split('\n').length;
        issues.push({
          file: filePath,
          line: lineNumber,
          match: match
        });
      }
    });
  });
  
  return issues;
};

const files = glob.sync('src/**/*.{tsx,ts,jsx,js}', {
  cwd: path.resolve(__dirname, '..'),
  absolute: true,
  ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
});

const allIssues = [];
files.forEach(file => {
  const issues = checkFile(file);
  allIssues.push(...issues);
});

if (allIssues.length > 0) {
  console.log('🚨 Found hardcoded colors:\n');
  allIssues.forEach(issue => {
    console.log(`${issue.file}:${issue.line} - ${issue.match}`);
  });
  console.log(`\n❌ Total issues: ${allIssues.length}`);
  process.exit(1);
} else {
  console.log('✅ No hardcoded colors found!');
}