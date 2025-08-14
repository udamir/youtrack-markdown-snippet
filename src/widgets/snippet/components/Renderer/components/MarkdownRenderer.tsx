import type React from 'react';
import { useEffect } from 'react';
import { useMarkdownRenderer } from '../hooks/useMarkdownRenderer';
import type { MarkdownRendererProps } from '../types/renderer.types';

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  containerRef 
}) => {
  const markdownIt = useMarkdownRenderer();

  useEffect(() => {
    if (containerRef.current && markdownIt && content) {
      try {
        const html = markdownIt.render(content);
        containerRef.current.innerHTML = html;
      } catch (error) {
        console.error('Error rendering markdown:', error);
        containerRef.current.innerHTML = `<p>Error rendering content: ${error instanceof Error ? error.message : String(error)}</p>`;
      }
    }
  }, [content, markdownIt, containerRef]);

  return (
    <div className="markdown-embed-content" ref={containerRef}>
      {/* Content will be rendered via innerHTML */}
    </div>
  );
};
