const markdownEmbedHandler = (ctx: any) => {
  const scriptName = ctx.request.getParameter('script');
  const param = ctx.request.getParameter('param');

  const module = require(`../${scriptName}`);

  if (!module) {
    ctx.response.code = 404;
    ctx.response.json({
      message: "Module not found"
    });
    return;
  }

  if (module.embedRenderer) {
    try {
      const content = module.embedRenderer(param);
      ctx.response.json({ content });
    } catch (error) {
      ctx.response.code = 500;
      ctx.response.json({
        message: `Error rendering embed: ${error}`,
      });
    }
  }

  ctx.response.code = 404;
  ctx.response.json({
    message: "No embedRenderer found"
  });
} 

export const httpHandler = {
  endpoints: [
    {
      scope: "issue",
      method: "GET",
      path: "markdown-embed",
      permissions: ['READ_ISSUE'],
      handle: markdownEmbedHandler
    },
    {
      scope: "article",
      method: "GET",
      path: "markdown-embed",
      permissions: ['READ_ARTICLE'],
      handle: markdownEmbedHandler
    }
  ]
}
