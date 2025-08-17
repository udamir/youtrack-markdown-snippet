import type React from "react"
import { useEffect, useState } from "react"

import LoaderInline from "@jetbrains/ring-ui-built/components/loader-inline/loader-inline"
import type { SelectItem } from "@jetbrains/ring-ui-built/components/select/select"
import Select from "@jetbrains/ring-ui-built/components/select/select"
import Input, { Size } from "@jetbrains/ring-ui-built/components/input/input"

import type { Snippet, SnippetInput } from "../../services/YoutrackService"
import { useWidgetContext } from "../../contexts/WidgetContext"
import type { SnippetInfo, WidgetConfig } from "../../types"
import { useDebounce } from "../../hooks/useDebounce"

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
  
  const [snippet, snippetError, snippetLoading] = useDebounce(500, async () => {
    if (!selectedSnippet) {
      updateConfig({ error: undefined })
      return null
    }
    const { workflow, rule } = selectedSnippet

    const [snippet, error] = await youtrack.getSnippet(workflow, rule, param, currentUser?.login, entityId)

    if (error) {
      updateConfig({ error: `Error while fetching snippet content!\n\n\`\`\`\n${error.data.message}\n\n${error.data.stack}\n\`\`\`` })
      return null
    }

    // If snippet has input, we need to show it
    if ("input" in snippet) {
      setInput(snippet.input!)
    }

    if ("content" in snippet && "title" in snippet) {
      updateConfig({
        title: `${selectedSnippet.title}${param ? ` - ${param}` : ""}`,
        snippetWorkflow: workflow,
        snippetRule: rule,
        snippetParam: param,
        snippetTitle: selectedSnippet.title,
        content: snippet.content,
      })
    }

    return snippet
  }, [youtrack, selectedSnippet, param])

  // Ensure param is valid when enum is provided
  useEffect(() => {
    if (input?.enum?.length) {
      const options = (input?.enum ?? []).map(v => String(v))
      if (!options.includes(param)) {
        setParam(options[0] ?? "")
      }
    }
  }, [input])

  useEffect(() => {
    if (snippetError || snippetsError) {
      updateConfig({
        error: snippetsError || snippetError,
      })
    }
  }, [updateConfig, snippetError, snippetsError])

  const getData = (snippets: Snippet[] | null) => snippets?.map((snippet) => ({
      label: snippet.title,
      key: `${snippet.workflow}:${snippet.rule}`,
      snippet: snippet,
    })) || []

  const selected = (snippet: Snippet | null) => snippet
    ? {
        label: snippet.title,
        key: `${snippet.workflow}:${snippet.rule}`,
        snippet: snippet,
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
              data={getData(snippets)}
              selected={selected(selectedSnippet)}
              onSelect={onSelectSnippet}
              className="full-width-select"
              filter
              label="Select a snippet..."
            />
          </div>
          <div className="content-id-loader">{(snippetsLoading || snippetLoading) && <LoaderInline />}</div>
        </div>

        {input && (
          <div className="section-select-row">
            <label htmlFor="param-input">{input.description || "Parameter"}</label>
            {input?.enum?.length ? (
              <Select
                id="param-select"
                data={(input?.enum ?? []).map((v) => ({ label: String(v), key: String(v) }))}
                selected={param ? { label: String(param), key: String(param) } : null}
                onSelect={(item: SelectItem | null) => {
                  if (item) setParam(String((item as any).key))
                }}
                size={Size.FULL}
                label="Select a value..."
                filter
              />
            ) : input.type === "text" ? (
              <textarea
                id="param-input"
                value={param}
                onChange={(e) => setParam(e.target.value)}
                rows={6}
                style={{ height: "48px" }}
                placeholder="Enter text..."
              />
            ) : (
              <Input
                id="param-input"
                value={param}
                onChange={(e) => setParam(e.target.value)}
                size={Size.FULL}
                placeholder="Enter parameter..."
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
