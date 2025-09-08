export interface Section {
  title: string;
  level: number;
  content: string;
  startPos: number;
  endPos: number;
}

export function parseMarkdownSections(markdown: string): Section[] {
  if (!markdown) return [];
  
  const sections: Section[] = [];
  const headerRegex = /^(#{1,6})\s+(.+)$/gm;
  
  let match = headerRegex.exec(markdown)
  let lastIndex = 0;
  
  while (match !== null) {
    const level = match[1].length;
    const title = removeMarkdown(match[2]).trim();
    const startPos = match.index;
    
    if (lastIndex > 0) {
      // Close previous section
      sections[sections.length - 1].endPos = startPos;
      sections[sections.length - 1].content = markdown.substring(
        sections[sections.length - 1].startPos,
        startPos
      ).trim();
    }
    
    sections.push({
      title,
      level,
      content: '',
      startPos,
      endPos: markdown.length
    });
    
    lastIndex = headerRegex.lastIndex;
    match = headerRegex.exec(markdown)
  }
  
  // Process content for the last section
  if (sections.length > 0) {
    const lastSection = sections[sections.length - 1];
    lastSection.content = markdown.substring(lastSection.startPos).trim();
  }
  
  return sections;
}

export function getSectionContent(markdown: string, sectionTitle: string): string {
  if (!markdown) return '';
  if (!sectionTitle) return markdown;
  
  const sections = parseMarkdownSections(markdown);
  const targetSection = sections.find(section => section.title === sectionTitle);
  
  if (!targetSection) {
    return '';
  }
  
  // Find the next section of same or higher level
  let endPos = markdown.length;
  for (let i = sections.indexOf(targetSection) + 1; i < sections.length; i++) {
    if (sections[i].level <= targetSection.level) {
      endPos = sections[i].startPos;
      break;
    }
  }
  
  // Get the full section content first
  const fullSectionContent = markdown.substring(targetSection.startPos, endPos).trim();
  
  // Now remove the section title line (i.e., the first line that starts with # characters)
  // This regex matches the header line at the beginning of the string
  return fullSectionContent.replace(/^#{1,6}\s+.+$/m, '').trim();
}

export function removeMarkdown(md: string): string {
  return md
    .replace(/<[^>]*>/g, '')                            // remove HTML tags
    .replace(/!\[.*?\]\(.*?\)/g, '')                    // remove images
    .replace(/\[([^\]]+)\]\((.*?)\)/g, '$1')            // links: [text](url) → text
    .replace(/(`{1,3})([\s\S]*?)\1/g, '$2')             // Inline or fenced code ticks (keep inner text)
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')                 // Headings at line start: remove leading # markers
    .replace(/^(.*)\n\s*={2,}\s*$/gm, '$1')             // Setext-style headings: keep the text line, drop underline === or ---
    .replace(/^(.*)\n\s*-{2,}\s*$/gm, '$1')             // Setext-style headings: keep the text line, drop underline === or ---
    .replace(/^\s{0,3}>\s?/gm, '')                      // Blockquotes at line start: remove leading > markers
    .replace(/^\s{0,3}(?:[*+-]|\d+\.)\s+/gm, '')        // Lists at line start: bullets or ordered
    .replace(/\*{3}([^*]+)\*{3}/g, '$1')                // Strong+em combined (asterisks)
    .replace(/(?<!\w)___([^_]+)___(?!\w)/g, '$1')       // Strong+em combined (underscores) with word-boundary protection
    .replace(/\*\*([^*]+)\*\*/g, '$1')                  // Bold (asterisks)
    .replace(/(?<!\w)__([^_]+)__(?!\w)/g, '$1')         // Bold (underscores) – avoid stripping underscores in words
    .replace(/\*([^*]+)\*/g, '$1')                      // Italic (asterisk)
    .replace(/(?<!\w)_([^_]+)_(?!\w)/g, '$1')           // Italic (underscore) – boundary-aware so part_of_word stays intact
    .replace(/~~([^~]+)~~/g, '$1')                      // Strikethrough
    .replace(/<((?:https?:\/\/|mailto:)[^>]+)>/g, '$1') // Autolinks <http://example.com> → keep inner content
    .replace(/\\([\\`*_{}\[\]()#+\-.!>~|])/g, '$1')     // Unescape common escaped punctuation
    .replace(/\n{2,}/g, '\n')                           // collapse multiple newlines
    .trim();
}
