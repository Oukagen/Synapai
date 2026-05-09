const fs = require('fs');
const path = require('path');

const postsDir = path.join(__dirname, 'content/posts');

const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));

files.forEach(f => {
  const fpath = path.join(postsDir, f);
  let content = fs.readFileSync(fpath, 'utf8');

  // Extract frontmatter (between --- markers)
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return;

  const frontmatter = match[1];
  const body = content.slice(match[0].length);

  // Fix lines that have unescaped quotes in quoted strings
  const lines = frontmatter.split('\n');
  let changed = false;
  const fixedLines = lines.map(line => {
    // Only process field lines (key: "value")
    const fieldMatch = line.match(/^(\w+): "(.*)"$/);
    if (!fieldMatch) return line;

    const key = fieldMatch[1];
    let value = fieldMatch[2];

    // Skip if already properly escaped (has backslash before quote)
    if (value.includes('\\"')) return line;

    // If value contains unescaped double quotes, escape them
    if (value.includes('"') && !value.startsWith('\\"')) {
      // Escape all unescaped double quotes
      value = value.split('"').join('\\"');
      changed = true;
    }

    return `${key}: "${value}"`;
  });

  if (changed) {
    const newContent = '---\n' + fixedLines.join('\n') + '\n---\n' + body;
    fs.writeFileSync(fpath, newContent, 'utf8');
    console.log('Fixed:', f);
  }
});