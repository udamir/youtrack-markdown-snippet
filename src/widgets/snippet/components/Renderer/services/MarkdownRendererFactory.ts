import MarkdownIt from 'markdown-it';
import { MARKDOWN_IT_CONFIG, TASK_LISTS_CONFIG, MULTIMD_TABLE_CONFIG } from '../config/markdown.config';

export class MarkdownRendererFactory {
  static createRenderer(): MarkdownIt {
    const md = new MarkdownIt(MARKDOWN_IT_CONFIG);
    
    MarkdownRendererFactory.setupMermaidRenderer(md);
    MarkdownRendererFactory.setupSyntaxHighlighting(md);
    MarkdownRendererFactory.setupPlugins(md);
    
    return md;
  }
  
  private static setupMermaidRenderer(md: MarkdownIt): void {
    const defaultFence = md.renderer.rules.fence;
    md.renderer.rules.fence = (tokens, idx, options, env, slf) => {
      const token = tokens[idx];
      const info = token.info ? token.info.trim() : '';
      const langName = info ? info.split(/\s+/g)[0] : '';

      if (langName === 'mermaid') {
        const uniqueId = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        return `<div class="mermaid" id="${uniqueId}">${token.content}</div>`;
      }

      return defaultFence ? defaultFence(tokens, idx, options, env, slf) : '';
    };
  }
  
  private static setupSyntaxHighlighting(md: MarkdownIt): void {
    const defaultCode = md.renderer.rules.code_block;
    md.renderer.rules.code_block = (tokens, idx, options, env, slf) => {
      const token = tokens[idx];
      const langName = token.info ? token.info.trim().split(/\s+/g)[0] : '';
      
      if (langName && window.hljs && window.hljs.getLanguage(langName)) {
        const highlighted = window.hljs.highlight(token.content, { language: langName });
        return `<pre><code class="hljs language-${langName}">${highlighted.value}</code></pre>`;
      }
      
      return defaultCode ? defaultCode(tokens, idx, options, env, slf) : `<pre><code>${token.content}</code></pre>`;
    };
  }
  
  private static setupPlugins(md: MarkdownIt): void {
    // Enable task lists with enhanced options (if available from CDN)
    if (window.markdownItTaskLists) {
      md.use(window.markdownItTaskLists, TASK_LISTS_CONFIG);
    }

    if (window.markdownItMultimdTable) {
      md.use(window.markdownItMultimdTable, MULTIMD_TABLE_CONFIG);
    }
  }
}
