# Canvas-to-UI

Convert freehand drawings into production-ready React UI components using AI.

## Features

- 🎨 **Canvas Drawing** - Powered by Excalidraw with full toolset
- 🤖 **AI Detection** - Google Gemini Vision API automatically detects UI components
- 🎯 **shadcn/ui** - Generates components from the shadcn/ui library
- 🔄 **Live Preview** - Switch between drawing and preview modes
- 📦 **Export** - Generate React/TypeScript code and image snapshots

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) installed
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd drawui
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   # Add your GOOGLE_GEMINI_API_KEY
   ```

4. Start development server:
   ```bash
   bun dev
   ```

5. Open http://localhost:3000

## Usage

1. **Draw** - Use Excalidraw tools to sketch UI mockups
2. **Wait** - AI automatically analyzes after 2 seconds of inactivity
3. **Preview** - Switch to Preview mode to see generated components
4. **Export** - Copy code or download as `.tsx` file or image

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript
- **Canvas:** Excalidraw
- **AI:** Google Gemini Vision API (gemini-2.0-flash-exp)
- **UI:** shadcn/ui, Radix UI, Tailwind CSS v4
- **Testing:** Vitest, jsdom
- **Package Manager:** Bun
- **Code Quality:** Biome

## Architecture

```
app/
  page.tsx                  # Main canvas app
  api/analyze-drawing/      # Gemini API route
components/
  canvas/                   # Canvas components
    DrawingCanvas.tsx       # Main component
    ExcalidrawWrapper.tsx   # Excalidraw integration
    PreviewOverlay.tsx      # Preview mode overlay
    ComponentLayer.tsx      # Individual component renderer
  export/                   # Export functionality
    ExportPanel.tsx         # Export UI
    CodeGenerator.tsx       # Code generation UI
  ui/                       # shadcn/ui components
lib/
  gemini.ts                 # Gemini API client
  canvas-utils.ts           # Canvas utilities
  component-mapper.ts       # Component deduplication
  code-generator.ts         # React code generation
  component-registry.ts     # Server-side component discovery
  component-registry.client.ts  # Client-side component registry
types/
  canvas.ts                 # TypeScript types
```

## Development

**Run tests:**
```bash
bun test
```

**Run tests with UI:**
```bash
bun test:ui
```

**Build for production:**
```bash
bun run build
```

**Lint code:**
```bash
bun run lint
```

**Format code:**
```bash
bun run format
```

## API Configuration

The app uses the Google Gemini Vision API for component detection. Set your API key in `.env.local`:

```env
GOOGLE_GEMINI_API_KEY=your_api_key_here
```

## Component Detection

The AI can currently detect these shadcn/ui components:
- Button, Input, Textarea
- Card (with Header, Content, Footer, Title, Description)
- Label, Badge, Avatar, Separator
- Select, Checkbox, Radio Group, Switch, Slider
- Tabs, Dialog, Alert, Tooltip

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT
