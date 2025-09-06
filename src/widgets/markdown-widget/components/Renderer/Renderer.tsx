import { useEffect, memo, useRef } from "react"
import type { FC } from "react"

import Markdown from "@jetbrains/ring-ui-built/components/markdown/markdown"
import Theme from "@jetbrains/ring-ui-built/components/global/theme.js"
import MarkdownIt from "markdown-it"

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
        // Keep original source in a data attribute to allow re-render on theme change
        return `<div class="mermaid" id="${mermaidId}" data-original="${token.content}"></div>`
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
        // We'll trigger rendering manually after DOM updates
        startOnLoad: false,
        theme: theme === Theme.DARK ? "dark" : "default",
        securityLevel: "loose",
      })
    }
  }, [theme])

  // Re-run Mermaid after content/theme updates to render or re-render diagrams
  useEffect(() => {
    // Ensure DOM is updated before running Mermaid
    requestAnimationFrame(() => {
      // Reset processed flag and restore original source so Mermaid re-renders with the new theme
      document.querySelectorAll('.mermaid').forEach(node => {
        const el = node as HTMLElement
        el.removeAttribute('data-processed')
        const source = el.getAttribute('data-original')
        if (source) {
          el.textContent = source
        }
      })
      window.mermaid?.run()
    })
  }, [content, theme])

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
      <Markdown key={theme}>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation> */}
        <div dangerouslySetInnerHTML={{ __html: renderedMarkdown(error ? error : content || "") }} />
      </Markdown>
    </div>
  )
})
