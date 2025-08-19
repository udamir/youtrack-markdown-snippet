import { useEffect, memo, useRef } from "react"
import type { FC } from "react"

import Markdown from "@jetbrains/ring-ui-built/components/markdown/markdown"
import Theme from "@jetbrains/ring-ui-built/components/global/theme.js"
import MarkdownIt from "markdown-it"

import { MERMAID_THEME_CONFIG } from "./markdown.config"
import { useWidgetContext } from "../../contexts/WidgetContext"

import "./renderer.css"

// HTML escape utility function
const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

export interface RendererProps {
  error?: string | null
  content?: string | null
  loading?: boolean
}

/**
 * Component for rendering embedded markdown content
 */
export const RendererComponent: FC<RendererProps> = memo(({ error = "", content, loading = false }) => {
  const { theme } = useWidgetContext()
  const markdown = useRef<MarkdownIt | null>(null)

  useEffect(() => {
    const markdownIt = new MarkdownIt("commonmark", {
      html: true,
    }).enable("table")

    // Add custom renderer for mermaid code blocks and proper syntax highlighting
    markdownIt.renderer.rules.fence = (tokens, idx, options, env, slf) => {
      const token = tokens[idx]
      const info = token.info ? token.info.trim() : ""
      const langName = info.split(/\s+/g)[0]

      if (info === "mermaid") {
        const mermaidId = `mermaid-${Math.random().toString(36).substring(2, 9)}`
        return `<div class="mermaid" id="${mermaidId}">${token.content}</div>`
      }

      // Handle regular code blocks with syntax highlighting
      let highlighted = ""

      if (langName && window.hljs) {
        try {
          // Try to highlight with the specified language
          if (window.hljs.getLanguage(langName)) {
            highlighted = window.hljs.highlight(langName, token.content, true).value
          } else {
            // If language not found, try auto-detection
            highlighted = window.hljs.highlightAuto(token.content).value
          }
        } catch (error) {
          // If highlighting fails, fall back to plain text
          highlighted = escapeHtml(token.content)
        }
      } else {
        highlighted = escapeHtml(token.content)
      }

      const langClass = langName ? ` class="language-${escapeHtml(langName)}"` : ""
      return `<pre><code${langClass}>${highlighted}</code></pre>`
    }

    // Enable task lists with enhanced options (if available from CDN)
    if (window.markdownItTaskLists) {
      markdownIt.use(window.markdownItTaskLists, {
        enabled: true,
        label: true,
        labelClass: "markdown-task-list-label",
      })
    }

    if (window.markdownItMultimdTable) {
      markdownIt.use(window.markdownItMultimdTable, {
        multiline: false,
        rowspan: false,
        headerless: false,
        multibody: true,
        aotolabel: true,
      })
    }

    markdown.current = markdownIt
  }, [])

  // Initialize mermaid from CDN with theme-aware configuration
  useEffect(() => {
    if (window.mermaid) {
      window.mermaid.initialize({
        startOnLoad: true,
        theme: theme === Theme.DARK ? "dark" : "default",
        securityLevel: "loose",
        themeVariables: MERMAID_THEME_CONFIG[theme],
      })
    }
  }, [theme])

  // Re-run Mermaid after content updates to render newly injected diagrams
  useEffect(() => {
    // Ensure DOM is updated before running Mermaid
    requestAnimationFrame(() => {
      window.mermaid.run()
    })
  }, [content])

  // Use markdown-it to render the content
  const renderedMarkdown = (content: string) => {
    if (!content) {
      return ""
    }

    return markdown.current?.render(content) || ""
  }

  if (loading) {
    return <div className="markdown-snippet-loader">Loading...</div>
  }

  if (!error && !content) {
    return <div className="markdown-snippet-empty">No content to display</div>
  }

  return (
    <div className="markdown-snippet-content">
      <Markdown>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation> */}
        <div dangerouslySetInnerHTML={{ __html: renderedMarkdown(error ? error : content || "") }} />
      </Markdown>
    </div>
  )
})
