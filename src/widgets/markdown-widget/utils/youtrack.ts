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


export const transformContent = (content: string, attachments: Record<string, string>): string => {
  // Process images and attachments
  const processedContent = processImageAttributes(content, attachments);
  
  // Process issue IDs to links (preserving code blocks)
  const processedContentWithLinks = convertIssueIdsToLinks(processedContent);
  
  return processedContentWithLinks;
}

/**
 * Process YouTrack's image attributes syntax: ![alt](image.png){width=100px height=200px}
 * and handle attachments by directly inserting HTML
 */
export const processImageAttributes = (content: string, attachments: Record<string, string>): string => {
  try {
    // If no attachments, return content as-is
    if (!attachments || Object.keys(attachments).length === 0) {
      return content
    }

    // Create dynamic regex based on actual attachment names
    const attachmentNames = Object.keys(attachments)
      .map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // Escape special regex characters
      .join('|')
    
    // Match images with any of the actual attachment names
    const imageAttributeRegex = new RegExp(
      `!\\[([^\\]]*)\\]\\((${attachmentNames})\\)(?:\\{([^}]*)\\})?`,
      'g'
    )

    return content.replace(imageAttributeRegex, (_, alt, src, attrs) => {
      // Extract attributes if present
      let width = ""
      let height = ""
      if (attrs) {
        const attrParts = attrs.split(" ")
        width = attrParts.find((attr: string) => attr.startsWith("width="))?.replace("width=", "") || ""
        height = attrParts.find((attr: string) => attr.startsWith("height="))?.replace("height=", "") || ""
      }

      // Direct replacement since regex already matched exact attachment name
      const finalSrc = attachments[src]

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
 * Skip processing inside ALL code blocks (inline and fenced) to preserve code syntax
 */
export const convertIssueIdsToLinks = (content: string): string => {
  try {
    const codeBlocks: string[] = [];
    let blockIndex = 0;
    
    // Replace all fenced code blocks with placeholders (```language...```)
    let contentWithPlaceholders = content.replace(
      /```[\s\S]*?```/g, 
      (match) => {
        const placeholder = `__CODE_BLOCK_${blockIndex}__`;
        codeBlocks.push(match);
        blockIndex++;
        return placeholder;
      }
    );
    
    // Replace inline code blocks with placeholders (`code`)
    contentWithPlaceholders = contentWithPlaceholders.replace(
      /`[^`\n]+`/g,
      (match) => {
        const placeholder = `__INLINE_CODE_${blockIndex}__`;
        codeBlocks.push(match);
        blockIndex++;
        return placeholder;
      }
    );
    
    // Regular expression to find issue IDs like PROJECT-123
    // Ensure we don't match IDs that are already part of a link
    const issueRegex = /(?<!\[|\]\()(?<!\w)([A-Z][A-Z0-9]+-\d+)(?!\w)(?!\]|\))/g;

    // Replace issue IDs with clickable links (only in non-code content)
    let processedContent = contentWithPlaceholders.replace(
      issueRegex, 
      (match) => `[${match}](/${getEntityTypeById(match)}/${match})`
    );
    
    // Restore all code blocks
    codeBlocks.forEach((block, index) => {
      processedContent = processedContent.replace(
        `__CODE_BLOCK_${index}__`, 
        block
      ).replace(
        `__INLINE_CODE_${index}__`, 
        block
      );
    });
    
    return processedContent;
  } catch (error) {
    return content;
  }
}
