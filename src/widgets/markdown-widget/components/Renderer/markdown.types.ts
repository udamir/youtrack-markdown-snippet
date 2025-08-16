export interface MermaidAPI {
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

export interface HighlightJS {
  getLanguage: (name: string) => { name: string } | undefined;
  highlight: (code: string, options: { language: string }) => { value: string };
  highlightAuto: (code: string, languageSubset?: string[]) => { value: string; language: string; relevance: number };
}

export type MarkdownItPlugin = (md: unknown, options?: unknown) => void;

export interface MarkdownItToken {
  info: string;
  content: string;
}

export interface MarkdownItRenderer {
  fence?: (tokens: MarkdownItToken[], idx: number, options: any, env: any, slf: any) => string;
  code_block?: (tokens: MarkdownItToken[], idx: number, options: any, env: any, slf: any) => string;
}

declare global {
  interface Window {
    mermaid: MermaidAPI;
    hljs: HighlightJS;
    markdownItTaskLists: MarkdownItPlugin;
    markdownItMultimdTable: MarkdownItPlugin;
  }
}
