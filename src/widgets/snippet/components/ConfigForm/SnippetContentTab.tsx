import type React from "react"
import { useEffect, useState } from "react"

import LoaderInline from "@jetbrains/ring-ui-built/components/loader-inline/loader-inline"
import type { SelectItem } from "@jetbrains/ring-ui-built/components/select/select"
import Select from "@jetbrains/ring-ui-built/components/select/select"
import Input from "@jetbrains/ring-ui-built/components/input/input"

import type { Snippet, SnippetInput } from "../../services/YoutrackService"
import { useWidgetContext } from "../../contexts/WidgetContext"
import type { SnippetInfo, WidgetConfig } from "./types"
import { useDebounce } from "../../hooks/useDebounce"
import { RendererComponent } from "../Renderer"

interface SnippetContentTabProps {
  initialConfig: WidgetConfig | null
  updateConfig: (config: WidgetConfig & { content?: string, error?: string }) => void
}

export const SnippetContentTab: React.FC<SnippetContentTabProps> = ({ initialConfig, updateConfig }) => {
  const { snippetWorkflow, snippetRule, snippetParam, snippetTitle } = initialConfig || {}
  const { youtrack, currentUser, entityId } = useWidgetContext()
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(
    snippetWorkflow && snippetRule && snippetTitle
      ? { workflow: snippetWorkflow, rule: snippetRule, title: snippetTitle }
      : null,
  )
  const [input, setInput] = useState<SnippetInput["input"] | null>(null)
  const [param, setParam] = useState(snippetParam || "")

  const [snippets, snippetsError, snippetsLoading] = useDebounce(500, () => youtrack.getSnippets(), [youtrack])

  const [snippet, snippetError, snippetLoading] = useDebounce(
    500,
    async () => {
      if (!selectedSnippet) {
        return null
      }
      const { workflow, rule } = selectedSnippet

      const snippet = await youtrack.getSnippet(workflow, rule, param, currentUser?.login, entityId)

      // If snippet has input, we need to show it
      if ("input" in snippet) {
        setInput(snippet.input!)
      }

      if ("content" in snippet && "title" in snippet) {
        updateConfig({
          snippetWorkflow: workflow,
          snippetRule: rule,
          snippetParam: param,
          snippetTitle: snippet.title,
          content: snippet.content,
        })
      }

      return snippet
    },
    [youtrack, selectedSnippet, param],
  )

  useEffect(() => {
    if (snippetError || snippetsError) {
      updateConfig({
        error: snippetsError || snippetError,
      })
    }
  }, [updateConfig, snippetError, snippetsError])

  // const error = snippetsError || snippetError
  const loading = snippetsLoading || snippetLoading

  const data =
    snippets?.map((snippet) => ({
      label: snippet.title,
      key: `${snippet.workflow}:${snippet.rule}`,
      snippet: snippet,
    })) || []

  const selected = selectedSnippet
    ? {
        label: selectedSnippet.title,
        key: `${selectedSnippet.workflow}:${selectedSnippet.rule}`,
        snippet: selectedSnippet,
      }
    : null

  const onSelectSnippet = (item: SelectItem | null) => {
    if (item && "snippet" in item) {
      setSelectedSnippet(item.snippet as SnippetInfo)
    } else {
      setSelectedSnippet(null)
    }
  }

  return (
    <div className="tab-content-wrapper">
      <div className="config-section">
        <div className="content-id-row">
          <div className="content-id-input-container">
            <label htmlFor="snippet-select">Workflow Snippet</label>
            <Select
              id="snippet-select"
              data={data}
              selected={selected}
              onSelect={onSelectSnippet}
              className="full-width-select"
              filter
              label="Select a snippet..."
            />
          </div>
          <div className="content-id-loader">{loading && <LoaderInline />}</div>
        </div>

        {input && (
          <div className="section-select-row">
            <label htmlFor="param-input">{input.description || "Parameter"}</label>
            <Input
              id="param-input"
              value={param}
              onChange={(e) => setParam(e.target.value)}
              className="full-width-input"
              placeholder="Enter parameter..."
            />
          </div>
        )}
      </div>

      {/* <div className="preview-section">
        {error ? (
          <div className="error-message" role="alert">
            {error || "Failed to load snippet"}
          </div>
        ) : snippet && "content" in snippet && snippet.content ? (
          <RendererComponent content={snippet.content} />
        ) : (
          <div className="preview-empty" />
        )}
      </div> */}
    </div>
  )
}
