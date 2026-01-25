import fs from 'fs';

// Language detection patterns
const patterns = {
  bash: [
    /^#!\/bin\/(bash|sh|zsh)/,
    /^(export |unset |source |\$\{)/,
    /^(cd |ls |cp |mv |mkdir |rm |chmod |chown )/,
    /^(apt-get |apt |yum |dnf |npm |pnpm |pip )/,
    /^(echo |cat |grep |sed |awk |sort |uniq |tail |head )/,
    /^(if |then |else |fi |for |do |done |while |case |esac)/,
    /^(function |\(\) )/,
    /^[a-z_]+=[^$]/,
    /^# [a-z_]+=/,
  ],
  javascript: [
    /^(import |export |const |let |var |function |class |async |await )/,
    /^(console\.|document\.|window\.|localStorage\.|sessionStorage\.)/,
    /^[a-zA-Z_$][a-zA-Z0-9_$]*\s*=\s*(async\s+)?\(/,
    /^(if |else |for |while |switch |case |break |continue |return )/,
    /^\{|\}$/,
    /^[a-zA-Z_$][a-zA-Z0-9_$]*\.\w+\s*=/,
    /^(=>|=>\s*\{)/,
  ],
  json: [
    /^\s*\{/,
    /^\s*"[\w-]+":\s*["\[\{0-9tf]/,
    /^\s*[\w-]+:\s*["\[\{0-9tf]/,
  ],
  http: [
    /^(GET |POST |PATCH |DELETE |PUT |HEAD |OPTIONS )/i,
    /^(http|https):\/\//i,
    /^Host:|User-Agent:|Content-Type:/i,
  ],
  text: [], // Fallback
};

function detectLanguage(code) {
  // Normalize code for matching
  const trimmedCode = code.trim();

  // Check each pattern
  for (const [lang, regexes] of Object.entries(patterns)) {
    if (regexes.some(regex => regex.test(trimmedCode))) {
      return lang;
    }
  }

  // Fallback: try to guess from common keywords
  if (trimmedCode.includes('npm') || trimmedCode.includes('pnpm') || trimmedCode.includes('node')) {
    return 'bash';
  }

  if (trimmedCode.includes('export') || trimmedCode.includes('import') || trimmedCode.includes('const ')) {
    return 'javascript';
  }

  if (trimmedCode.includes('{') && trimmedCode.includes('}') && trimmedCode.includes('":')) {
    return 'json';
  }

  // Default fallback
  return 'text';
}

function fixCodeBlocks(filename) {
  let content = fs.readFileSync(filename, 'utf8');
  let fixed = 0;

  // Match code blocks without language: ```code```
  const codeBlockRegex = /```(\n)([\s\S]*?)(\n```)/gs;

  content = content.replace(codeBlockRegex, (match, newline, code, endNewline) => {
    const lang = detectLanguage(code);
    fixed++;
    return `\`\`\`${lang}${newline}${code}${endNewline}`;
  });

  if (fixed > 0) {
    fs.writeFileSync(filename, content, 'utf8');
    console.log(`✅ ${filename}: Fixed ${fixed} code blocks`);
  } else {
    console.log(`✓ ${filename}: No changes needed`);
  }
}

// Process all markdown files
const files = process.argv.slice(2);
if (files.length === 0) {
  console.log('Usage: node fix-md-blocs.js <file1.md> <file2.md> ...');
  process.exit(1);
}

files.forEach(fixCodeBlocks);
