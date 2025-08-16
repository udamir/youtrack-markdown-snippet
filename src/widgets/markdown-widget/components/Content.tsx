import { getSectionContent, transformContent } from "../utils"
import { useWidgetContext } from "../contexts/WidgetContext"
import type { WidgetContentComponentType } from "./Widget"
import { useDebounce } from "../hooks/useDebounce"
import type { WidgetConfig } from "./ConfigForm"
import { RendererComponent } from "./Renderer"

export const WidgetContent: WidgetContentComponentType<WidgetConfig> = ({ config, setTitle, refreshTrigger }) => {
  const { youtrack, currentUser, entityId } = useWidgetContext()

  const [content, contentError, contentLoading] = useDebounce(500, async () => {
    if (config?.entityId) {
      const entity = await youtrack.getEntityContent(config.entityId)
      const { sectionTitle, contentField } = config
      const content = getSectionContent(contentField ? entity.fields[contentField] : entity.content, sectionTitle || "")
      setTitle?.(entity.summary)
      return transformContent(content, entity.attachments)
    }

    if (config?.snippetWorkflow && config.snippetRule) {
      const [snippet, error] = await youtrack.getSnippet(
        config.snippetWorkflow,
        config.snippetRule,
        config.snippetParam || "",
        currentUser?.login,
        entityId,
        refreshTrigger
      )

      if (error) {
        throw new Error(`Error while fetching snippet content!\n\n\`\`\`\n${error.data.message}\n\n${error.data.stack}\n\`\`\``)
      }
      
      if ("title" in snippet && "content" in snippet) {
        setTitle?.(snippet.title)
        return transformContent(snippet.content, {})
      }
    }

    throw new Error(`Invalid configuration: ${JSON.stringify(config)}`)
  }, [config, refreshTrigger])

  return (
    <div className="widget">
      <RendererComponent content={content} loading={contentLoading} error={contentError} />
    </div>
  )
}
