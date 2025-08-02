import React, { useMemo, useEffect, useRef } from 'react';
import type { FC } from 'react';
import LoaderInline from '@jetbrains/ring-ui-built/components/loader-inline/loader-inline';
import Markdown from '@jetbrains/ring-ui-built/components/markdown/markdown';
import Theme from '@jetbrains/ring-ui-built/components/global/theme';
import MarkdownIt from 'markdown-it';
import { getSectionContent } from '../../utils/markdown';

import './renderer.css';

// Declare global libraries from CDN
interface MermaidAPI {
  initialize: (config: {
    startOnLoad?: boolean;
    theme?: string;
    securityLevel?: string;
    themeVariables?: Record<string, string>;
  }) => void;
  run: () => Promise<void>;
  mermaidAPI?: {
    reset: () => void;
  };
}

interface HighlightJS {
  getLanguage: (name: string) => { name: string } | undefined;
  highlight: (code: string, options: { language: string }) => { value: string };
  highlightAuto: (code: string, languageSubset?: string[]) => { value: string; language: string; relevance: number };
}

type MarkdownItPlugin = (md: unknown, options?: unknown) => void;

declare global {
  interface Window {
    mermaid: MermaidAPI;
    hljs: HighlightJS;
    markdownItTaskLists: MarkdownItPlugin;
    markdownItMultimdTable: MarkdownItPlugin;
  }
}

// Note: highlight.js CSS is loaded via CDN
import './renderer.css';

// HTML escape utility function
const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

interface RendererProps {
  loading: boolean;
  error: string | null;
  content: string;
  sectionTitle: string;
  theme: Theme.LIGHT | Theme.DARK;
}

/**
 * Component for rendering embedded markdown content
 */
