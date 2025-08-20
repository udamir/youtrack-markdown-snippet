const entities = require("@jetbrains/youtrack-scripting-api/entities");
const http = require("@jetbrains/youtrack-scripting-api/http");

/** 
 * Checks if the entity is an article
 * @param {string} entityId - The ID of the entity
 * @returns {boolean} - True if the entity is an article, false otherwise
*/
const isArticle = (entityId) => entityId.split("-")[1] === "A";

/**
 * @import { YouTrackGlobalContext } from "../@types/context";
 * 
 * @type {{
 *  endpoints: {
 *    method: "GET" | "POST" | "PUT" | "DELETE";
 *    path: string;
 *    handle: (ctx: YouTrackGlobalContext) => void;
 *  }[]
 * }} 
*/
exports.httpHandler = {
  endpoints: [
    {
      method: "GET",
      path: "snippets",
      handle: (ctx) => {
        const baseUrl = ctx.globalStorage.extensionProperties.baseUrl;
        const apiKey = ctx.globalStorage.extensionProperties.apiKey;

        if (!baseUrl || !apiKey) {
          ctx.response.code = 500;
          ctx.response.json({
            message: "Missing baseUrl or apiKey",
          });
          return;
        }

        const connection = new http.Connection(baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`, null, 30000);
        connection.bearerAuth(apiKey);

        const response = connection.getSync("/api/admin/workflows", { fields: "id,name,rules(id,name,title,type)", $top: "-1", query: "language:JS,mps" });
        const json = JSON.parse(response.response);
        if (!response.isSuccess) {
          ctx.response.code = 500;
          ctx.response.json({
            message: `Cannot fetch list of snippets: ${json.message}`,
          });
          return;
        }

        const snippets = [];
        for (const workflow of json) {
          for (const rule of workflow.rules) {
            if (rule.title?.startsWith("snippet:") && rule.type === "StatelessActionRule") {
              snippets.push({ title: rule.title.slice(8), workflow: workflow.name, rule: rule.name })
            }
          }
        }

        ctx.response.json({ snippets });
      }
    },
    {
      method: "GET",
      path: "snippet",
      handle: (ctx) => {
        const entityId = ctx.request.getParameter("entityId") || "";
        const login = ctx.request.getParameter("login") || "";
        const workflow = ctx.request.getParameter("workflow") || "";
        const ruleName = ctx.request.getParameter("rule") || "";
        const userInput = ctx.request.getParameter("userInput") || "";
        const refreshCount = ctx.request.getParameter("refreshCount") || 0;

        try {
          const { rule } = require(`../${workflow}/${ruleName}`);

          const article = isArticle(entityId) ? entities.Article.findById(entityId) : null;
          const issue = !isArticle(entityId) ? entities.Issue.findById(entityId) : null;
          const currentUser = login ? entities.User.findByLogin(login) : null;
          let input = null;
          rule.guard({ 
            article, 
            issue, 
            currentUser, 
            setUserInput: (/** @type {any} */ value) => {
              input = value;
            } 
          });

          if (userInput && !input) {
            ctx.response.json({ input });
          } else {

            ctx.response.json({
              title: rule.title,
              content: rule.action({ article, issue, currentUser, userInput, refreshCount }),
              ...(input ? { input } : {})
            });
          }
        } catch (/** @type {any} */ error) {
          ctx.response.code = 500;
          ctx.response.json({
            message: `Error in workflow rule: "${workflow}/${ruleName}.js"`,
            stack: error.stack.replace(/scripts\//g, "/"),
          });
        }
      },
    },
  ],
};
