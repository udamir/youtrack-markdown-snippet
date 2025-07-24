import type { YouTrack } from "youtrack-client";
import { tryCatch } from "./tryCatch";

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
export const getEntityUrl = (id: string): string => {
  const entityType = getEntityTypeById(id);
  return `/${entityType}/${id}`;
}

/**
 * Fetches the content of an entity (issue description or article content)
 * @param entityId YouTrack entity ID
 * @param youtrack YouTrack client instance
 * @returns Tuple of [content, error]
 */
export const fetchEntityContent = async (entityId: string, youtrack: YouTrack): Promise<{ summary: string, content: string, attachments: Record<string, string>, error: Error | null }> => {
  const entityType = getEntityTypeById(entityId);
  
  if (entityType === 'issue') {
    const [issue, error] = await tryCatch(youtrack.Issues.getIssueById(entityId, {fields: 'summary,description,attachments(id,url,name)'}));
    return { 
      summary: issue?.summary ?? '', 
      content: issue?.description ?? '', 
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

  return { summary: '', content: '', attachments: {}, error: new Error('Invalid entity type') };
}
