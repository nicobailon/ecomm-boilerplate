#!/usr/bin/env tsx

import fs from 'fs';
import { getLogsPath } from '../lib/unified-logger.js';

console.log('\n🔍 Unified Logging System Information\n');

console.log('📋 Features:');
console.log('  ✓ Backend console.log forwarding to unified log file');
console.log('  ✓ Frontend console.log collection via API');
console.log('  ✓ MongoDB/SQL query logging');
console.log('  ✓ All logs in single tailable file\n');

console.log('📂 Log Location:');
const logPath = getLogsPath();
console.log(`  ${logPath}`);

if (fs.existsSync(logPath)) {
  const stats = fs.statSync(logPath);
  console.log(`  Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Last modified: ${stats.mtime.toLocaleString()}\n`);
} else {
  console.log('  (Log file will be created when server starts)\n');
}

console.log('🚀 Usage:');
console.log('  make tail-logs            # View last 50 lines and follow new output (for AI agents)');
console.log('  npm run logs:tail         # Same as above (alternative)');
console.log('  tail -n 100 logs/unified.log  # View last 100 lines');
console.log('  grep "error" logs/unified.log # Search for errors');
console.log('  grep "frontend" logs/unified.log | jq . # Pretty print frontend logs\n');

console.log('🔧 Frontend Logging:');
console.log('  Frontend logging is automatically enabled.');
console.log('  To disable, set VITE_ENABLE_FRONTEND_LOGGING=false in frontend .env\n');

console.log('🗄️  MongoDB/SQL Query Logging:');
console.log('  All database queries are automatically logged.');
console.log('  Look for entries with source: "database"\n');

console.log('📊 Log Format:');
console.log('  JSON format with timestamp, level, source, and message\n');

console.log('💡 Example Usage:');
console.log('  - tail -f logs/unified.log | jq .');
console.log('  - grep \'"source":"frontend"\' logs/unified.log');
console.log('  - grep \'"source":"database"\' logs/unified.log');