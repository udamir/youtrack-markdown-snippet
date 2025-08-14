/** @import { YouTrackGlobalContext } from "../@types/context" */
const entities = require("@jetbrains/youtrack-scripting-api/entities")

const isArticle = (entityId) => {
  const [, i, a] = entityId.split("-")
  return i === "A" && a
}

exports.httpHandler = {
  endpoints: [
    {
      method: "GET",
      path: "snippet",
      handle: (/** @type {YouTrackGlobalContext} */ ctx) => {
        const entityId = ctx.request.getParameter("entityId") || ""
        const login = ctx.request.getParameter("login") || ""
        const workflow = ctx.request.getParameter("workflow") || ""
        const ruleName = ctx.request.getParameter("rule") || ""
        const userInput = ctx.request.getParameter("param") || ""

        try {
          const { rule } = require(`../${workflow}/${ruleName}`)

          if (rule.userInput && !userInput) {
            ctx.response.json({ input: rule.userInput })
          } else {
            const article = isArticle(entityId) ? entities.Article.findById(entityId) : null
            const issue = !isArticle(entityId) ? entities.Issue.findById(entityId) : null
            const currentUser = login ? entities.User.findByLogin(login) : null

            ctx.response.json({
              title: rule.title,
              content: rule.action({ article, issue, currentUser, userInput }),
            })
          }
        } catch (error) {
          ctx.response.code = 500
          ctx.response.json({
            message: `Error while fetching snippet: ${error}`,
          })
        }
      },
    },
  ],
}
