import type { Mermaid } from "mermaid";
import type markdownIt from "markdown-it";
import type hljs from "highlightjs";

export type MarkdownItPlugin = (md: markdownIt, options?: unknown) => void;

declare global {
  interface Window {
    mermaid: Mermaid;
    hljs: typeof hljs;
    markdownItTaskLists: MarkdownItPlugin;
    markdownItMultimdTable: MarkdownItPlugin;
  }
}
