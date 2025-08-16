import { useState } from "react"

import ButtonSet from "@jetbrains/ring-ui-built/components/button-set/button-set.js"
import Button from "@jetbrains/ring-ui-built/components/button/button.js"
import Tabs from "@jetbrains/ring-ui-built/components/tabs/dumb-tabs"
import Tab from "@jetbrains/ring-ui-built/components/tabs/tab"

import type { WidgetConfigFormComponentType } from "../Widget"
import { SnippetContentTab } from "./SnippetContentTab"
import { StaticContentTab } from "./StaticContentTab"
import type { WidgetConfig } from "../../types"

import "./ConfigForm.css"
import { RendererComponent } from "../Renderer"

export const WidgetConfigForm: WidgetConfigFormComponentType<WidgetConfig> = ({
  initialConfig,
  onSubmit,
  onCancel,
}) => {
  const [activeTab, setActiveTab] = useState(initialConfig?.snippetWorkflow ? "snippet" : "static")
  const [staticState, setStaticState] = useState<WidgetConfig & { content?: string, error?: string } | null>(initialConfig)
  const [snippetState, setSnippetState] = useState<WidgetConfig & { content?: string, error?: string } | null>(initialConfig)

  const isConfigCorrect = (config: WidgetConfig | null) =>
    config && (config.entityId || (config.snippetWorkflow && config.snippetRule))

  // Use function overloads for better type safety
  function tabData(contentType: "config"): WidgetConfig | null
  function tabData(contentType: "content" | "error"): string | null
  function tabData(contentType: "config" | "content" | "error"): WidgetConfig | string | null {
    const data = activeTab === "static" ? staticState : snippetState
    if (!data) return null
    const { content = null, error = null, ...config} = data
    switch (contentType) {
      case "config": return config
      case "content": return content
      case "error": return error
      default: return null
    }
  }
  
  return (
    <div className="markdown-snippet-config">
      <Tabs className="tab-navigation" selected={activeTab} onSelect={setActiveTab}>
        <Tab id="static" title="Entity Content">
          <StaticContentTab {...{ initialConfig: staticState, updateConfig: setStaticState }} />
        </Tab>

        <Tab id="snippet" title="Workflow Snippet">
          <SnippetContentTab {...{ initialConfig: snippetState, updateConfig: setSnippetState }} />
        </Tab>
      </Tabs>

      <div className="preview-section">
        <RendererComponent content={tabData("content")} loading={false} error={tabData("error")} />
      </div>

      <div className="bottom-button-container">
        <ButtonSet className="config-buttons">
          <Button
            primary
            disabled={tabData("config") === initialConfig || !isConfigCorrect(tabData("config"))}
            onClick={() => onSubmit(tabData("config")!)}
          >
            Save
          </Button>
          <Button secondary onClick={() => onCancel()}>
            Cancel
          </Button>
        </ButtonSet>
      </div>
    </div>
  )
}
