import { useState } from "react"

import ButtonSet from "@jetbrains/ring-ui-built/components/button-set/button-set.js"
import Button from "@jetbrains/ring-ui-built/components/button/button.js"
import Tabs from "@jetbrains/ring-ui-built/components/tabs/dumb-tabs"
import Tab from "@jetbrains/ring-ui-built/components/tabs/tab"

import type { WidgetConfigFormComponentType } from "../Widget"
import { SnippetContentTab } from "./SnippetContentTab"
import { StaticContentTab } from "./StaticContentTab"
import type { WidgetConfig } from "./types"

import "./ConfigForm.css"
import { RendererComponent } from "../Renderer"

export const WidgetConfigForm: WidgetConfigFormComponentType<WidgetConfig> = ({
  initialConfig,
  onSubmit,
  onCancel,
}) => {
  const [activeTab, setActiveTab] = useState(initialConfig?.snippetWorkflow ? "snippet" : "static")
  const [staticConfig, setStaticConfig] = useState<WidgetConfig & { content?: string, error?: string } | null>(initialConfig)
  const [snippetConfig, setSnippetConfig] = useState<WidgetConfig & { content?: string, error?: string } | null>(initialConfig)

  const isConfigCorrect = (config: WidgetConfig | null) =>
    config && (config.entityId || (config.snippetWorkflow && config.snippetRule))

  const config = () => activeTab === "static" ? staticConfig : snippetConfig
  
  return (
    <div className="markdown-snippet-config">
      <Tabs className="tab-navigation" selected={activeTab} onSelect={setActiveTab}>
        <Tab id="static" title="Entity Content">
          <StaticContentTab {...{ initialConfig: staticConfig, updateConfig: setStaticConfig }} />
        </Tab>

        <Tab id="snippet" title="Workflow Snippet">
          <SnippetContentTab {...{ initialConfig: snippetConfig, updateConfig: setSnippetConfig }} />
        </Tab>
      </Tabs>

      <div className="preview-section">
        {config()?.error ? (
          <div className="error-message" role="alert">
            {config()?.error || "Failed to load snippet"}
          </div>
        ) : config()?.content ? (
          <RendererComponent content={config()!.content!} />
        ) : (
          <div className="preview-empty" />
        )}
      </div>

      <div className="bottom-button-container">
        <ButtonSet className="config-buttons">
          <Button
            primary
            disabled={config()=== initialConfig || !isConfigCorrect(config())}
            onClick={() => onSubmit(config()!)}
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