export const RendererComponent: FC<RendererProps> = ({
  loading,
  error,
  content,
  sectionTitle,
  theme
}) => {
  // All hooks must be at the top before any conditional returns
  
  // Get current theme from props
  const isDarkTheme = theme === Theme.DARK;

  // Track content changes for mermaid rendering
  const contentRef = useRef<string>('');
  const themeRef = useRef<Theme.LIGHT | Theme.DARK>(theme);
  
  // Switch highlight.js theme based on current theme
  useEffect(() => {
    const lightThemeLink = document.getElementById('hljs-theme-light') as HTMLLinkElement;
    const darkThemeLink = document.getElementById('hljs-theme-dark') as HTMLLinkElement;
    
    if (lightThemeLink && darkThemeLink) {
      if (isDarkTheme) {
        lightThemeLink.disabled = true;
        darkThemeLink.disabled = false;
      } else {
        lightThemeLink.disabled = false;
        darkThemeLink.disabled = true;
      }
    }
  }, [isDarkTheme]);

  // Initialize mermaid from CDN with theme-aware configuration
  useEffect(() => {
    if (window.mermaid) {
      const mermaidTheme = isDarkTheme ? 'dark' : 'default';
      const themeVariables = isDarkTheme ? {
        primaryColor: '#bb86fc',
        primaryTextColor: '#ffffff',
        primaryBorderColor: '#bb86fc',
        lineColor: '#ffffff',
        sectionBkgColor: '#1e1e1e',
        altSectionBkgColor: '#2d2d2d',
        gridColor: '#ffffff',
        secondaryColor: '#03dac6',
        tertiaryColor: '#cf6679'
      } : {
        primaryColor: '#1976d2',
        primaryTextColor: '#000000',
        primaryBorderColor: '#1976d2',
        lineColor: '#000000',
        sectionBkgColor: '#ffffff',
        altSectionBkgColor: '#f5f5f5',
        gridColor: '#000000',
        secondaryColor: '#00acc1',
        tertiaryColor: '#d32f2f'
      };
      
      window.mermaid.initialize({
        startOnLoad: true,
        theme: mermaidTheme,
        securityLevel: 'loose',
        themeVariables
      });
    }
  }, [isDarkTheme]);
  
  // If there's a section title, extract just that section's content
  // Otherwise, use the full content
  const displayContent = sectionTitle ? getSectionContent(content, sectionTitle) : content;
  
  // Trim the content to remove extra whitespace and leading/trailing line breaks
  const trimmedContent = displayContent.replace(/^\s+|\s+$/g, '');
  
  // Use markdown-it to render the content
  const renderedMarkdown = useMemo(() => {
    if (!trimmedContent) {
      return '';
    }
    
    const markdownIt = new MarkdownIt('commonmark', {
      html: true
    }).enable('table');
    
    // Add custom renderer for mermaid code blocks and proper syntax highlighting
    markdownIt.renderer.rules.fence = (tokens, idx, options, env, slf) => {
      const token = tokens[idx];
      const info = token.info ? token.info.trim() : '';
      const langName = info.split(/\s+/g)[0];
      
      if (info === 'mermaid') {
        const mermaidId = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        return `<div class="mermaid" id="${mermaidId}">${token.content}</div>`;
      }
      
      // Handle regular code blocks with syntax highlighting
      let highlighted = '';
      
      if (langName && window.hljs) {
        try {
          // Try to highlight with the specified language
          if (window.hljs.getLanguage(langName)) {
            highlighted = window.hljs.highlight(token.content, {
              language: langName
            }).value;
          } else {
            // If language not found, try auto-detection
            const result = window.hljs.highlightAuto(token.content);
            highlighted = result.value;
          }
        } catch (error) {
          // If highlighting fails, fall back to plain text
          highlighted = escapeHtml(token.content);
        }
      } else {
        highlighted = escapeHtml(token.content);
      }
      
      const langClass = langName ? ` class="language-${escapeHtml(langName)}"` : '';
      return `<pre><code${langClass}>${highlighted}</code></pre>`;
    };

    // Enable task lists with enhanced options (if available from CDN)
    if (window.markdownItTaskLists) {
      markdownIt.use(window.markdownItTaskLists, {
        enabled: true,
        label: true,
        labelClass: "markdown-task-list-label",
      });
    }

    if (window.markdownItMultimdTable) {
      markdownIt.use(window.markdownItMultimdTable, {
        multiline:  false,
        rowspan:    false,
        headerless: false,
        multibody:  true,
        aotolabel:  true,
      });
    }
    
    return markdownIt.render(trimmedContent);
  }, [trimmedContent]);
  
  // Render mermaid diagrams when content or theme changes
  useEffect(() => {
    const contentChanged = contentRef.current !== trimmedContent;
    const themeChanged = themeRef.current !== theme;
    
    if ((contentChanged || themeChanged) && trimmedContent) {
      contentRef.current = trimmedContent;
      themeRef.current = theme;
      
      const renderMermaid = async () => {
        try {
          if (window.mermaid) {
            const mermaidTheme = isDarkTheme ? 'dark' : 'default';

            const themeVariables = isDarkTheme ? {
              primaryColor: '#bb86fc',
              primaryTextColor: '#ffffff',
              primaryBorderColor: '#bb86fc',
              lineColor: '#ffffff',
              sectionBkgColor: '#1e1e1e',
              altSectionBkgColor: '#2d2d2d',
              gridColor: '#ffffff',
              secondaryColor: '#03dac6',
              tertiaryColor: '#cf6679'
            } : {
              primaryColor: '#1976d2',
              primaryTextColor: '#000000',
              primaryBorderColor: '#1976d2',
              lineColor: '#000000',
              sectionBkgColor: '#ffffff',
              altSectionBkgColor: '#f5f5f5',
              gridColor: '#000000',
              secondaryColor: '#00acc1',
              tertiaryColor: '#d32f2f'
            };
            
            // Force mermaid to reset completely
            if (window.mermaid.mermaidAPI) {
              window.mermaid.mermaidAPI.reset();
            }
            
            // Always re-initialize mermaid with current theme
            window.mermaid.initialize({
              startOnLoad: false,
              theme: mermaidTheme,
              securityLevel: 'loose',
              themeVariables
            });
            
            // If theme changed, clear existing diagrams to force re-render
            if (themeChanged) {
              const mermaidElements = document.querySelectorAll('.mermaid');
              for (const element of mermaidElements) {
                // Store original content if not already stored
                if (!element.getAttribute('data-original-content')) {
                  const originalContent = element.textContent || '';
                  element.setAttribute('data-original-content', originalContent);
                }
                
                // Clear rendered content and reset to original
                const originalContent = element.getAttribute('data-original-content');
                if (originalContent) {
                  element.innerHTML = originalContent;
                  element.removeAttribute('data-processed');
                }
              }
            }
            
            await window.mermaid.run();
          }
        } catch (renderError) {
          console.error('[Mermaid] Rendering error:', renderError);
        }
      };
      
      // Small delay to ensure DOM is updated
      const timeoutDelay = 10;
      setTimeout(renderMermaid, timeoutDelay);
    }
  }, [trimmedContent, theme, isDarkTheme]);
  
  // Handle conditional returns after all hooks
  if (loading) {
    return <div className="markdown-embed-loading"><LoaderInline /></div>;
  }
  
  if (error) {
    return <div className="markdown-embed-error">{error}</div>;
  }
  
  if (!content) {
    return <div className="markdown-embed-empty">No content to display</div>;
  }
  
  if (!trimmedContent) {
    return <div className="markdown-embed-empty">Content not found</div>;
  }
  
  return (
    <div className={`markdown-embed-content ${isDarkTheme ? 'ring-ui-theme-dark' : 'ring-ui-theme-light'}`}>
      <Markdown>
        {/* Be careful with passing user input down to `dangerouslySetInnerHTML`! */}
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation> */}
        <div dangerouslySetInnerHTML={{
          __html: renderedMarkdown
        }} />
      </Markdown>
    </div>
  );
};



