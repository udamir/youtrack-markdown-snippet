const entities = require("@jetbrains/youtrack-scripting-api/entities");

const isArticle = (entityId) => entityId.split("-")[1] === "A";

exports.httpHandler = {
  endpoints: [
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
            setUserInput: (value) => {
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
        } catch (error) {
          ctx.response.code = 500;
          ctx.response.json({
            message: `Error in workflow rule: "${workflow}/${ruleName}.js"`,
            stack: error.stack?.replace(/scripts\//g, "/") || error.message || "",
          });
        }
      },
    },
  ],
};
