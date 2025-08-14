import { useMemo } from 'react';
import { getSectionContent } from '../../../utils/markdown';

export const useContentProcessor = (content: string, sectionTitle?: string) => {
  const processedContent = useMemo(() => {
    if (!content || content.trim() === '') {
      return '';
    }

    // Process content with section filtering if needed
    let displayContent = content;
    if (sectionTitle && sectionTitle.trim() !== '') {
      displayContent = getSectionContent(content, sectionTitle);
    }

    // Trim content
    return displayContent.trim();
  }, [content, sectionTitle]);

  const isEmpty = !processedContent;
  const hasContent = !!processedContent;

  return {
    processedContent,
    isEmpty,
    hasContent,
  };
};
