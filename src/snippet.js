/** 
 * @import { Issue, Article, User } from "@jetbrains/youtrack-scripting-api/entities" 
 * 
 * @typedef {{
 *  article?: Article | null;                             // Article if snippet is in article
 *  issue?: Issue | null;                                 // Issue if snippet is in issue
 *  currentUser?: User | null;                            // Current user
 *  refreshCount: number                                  // Refresh count
 *  userInput?: string | number | boolean                 // User input value
 * }} SnippetRuleContext
 * 
 * @typedef {(ctx: SnippetRuleContext) => string[]} EnumResolver
 * 
 * @typedef {SnippetRuleContext & { 
 *  setUserInput: (value?: SnippetUserInput) => void      // Callback function to set user input
 * }} SnippetGuardContext
 * 
 * @typedef {{
 *  type: "string" | "number" | "boolean" | "text";       // Type of the user input
 *  enum?: string[] | number[] | EnumResolver;            // Enum values for the user input
 *  description: string;                                  // Description of the user input
 *  required?: boolean;                                   // Whether the user input is required
 * }} SnippetUserInput
 * 
 * @typedef {{
 *  name: string;                                         // Name of the snippet, should be unique in YouTrack
 *  title: string;                                        // Title of the snippet
 *  userInput?: SnippetUserInput;                         // User input for the snippet
 *  action: (ctx: SnippetRuleContext) => string;          // Action to be performed
 *  debug?: {
 *    guard?: (ctx: SnippetRuleContext) => boolean;       // Guard to run snippet in debug mode
 *    userInput?: string | number | boolean;              // User input value to run snippet in debug mode
 *    entityType?: "Issue" | "Article";                   // Entity type to run snippet in, default is "Issue"
 *    refreshCount?: number;                              // Refresh count to run snippet in debug mode
 *  }
 * }} SnippetRule
 * 
 * @typedef {{
 *  title: string;                                        // Title of the snippet
 *  command: string;                                      // Command to run the snippet
 *  input?: {
 *    type: "string" | "number" | "boolean";              // Type of the user input
 *    description: string;                                // Description of the user input
 *  };
 *  action: (ctx: SnippetRuleContext) => string | void;   // Action to be performed
 *  guard: (ctx: SnippetGuardContext) => boolean;         // Guard to run snippet
 *  ruleType: "action";                                   // Rule type
 *  target: "Issue" | "Article";                          // Target entity type
 * }} ActionRule
 */

class Snippet {
  /**
   * Embeds a snippet into the markdown content
   * @param {SnippetRule} rule
   * @returns {ActionRule}
   */
  static forMarkdown(rule) {
    if (!rule || typeof rule !== "object") {
      throw new Error("Snippet rule must be an object with title, name and action properties");
    }
    const { title, name, action, userInput, debug } = rule;

    if (!title || !name || !action) {
      throw new Error("Snippet rule must have title, name and action properties");
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

        if (!Array.isArray(userInput.enum) && typeof userInput.enum !== "function") {
          throw new Error("Snippet rule userInput enum must be an array or a function");
        }
        if (typeof userInput.enum !== "function" && userInput.enum.some((v) => typeof v !== "string" && typeof v !== "number")) {
          throw new Error("Snippet rule userInput enum must contain only strings or numbers");
        }
      }
    }

    return {
      title: `${debug ? "debug-" : ""}snippet:${title}`,
      command: `${debug ? "debug-" : ""}snippet:${name}`,
      action: debug ? (ctx) => {
        const result = action({ ...ctx, userInput: debug.userInput, refreshCount: debug.refreshCount ?? 0 });
        if (debug.userInput === "Article" && ctx.article) {
          ctx.article.content = result;
        } else if (ctx.issue) {
          ctx.issue.description = result;
        }
      } : action,
      guard: ({ setUserInput, ...rest }) => {
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
//     description: "Select an option",
//     required: true
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

