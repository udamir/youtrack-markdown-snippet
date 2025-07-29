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
    const title = match[2].trim();
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
  if (!markdown || !sectionTitle) return '';
  
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
    .replace(/!\[.*?\]\(.*?\)/g, '') // remove images
    .replace(/\[([^\]]+)\]\((.*?)\)/g, '$1') // links: [text](url) → text
    .replace(/(`{1,3})(.*?)\1/g, '$2') // inline or block code
    .replace(/[*_~#>`-]/g, '') // basic formatting symbols
    .replace(/\n{2,}/g, '\n') // collapse multiple newlines
    .trim();
}
