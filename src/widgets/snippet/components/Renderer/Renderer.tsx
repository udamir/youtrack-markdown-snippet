import React, { useEffect, useRef } from 'react';
import type { FC } from 'react';

import { MarkdownRenderer } from './components/MarkdownRenderer';
import { RendererErrorBoundary } from './components/ErrorBoundary';

import type { RendererComponentProps } from './types/renderer.types';

import './Renderer.css';
import { useTheme } from '@jetbrains/ring-ui-built/components/global/theme';
import Theme from '@jetbrains/ring-ui-built/components/global/theme.js';
import { MERMAID_THEME_CONFIG } from './config/markdown.config';

/**
 * Renders markdown content with support for mermaid diagrams, syntax highlighting,
 * and custom plugins. Handles loading, error, and empty states.
 * 
 * @param content - Raw markdown content to render
 * @param theme - Current UI theme for styling
 */
export const RendererComponent: FC<RendererComponentProps> = React.memo(({
  content,
}) => {
  const theme = useTheme()
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.mermaid) {
      window.mermaid.initialize({
        startOnLoad: true,
        theme: theme === Theme.DARK ? 'dark' : 'default',
        securityLevel: 'loose',
        themeVariables: MERMAID_THEME_CONFIG[theme],
      });
    }
  }, [theme]);

  // Render mermaid diagrams when content changes
  useEffect(() => {
    if (window.mermaid && containerRef.current) {
      const mermaidElements = containerRef.current.querySelectorAll('.mermaid');
      if (mermaidElements.length > 0) {
        window.mermaid.run().catch((error) => {
          console.error('Mermaid rendering error:', error);
        });
      }
    }
  }, [content, containerRef]);

  return (
    <RendererErrorBoundary>
      <MarkdownRenderer 
        content={content} 
        containerRef={containerRef} 
      />
    </RendererErrorBoundary>
  );
});
