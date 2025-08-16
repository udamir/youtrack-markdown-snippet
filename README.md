# YouTrack Markdown Snippet

A YouTrack Widget that allows you to embed markdown content from different sources (issues, articles, workflow snippets) directly into other YouTrack markdown. This enables content reuse and maintains a single source of truth across your knowledge base.

## Features

- __Static content embed__: embed markdown from any Issue or Knowledge Base Article
- __Field/section selection__: choose any Text custom field and optionally a specific heading section
- __Dynamic Snippets__: render workflow-defined scripts (Snippets.forMarkdown)
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

1. Download the latest release from the GitHub releases page
2. Go to the YouTrack Administration area
3. Navigate to Apps
4. Click "Upload app zip"
5. Select the downloaded zip file

## Usage

1. Edit any markdown field in YouTrack
2. Click the widget icon in the toolbar and choose "Markdown Snippet"
3. In the configuration popup, pick between tabs:
   - __Static Content__: enter an entity ID (e.g., `ABC-123` or an article ID). Optionally choose a Text field and a section.
   - __Snippet__: pick a workflow snippet. Input parameters if the snippet has `userInput`.
4. Preview updates in real-time. Fix any validation errors shown.
5. Save the configuration to embed.

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

## Workflow snippet example

Add this snippet to your workflow (Administration > Workflows) and it automatically appears in the widget.

```js
const { Snippet } = require("../markdown-snippet/snippet");

exports.rule = Snippet.forMarkdown({
  title: "Test snippet",
  name: "test-snippet",
  userInput: {
  	type: "string",
    enum: ["foo", "bar", "baz"],
    description: "Select an option"
  },
  action: (ctx) => {
    const params = `User: ${ctx.currentUser.login}\nUser input: "${ctx.userInput}\nRefresh count: ${ctx.refreshCount}`;
    const data = ctx.issue ? `Issue: ${ctx.issue.id}${params}` : `Article: ${ctx.article.id}${params}`;
    return "```\n" + data + "\n```";
  }
});
```

> Note that due to YouTrack caching, updating of workflow snippets may take a few minutes to take effect.

## Technical Details

This widget uses:

- __React + Ring UI__ for the UI
- __markdown-it__ (with task-lists and multimd-table plugins) for markdown rendering
- __highlight.js__ for syntax highlighting (loaded via CDN)
- __Mermaid__ for diagrams (loaded via CDN)
- __YouTrack Client API__ for fetching content and metadata

The widget implementation features:

- __Config Form Tabs__ in `src/widgets/markdown-widget/components/ConfigForm/`:
  - `StaticContentTab.tsx` fetches entity content and supports Text fields + section selection
  - `SnippetContentTab.tsx` lists snippets and renders input parameters
- __Debounced Fetching__ via `useDebounce.ts` to avoid redundant requests and race conditions
- __Renderer__ in `components/Renderer/Renderer.tsx` uses a persistent markdown-it instance and theme-aware Mermaid config
- __YoutrackService__ in `services/YoutrackService.ts` abstracts API calls and snippet execution
- __Error handling__ shows detailed messages from snippet execution and entity fetching

### Performance

- Mermaid and Highlight.js are externalized and loaded from CDN for faster builds and smaller bundles
- Build time reduced to ~5s locally; main bundle size significantly smaller

### Configuration Keys Saved by the Widget

- Static mode:
  - `entityId`: Issue or Article ID
  - `contentField`: optional Text custom field name
  - `sectionTitle`: optional markdown heading to extract
- Snippet mode:
  - `snippetWorkflow`: workflow name
  - `snippetRule`: rule name
  - `snippetTitle`: display label
  - `snippetParam`: user input (enum selection or text)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the package.json file for details.
