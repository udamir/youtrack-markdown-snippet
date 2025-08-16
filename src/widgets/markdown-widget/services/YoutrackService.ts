import { YouTrack } from "youtrack-client"
import { tryCatch } from "../utils/tryCatch"

import type { EmbeddableWidgetAPI } from "../../../../@types/globals"
import type { RequestParams } from "@jetbrains/ring-ui-built/components/http/http.js"
import { getEntityTypeById } from "../utils"

export type EntityContent = {
  summary: string
  content: string
  fields: Record<string, string>
  attachments: Record<string, string>
}

export type Snippet = {
  title: string
  workflow: string
  rule: string
}

export type SnippetContent = {
  title: string
  content: string
} & Partial<SnippetInput>

export type SnippetInput = {
  input: {
    type: "string" | "number" | "boolean" | "text"
    enum?: string[] | number[]
    description: string
  }
}

export type SnippetError = {
  message: string
  stack: string
}

export class YoutrackService {
  private youtrack: YouTrack

  constructor(private readonly host: EmbeddableWidgetAPI) {
    this.youtrack = new YouTrack("", (config) => {
      const { url, data, ...rest } = config
      return this.host.fetchYouTrack(url.slice(4), {
        ...(data ? { body: data } : {}),
        ...rest,
      })
    })
  }

  public fetchYouTrack(url: string, config?: RequestParams) {
    return this.host.fetchYouTrack(url, config)
  }
  
  public getCurrentUser() {
    return this.youtrack.Users.getCurrentUserProfile({ fields: ["id", "login"] })
  }

  public async getEntityContent(entityId: string): Promise<EntityContent> {
    const entityType = getEntityTypeById(entityId)

    if (entityType === "issue") {
      const [issue, error] = await tryCatch(
        this.youtrack.Issues.getIssueById(entityId, {
          fields: "summary,description,attachments(id,url,name),customFields($type,id,name,value(text))",
        }),
      )
      if (error) {
        throw new Error(`Error while fetching issue '${entityId}', error: ${error.message}`)
      }
      return {
        summary: issue?.summary ?? "",
        content: issue?.description ?? "",
        fields:
          issue?.customFields.reduce(
            (acc: Record<string, string>, { name, value, $type }) => {
              if (!name || !value || $type !== "TextIssueCustomField") {
                return acc
              }
              acc[name] = value.text
              return acc
            },
            {} as Record<string, string>,
          ) ?? {},
        attachments:
          issue?.attachments.reduce(
            (acc, { name, url }) => {
              if (!name || !url) return acc
              acc[name] = url || ""
              return acc
            },
            {} as Record<string, string>,
          ) ?? {},
      }
    }

    if (entityType === "article") {
      const [article, error] = await tryCatch(
        this.youtrack.Articles.getArticle(entityId, { fields: "summary,content,attachments(id,url,name)" }),
      )
      if (error) {
        throw new Error(`Error while fetching article '${entityId}', error: ${error.message}`)
      }
      return {
        summary: article?.summary ?? "",
        content: article?.content ?? "",
        fields: {},
        attachments:
          article?.attachments.reduce(
            (acc, { name, url }) => {
              if (!name || !url) return acc
              acc[name] = url || ""
              return acc
            },
            {} as Record<string, string>,
          ) ?? {},
      }
    }

    throw new Error(`Error: entity with id '${entityId}' not found`)
  }

  public getSnippets = async (): Promise<Snippet[]> => {
    const [data, error] = await tryCatch(
      this.youtrack.Admin.Workflows.getWorkflows({
        fields: "id,name,rules(id,name,title,type)",
        $top: -1,
        query: "language:JS,mps",
      }),
    )
    if (error) {
      throw new Error(`Cannot fetch workflows: ${JSON.stringify(error)}`)
    }

    const snippets = []
    for (const workflow of data) {
      for (const rule of workflow.rules) {
        if (rule.title?.startsWith("snippet:") && rule.type === "StatelessActionRule") {
          snippets.push({ title: rule.title.slice(8), workflow: workflow.name, rule: rule.name })
        }
      }
    }

    return snippets
  }

  public getSnippet = async (workflow: string, rule: string, userInput = "", login = "", entityId = "", refreshCount = 0) => {
    return tryCatch<SnippetContent | SnippetInput, { data: SnippetError }>(
      this.host.fetchApp<SnippetContent | SnippetInput>("backend-global/snippet", { query: { workflow, rule, userInput, login, entityId, refreshCount }, scope: false }),
    )
  }
}
