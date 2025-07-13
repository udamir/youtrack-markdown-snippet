# YouTrack Markdown Embed Widget

A YouTrack Widget that allows you to embed markdown content from issues or articles directly into other YouTrack markdown fields. This enables content reuse and maintains a single source of truth across your knowledge base.

## Features

- Embed markdown content from any YouTrack issue or article
- Select specific sections from the source document or include the entire content
- Real-time preview during configuration
- Automatic syntax highlighting for code blocks
- Seamless integration with YouTrack's markdown editor

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
2. Click the widget icon in the toolbar
3. Select "Markdown Embed"
4. Enter the ID of the issue or article containing the content you want to embed
5. Choose whether to embed all content or a specific section
6. Save the configuration

## Development

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Upload to YouTrack (requires environment variables)
npm run upload

# Package as zip file
npm run pack
```

### Environment Setup

To use the upload functionality, create a `.env` file in the root directory with the following variables:

```
YOUTRACK_BASE_URL=https://youtrack-instance.example.com
YOUTRACK_TOKEN=perm:your-permanent-token
```

## Technical Details

This widget uses:

- React for the UI components
- markdown-it for parsing and rendering markdown content
- highlight.js for syntax highlighting in code blocks
- YouTrack Client API for fetching content from issues and articles

The widget implementation features:

- Section parsing to extract specific headings and their content
- Real-time content preview during configuration
- Error handling for invalid IDs or network issues
- Configurable content selection

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the package.json file for details.
