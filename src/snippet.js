/**
 * @typedef {{
*  name: string;                                         // Name of the snippet
*  title: string;                                        // Title of the snippet
*  userInput?: {
*    type: "string" | "number" | "boolean" | "text";     // Type of the user input
*    description: string;                                // Description of the user input
*  };
*  action: (
*    ctx: {
*      article: Article | null;                          // Article if snippet is in article
*      issue: Issue | null;                              // Issue if snippet is in issue
*      currentUser: User | null;                         // Current user
*      userInput?: string | number | boolean             // User input value
*    },
*    userInput?: string | number | boolean               // User input value
*  ) => string;                                          // Action to be performed
* }} SnippetRule
*/

class Snippet {
 /**
  * Embeds a snippet into the markdown content
  * @param {SnippetRule} rule
  */
 static register(rule) {
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
   }

   return {
     title: `snippet:${title}`,
     command: `snippet:${name}`,
     userInput,
     action: action,
     guard: () => false,
     ruleType: "action",
     target: "Issue",
   };
 }
}

exports.Snippet = Snippet;
