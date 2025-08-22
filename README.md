# YouTrack Markdown Snippet

A YouTrack Widget that allows you to embed markdown content from different sources (issues, articles, workflow snippets) directly into other YouTrack markdown. This enables content reuse and maintains a single source of truth across your knowledge base.

## Features

- __Static content embed__: embed markdown from any Issue or Knowledge Base Article
- __Field/section selection__: choose any Text custom field and optionally a specific heading section
- __Dynamic Snippets__: render workflow-defined scripts (Snippet.forMarkdown)
- __Snippet parameters__: supports enum parameters (dropdown) and free-form text parameters (textarea)
- __Real-time preview__: live preview of the rendered content
- __Mermaid + code highlighting__: support diagram rendering and syntax highlighting
- __Light/Dark theme aware__: styles align with YouTrack themes
- __Seamless integration__: content renders as native markdown

## Use Cases

- Include common procedures or FAQs across multiple articles
- Reference requirements or specifications in related issues
- Create dynamic documentation that updates when the source content changes
- Share standardized sections across team documentation

## Requirements

- YouTrack 2023.2 or later

## Installation 

Install the app from JetBrains Marketplace: https://plugins.jetbrains.com/plugin/28224

Manual installation steps:
1. Pack `markdown-snippet.zip` file from source code
2. Go to the YouTrack Administration area
3. Navigate to Apps
4. Click "Upload app zip"
5. Select the downloaded zip file

## Usage

1. Edit any markdown field in YouTrack
2. Click `Image and Embedded content` icon in the toolbar and choose `Widgets` > `Markdown Snippet Widget`
3. In the configuration popup, pick between tabs:
   - __Entity Content__: enter an entity ID (e.g., an issue ID `ABC-123` or an article ID `ABC-A-123`). Optionally choose a `Content field` and a `Section`.
   - __Workflow Snippet__: pick a workflow snippet. Input parameters if the snippet has required `userInput`.
4. Preview selected content in real-time.
5. Save the configuration to embed the content.

### Configure widget settings (required for workflow snippets)

To list and execute workflow snippets, the widget needs a YouTrack API key with admin permissions that can access workflow scripts.

1. Create new Admin API Token for YouTrack: Profile > Account security > New token...
2. Open Administration > Apps > Markdown Snippet Widget > Settings
3. Set `API key` with created token.
4. Save settings.

## Workflow snippet example

Add this snippet to your workflow (Administration > Workflows) and it automatically appears in the widget configuration dialog.

```js
const { Snippet } = require('../markdown-snippet/snippet');

exports.rule = Snippet.forMarkdown({
  title: "Test snippet with parameter",
  name: "test-snippet",
  userInput: {
  	type: "string",
    enum: ["foo", "bar", "baz"],
    description: "Select an option"
  },
  action: ({ issue, article, currentUser, userInput, refreshCount }) => {
    return [
      "```",
      `User: ${currentUser.login}`,
      issue ? `IssueId: ${issue.id}` : `ArticleId: ${article.id}`,
      `User input: ${userInput}`,
      `Refresh count: ${refreshCount}`,
      "```"
    ].join("\n");
  }
});
```

> Note that due to YouTrack caching, updating of workflow snippets may take a few minutes to take effect.
> Workaround: open `/markdown-snippet/backend-global.js` make a tiny change (add whitespace at the end of the file) and `Save` file. This will trigger a refresh of cache.

### Debugging workflow snippet

To debug a snippet before releasing it, add a `debug` property to the snippet rule. In debug mode the snippet is hidden from the widget configuration dialog and is available only as a command guarded by your `guard` function. The command name is prefixed with `debug-snippet:`. You can also provide default `userInput`, `entityType` ("Issue" | "Article"), and optional `refreshCount` passed into your `action`.

Example of snippet in workflow:
```js
exports.rule = Snippet.forMarkdown({
  title: "Snippet in debug mode",
  name: "snippet-in-debug-mode",
  userInput: {
    type: "string",
    enum: ["foo", "bar", "baz"],
    description: "Select an option"
  },
  action: ({ userInput }) => `provided userInput: ${userInput}`,
  debug: {
    guard: ({ currentUser }) => currentUser?.login === "admin",
    userInput: "foo",
    entityType: "Article",
    refreshCount: 0
  }
});
```

Log in as an admin user and execute the command `debug-snippet:snippet-in-debug-mode` in any Article (or Issue depending on `entityType`). The snippet will run and save the result to the article content when `entityType` is "Article"; otherwise it saves to the issue description.

## Development

### Setup

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Upload to YouTrack (requires environment variables)
bun run upload

# Package as zip file
bun run pack
```

### Environment Setup

To use the upload functionality, create a `.env` file in the root directory with the following variables:

```
YOUTRACK_BASE_URL=https://youtrack-instance.example.com
YOUTRACK_TOKEN=perm:your-permanent-token
```

## Technical Details

This widget uses:

- __React + Ring UI__ for the UI
- __markdown-it__ (with task-lists and multimd-table plugins) for markdown rendering
- __highlight.js__ for syntax highlighting (loaded via CDN)
- __Mermaid__ for diagrams (loaded via CDN)
- __YouTrack Client API__ for fetching content and metadata

### Configuration Keys Saved by the Widget
- Base parameters:
  - `title`: display label
  - `url`: URL for title
- Entity content mode:
  - `entityId`: Issue or Article ID
  - `contentField`: optional Text custom field name
  - `sectionTitle`: optional markdown heading to extract
- Workflow snippet mode:
  - `snippetWorkflow`: workflow name
  - `snippetRule`: rule name
  - `snippetTitle`: display label
  - `snippetParam`: user input

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
