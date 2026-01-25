import fs from 'fs';

function fixTables(filename) {
  let content = fs.readFileSync(filename, 'utf8');
  let fixed = false;

  // Fix tables: ensure spaces around pipes within table rows
  // Pattern: |text| becomes | text |
  content = content.replace(/\|([^|\n]+?)\|/g, (match, content) => {
    // Don't match table separator rows (|---|)
    if (content.match(/^[-:]+$/)) {
      return match;
    }

    // Add spaces around pipes within cells
    const fixedContent = content.replace(/\|/g, ' | ');
    // Remove leading/trailing spaces from first/last cell
    const trimmedContent = fixedContent.replace(/^\s*/, '').replace(/\s*$/, '');

    fixed = true;
    return `|${trimmedContent}|`;
  });

  if (fixed) {
    fs.writeFileSync(filename, content, 'utf8');
    console.log(`✅ ${filename}: Fixed table formatting`);
  }
}

const files = process.argv.slice(2);
files.forEach(fixTables);
