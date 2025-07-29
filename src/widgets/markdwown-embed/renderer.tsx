import markdownitTaskLists from 'markdown-it-task-lists';
import mermaid, { type MermaidConfig } from 'mermaid';
import markdownItMultimdTable from 'markdown-it-multimd-table'
import React, { useMemo } from 'react';
import type { FC } from 'react';
import LoaderInline from '@jetbrains/ring-ui-built/components/loader-inline/loader-inline';
import Markdown from '@jetbrains/ring-ui-built/components/markdown/markdown';
import MarkdownIt from 'markdown-it';

import highlightJs from 'highlight.js';
import { getSectionContent } from '../../utils/markdown';

// Import highlight.js CSS for syntax highlighting
import 'highlight.js/styles/github.css';
import './renderer.css';

interface RendererProps {
  loading: boolean;
  error: string | null;
  content: string;
  sectionTitle: string;
}

/**
 * Component for rendering embedded markdown content
 */
export const RendererComponent: FC<RendererProps> = ({
  loading,
  error,
  content,
  sectionTitle
}) => {
  if (loading) {
    return <div className="markdown-embed-loading"><LoaderInline /></div>;
  }
  
  if (error) {
    return <div className="markdown-embed-error">{error}</div>;
  }
  
  if (!content) {
    return <div className="markdown-embed-empty">No content to display</div>;
  }
  
  // If there's a section title, extract just that section's content
  // Otherwise, use the full content
  const displayContent = sectionTitle ? getSectionContent(content, sectionTitle) : content;
  
  if (!displayContent) {
    return <div className="markdown-embed-empty">Content not found</div>;
  }
  
  // Use markdown-it to render the content
  const renderedMarkdown = useMemo(() => {
    const markdownIt = new MarkdownIt('commonmark', {
      html: true, // Enable HTML tags in source
      breaks: true, // Convert '\n' to <br>
      linkify: true, // Auto-convert URLs to links
      typographer: true, // Enable smartquotes and other typographic replacements
      highlight(str: string, lang: string) {
        if (lang && highlightJs.getLanguage(lang)) {
          return highlightJs.highlight(str, {
            language: lang
          }).value;
        }
        return '';
      }
    }).enable('table');

    // Enable task lists with enhanced options
    markdownIt.use(markdownitTaskLists, {
      enabled: true,
      label: true,
      labelClass: "markdown-task-list-label",
    });
    markdownIt.use(markdownItMermaid())

    markdownIt.use(markdownItMultimdTable, {
      multiline:  false,
      rowspan:    false,
      headerless: false,
      multibody:  true,
      aotolabel:  true,
    })

    return markdownIt.render(displayContent);
  }, [displayContent]);
  
  return (
    <div className="markdown-embed-content">
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

const markdownItMermaid = ({ ...mermaidOptions }: Partial<MermaidConfig> = {}) => {
  mermaid.initialize({ ...mermaidOptions })
  return (md: MarkdownIt) => {
    const sourceRender = md.renderer.rules.fence;
    md.renderer.rules.fence = (tokens, idx, options, env, self) => {
      const token = tokens[idx];
      if (token.info === 'mermaid' && token.content) {
        mermaid.run();
        return `<pre class="mermaid">${token.content}</pre>`;
      }
      return sourceRender?.(tokens, idx, options, env, self) as string;
    }
  }
}

