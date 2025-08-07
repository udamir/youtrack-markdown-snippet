import type { YouTrack } from "youtrack-client";
import { tryCatch } from "./tryCatch";

import JSZip from "jszip"

/**
 * Validates if a string is a valid YouTrack entity ID format
 * Valid formats: XXX-DDD or XXX-A-DDD where X is letter, D is digit, A is constant letter
 * @param id String to validate
 * @returns Boolean indicating if the ID is valid
 */
export const isValidEntityId = (id: string): boolean => {
  // Issue format: PROJECT-123 or PROJECT-A-123
  // Where PROJECT is 1+ letters, followed by optional digits
  // 123 is 1+ digits
  // A is optional
  return /^[A-Z]+[A-Z0-9]*-(?:[A]-)?\d+$/i.test(id);
}

/**
 * Determines if an ID belongs to an article or issue based on its format
 * @param id YouTrack entity ID
 * @returns Entity type: "issue" or "article"
 */
export const getEntityTypeById = (id: string): "issue" | "article" => {
  const [_, __, articleId] = id.split("-")
  return articleId ? "article" : "issue"
}

/**
 * Returns the URL for a given entity ID
 * @param id YouTrack entity ID
 * @returns URL for the entity
 */
export const getEntityUrl = (id: string, baseUrl = ""): string => {
  const entityType = getEntityTypeById(id);
  return `${baseUrl}/${entityType}/${id}`;
}

/**
 * Fetches the content of an entity (issue description or article content)
 * @param entityId YouTrack entity ID
 * @param youtrack YouTrack client instance
 * @returns Tuple of [content, error]
 */
export const fetchEntityContent = async (entityId: string, youtrack: YouTrack): Promise<{ summary: string, content: string, fields: Record<string, string>, attachments: Record<string, string>, error: Error | null }> => {
  const entityType = getEntityTypeById(entityId);
  
  if (entityType === 'issue') {
    const [issue, error] = await tryCatch(youtrack.Issues.getIssueById(entityId, {fields: 'summary,description,attachments(id,url,name),fields(id,name,value(text))'}));
    return { 
      summary: issue?.summary ?? '', 
      content: issue?.description ?? '', 
      fields: (issue as any)?.fields.reduce(
        (acc: Record<string, string>, { name, value, $type }: { name: string, $type: string, value: { text: string } }) => {
          if (!name || !value || $type !== "TextIssueCustomField") return acc
          acc[name] = value.text
          return acc
        },
        {} as Record<string, string>,
      ) ?? {},
      attachments: issue?.attachments.reduce(
        (acc, { name, url }) => {
          if (!name || !url) return acc
          acc[name] = url || ""
          return acc
        },
        {} as Record<string, string>,
      ) ?? {},
      error
    };
  }  
  
  if (entityType === 'article') {
    const [article, error] = await tryCatch(youtrack.Articles.getArticle(entityId, {fields: 'summary,content,attachments(id,url,name)'}));
    return { 
      summary: article?.summary ?? '', 
      content: article?.content ?? '', 
      fields: {},
      attachments: article?.attachments.reduce(
        (acc, { name, url }) => {
          if (!name || !url) return acc
          acc[name] = url || ""
          return acc
        },
        {} as Record<string, string>,
      ) ?? {},
      error
    };
  }

  return { summary: '', content: '', fields: {}, attachments: {}, error: new Error('Invalid entity type') };
}

export type WorkflowEntity = {
  id: string
  name: string
}

export const fetchWorkflows = async (youtrack: YouTrack): Promise<WorkflowEntity[]> => {
  return []
  // const [data, error] = await tryCatch(
  //   youtrack.fetch<WorkflowEntity[]>({
  //     url: "/api/admin/workflows?fields=id,name&$top=-1&query=language:JS,mps",
  //   }),
  // )
  // if (error) {
  //   throw new Error(`Cannot fetch workflows: ${error}`)
  // }
  // return data
}

/**
 * Fetch a workflow script names with embedRenderer from YouTrack
 * @param workflow Workflow name
 * @returns {Promise<string[] | null>} Workflow scripts as an array of strings
 * @throws {YouTrackApiError} If the workflow cannot be fetched
 */
export const fetchWorkflowScripts = async (workflow: string, youtrack: YouTrack): Promise<string[] | null> => {
  return []
  // // Remove @ prefix but don't encode the whole name
  // const workflowName = workflow.replace(/^@/, "")
  // const [blob, error] = await tryCatch(youtrack.fetch<Blob>({
  //   url: `/api/admin/workflows/${workflowName}`,
  //   method: "GET",
  //   headers: { Accept: "application/zip" },
  // }))
  // if (error) {
  //   throw new Error(`Error while fetching workflow '${workflow}'`)
  // }

  // // Convert blob to buffer and unzip
  // const arrayBuffer = await blob.arrayBuffer()
  // const zip = await JSZip.loadAsync(Buffer.from(arrayBuffer))

  // // Extract files with their content
  // const files: string[] = []

  // for (const [fileName, file] of Object.entries(zip.files)) {
  //   const script = await file.async("string")
  //   if (script.includes("exports.embedRenderer")) {
  //     files.push(fileName)
  //   }
  // }

  // return files
}

export const fetchWorkflowScriptContent = async (workflow: string, script: string, param = "", youtrack: YouTrack): Promise<string | null> => {
  const scripts = await fetchWorkflowScripts(workflow, youtrack)
  if (!scripts || scripts.length === 0) {
    return null
  }
  return scripts[0]
}