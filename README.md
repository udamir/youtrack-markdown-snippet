# YouTrack Markdown Snippet

A YouTrack widget that lets you embed markdown content from multiple sources (Issues, Articles, workflow scripts) directly into other YouTrack markdown. This promotes content reuse and helps maintain a single source of truth across your knowledge base.

## Features

- __Static content__: embed markdown from any Issue or Knowledge Base Article
- __Field/section selection__: choose any Text custom field and optionally a specific heading/section
- __Dynamic snippets__: render workflow-defined scripts via `Snippet.forMarkdown`
- __Snippet parameters__: supports enum parameters (dropdown) and free‑form text parameters (textarea)
- __Live preview__: real-time preview of rendered content
- __Mermaid + code highlighting__: supports diagram rendering and syntax highlighting
- __Theme aware__: styles follow YouTrack light/dark themes
- __Native rendering__: content renders as standard markdown

## Use Cases

- Include common procedures or FAQs across multiple Articles
- Reference requirements or specifications in related Issues
- Create dynamic documentation that updates with source content changes
- Share standardized sections across team documentation

## Requirements

- YouTrack 2023.2 or later

## Installation 

Install the app from JetBrains Marketplace: https://plugins.jetbrains.com/plugin/28224

Manual installation steps:
1. Create `markdown-snippet.zip` from the build output
2. Go to YouTrack Administration
3. Open Apps
4. Click "Upload app zip"
5. Select the generated zip

## Usage

1. Edit any markdown field in YouTrack.
2. Click the "Image and embedded content" icon, then choose Widgets → Markdown Snippet Widget.
3. In the configuration dialog, choose a tab:
   - __Entity content__: enter an entity ID (e.g., Issue `ABC-123` or Article `ABC-A-123`). Optionally select a Content field and Section.
   - __Workflow snippet__: select a workflow snippet and provide parameters if it requires `userInput`.
4. Preview the content in real time.
5. Save to embed the content.

### Configure widget settings (required for workflow snippets)

To list and execute workflow snippets, the widget needs a YouTrack API key with admin permissions that can access workflow scripts.

1. Create new Admin API Token for YouTrack: Profile > Account security > New token...
2. Open Administration > Apps > Markdown Snippet Widget > Settings
3. Set `API key` with created token.
4. Save settings.

## Workflow snippet example

Add this snippet to your workflow (Administration > Workflows). It will automatically appear in the widget configuration dialog.

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

 > Due to YouTrack caching, workflow snippet updates may take some time to propagate.
 > Workaround: open `/markdown-snippet/backend-global.js`, make a tiny change (e.g., add whitespace at the end), and save. This forces the cache to refresh.

### Debugging workflow snippet

To debug a snippet before releasing it, add a `debug` property to the snippet rule. In debug mode, the snippet is hidden in the widget configuration UI and is available only as a command guarded by your `guard` function. The command name is prefixed with `debug-snippet:`. You can also provide default `userInput`, an `entityType` ("Issue" | "Article"), and an optional `refreshCount` passed into your `action`.

Example snippet:
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

Log in as an admin user and run `debug-snippet:snippet-in-debug-mode` in any Article (or Issue, depending on `entityType`). The snippet saves the result to the Article content when `entityType` is "Article"; otherwise it saves to the Issue description.

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

### Environment setup

 To enable the upload commands, create a `.env` file in the project root with:

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

### Configuration keys saved by the widget
 - Base parameters:
   - `title`: display label
   - `url`: title link URL
 - Entity content mode:
   - `entityId`: Issue or Article ID
   - `contentField`: optional Text custom field
   - `sectionTitle`: optional markdown heading to extract
 - Workflow snippet mode:
   - `snippetWorkflow`: workflow name
   - `snippetRule`: rule name
   - `snippetTitle`: display label
   - `snippetParam`: user input

## Contributing

 Contributions are welcome! Feel free to open a Pull Request.

 1. Fork the repository
 2. Create a feature branch (`git checkout -b feature/amazing-feature`)
 3. Commit your changes (`git commit -m 'Add amazing feature'`)
 4. Push the branch (`git push origin feature/amazing-feature`)
 5. Open a Pull Request

## License

This project is licensed under the MIT License.
