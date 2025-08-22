/** 
 * @import { Issue, Article, User } from "@jetbrains/youtrack-scripting-api/entities" 
 * 
 * @typedef {{
 *  article: Article | null;                          // Article if snippet is in article
 *  issue: Issue | null;                              // Issue if snippet is in issue
 *  currentUser: User | null;                         // Current user
 *  refreshCount: number                              // Refresh count
 *  userInput?: string | number | boolean             // User input value
 * }} SnippetRuleContext
 * 
 * @typedef {{
 *  name: string;                                         // Name of the snippet, should be unique in YouTrack
 *  title: string;                                        // Title of the snippet
 *  userInput?: {
 *    type: "string" | "number" | "boolean" | "text";     // Type of the user input
 *    enum?: string[] | number[];                         // Enum values for the user input
 *    description: string;                                // Description of the user input
 *  };
 *  action: (ctx: SnippetRuleContext) => string;          // Action to be performed
 *  debug?: {
 *    guard?: (ctx: SnippetRuleContext) => boolean;       // Guard to run snippet in debug mode
 *    userInput?: string | number | boolean;              // User input value to run snippet in debug mode
 *    entityType?: "Issue" | "Article";                   // Entity type to run snippet in, default is "Issue"
 *    refreshCount?: number;                              // Refresh count to run snippet in debug mode
 *  }
 * }} SnippetRule
 */

class Snippet {
  /**
   * Embeds a snippet into the markdown content
   * @param {SnippetRule} rule
   */
  static forMarkdown(rule) {
    const { title, name, action, userInput, debug } = rule;

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
      title: `${debug ? "debug-" : ""}snippet:${title}`,
      command: `${debug ? "debug-" : ""}snippet:${name}`,
      action: debug ? (/** @type {any} */ ctx) => {
        const result = action({ ...ctx, userInput: debug.userInput, refreshCount: debug.refreshCount ?? 0 });
        if (debug.userInput === "Article") {
          ctx.article.content = result;
        } else {
          ctx.issue.description = result;
        }
      } : action,
      guard: (/** @type {any} */ { setUserInput, ...rest }) => {
        setUserInput?.(userInput);

        return debug?.guard ? debug.guard({ ...rest, userInput: debug.userInput }) : false;
      },
      ruleType: "action",
      target: debug?.entityType || "Issue",
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


// Example of a snippet with debug
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
//   },
//   debug: {
//     entityType: "Article",                   // Snippet can be run in article
//     guard: ({ currentUser }) => {
//       return currentUser.login === "admin";  // Admin can run command "snippet:test-snippet" in any article
//     },
//     userInput: "foo",                        // User input value to run snippet in debug mode
//   }
// });
//

