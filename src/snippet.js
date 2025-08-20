/** 
 * @import { Issue, Article, User } from "@jetbrains/youtrack-scripting-api/entities" 
 * 
 * @typedef {{
 *  name: string;                                         // Name of the snippet
 *  title: string;                                        // Title of the snippet
 *  userInput?: {
 *    type: "string" | "number" | "boolean" | "text";     // Type of the user input
 *    enum?: string[] | number[];                         // Enum values for the user input
 *    description: string;                                // Description of the user input
 *  };
 *  action: (
 *    ctx: {
 *      article: Article | null;                          // Article if snippet is in article
 *      issue: Issue | null;                              // Issue if snippet is in issue
 *      currentUser: User | null;                         // Current user
 *      userInput?: string | number | boolean             // User input value
 *      refreshCount?: number                             // Refresh count
 *    }
 *  ) => string;                                          // Action to be performed
 * }} SnippetRule
 */

class Snippet {
  /**
   * Embeds a snippet into the markdown content
   * @param {SnippetRule} rule
   * @returns {Snippet}
   */
  static forMarkdown(rule) {
    const { title, name, action, userInput } = rule;

    if (!title || !name || !action) {
      throw new Error("Snippet rule must have title, name and action");
    }

    if (typeof action !== "function") {
      throw new Error("Snippet rule action must be a function");
    }

    if (userInput) {
      if (!["string", "number", "boolean", "text"].includes(userInput.type)) {
        throw new Error("Snippet rule userInput type must be 'string', 'number', 'boolean' or 'text'");
      }
      if (!userInput.description) {
        throw new Error("Snippet rule userInput must have description");
      }
      if (userInput.enum) {
        if (userInput.type !== "string" && userInput.type !== "number") {
          throw new Error("Snippet rule userInput enum is only supported for string and number types");
        }

        if (!Array.isArray(userInput.enum)) {
          throw new Error("Snippet rule userInput enum must be an array");
        }
        if (userInput.enum.some((v) => typeof v !== "string" && typeof v !== "number")) {
          throw new Error("Snippet rule userInput enum must contain only strings or numbers");
        }
      }
    }

    return {
      title: `snippet:${title}`,
      command: `snippet:${name}`,
      action: action,
      guard: (/** @type {any} */ { setUserInput }) => {
        setUserInput?.(userInput);
        return false;
      },
      ruleType: "action",
      target: "Issue",
    };
  }
}

exports.Snippet = Snippet;

// Example of a snippet
//
// const { Snippet } = require('../markdown-snippet/snippet');
//
// exports.rule = Snippet.forMarkdown({
//   title: "Test snippet with parameter",
//   name: "test-snippet",
//   userInput: {
//   	type: "string",
//     enum: ["foo", "bar", "baz"],
//     description: "Select an option"
//   },
//   action: ({ issue, article, currentUser, userInput, refreshCount }) => {
//     return [
//       "```",
//       `User: ${currentUser.login}`,
//       issue ? `IssueId: ${issue.id}` : `ArticleId: ${article.id}`,
//       `User input: ${userInput}`,
//       `Refresh count": ${refreshCount}`,
//       "```"
//     ].join("\n");
//   }
// });
