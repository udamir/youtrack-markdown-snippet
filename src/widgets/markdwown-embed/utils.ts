import { getEntityTypeById } from "../../utils/youtrack"

export const transformContent = (content: string, attachments: Record<string, string>): string => {
  // Process images and attachments
  const processedContent = processImageAttributes(content, attachments);
  
  // Process issue IDs to links
  const processedContentWithLinks = convertIssueIdsToLinks(processedContent);
  
  return processedContentWithLinks;
}

/**
 * Process YouTrack's image attributes syntax: ![alt](image.png){width=100px height=200px}
 * and handle attachments by directly inserting HTML
 */
export const processImageAttributes = (content: string, attachments: Record<string, string>): string => {
  try {
    // Handle regular images with YouTrack attribute syntax
    const imageAttributeRegex = /!\[(.*?)\]\((.*?)\)(?:\{(.*?)\})?/g

    return content.replace(imageAttributeRegex, (_, alt, src, attrs) => {
      // Extract attributes if present
      let width = ""
      let height = ""
      if (attrs) {
        const attrParts = attrs.split(" ")
        width = attrParts.find((attr: string) => attr.startsWith("width="))?.replace("width=", "") || ""
        height = attrParts.find((attr: string) => attr.startsWith("height="))?.replace("height=", "") || ""
      }

      // Try to find a matching attachment by exact name or filename
      let finalSrc = src
      if (attachments) {
        const fileName = src.split("/").pop() || src

        // First try direct match
        if (attachments[src]) {
          finalSrc = attachments[src]
        } else {
          const attachmentKey = Object.keys(attachments).find(
            (key: string) => key.endsWith(fileName) || key === fileName,
          )

          if (attachmentKey) {
            finalSrc = attachments[attachmentKey]
          }
        }

        // Ensure the URL has YouTrack base URL if needed
        if (finalSrc && finalSrc !== src) {
          // If the URL doesn't already start with http/https, add the YouTrack base URL
          if (!finalSrc.startsWith("http://") && !finalSrc.startsWith("https://")) {
            // If the URL already starts with a slash, just append to base URL
            if (finalSrc.startsWith("/")) {
              finalSrc = `${finalSrc}`
            } else {
              // Otherwise add a slash between base URL and path
              finalSrc = `/${finalSrc}`
            }
          }
        }
      }

      // Generate direct HTML for the image to ensure attributes are handled correctly
      let style = ""
      if (width) style += `width: ${width};`
      if (height) style += `height: ${height};`

      return `<img src="${finalSrc}" alt="${alt}" style="${style}" loading="lazy" />`
    })
  } catch (error) {
    return content
  }
}

/**
 * Convert issue IDs (like PROJECT-123) to clickable links
 */
export const convertIssueIdsToLinks = (content: string): string => {
  try {
    // Regular expression to find issue IDs like PROJECT-123
    // Ensure we don't match IDs that are already part of a link
    const issueRegex = /(?<!\[|\]\()(?<!\w)([A-Z][A-Z0-9]+-\d+)(?!\w)(?!\]|\))/g

    // Replace issue IDs with clickable links
    return content.replace(issueRegex, (match) => `[${match}](/${getEntityTypeById(match)}/${match})`)
  } catch (error) {
    return content
  }
}
