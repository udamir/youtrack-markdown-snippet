import type React from "react"
import { useState, useEffect } from "react"

import LoaderInline from "@jetbrains/ring-ui-built/components/loader-inline/loader-inline"
import Select from "@jetbrains/ring-ui-built/components/select/select"
import Input from "@jetbrains/ring-ui-built/components/input/input"

import { parseMarkdownSections, getSectionContent } from "../../utils/markdown"
import { useWidgetContext } from "../../contexts/WidgetContext"
import { isValidEntityId } from "../../utils/youtrack"
import { useDebounce } from "../../hooks/useDebounce"
import { RendererComponent } from "../Renderer"
import { transformContent } from "../../utils"
import type { WidgetConfig } from "./types"

interface StaticContentTabProps {
  initialConfig: WidgetConfig | null
  updateConfig: (config: WidgetConfig & { content?: string, error?: string }) => void
}

export const StaticContentTab: React.FC<StaticContentTabProps> = ({ initialConfig, updateConfig }) => {
  const { youtrack } = useWidgetContext()
  const [entityId, setEntityId] = useState(initialConfig?.entityId || "")
  const [sectionTitle, setSectionTitle] = useState(initialConfig?.sectionTitle || "")
  const [contentField, setContentField] = useState(initialConfig?.contentField || "")
  // const [content, setContent] = useState("")

  // Fetch entity data only when entityId changes
  const [entity, entityError, entityLoading] = useDebounce(500, async () => {
    if (!entityId || !isValidEntityId(entityId)) {
      return null
    }

    return await youtrack.getEntityContent(entityId)
  }, [youtrack, entityId])

  // Update config when entity or form parameters change
  useEffect(() => {
    if (!entity) return

    // Generate content for preview (same logic as Content.tsx)
    const rawContent = contentField ? entity.fields[contentField] : entity.content
    const sectionContent = getSectionContent(rawContent || "", sectionTitle)
    const transformedContent = transformContent(sectionContent, entity.attachments)

    // Update config with entity data and content
    updateConfig({ 
      entityId, 
      sectionTitle, 
      contentField,
      content: transformedContent,
    })
    // setContent(transformedContent)
  }, [entity, entityId, sectionTitle, contentField, updateConfig])

  const sections = parseMarkdownSections(entity?.content || "")
  const sectionsList = sections.map((section) => ({
    label: `${"#".repeat(section.level)} ${section.title}`,
    key: section.title,
  }))

  const selectedSection = sections.find((s) => s.title === sectionTitle)
  
  const availableFields = Object.keys(entity?.fields || {}).map((fieldName) => ({
    label: fieldName,
    key: fieldName,
  })) 
  
  useEffect(() => {
    if (!entityError) return
    updateConfig({
      error: entityError,
    })
  }, [entityError, updateConfig])

  const error = entityError
  const loading = entityLoading

  return (
    <div className="tab-content-wrapper">
      <div className="config-section">
        <div className="content-id-row">
          <div className="content-id-input-container">
            <label htmlFor="content-id-input">Entity Id</label>
            <Input
              id="content-id-input"
              value={entityId}
              onChange={(event) => setEntityId(event.target.value)}
              placeholder="Enter issue/article ID (e.g., DEMO-123)"
              error={entityId && !isValidEntityId(entityId) ? "Invalid ID format" : null}
            />
          </div>
          <div className="content-id-loader">{loading && <LoaderInline />}</div>

          {/* Content field select - only show if entity has text fields */}
          {!!availableFields.length && (
            <div className="content-field-select-container">
              <label htmlFor="content-field-select">Content field</label>
              <Select
                id="content-field-select"
                disabled={entityLoading}
                data={[{ label: "Description", key: "" }, ...availableFields]}
                selected={{
                  label: contentField === "" ? "Description" : contentField,
                  key: contentField,
                }}
                onSelect={(item) => setContentField(item?.key || "")}
                className="full-width-select"
              />
            </div>
          )}
        </div>

        <div className="section-select-row">
          <label htmlFor="section-select">Section</label>
          <Select
            id="section-select"
            disabled={!sections.length || loading}
            data={[{ label: "All content", key: "" }, ...sectionsList]}
            selected={{
              label: selectedSection ? `${"#".repeat(selectedSection.level)} ${sectionTitle}` : "All content",
              key: sectionTitle || "",
            }}
            onSelect={(item) => setSectionTitle(item?.key || "")}
            className="full-width-select"
          />
        </div>
      </div>

      {/* <div className="preview-section">
        {error ? (
          <div className="error-message" role="alert">
            {error}
          </div>
        ) : content ? (
          <RendererComponent content={content} />
        ) : (
          <div className="preview-empty" />
        )}
      </div> */}
    </div>
  )
}
