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

export const WidgetConfigForm: WidgetConfigFormComponentType<WidgetConfig> = ({
  initialConfig,
  onSubmit,
  onCancel,
}) => {
  const [activeTab, setActiveTab] = useState(initialConfig?.entityId ? "static" : "snippet")
  const [config, setConfig] = useState<WidgetConfig>(initialConfig)

  const isConfigCorrect = (config: WidgetConfig) =>
    config.entityId || (config.snippetWorkflow && config.snippetRule)

  return (
    <div className="markdown-embed-config">
      <Tabs selected={activeTab} onSelect={setActiveTab}>
        <Tab id="static" title="Static Content">
          <StaticContentTab {...{ initialConfig: config, updateConfig: setConfig }} />
        </Tab>

        <Tab id="snippet" title="Workflow Snippet">
          <SnippetContentTab {...{ initialConfig: config, updateConfig: setConfig }} />
        </Tab>
      </Tabs>

      <div className="bottom-button-container">
        <ButtonSet className="config-buttons">
          <Button
            primary
            disabled={config === initialConfig || !isConfigCorrect(config)}
            onClick={() => onSubmit(config)}
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
