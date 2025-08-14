import type React from "react"
import { useState } from "react"

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
  initialConfig: WidgetConfig
  updateConfig: (config: WidgetConfig) => void
}

export const SnippetContentTab: React.FC<SnippetContentTabProps> = ({ initialConfig, updateConfig }) => {
  const {snippetWorkflow, snippetRule, snippetParam, snippetTitle} = initialConfig
  const { youtrack, currentUser, entityId } = useWidgetContext()
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(snippetWorkflow && snippetRule && snippetTitle ? { workflow: snippetWorkflow, rule: snippetRule, title: snippetTitle } : null)
  const [input, setInput] = useState<SnippetInput["input"] | null>(null)
  const [param, setParam] = useState(snippetParam || "")

  const [snippets, snippetsError, snippetsLoading] = useDebounce(500, () => youtrack.getSnippets(), [youtrack])

  const [snippet, snippetError, snippetLoading] = useDebounce(500, async () => {
    if (!selectedSnippet) {
      return null
    }
    const { workflow, rule } = selectedSnippet
    console.log(currentUser, entityId)

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
        // Clear static content fields when using snippet
        entityId: undefined,
        sectionTitle: undefined,
        contentField: undefined,
      })
    }

    return snippet
  },[youtrack, selectedSnippet, param])

  const error = snippetsError || snippetError
  const loading = snippetsLoading || snippetLoading

  const data = snippets?.map((snippet) => ({
    label: snippet.title,
    key: `${snippet.workflow}:${snippet.rule}`,
    snippet: snippet,
  })) || []

  const selected = selectedSnippet ? {
    label: selectedSnippet.title,
    key: `${selectedSnippet.workflow}:${selectedSnippet.rule}`,
    snippet: selectedSnippet,
  } : null

  const onSelectSnippet = (item: SelectItem | null) => {
    if (item && "snippet" in item) {
      setSelectedSnippet(item.snippet as SnippetInfo)
    } else {
      setSelectedSnippet(null)
    }
  }

  return (
    <>
      <div className="content-id-row">
        <div className="content-id-input-container">
          <label htmlFor="snippet-select">Available Workflow Snippets</label>
          <Select
            id="snippet-select"
            disabled={loading}
            data={data}
            selected={selected}
            onSelect={onSelectSnippet}
            className="full-width-select"
          />
        </div>

        <div className="content-id-loader">{loading && <LoaderInline />}</div>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <div className="snippet-info">
        {input && (
          <div className="snippet-input-section">
            <label htmlFor="snippet-param-input">
              {input.description || "Parameter"}
              {input.type && <span className="input-type"> ({input.type})</span>}
            </label>
            <Input
              id="snippet-param-input"
              value={param}
              onChange={(event) => setParam(event.target.value)}
              placeholder={`Enter ${input.type || "parameter"}...`}
            />
          </div>
        )}
      </div>

      <div className="preview-delimiter" />

      {snippet && "content" in snippet && snippet.content && (
        <div className="preview-section">
          <div className="preview-container">
            <RendererComponent content={snippet.content} />
          </div>
        </div>
      )}
    </>
  )
}
