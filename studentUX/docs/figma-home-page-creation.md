# Create Exxat One Home Page in Figma via TalkToFigma MCP

When the TalkToFigma connection is working, ask the AI to run these steps. The AI will use the MCP tools to create the home page inside your selected frame.

## Prerequisites

1. **Socket server running**: `cursor-talk-to-figma-socket` on port 3055
2. **Figma plugin**: Cursor Talk to Figma plugin open and connected
3. **Frame selected**: Create a frame in Figma and select it before running

## Home Page Structure to Create

### 1. Main content frame (inside your selected frame)
- Vertical auto-layout
- Padding: 32px
- Gap: 24px

### 2. Header
- "Hi, Sarah Morgan" — 36px, bold

### 3. Product cards row (4 cards)
- Profile | Volunteership | Internships | Jobs
- Each: 280×200, rounded corners

### 4. Explore Opportunities section
- Title: "Explore Opportunities"
- Subtitle: "Internships, jobs, and career resources"
- 3 promo cards in a row

### 5. Exxat Prism banner
- Logo (Exxat Prism SVG)
- Headline: "Efficiency meets excellence in education"
- Description: "The all-in-one solution that transforms processes and elevates clinical & experiential learning experiences."
- Button: "Open Exxat Prism"

### 6. Career section & Career journey section

## Troubleshooting

**"Request to Figma timed out"**
- Ensure the Figma plugin shows "Connected" or similar
- In the plugin, click "Join channel" or "Connect" if available
- Restart the socket server: `cursor-talk-to-figma-socket`
- Restart Cursor to reconnect the MCP server

**Channel**: Use `default` when joining via `join_channel`
